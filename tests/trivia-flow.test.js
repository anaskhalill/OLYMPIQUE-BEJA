/*
 * Dedicated C5 security harness for the Trivia feature.
 *
 * Loads the real /api/trivia/award route and the server-only trivia module
 * through ts-node with an in-memory Firestore model that serializes
 * transactions, then asserts on the server-authoritative invariants:
 *
 *  - the client is never consulted for correctness (answerIndex only)
 *  - the server computes the correct answer and reward deterministically
 *  - once-per-day is enforced even under concurrent requests (no double award)
 *  - malformed / out-of-range answerIndex values are rejected
 *  - the reward is +1 correct / -1 wrong, floored at 0
 */
"use strict";

class MockRequest {
  constructor({ headers = {}, body = null }) {
    this._headers = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    this._body = body;
  }
  headers = { get: (name) => this._headers.get(String(name).toLowerCase()) };
  async json() {
    if (this._body == null) throw new Error("No JSON body");
    return this._body;
  }
}

// ---------------------------------------------------------------------------
// In-memory Firestore mock (serialized transactions, subcollections)
// ---------------------------------------------------------------------------
const KEY = (parts) => parts.join(":");
const dbData = new Map();
const SERVER_TIMESTAMP = () => ({ __SERVER_TIMESTAMP__: true });
function clone(v) { return JSON.parse(JSON.stringify(v)); }
function makeDocRef(parts) {
  return {
    id: parts[parts.length - 1],
    __path: parts,
    async get() {
      const data = dbData.get(KEY(parts));
      return { exists: data !== undefined, data: () => (data === undefined ? undefined : clone(data)) };
    },
    async set(data, opts = {}) {
      const merged = dbData.has(KEY(parts)) ? clone(dbData.get(KEY(parts))) : {};
      const next = opts.merge ? { ...merged, ...clone(data) } : clone(data);
      dbData.set(KEY(parts), next);
    },
    async update(patch) {
      const cur = dbData.has(KEY(parts)) ? clone(dbData.get(KEY(parts))) : {};
      for (const [k, v] of Object.entries(patch)) {
        cur[k] = v && typeof v === "object" && v.__SERVER_TIMESTAMP__ ? "__server_timestamp__" : v;
      }
      dbData.set(KEY(parts), cur);
    },
    collection(name) { return collection(name, parts); },
  };
}
function collection(name, parentParts = []) {
  return {
    doc(id) { return makeDocRef([...parentParts, name, id]); },
    __name: name,
    __parent: parentParts,
  };
}
let txTail = Promise.resolve();
const mockFirestore = {
  collection(name) { return collection(name); },
  async runTransaction(cb) {
    const run = async () => {
      const txn = {
        async get(ref) {
          const data = dbData.get(KEY(ref.__path));
          return { exists: data !== undefined, data: () => (data === undefined ? undefined : clone(data)) };
        },
        update(ref, patch) { return makeDocRef(ref.__path).update(patch); },
        set(ref, data, opts) { return makeDocRef(ref.__path).set(data, opts); },
      };
      try { return await cb(txn); } finally {}
    };
    const result = txTail.then(run, run);
    txTail = result.catch(() => {});
    return result;
  },
};

// ---------------------------------------------------------------------------
// Auth + module mocks
// ---------------------------------------------------------------------------
const tokens = new Map();
const mockAuth = {
  extractBearerToken: (authorization) => {
    if (!authorization) return null;
    const m = /^Bearer\s+(.+)$/i.exec(authorization.trim());
    return m ? m[1] : null;
  },
  verifyIdToken: async (token) => {
    if (!token) return null;
    const uid = tokens.get(token);
    if (!uid) return null;
    return { uid };
  },
};

const Module = require("module");
const Path = require("path");
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "next/server") {
    return {
      NextRequest: class {},
      NextResponse: { json: (data, init = {}) => ({ __json: data, __status: init.status || 200 }) },
    };
  }
  if (request === "server-only") return {};
  if (request === "firebase-admin/firestore") {
    return { FieldValue: { serverTimestamp: SERVER_TIMESTAMP } };
  }
  if (request === "@/lib/admin/firebase-admin") return { getAdminDb: () => mockFirestore };
  if (request === "@/lib/admin/verify-id-token") return mockAuth;
  if (request.startsWith("@/")) {
    const mapped = Path.join(__dirname, "..", "src", request.slice(2)) + ".ts";
    return originalLoad.call(this, mapped, parent, isMain);
  }
  return originalLoad.apply(this, arguments);
};

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node" },
});

const triviaRoute = require("../src/app/api/trivia/award/route.ts");
const { getQuestionForToday } = require("../src/lib/admin/trivia.ts");

let failures = 0;
const results = [];
function assert(cond, name) {
  results.push(cond);
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}: ${name}`);
}
function reset() { dbData.clear(); tokens.clear(); }
function userDoc(uid, points = 0) { dbData.set(KEY(["users", uid]), { points }); }
function getPoints(uid) { const d = dbData.get(KEY(["users", uid])); return d ? d.points : undefined; }
const play = (token, answerIndex) =>
  triviaRoute.POST(new MockRequest({
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: { answerIndex },
  }));

(async () => {
  const question = getQuestionForToday();
  const correctIdx = question.correct;
  const wrongIdx = (correctIdx + 1) % question.options.length;

  // --- 1. Correct answer requires no client-side 'correct' flag ----------
  reset();
  tokens.set("tokenA", "userA");
  userDoc("userA", 10);
  const r1 = await play("tokenA", correctIdx);
  assert(r1.__status === 200, "1a. correct answer accepted");
  assert(r1.__json.correct === true, "1b. server reports correct");
  assert(r1.__json.points === 11, "1c. +1 awarded to authoritative balance");
  assert(getPoints("userA") === 11, "1d. Firestore balance updated to 11");

  // --- 2. A client-supplied 'correct' flag is ignored --------------------
  reset();
  tokens.set("tokenA", "userA");
  userDoc("userA", 5);
  // Attempt to force the reward regardless of the real answer. The server
  // recomputes correctness from answerIndex only.
  const r2 = await triviaRoute.POST(new MockRequest({
    headers: { authorization: "Bearer tokenA", "content-type": "application/json" },
    body: { answerIndex: wrongIdx, correct: true, points: 999, delta: 50 },
  }));
  assert(r2.__status === 200, "2a. request accepted");
  assert(r2.__json.correct === false, "2b. server says wrong (client 'correct' flag ignored)");
  assert(r2.__json.awarded === -1, "2c. server applied -1, not +reward");
  assert(getPoints("userA") === 4, "2d. balance reflects -1 (5 -> 4), not arbitrary delta");

  // --- 3. Malformed / out-of-range answerIndex rejected ------------------
  reset();
  tokens.set("tokenA", "userA");
  userDoc("userA", 5);
  for (const bad of [-2, 4, 99, -1, 1.5, "1", null, { x: 1 }]) {
    const r = await triviaRoute.POST(new MockRequest({
      headers: { authorization: "Bearer tokenA", "content-type": "application/json" },
      body: { answerIndex: bad },
    }));
    assert(r.__status === 400, `3. invalid answerIndex ${JSON.stringify(bad)} -> 400`);
  }
  assert(getPoints("userA") === 5, "3z. invalid input did not mutate balance");

  // --- 4. Concurrent same-day plays award only once ----------------------
  reset();
  tokens.set("tokenA", "userA");
  userDoc("userA", 0);
  const [c1, c2, c3] = await Promise.all([
    play("tokenA", correctIdx),
    play("tokenA", correctIdx),
    play("tokenA", correctIdx),
  ]);
  const awarded = [c1, c2, c3].filter((r) => r.__json.alreadyPlayed !== true);
  assert(awarded.length === 1, "4a. exactly one of 3 concurrent plays was a real award");
  assert(getPoints("userA") === 1, "4b. balance incremented exactly once (0 -> 1)");
  const anyReplay = [c1, c2, c3].some((r) => r.__json.alreadyPlayed === true);
  assert(anyReplay, "4c. the other concurrent plays were rejected as alreadyPlayed");

  // --- 5. Wrong answer floored at 0 (never negative) ---------------------
  reset();
  tokens.set("tokenA", "userA");
  userDoc("userA", 0);
  const r5 = await play("tokenA", wrongIdx);
  assert(r5.__json.points === 0, "5a. wrong answer floored at 0");
  assert(getPoints("userA") === 0, "5b. stored balance never negative");
  const r5b = await play("tokenA", wrongIdx);
  assert(r5b.__json.alreadyPlayed === true, "5c. replay same day blocked");
  assert(getPoints("userA") === 0, "5d. no farming on replay");

  // --- 6. A user with no existing doc starts at 0, still replay-safe -----
  reset();
  tokens.set("tokenA", "userA");
  const r6a = await play("tokenA", correctIdx);
  assert(r6a.__json.points === 1, "6a. absent user awarded +1 (0 -> 1)");
  const r6b = await play("tokenA", correctIdx);
  assert(r6b.__json.alreadyPlayed === true, "6b. second play same day blocked");

  console.log("\n======================================");
  console.log(failures === 0 ? `ALL ${results.length} ASSERTIONS PASSED` : `${failures} ASSERTION(S) FAILED`);
  console.log("======================================");
  process.exit(failures === 0 ? 0 : 1);
})();

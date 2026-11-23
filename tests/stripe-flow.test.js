/*
 * Manual security verification harness for C3 hardening (secure Stripe card flow).
 *
 * We cannot hit the real Firebase/Stripe from tests, so we load the real route
 * handlers (src/app/api/payment/route.ts and
 * src/app/api/webhooks/stripe/route.ts) through ts-node and intercept their
 * module dependencies with a Node require hook, then assert on the security and
 * race-condition invariants.
 */
"use strict";

// --- Real HTTP objects -----------------------------------------------------
class MockRequest {
  constructor({ headers = {}, body = null, textBody = null }) {
    this._headers = new Map(Object.entries(headers));
    this._body = body;
    this._textBody = textBody;
  }
  headers = {
    get: (name) => this._headers.get(name.toLowerCase()),
  };
  async json() {
    if (this._body == null) throw new Error("No JSON body");
    return this._body;
  }
  async text() {
    if (this._textBody == null) throw new Error("No text body");
    return this._textBody;
  }
}

// --- In-memory Firestore mock ---------------------------------------------
const firestoreData = new Map();
let serverTimestampCalls = 0;

function firestoreClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const mockFirestore = {
  collection(name) {
    if (name !== "orders") throw new Error(`Unexpected collection: ${name}`);
    return {
      doc(id) {
        return {
          async get() {
            const data = firestoreData.get(id);
            return {
              exists: !!data,
              data: () => (data ? firestoreClone(data) : undefined),
            };
          },
          async set(data) {
            firestoreData.set(id, firestoreClone(data));
          },
          async update(patch) {
            const cur = firestoreData.get(id) || {};
            const next = { ...firestoreClone(cur) };
            for (const [k, v] of Object.entries(patch)) {
              if (v && typeof v === "object" && v.__SERVER_TIMESTAMP__) {
                serverTimestampCalls++;
                next[k] = "__server_timestamp__";
              } else {
                next[k] = v;
              }
            }
            firestoreData.set(id, next);
          },
          __id: id,
        };
      },
    };
  },
  async runTransaction(cb) {
    return cb({
      async get(ref) {
        const data = firestoreData.get(ref.__id);
        return { exists: !!data, data: () => firestoreClone(data) };
      },
      update(ref, patch) {
        return ref.update(patch);
      },
    });
  },
};

// --- Stripe mock -----------------------------------------------------------
const stripePaymentIntents = new Map(); // piId -> intent
const stripeIdempotencyKeys = new Map(); // key -> intent
let paymentIntentsCreated = 0;
let honorIdempotency = true; // toggle to simulate Stripe idempotency bypass
let nextWebhookPi = null; // PI object the webhook constructEvent should return
let nextWebhookType = "payment_intent.succeeded";

const mockStripeInstance = {
  paymentIntents: {
    async create({ amount, currency, metadata }, opts = {}) {
      const key = opts.idempotencyKey;
      if (key && honorIdempotency && stripeIdempotencyKeys.has(key)) {
        return stripeIdempotencyKeys.get(key);
      }
      paymentIntentsCreated++;
      const id = `pi_test_${paymentIntentsCreated}`;
      const intent = {
        id,
        amount,
        currency,
        metadata,
        status: "requires_payment_method",
        client_secret: `secret_${id}`,
      };
      stripePaymentIntents.set(id, intent);
      if (key) stripeIdempotencyKeys.set(key, intent);
      return intent;
    },
    async retrieve(id) {
      const intent = stripePaymentIntents.get(id);
      if (!intent) throw new Error("No such payment intent");
      return intent;
    },
  },
  webhooks: {
    constructEvent(rawBody, signature, secret) {
      if (secret !== "whsec_test") throw new Error("Bad secret");
      if (!signature || signature === "INVALID") throw new Error("Bad signature");
      if (!nextWebhookPi) throw new Error("No PaymentIntent configured for webhook");
      return {
        type: nextWebhookType,
        data: { object: { ...nextWebhookPi, metadata: { ...(nextWebhookPi.metadata || {}) } } },
      };
    },
  },
};

// --- Module mocking via require hook ---------------------------------------
const Module = require("module");
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "stripe") return function StripeMock() { return mockStripeInstance; };
  if (request === "next/server") {
    return {
      NextRequest: class {},
      NextResponse: {
        json: (data, init = {}) => ({ __json: data, __status: init.status || 200 }),
      },
    };
  }
  if (request === "firebase-admin/firestore") {
    return {
      FieldValue: { serverTimestamp: () => ({ __SERVER_TIMESTAMP__: true }) },
    };
  }
  if (request === "@/lib/admin/firebase-admin") {
    return { getAdminDb: () => mockFirestore };
  }
  if (request === "@/lib/admin/verify-id-token") {
    return mockAuth;
  }
  return originalLoad.apply(this, arguments);
};

// --- Fake auth that maps a token to a uid ----------------------------------
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

// --- Load routes through ts-node ------------------------------------------
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: { module: "commonjs", moduleResolution: "node" },
});

const paymentRoute = require("../src/app/api/payment/route.ts");
const webhookRoute = require("../src/app/api/webhooks/stripe/route.ts");

// --------------------------------------------------------------------------
// Assertion helpers
// --------------------------------------------------------------------------
let failures = 0;
const results = [];

function assert(cond, name) {
  results.push(cond);
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}: ${name}`);
}

function reset() {
  firestoreData.clear();
  stripePaymentIntents.clear();
  stripeIdempotencyKeys.clear();
  paymentIntentsCreated = 0;
  serverTimestampCalls = 0;
  honorIdempotency = true;
  nextWebhookPi = null;
  nextWebhookType = "payment_intent.succeeded";
}

function seedOrder(orderId, uid, total = 117) {
  firestoreData.set(orderId, {
    orderId,
    userId: uid,
    paymentMethod: "card",
    paymentStatus: "unpaid",
    status: "pending",
    total,
  });
}

function paymentRequest(orderId, token = "tokenA", extra = {}) {
  return new MockRequest({
    headers: { authorization: `Bearer ${token}` },
    body: { orderId, ...extra },
  });
}

function webhookRequest(pi) {
  return new MockRequest({
    headers: { "stripe-signature": "VALID" },
    textBody: `{"type":"${nextWebhookType}"}`,
  });
}

// --------------------------------------------------------------------------
(async () => {
  // --- 1. Unauthenticated payment creation -> 401, no PI --------------------
  reset();
  seedOrder("OB-1", "userA");
  let res = await paymentRoute.POST(new MockRequest({ body: { orderId: "OB-1" } }));
  assert(res.__status === 401, "1a. unauthenticated payment creation -> 401");
  assert(paymentIntentsCreated === 0, "1b. no PaymentIntent created");

  // --- 2. User cannot pay another user's order -> 403 -----------------------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-2", "userB");
  res = await paymentRoute.POST(paymentRequest("OB-2"));
  assert(res.__status === 403, "2a. paying another user's order -> 403");
  assert(paymentIntentsCreated === 0, "2b. no PaymentIntent created");

  // --- 3. Client fake amount ignored; amount from server order --------------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-3", "userA", 117);
  res = await paymentRoute.POST(paymentRequest("OB-3", "tokenA", { amount: 1 }));
  assert(res.__status === 200, "3a. valid request accepted");
  assert(paymentIntentsCreated === 1, "3b. exactly one PaymentIntent created");
  const pi3 = [...stripePaymentIntents.values()][0];
  assert(pi3.amount === 117 * 1000, "3c. PI amount = server order total (117*1000)");
  assert(pi3.amount !== 1 * 1000, "3d. client fake amount NOT used");

  // --- 4. Two concurrent creation attempts -> single PaymentIntent ----------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-4", "userA", 117);
  const [r4a, r4b] = await Promise.all([
    paymentRoute.POST(paymentRequest("OB-4")),
    paymentRoute.POST(paymentRequest("OB-4")),
  ]);
  assert(r4a.__status === 200 && r4b.__status === 200, "4a. both concurrent requests accepted");
  assert(paymentIntentsCreated === 1, "4b. two concurrent attempts created only ONE PaymentIntent");
  const storedId4 = firestoreData.get("OB-4").paymentIntentId;
  assert(typeof storedId4 === "string" && storedId4.length > 0, "4c. one PaymentIntent id stored");
  assert(
    r4a.__json?.clientSecret === r4b.__json?.clientSecret,
    "4d. both concurrent requests received the SAME PaymentIntent (same client secret)"
  );
  assert(
    r4a.__json?.clientSecret === `secret_${storedId4}`,
    "4e. returned client secret matches the stored PaymentIntent"
  );

  // --- 5. Existing PaymentIntent is safely reused ---------------------------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-5", "userA", 117);
  const r5a = await paymentRoute.POST(paymentRequest("OB-5"));
  const r5b = await paymentRoute.POST(paymentRequest("OB-5"));
  assert(r5a.__status === 200 && r5b.__status === 200, "5a. first and second request accepted");
  assert(paymentIntentsCreated === 1, "5b. no second PaymentIntent created");
  assert(
    r5a.__json?.clientSecret === r5b.__json?.clientSecret,
    "5c. existing PaymentIntent safely reused (same client secret)"
  );
  assert(
    r5a.__json?.clientSecret === `secret_${firestoreData.get("OB-5").paymentIntentId}`,
    "5d. reused intent id matches the stored PaymentIntent"
  );

  // --- 6. Flood after a create (stress idempotency) -------------------------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-6", "userA", 117);
  await Promise.all([
    paymentRoute.POST(paymentRequest("OB-6")),
    paymentRoute.POST(paymentRequest("OB-6")),
    paymentRoute.POST(paymentRequest("OB-6")),
    paymentRoute.POST(paymentRequest("OB-6")),
  ]);
  assert(paymentIntentsCreated === 1, "6a. flood of 4 concurrent attempts -> one PaymentIntent");
  assert(
    typeof firestoreData.get("OB-6").paymentIntentId === "string",
    "6b. exactly one PaymentIntent id stored after flood"
  );

  const runValidWebhook = async (orderId) => {
    const storedId = firestoreData.get(orderId).paymentIntentId;
    const pi = stripePaymentIntents.get(storedId);
    nextWebhookPi = { ...pi, metadata: { orderId } };
    return webhookRoute.POST(webhookRequest(pi));
  };

  // --- 7. Valid webhook marks the correct order paid ------------------------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-7", "userA", 117);
  await paymentRoute.POST(paymentRequest("OB-7"));
  const storedId7 = firestoreData.get("OB-7").paymentIntentId;
  const pi7 = stripePaymentIntents.get(storedId7);
  nextWebhookPi = { ...pi7, metadata: { orderId: "OB-7" } };
  res = await webhookRoute.POST(webhookRequest(pi7));
  assert(res.__status === 200, "7a. valid webhook accepted");
  assert(firestoreData.get("OB-7").paymentStatus === "paid", "7b. correct order marked paid");

  // --- 8. Duplicate valid webhook remains idempotent ------------------------
  const tsBefore = serverTimestampCalls;
  await webhookRoute.POST(webhookRequest(pi7));
  await webhookRoute.POST(webhookRequest(pi7));
  assert(serverTimestampCalls === tsBefore, "8a. duplicate webhook did NOT process/pay again");
  assert(firestoreData.get("OB-7").paymentStatus === "paid", "8b. order still paid once");

  // --- 9. Amount mismatch webhook leaves order unpaid -----------------------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-9", "userA", 117);
  await paymentRoute.POST(paymentRequest("OB-9"));
  const storedId9 = firestoreData.get("OB-9").paymentIntentId;
  const badPi9 = { ...stripePaymentIntents.get(storedId9), amount: (117 * 1000) + 1 };
  nextWebhookPi = { ...badPi9, metadata: { orderId: "OB-9" } };
  await webhookRoute.POST(webhookRequest(badPi9));
  assert(firestoreData.get("OB-9").paymentStatus === "unpaid", "9a. amount mismatch -> order UNPAID");

  // --- 10. Currency mismatch webhook leaves order unpaid --------------------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-10", "userA", 117);
  await paymentRoute.POST(paymentRequest("OB-10"));
  const storedId10 = firestoreData.get("OB-10").paymentIntentId;
  const badPi10 = { ...stripePaymentIntents.get(storedId10), currency: "usd" };
  nextWebhookPi = { ...badPi10, metadata: { orderId: "OB-10" } };
  await webhookRoute.POST(webhookRequest(badPi10));
  assert(firestoreData.get("OB-10").paymentStatus === "unpaid", "10a. currency mismatch -> order UNPAID");

  // --- 11. Wrong PaymentIntent ID webhook leaves order unpaid ---------------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-11", "userA", 117);
  await paymentRoute.POST(paymentRequest("OB-11"));
  const storedId11 = firestoreData.get("OB-11").paymentIntentId;
  const otherPi11 = { ...stripePaymentIntents.get(storedId11), id: "pi_test_WRONG" };
  nextWebhookPi = { ...otherPi11, metadata: { orderId: "OB-11" } };
  await webhookRoute.POST(webhookRequest(otherPi11));
  assert(firestoreData.get("OB-11").paymentStatus === "unpaid", "11a. wrong PaymentIntent id -> order UNPAID");

  // --- 12. Wrong metadata order ID webhook leaves order unpaid --------------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-12", "userA", 117);
  await paymentRoute.POST(paymentRequest("OB-12"));
  const storedId12 = firestoreData.get("OB-12").paymentIntentId;
  const pi12 = stripePaymentIntents.get(storedId12);
  nextWebhookPi = { ...pi12, metadata: { orderId: "OB-OTHER" } }; // wrong order
  await webhookRoute.POST(webhookRequest(pi12));
  assert(firestoreData.get("OB-12").paymentStatus === "unpaid", "12a. wrong metadata orderId -> order UNPAID");

  // --- 13. Order remains unpaid without a verified webhook ------------------
  reset();
  tokens.set("tokenA", "userA");
  seedOrder("OB-13", "userA", 117);
  await paymentRoute.POST(paymentRequest("OB-13"));
  assert(firestoreData.get("OB-13").paymentStatus === "unpaid", "13a. client-side success (no webhook) -> order UNPAID");

  console.log("\n======================================");
  console.log(failures === 0 ? `ALL ${results.length} ASSERTIONS PASSED` : `${failures} ASSERTION(S) FAILED`);
  console.log("======================================");
  process.exit(failures === 0 ? 0 : 1);
})();

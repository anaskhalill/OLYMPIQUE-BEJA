import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAdminDb } from "@/lib/admin/firebase-admin";
import { extractBearerToken, verifyIdToken } from "@/lib/admin/verify-id-token";

const openai =
  process.env.OPENROUTER_API_KEY &&
  !process.env.OPENROUTER_API_KEY.startsWith("your_")
    ? new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        timeout: 20000,
        maxRetries: 1,
        defaultHeaders: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "Olympique Beja Assistant",
        },
      })
    : null;

const MODELS = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemini-2.0-flash-lite-001",
  "openai/gpt-3.5-turbo",
];

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_MESSAGES = 8;
const MAX_TOKENS = 800;
const MAX_REQUESTS_PER_DAY = 30;

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function tooManyRequests(): NextResponse {
  return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
}

class RateLimitExceededError extends Error {
  constructor() {
    super("Rate limit exceeded");
    this.name = "RateLimitExceededError";
  }
}

const CLUB_KNOWLEDGE = `
OLYMPIQUE DE BEJA (Olympique Beja / OB) - OFFICIAL INFORMATION:

1. FOUNDATION & IDENTITY:
- Full name: Olympique de Beja.
- Founded: July 17, 1929 in Beja, northwest Tunisia.
- Colors: Red and White.
- Nickname: "El Lampik" (The Storks).
- Stadium: Stade Boujemaa Kmiti, capacity 15,000.
- League: Tunisian Ligue Professionnelle 1.

2. HONOURS:
- Coupe de Tunisie: 3 titles (1992/1993, 2009/2010, 2022/2023).
- Super Coupe de Tunisie: 2 titles (1995, 2023).
- Ligue Professionnelle 2: 3 titles (1984/1985, 2005/2006, 2019/2020).
- Best Ligue 1 finish: 5th in 1997/1998.

3. CURRENT SQUAD 2026/2027:
- Coach: Nacif Beyaoui.
- Key players listed in knowledge base.
`;

const getSystemPrompt = (language: string) => {
  const prompts: Record<string, string> = {
    fr: `Tu es l'assistant officiel de l'Olympique de Beja (Tunisie).
${CLUB_KNOWLEDGE}
CONSIGNES:
- Reponds toujours en francais avec precision.
- Fournis uniquement des faits verifies.
- Ne jamais inventer des titres ou des resultats inexistants.`,
    ar: `انت المساعد الذكي الرسمي للأولمبي الباجي التونسي.
${CLUB_KNOWLEDGE}
تعليمات:
- اجب دائماً بالعربية الفصحى.
- قدم حقائق دقيقة 100%.
- لا تخترع بطولات.`,
    en: `You are the official Olympique Beja Assistant.
${CLUB_KNOWLEDGE}
RULES:
- Respond in English with accurate, verified facts.
- Be passionate and authentic.`,
  };
  return prompts[language] || prompts.fr;
};

function getLocalClubResponse(query: string, lang: string): string | null {
  const q = query.toLowerCase().trim();

  if (lang === "ar" || /[\u0600-\u06FF]/.test(query)) {
    if (q.includes("تأسيس") || q.includes("تاريخ") || q.includes("متى")) {
      return "تأسيس الأولمبي الباجي في **17 يوليو 1929** في مدينة باجة.";
    }
    if (q.includes("ألقاب") || q.includes("بطولات") || q.includes("كأس")) {
      return "سجل ألقاب: كأس تونس 3 مرات (1993، 2010، 2023)، الكأس الممتازة مرتين (1995، 2023).";
    }
    if (q.includes("ملعب")) {
      return "يلعب على **ملعب بوجمعة كميتي** بباجة، سعة 15 ألف متفرج.";
    }
  }

  if (lang === "fr" || lang === "en") {
    if (q.includes("fondation") || q.includes("fonde") || q.includes("founded") || q.includes("beja")) {
      return "L'**Olympique de Beja** a ete fonde le **17 juillet 1929** a Beja, nord-ouest de la Tunisie. Surnomme El Lampik (Les Storks).";
    }
    if (q.includes("palmares") || q.includes("titres") || q.includes("trophies") || q.includes("coupe")) {
      return "Palmares: Coupe de Tunisie x3 (1993, 2010, 2023), Super Coupe x2 (1995, 2023), Ligue 2 x3 (1985, 2006, 2020).";
    }
    if (q.includes("stade") || q.includes("stadium") || q.includes("kmiti")) {
      return "L'OB evolue au **Stade Boujemaa Kmiti** a Beja, capacite **15 000 places**.";
    }
    if (q.includes("couleur") || q.includes("colors") || q.includes("rouge")) {
      return "Les couleurs de l'OB sont le **rouge et le blanc**.";
    }
    if (q.includes("derby") || q.includes("nord")) {
      return "L'OB est le porte-drapeau du football du nord-ouest tunisien.";
    }
    if (q.includes("coach") || q.includes("entraineur") || q.includes("beyaoui")) {
      return "L'entraineur actuel est **Nacif Beyaoui**, en poste pour la saison 2026/2027.";
    }
    if (q.includes("effectif") || q.includes("squad") || q.includes("players") || q.includes("joueurs")) {
      return "Consultez la section Equipe pour l'effectif complet 2026/2027.";
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const db = getAdminDb();
  if (!db) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const authorization = request.headers.get("authorization");
  const token = extractBearerToken(authorization);
  const session = await verifyIdToken(token);
  if (!session?.uid) return unauthorized();

  let language = "fr";

  try {
    const today = new Date().toISOString().slice(0, 10);
    const usageRef = db
      .collection("users")
      .doc(session.uid)
      .collection("chatUsage")
      .doc(today);

    // Atomic daily rate limit: read the current count and increment inside a
    // single transaction so concurrent requests cannot race past the cap.
    try {
      await db.runTransaction(async (tx) => {
        const usageSnap = await tx.get(usageRef);
        const usageData = usageSnap.exists ? usageSnap.data() : undefined;
        const usageCount =
          usageData && typeof usageData.count === "number"
            ? (usageData.count as number)
            : 0;
        if (usageCount >= MAX_REQUESTS_PER_DAY) {
          throw new RateLimitExceededError();
        }
        tx.set(usageRef, { count: usageCount + 1 }, { merge: true });
      });
    } catch (err) {
      if (err instanceof RateLimitExceededError) {
        return tooManyRequests();
      }
      throw err;
    }

    const body = await request.json();
    const message = body.message;
    const messages = body.messages || [];

    if (body.language && ["fr", "en", "ar"].includes(body.language)) {
      language = body.language;
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` },
        { status: 400 }
      );
    }

    const sanitizedMessage = message
      .replace(/[<>]/g, "")
      .trim();

    const localAnswer = getLocalClubResponse(sanitizedMessage, language);
    if (localAnswer) {
      return NextResponse.json({ reply: localAnswer, response: localAnswer });
    }

    if (openai && process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.startsWith("your_")) {
      let liveDataContext = "";
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
        const [standingsRes, fixturesRes] = await Promise.allSettled([
          fetch(`${baseUrl}/api/standings`, { cache: "no-store" }).then((r) => r.json()),
          fetch(`${baseUrl}/api/fixtures`, { cache: "no-store" }).then((r) => r.json()),
        ]);

        if (standingsRes.status === "fulfilled" && standingsRes.value) {
          const rows = standingsRes.value.standings?.[0]?.rows || standingsRes.value.overall || [];
          if (rows.length > 0) {
            const obRow = rows.find(
              (r: Record<string, unknown>) =>
                ((r.team as Record<string, unknown>)?.name as string || "").toLowerCase().includes("beja")
            );
            if (obRow) {
              liveDataContext += `\nCLASSEMENT: OB ${obRow.position}eme avec ${obRow.points}pts.\n`;
            }
          }
        }
        if (fixturesRes.status === "fulfilled" && fixturesRes.value) {
          const recent = fixturesRes.value.recent || [];
          if (recent.length > 0) {
            const last = recent[0];
            liveDataContext += `DERNIER MATCH: ${last.date} - OB ${last.score || "?"} ${last.opponent}.\n`;
          }
        }
      } catch {
        // Live data unavailable - proceed without it
      }

      const systemPrompt =
        getSystemPrompt(language) + (liveDataContext ? `\nDATA:\n${liveDataContext}` : "");

      // Build conversation history defensively: only well-formed user/assistant
      // turns are forwarded, unknown roles are dropped, and content is capped.
      const conversationHistory = (Array.isArray(messages) ? messages : [])
        .slice(-MAX_HISTORY_MESSAGES)
        .map((raw) => {
          const m = (raw ?? {}) as Record<string, unknown>;
          const role = m.role === "assistant" ? "assistant" : m.role === "user" ? "user" : null;
          if (!role) return null;
          const content =
            typeof m.content === "string" ? m.content.replace(/[\x00-\x1f\x7f]/g, "").slice(0, MAX_MESSAGE_LENGTH) : "";
          return { role: role as "user" | "assistant", content };
        })
        .filter((m): m is { role: "user" | "assistant"; content: string } => m !== null && m.content.length > 0);

      for (const model of MODELS) {
        try {
          const completion = await openai.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              ...conversationHistory,
              { role: "user", content: sanitizedMessage },
            ],
            temperature: 0.6,
            max_tokens: MAX_TOKENS,
          });

          const reply = completion.choices[0]?.message?.content;
          if (reply && reply.trim().length > 0) {
            return NextResponse.json({ reply, response: reply });
          }
        } catch {
          continue;
        }
      }
    }

    const defaultFallbacks: Record<string, string> = {
      fr: "L'Olympique de Beja (fonde en 1929) joue en rouge et blanc au Stade Boujemaa Kmiti. 3 Coupes de Tunisie ! Posez-moi vos questions sur le club !",
      ar: "الأولمبي الباجي تأسس في 17 يوليو 1929. يلعب بالأحمر والأبيض على ملعب بوجمعة كميتي. 3 ألقاب لكأس تونس!",
      en: "Olympique Beja (founded 1929) plays in red and white at Stade Boujemaa Kmiti. 3 Tunisian Cups! Ask me about the club!",
    };

    const reply = defaultFallbacks[language] || defaultFallbacks.fr;
    return NextResponse.json({ reply, response: reply });
  } catch (error: unknown) {
    console.error("Chat API Error:", error instanceof Error ? error.message : "Unknown error");
    const errorFallback =
      language === "ar"
        ? "مرحباً بك! الأولمبي الباجي تأسس في 1929. اسألني عن النادي!"
        : "Bienvenue ! L'Olympique de Beja (fonde en 1929). Posez-moi vos questions !";

    return NextResponse.json({ reply: errorFallback, response: errorFallback });
  }
}

import { NextResponse } from "next/server";

const SOFASCORE_API = "https://www.sofascore.com/api/v1";

// Olympique Béja
const TEAM_ID = 59634;

// Tunisian Ligue 1
const LIGUE_1_ID = 984;

export const dynamic = "force-dynamic";
export const revalidate = 0;


// ============================================================
// SOFASCORE FETCH
// ============================================================

async function sofaFetch(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `SofaScore ${response.status}: ${url}`
    );
  }

  return response.json();
}


// ============================================================
// GET EVENTS FROM MULTIPLE PAGES
// ============================================================

async function getTeamEvents() {
  const pages = Array.from({ length: 5 }, (_, i) => i);

  const results = await Promise.allSettled([
    ...pages.map((page) =>
      sofaFetch(
        `${SOFASCORE_API}/team/${TEAM_ID}/events/next/${page}`
      )
    ),

    ...pages.map((page) =>
      sofaFetch(
        `${SOFASCORE_API}/team/${TEAM_ID}/events/last/${page}`
      )
    ),
  ]);

  const events: any[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;

    if (Array.isArray(result.value?.events)) {
      events.push(...result.value.events);
    }
  }

  // Remove duplicates
  const uniqueEvents = new Map<number, any>();

  for (const event of events) {
    if (event?.id) {
      uniqueEvents.set(event.id, event);
    }
  }

  return Array.from(uniqueEvents.values());
}


// ============================================================
// CHECK IF EVENT BELONGS TO OLYMPIQUE BÉJA
// ============================================================

function isObEvent(event: any) {
  return (
    event.homeTeam?.id === TEAM_ID ||
    event.awayTeam?.id === TEAM_ID
  );
}


// ============================================================
// GET COMPETITION NAME
// ============================================================

function getCompetition(event: any) {
  const tournament = event.tournament?.uniqueTournament;

  if (!tournament) {
    return event.tournament?.name || "Football";
  }

  return tournament.name || event.tournament?.name || "Football";
}


// ============================================================
// CHECK COMPETITION
// ============================================================

function isRelevantCompetition(event: any) {
  const tournamentId =
    event.tournament?.uniqueTournament?.id;

  const name = getCompetition(event).toLowerCase();

  // Ligue 1 Tunisia only
  if (tournamentId === LIGUE_1_ID) {
    return true;
  }

  // Extra protection in case SofaScore tournament ID changes
  if (name.includes("ligue 1")) {
    return true;
  }

  return false;
}


// ============================================================
// MAP SOFASCORE POSITION CODE
// ============================================================

function mapPosition(pos?: string): string {
  if (!pos) return "Unknown";
  const p = pos.toUpperCase();
  if (p === "G" || p === "GK" || p === "GOALKEEPER") return "Goalkeeper";
  if (p === "D" || p === "DEF" || p === "DEFENDER") return "Defender";
  if (p === "M" || p === "MID" || p === "MIDFIELDER") return "Midfielder";
  if (p === "F" || p === "FWD" || p === "FORWARD" || p === "STRIKER") return "Forward";
  return pos;
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(timestamp?: number) {
  if (!timestamp) {
    return {
      date: "Date à confirmer",
      time: "Heure à confirmer",
    };
  }

  const date = new Date(timestamp * 1000);

  return {
    date: date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Tunis",
    }),

    time: date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Tunis",
    }),
  };
}


// ============================================================
// MAP SOFASCORE EVENT
// ============================================================

// Maintained manually. Keyed by opponent name so we can attribute
// the correct goalscorers/assists even when SofaScore doesn't
// provide per-goal event data. Each entry: array of
// { name, minute, assist }.
const KNOWN_SCORERS: Record<
  string,
  Array<{ name: string; minute?: number; assist?: string }>
> = {
  "US Ben Guerdane": [
    { name: "Hasni B.", minute: 69, assist: "Gafsi H." },
  ],
};

function getScorers(
  opponentName: string
): Array<{ name: string; minute?: number; assist?: string }> {
  if (!opponentName) return [];

  const direct = KNOWN_SCORERS[opponentName];

  if (direct) return direct;

  // Fallback: normalize & fuzzy-match opponent names
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z]/g, "");

  const key = norm(opponentName);

  for (const name of Object.keys(KNOWN_SCORERS)) {
    if (norm(name) === key) return KNOWN_SCORERS[name];
  }

  return [];
}

function mapSofaScoreEvent(event: any) {
  const isHome = event.homeTeam?.id === TEAM_ID;

  const homeScore =
    event.homeScore?.current ??
    event.homeScore?.display ??
    null;

  const awayScore =
    event.awayScore?.current ??
    event.awayScore?.display ??
    null;

  const isFinished =
    event.status?.type === "finished";

  const isLive =
    event.status?.type === "inprogress" ||
    event.status?.type === "live";

  const caScore = isHome
    ? homeScore
    : awayScore;

  const opponentScore = isHome
    ? awayScore
    : homeScore;

  const opponent = isHome
    ? event.awayTeam
    : event.homeTeam;

  let result: "Win" | "Draw" | "Loss" | null = null;

  if (
    isFinished &&
    caScore !== null &&
    opponentScore !== null
  ) {
    if (caScore > opponentScore) {
      result = "Win";
    } else if (caScore === opponentScore) {
      result = "Draw";
    } else {
      result = "Loss";
    }
  }

  const { date, time } =
    formatDate(event.startTimestamp);

  // Match status
  let status = "upcoming";

  if (isLive) {
    status = "live";
  } else if (isFinished) {
    status = "finished";
  }

  return {
    id: event.id,

    opponent:
      opponent?.name ||
      "Adversaire à confirmer",

    opponentShortName:
      opponent?.shortName ||
      opponent?.nameCode ||
      "",

    opponentId:
      opponent?.id || null,

    score:
      caScore !== null &&
      opponentScore !== null
        ? `${caScore}-${opponentScore}`
        : null,

    homeScore,
    awayScore,

    date,
    time,

    timestamp:
      event.startTimestamp || null,

    competition:
      getCompetition(event),

    competitionId:
      event.tournament?.uniqueTournament?.id ||
      null,

    venue:
      event.venue?.name ||
      "Stade à confirmer",

    city:
      event.venue?.city ||
      null,

    matchday:
      event.roundInfo?.round ||
      event.roundInfo?.name ||
      null,

    isHome,

    result,

    status,

    // Useful for your frontend
    isLive,
    isFinished,

    scorers: getScorers(opponent?.name || ""),

    highlightUrl:
      `https://www.youtube.com/results?search_query=` +
      encodeURIComponent(
        `Olympique Béja ${opponent?.name || ""} highlights`
      ),

    slug: event.slug || null,
  };
}


// ============================================================
// GET
// ============================================================

export async function GET() {
  try {
    const events = await getTeamEvents();

    // Keep only Olympique Béja matches
    const clubEvents = events
      .filter(isObEvent)
      .filter(isRelevantCompetition);

    if (clubEvents.length === 0) {
      throw new Error(
        "No Olympique Béja fixtures found"
      );
    }

    // Map
    const mapped = clubEvents.map(
      mapSofaScoreEvent
    );

    // Sort oldest -> newest
    mapped.sort(
      (a, b) =>
        (a.timestamp || 0) -
        (b.timestamp || 0)
    );

    // Finished / live / upcoming
    const recent = mapped
      .filter(
        (match) =>
          match.status === "finished"
      )
      .sort(
        (a, b) =>
          (b.timestamp || 0) -
          (a.timestamp || 0)
      )
      .slice(0, 10);

    // Fetch lineup for the most recent finished match
    let latestLineup = null;
    if (recent.length > 0) {
      try {
        const latestEventId = recent[0].id;
        const lineupData = await sofaFetch(
          `${SOFASCORE_API}/event/${latestEventId}/lineups`
        );
        if (lineupData?.confirmed) {
          const isObHome = recent[0].isHome;
          const obTeam = isObHome ? lineupData.home : lineupData.away;
          if (obTeam?.players) {
            const formation = obTeam.formation || "4-3-3";
            const starters = obTeam.players
              .filter((p: any) => !p.substitute)
              .sort((a: any, b: any) => (a.shirtNumber || 0) - (b.shirtNumber || 0));
            const bench = obTeam.players
              .filter((p: any) => p.substitute)
              .sort((a: any, b: any) => (a.shirtNumber || 0) - (b.shirtNumber || 0));
            latestLineup = {
              formation,
              matchday: recent[0].matchday,
              opponent: recent[0].opponent,
              score: recent[0].score,
              date: recent[0].date,
              isHome: isObHome,
              starters: starters.map((p: any) => ({
                name: p.player?.name || p.player?.shortName || "Unknown",
                number: p.shirtNumber || 0,
                position: mapPosition(p.position || p.player?.position),
                nationality: p.player?.country?.name || "",
                image: `/cards/${(p.player?.shortName || "player").toLowerCase().replace(/\s+/g, "")}.png`,
              })),
              bench: bench.map((p: any) => ({
                name: p.player?.name || p.player?.shortName || "Unknown",
                number: p.shirtNumber || 0,
                position: mapPosition(p.position || p.player?.position),
                nationality: p.player?.country?.name || "",
                image: `/cards/${(p.player?.shortName || "player").toLowerCase().replace(/\s+/g, "")}.png`,
              })),
            };
          }
        }
      } catch (lineupErr) {
        console.warn("Lineup fetch failed:", (lineupErr as any)?.message);
      }
    }

    const live = mapped.filter(
      (match) => match.status === "live"
    );

    const upcoming = mapped
      .filter(
        (match) =>
          match.status === "upcoming"
      )
      .sort(
        (a, b) =>
          (a.timestamp || 0) -
          (b.timestamp || 0)
      )
      .slice(0, 20);

    return NextResponse.json(
      {
        upcoming,
        recent,
        live,
        latestLineup,

        // Everything is useful if you need a
        // complete fixtures page
        all: mapped,

        lastUpdated:
          new Date().toISOString(),

        isFallback: false,

        source: "SofaScore",
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Olympique Béja fixtures error:",
      error
    );

    return NextResponse.json(
      getFallbackFixtures(),
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}


// ============================================================
// FALLBACK
// ============================================================

function getFallbackFixtures() {
  return {
    upcoming: [
  // =========================
  // LIGUE 1
  // =========================

  {
    opponent: "CA Bizertin",
    date: "05 Septembre 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade 15 Octobre",
    matchday: "J3",
  },

  {
    opponent: "PS Sakiet Eddaïer",
    date: "12 Septembre 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J4",
  },

  {
    opponent: "Espérance de Tunis",
    date: "10 Octobre 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade Olympique de Radès",
    matchday: "J5",
  },

  {
    opponent: "ES Sahel",
    date: "17 Octobre 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J6",
  },

  {
    opponent: "JS Omrane",
    date: "24 Octobre 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade El Menzah",
    matchday: "J7",
  },

  {
    opponent: "AS Marsa",
    date: "21 Novembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J8",
  },

  {
    opponent: "CS Hammam-Lif",
    date: "28 Novembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Bou Kornine",
    matchday: "J9",
  },

  {
    opponent: "ES Métlaoui",
    date: "05 Décembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J10",
  },

  {
    opponent: "CS Sfaxien",
    date: "12 Décembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J11",
  },

  {
    opponent: "US Monastir",
    date: "19 Décembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Mustapha Ben Jannet",
    matchday: "J12",
  },

  {
    opponent: "Club Africain",
    date: "26 Décembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J13",
  },

  {
    opponent: "ES Hammam Sousse",
    date: "30 Décembre 2026",
    time: "17:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J14",
  },

  {
    opponent: "Stade Tunisien",
    date: "02 Janvier 2027",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J15",
  },
    ],

    recent: [
  {
    opponent: "US Ben Guerdane",
    date: "30 Août 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade Boujemaa Kmiti",
    matchday: "J2",
    score: "1-2",
    result: "Loss",
    scorers: [{ name: "Hasni B.", minute: 69, assist: "Gafsi H." }],
    highlightUrl:
      "https://www.youtube.com/results?search_query=Olympique+B%C3%A9ja+1-2+US+Ben+Guerdane+2026",
  },

  {
    opponent: "ES Zarzis",
    date: "23 Août 2026",
    time: "16:30",
    competition: "Ligue 1",
    venue: "Stade Abdessalam Kazouz (Zlidi)",
    matchday: "J1",
    score: "0-1",
    result: "Loss",
    scorers: [],
    highlightUrl:
      "https://www.youtube.com/results?search_query=ES+Zarzis+1-0+Olympique+B%C3%A9ja+2026",
  },
    ],

    live: [],

    all: [],

    lastUpdated:
      new Date().toISOString(),

    isFallback: true,

    source: "Fallback",
  };
}
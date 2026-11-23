import { NextResponse } from "next/server";

const SOFASCORE_API = "https://www.sofascore.com/api/v1";
const TOURNAMENT_ID = 984; // Tunisian Ligue Professionnelle 1

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      `SofaScore error ${response.status}: ${url}`
    );
  }

  return response.json();
}

export async function GET() {
  try {
    // =====================================================
    // 1. GET ALL SEASONS
    // =====================================================

    const seasonsData = await sofaFetch(
      `${SOFASCORE_API}/unique-tournament/${TOURNAMENT_ID}/seasons`
    );

    const seasons = seasonsData?.seasons;

    if (!Array.isArray(seasons) || seasons.length === 0) {
      throw new Error("No SofaScore seasons found");
    }

    // =====================================================
    // 2. FIND CURRENT 2026/27 SEASON
    // =====================================================

    const currentSeason =
      seasons.find(
        (season: any) =>
          season.name === "2026/2027" ||
          season.name === "2026/27" ||
          season.year === "2026/2027"
      ) || seasons[0];

    const seasonId = currentSeason.id;

    // =====================================================
    // 3. GET LIVE STANDINGS (overall, home, away)
    // =====================================================

    const normalizeRows = (rows: any[]) =>
      rows.map((row: any, index: number) => ({
        position: row.position ?? index + 1,

        team: {
          id: row.team?.id,
          name: row.team?.name,
          shortName:
            row.team?.shortName ||
            row.team?.nameCode ||
            row.team?.shortName,
          slug: row.team?.slug,
          logo: row.team?.id
            ? `https://api.sofascore.com/api/v1/team/${row.team.id}/image`
            : null,
        },

        matches: row.matches ?? 0,
        wins: row.wins ?? 0,
        draws: row.draws ?? 0,
        losses: row.losses ?? 0,

        goalsFor: row.scoresFor ?? 0,
        goalsAgainst: row.scoresAgainst ?? 0,

        goalDifference:
          row.goalDifference ??
          (row.scoresFor ?? 0) - (row.scoresAgainst ?? 0),

        points: row.points ?? 0,

        // Extra SofaScore information
        promotion: row.promotion || null,
        descriptions: row.descriptions || [],
      }));

    const fetchStandingsType = async (type: string) => {
      const standingsData = await sofaFetch(
        `${SOFASCORE_API}/unique-tournament/${TOURNAMENT_ID}/season/${seasonId}/standings/${type}`
      );
      const rows = standingsData?.standings?.[0]?.rows;
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error(`No ${type} standings returned from SofaScore`);
      }
      return normalizeRows(rows);
    };

    const totalRows = await fetchStandingsType("total");

    // Home & away are best-effort: fall back to overall if unavailable.
    let homeRows: any[] = totalRows;
    let awayRows: any[] = totalRows;
    try {
      homeRows = await fetchStandingsType("home");
    } catch (err: any) {
      console.warn("Home standings unavailable, using overall:", err?.message || err);
    }
    try {
      awayRows = await fetchStandingsType("away");
    } catch (err: any) {
      console.warn("Away standings unavailable, using overall:", err?.message || err);
    }

// =====================================================
// 5. FIND OLYMPIQUE BÉJA
// =====================================================

const ob = totalRows.find((row: any) => {
  const name = row.team.name?.toLowerCase();
  const shortName = row.team.shortName?.toLowerCase();

  return (
    name?.includes("olympique beja") ||
    name?.includes("olympique béja") ||
    name?.includes("beja") ||
    shortName === "ob" ||
    shortName === "ojb"
  );
});

    // =====================================================
    // 6. RETURN LIVE DATA
    // =====================================================

    return NextResponse.json(
      {
        standings: [
          {
            type: "total",
            rows: totalRows,
          },
          {
            type: "home",
            rows: homeRows,
          },
          {
            type: "away",
            rows: awayRows,
          },
        ],

        season: {
          id: seasonId,
          name: currentSeason.name,
          slug: currentSeason.slug,
        },

        ob: ob || null,

        lastUpdated: new Date().toISOString(),

        isFallback: false,

        source: "SofaScore",
      },
      {
        headers: {
          // Don't let browser/CDN keep old standings
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("SofaScore standings error:", error);

    // =====================================================
    // EMERGENCY FALLBACK
    // =====================================================

    return NextResponse.json(
      getFallbackStandings(),
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}


// =========================================================
// EMERGENCY FALLBACK
// =========================================================

function getFallbackStandings() {
  return {
    standings: [
      {
        type: "total",
        rows: [
          {
            position: 1,
            team: {
              name: "JS Omrane",
              shortName: "JSO",
            },
            matches: 2,
            wins: 2,
            draws: 0,
            losses: 0,
            goalsFor: 5,
            goalsAgainst: 1,
            goalDifference: 4,
            points: 6,
          },

          {
            position: 2,
            team: {
              name: "PS Sakiet Eddaïer",
              shortName: "PSSE",
            },
            matches: 2,
            wins: 2,
            draws: 0,
            losses: 0,
            goalsFor: 4,
            goalsAgainst: 1,
            goalDifference: 3,
            points: 6,
          },

          {
            position: 3,
            team: {
              name: "Étoile du Sahel",
              shortName: "ESS",
            },
            matches: 2,
            wins: 2,
            draws: 0,
            losses: 0,
            goalsFor: 4,
            goalsAgainst: 2,
            goalDifference: 2,
            points: 6,
          },

          {
            position: 4,
            team: {
              name: "Club Africain",
              shortName: "CA",
            },
            matches: 2,
            wins: 1,
            draws: 1,
            losses: 0,
            goalsFor: 3,
            goalsAgainst: 1,
            goalDifference: 2,
            points: 4,
          },

          {
            position: 5,
            team: {
              name: "CA Bizertin",
              shortName: "CAB",
            },
            matches: 2,
            wins: 1,
            draws: 1,
            losses: 0,
            goalsFor: 3,
            goalsAgainst: 2,
            goalDifference: 1,
            points: 4,
          },

          {
            position: 6,
            team: {
              name: "CS Sfaxien",
              shortName: "CSS",
            },
            matches: 2,
            wins: 1,
            draws: 1,
            losses: 0,
            goalsFor: 3,
            goalsAgainst: 2,
            goalDifference: 1,
            points: 4,
          },

          {
            position: 7,
            team: {
              name: "Espérance de Tunis",
              shortName: "EST",
            },
            matches: 2,
            wins: 1,
            draws: 1,
            losses: 0,
            goalsFor: 3,
            goalsAgainst: 2,
            goalDifference: 1,
            points: 4,
          },

          {
            position: 8,
            team: {
              name: "US Monastir",
              shortName: "USM",
            },
            matches: 2,
            wins: 1,
            draws: 0,
            losses: 1,
            goalsFor: 3,
            goalsAgainst: 2,
            goalDifference: 1,
            points: 3,
          },

          {
            position: 9,
            team: {
              name: "ES Zarzis",
              shortName: "ESZ",
            },
            matches: 2,
            wins: 1,
            draws: 0,
            losses: 1,
            goalsFor: 2,
            goalsAgainst: 1,
            goalDifference: 1,
            points: 3,
          },

          {
            position: 10,
            team: {
              name: "AS Marsa",
              shortName: "ASM",
            },
            matches: 2,
            wins: 1,
            draws: 0,
            losses: 1,
            goalsFor: 2,
            goalsAgainst: 2,
            goalDifference: 0,
            points: 3,
          },

          {
            position: 11,
            team: {
              name: "ES Hammam-Sousse",
              shortName: "ESHS",
            },
            matches: 2,
            wins: 1,
            draws: 0,
            losses: 1,
            goalsFor: 2,
            goalsAgainst: 2,
            goalDifference: 0,
            points: 3,
          },

          {
            position: 12,
            team: {
              name: "Stade Tunisien",
              shortName: "ST",
            },
            matches: 2,
            wins: 0,
            draws: 1,
            losses: 1,
            goalsFor: 1,
            goalsAgainst: 2,
            goalDifference: -1,
            points: 1,
          },

          {
            position: 13,
            team: {
              name: "US Ben Guerdane",
              shortName: "USBG",
            },
            matches: 2,
            wins: 0,
            draws: 1,
            losses: 1,
            goalsFor: 1,
            goalsAgainst: 2,
            goalDifference: -1,
            points: 1,
          },

          {
            position: 14,
            team: {
              name: "CS Hammam-Lif",
              shortName: "CSHL",
            },
            matches: 2,
            wins: 0,
            draws: 1,
            losses: 1,
            goalsFor: 0,
            goalsAgainst: 1,
            goalDifference: -1,
            points: 1,
          },

          {
            position: 15,
            team: {
              name: "Olympique Béja",
              shortName: "OB",
            },
            matches: 2,
            wins: 0,
            draws: 0,
            losses: 2,
            goalsFor: 1,
            goalsAgainst: 3,
            goalDifference: -2,
            points: 0,
          },

          {
            position: 16,
            team: {
              name: "ES Métlaoui",
              shortName: "ESM",
            },
            matches: 2,
            wins: 0,
            draws: 0,
            losses: 2,
            goalsFor: 1,
            goalsAgainst: 3,
            goalDifference: -2,
            points: 0,
          },
        ],
      },
    ],
  };
}

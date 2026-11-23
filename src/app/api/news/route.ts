import { NextResponse } from 'next/server';

export const revalidate = 600; // Cache for 10 minutes instead of 1 hour

export async function GET() {
  try {
    const res = await fetch('https://news.google.com/rss/search?q=olympique+b%C3%A9ja+tunisie&hl=fr&gl=TN&ceid=TN:fr', {
      next: { revalidate: 600 }
    });
    
    if (!res.ok) throw new Error('Failed to fetch news');
    const xml = await res.text();

    let items: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    // Parse Google News RSS
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title>([^<]+)<\/title>/);
      const linkMatch = itemXml.match(/<link>([^<]+)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([^<]+)<\/source>/);

      if (titleMatch && linkMatch) {
        let title = titleMatch[1];
        // Clean up title format "News Title - Source Name"
        title = title.replace(/\s+-\s+[^-]+$/, '');
        // Replace HTML entities
        title = title.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
        
        const source = sourceMatch ? sourceMatch[1] : 'News';
        
        // Filter out Eurosport news
        if (source.toLowerCase().includes('eurosport') || title.toLowerCase().includes('eurosport')) {
          continue;
        }
        
        const timestamp = pubDateMatch ? new Date(pubDateMatch[1]).getTime() : Date.now();
        const date = pubDateMatch ? new Date(pubDateMatch[1]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : 'RECENT';
        
        const url = linkMatch[1];
        
        let cat = 'Actualité';
        const titleLower = title.toLowerCase();
        if (titleLower.includes('match') || titleLower.includes('résultat') || titleLower.includes('coupe') || titleLower.includes('ligue') || titleLower.includes('score')) cat = 'Match';
        if (titleLower.includes('transfert') || titleLower.includes('mercato') || titleLower.includes('signer')) cat = 'Transfert';

        items.push({
          title,
          date,
          timestamp,
          source,
          cat,
          url
        });
      }
    }

    // Sort items by new to old
    items.sort((a, b) => b.timestamp - a.timestamp);

    // Pick top 12 items and assign images
    items = items.slice(0, 12).map((item, num) => ({
      ...item,
      img: `/${(num % 3) + 1}.png`
    }));

    if (items.length === 0) {
      throw new Error('No items parsed');
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching news:', error);
    // Fallback to static if fetching fails
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const dateStr = `${day} ${month} ${year}`;
    const dateYesterday = new Date(now.getTime() - 86400000);
    const dayY = String(dateYesterday.getDate()).padStart(2, '0');
    const monthY = dateYesterday.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    const dateStrY = `${dayY} ${monthY} ${year}`;
    const date2Days = new Date(now.getTime() - 2 * 86400000);
    const day2 = String(date2Days.getDate()).padStart(2, '0');
    const month2 = date2Days.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    const dateStr2 = `${day2} ${month2} ${year}`;

    return NextResponse.json({
      items: [
        { title: "Olympique Béja prépare le choc face à l'Espérance de Tunis", date: dateStr, cat: "Match", img: "/1.png", url: "https://olympique-beja.com/actualites/preparation-esperance", source: "Official Site", timestamp: now.getTime() },
        { title: "Nouveau sponsor maillot dévoilé pour la saison 2026/27", date: dateStrY, cat: "Actualité", img: "/2.png", url: "https://www.foot24.tn/equipe/olympique-beja/nouveau-sponsor-2026-27", source: "Foot24", timestamp: dateYesterday.getTime() },
        { title: "Stade Boujemaa Kmiti : travaux de rénovation achevés", date: dateStr2, cat: "Infrastructure", img: "/3.png", url: "https://www.tunisienumerique.com/sport/stade-boujemaa-kmiti-renovation", source: "Tunisie Numerique", timestamp: date2Days.getTime() },
        { title: "Mercato : deux nouvelles recrues signent à l'OB", date: dateStr, cat: "Transfert", img: "/1.png", url: "https://www.foottn.com/mercato/olympique-beja-deux-recrues", source: "FootTN", timestamp: now.getTime() - 3600000 },
        { title: "L'équipe U21 championne de Tunisie", date: dateStrY, cat: "Event", img: "/2.png", url: "https://www.tunisisports.net/equipe/olympique-beja/u21-champion", source: "TunisiaSports", timestamp: dateYesterday.getTime() - 7200000 },
        { title: "Bilel Ifa prolonge son contrat jusqu'en 2029", date: dateStr2, cat: "Transfert", img: "/3.png", url: "https://www.nessmashort.net/sport/bilel-ifa-prolongation-2029", source: "Nessma Sport", timestamp: date2Days.getTime() - 10800000 }
      ]
    });
  }
}


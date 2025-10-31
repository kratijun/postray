import { NextRequest, NextResponse } from 'next/server';

// Overpass API für Hausnummern in Österreich
export async function POST(request: NextRequest) {
  try {
    const { bounds } = await request.json();

    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
      return NextResponse.json(
        { error: 'Ungültige Grenzen' },
        { status: 400 }
      );
    }

    // Overpass Query für Hausnummern in Österreich
    const overpassQuery = `
      [out:json][timeout:25];
      (
        way["addr:housenumber"]["addr:street"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
        node["addr:housenumber"]["addr:street"](${bounds.south},${bounds.west},${bounds.north},${bounds.east});
      );
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      throw new Error('Overpass API Fehler');
    }

    const data = await response.json();

    // Adressen extrahieren und formatieren
    const addresses = data.elements
      .filter((el: any) => el.tags && el.tags['addr:housenumber'] && el.tags['addr:street'])
      .map((el: any) => {
        let lat: number | null = null;
        let lng: number | null = null;

        // Für Nodes: direkte Koordinaten
        if (el.type === 'node' && el.lat && el.lon) {
          lat = parseFloat(el.lat);
          lng = parseFloat(el.lon);
        }
        // Für Ways: center-Koordinaten
        else if (el.type === 'way' && el.center) {
          lat = parseFloat(el.center.lat);
          lng = parseFloat(el.center.lon);
        }

        if (!lat || !lng) return null;

        return {
          street: el.tags['addr:street'],
          houseNumber: el.tags['addr:housenumber'],
          lat,
          lng,
        };
      })
      .filter((addr: any) => addr !== null);

    // Gruppiere nach Straße und Hausnummer, um Duplikate zu vermeiden
    const uniqueAddresses = Array.from(
      new Map(
        addresses.map((addr: any) => [
          `${addr.street}-${addr.houseNumber}`,
          addr,
        ])
      ).values()
    );

    return NextResponse.json({ addresses: uniqueAddresses });
  } catch (error) {
    console.error('Overpass API Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Adressdaten' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Adressen für einen Rayon abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rayonId = searchParams.get('rayonId');

    if (!rayonId) {
      return NextResponse.json(
        { error: 'Rayon-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Prüfe ob Rayon dem Benutzer gehört
    const rayon = await prisma.rayon.findFirst({
      where: {
        id: rayonId,
        userId: session.user.id,
      },
    });

    if (!rayon) {
      return NextResponse.json({ error: 'Rayon nicht gefunden' }, { status: 404 });
    }

    const addresses = await prisma.address.findMany({
      where: { rayonId },
      orderBy: [{ street: 'asc' }, { houseNumber: 'asc' }],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Fehler beim Abrufen der Adressen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Adressen' },
      { status: 500 }
    );
  }
}

// Adressen für einen Rayon erstellen (Batch)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { rayonId, addresses } = await request.json();

    if (!rayonId || !addresses || !Array.isArray(addresses)) {
      return NextResponse.json(
        { error: 'Rayon-ID und Adressen-Array sind erforderlich' },
        { status: 400 }
      );
    }

    // Prüfe ob Rayon dem Benutzer gehört
    const rayon = await prisma.rayon.findFirst({
      where: {
        id: rayonId,
        userId: session.user.id,
      },
    });

    if (!rayon) {
      return NextResponse.json({ error: 'Rayon nicht gefunden' }, { status: 404 });
    }

    // Erstelle Adressen
    const createdAddresses = await prisma.$transaction(
      addresses.map((addr: any) =>
        prisma.address.upsert({
          where: {
            rayonId_street_houseNumber: {
              rayonId,
              street: addr.street,
              houseNumber: addr.houseNumber,
            },
          },
          update: {},
          create: {
            rayonId,
            street: addr.street,
            houseNumber: addr.houseNumber,
            lat: addr.lat,
            lng: addr.lng,
            status: addr.status || 'OPEN',
            notes: addr.notes || null,
          },
        })
      )
    );

    return NextResponse.json(createdAddresses, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen der Adressen:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Adressen' },
      { status: 500 }
    );
  }
}


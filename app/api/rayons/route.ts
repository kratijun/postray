import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Alle Rayons des Benutzers abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const rayons = await prisma.rayon.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { addresses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(rayons);
  } catch (error) {
    console.error('Fehler beim Abrufen der Rayons:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Rayons' },
      { status: 500 }
    );
  }
}

// Neuen Rayon erstellen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { name, bounds } = await request.json();

    if (!name || !bounds) {
      return NextResponse.json(
        { error: 'Name und Grenzen sind erforderlich' },
        { status: 400 }
      );
    }

    const rayon = await prisma.rayon.create({
      data: {
        name,
        bounds: JSON.stringify(bounds),
        userId: session.user.id,
      },
    });

    return NextResponse.json(rayon, { status: 201 });
  } catch (error) {
    console.error('Fehler beim Erstellen des Rayons:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Rayons' },
      { status: 500 }
    );
  }
}


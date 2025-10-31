import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Einzelnen Rayon abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const rayon = await prisma.rayon.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        addresses: true,
      },
    });

    if (!rayon) {
      return NextResponse.json({ error: 'Rayon nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(rayon);
  } catch (error) {
    console.error('Fehler beim Abrufen des Rayons:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden des Rayons' },
      { status: 500 }
    );
  }
}

// Rayon löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    await prisma.rayon.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Rayon gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Rayons:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Rayons' },
      { status: 500 }
    );
  }
}


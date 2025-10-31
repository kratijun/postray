import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Adresse aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const { status, notes } = await request.json();

    // Prüfe ob Adresse zu einem Rayon des Benutzers gehört
    const address = await prisma.address.findUnique({
      where: { id: params.id },
      include: { rayon: true },
    });

    if (!address || address.rayon.userId !== session.user.id) {
      return NextResponse.json({ error: 'Adresse nicht gefunden' }, { status: 404 });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updatedAddress);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Adresse:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Adresse' },
      { status: 500 }
    );
  }
}


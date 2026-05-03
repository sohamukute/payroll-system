import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    interface PatchBody { status: string; reviewedBy?: string; }
    const { status, reviewedBy } = await request.json() as PatchBody;
    const leave = await prisma.leave.update({
      where: { id },
      data: { status, reviewedBy: reviewedBy ?? 'Admin', reviewedAt: new Date() },
      include: { employee: true },
    });
    return NextResponse.json(leave);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update leave' }, { status: 500 });
  }
}

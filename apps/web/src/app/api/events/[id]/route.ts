import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  notes: z.string().optional().nullable(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  tags: z.array(z.string()).optional(),
  colourId: z.string().optional().nullable(),
  recurrence: z.string().optional().nullable(),
});

// PATCH /api/events/[id] — move, reschedule or update event
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.event.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.event.update({
    where: { id },
    data: {
      ...parsed.data,
      startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
      endAt:   parsed.data.endAt   ? new Date(parsed.data.endAt)   : undefined,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/events/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.event.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

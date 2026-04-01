import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  frequency: z.enum(["daily", "weekdays", "custom"]).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  colourId: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  archived: z.boolean().optional(),
});

// PATCH /api/habits/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.habit.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

// DELETE /api/habits/[id] — soft delete (archive)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.habit.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.habit.update({ where: { id }, data: { archived: true } });
  return NextResponse.json({ success: true });
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const HabitSchema = z.object({
  name: z.string().min(1).max(200),
  frequency: z.enum(["daily", "weekdays", "custom"]).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  colourId: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

// GET /api/habits
export async function GET(_req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const habits = await prisma.habit.findMany({
    where: { userId, archived: false },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(habits);
}

// POST /api/habits
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = HabitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const habit = await prisma.habit.create({
    data: {
      ...parsed.data,
      userId,
      daysOfWeek: parsed.data.daysOfWeek ?? [],
    },
  });

  return NextResponse.json(habit, { status: 201 });
}

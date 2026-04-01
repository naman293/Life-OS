import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TaskSchema = z.object({
  title: z.string().min(1).max(500),
  notes: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  durationMins: z.number().int().positive().optional().nullable(),
  tags: z.array(z.string()).optional(),
  colourId: z.string().optional().nullable(),
});

// GET /api/tasks  — list tasks for the current user
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const due    = searchParams.get("due"); // "today" | "upcoming"

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (due === "today") {
    where.dueAt = { gte: today, lt: tomorrow };
  } else if (due === "upcoming") {
    where.dueAt = { gte: tomorrow };
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

// POST /api/tasks  — create a new task
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = TaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      userId,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
      tags: parsed.data.tags ?? [],
    },
  });

  return NextResponse.json(task, { status: 201 });
}

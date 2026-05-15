import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const EventSchema = z.object({
  title: z.string().min(1).max(500),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  notes: z.string().optional().nullable(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  tags: z.array(z.string()).optional(),
  colourId: z.string().optional().nullable(),
  recurrence: z.string().optional().nullable(),
});

// GET /api/events?from=ISO&to=ISO
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { userId };

  if (from || to) {
    // Explicit date range (e.g. calendar view) — honour it exactly
    where.startAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to)   } : {}),
    };
  } else {
    // Default list view — hide events that ended before today's midnight
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    where.endAt = { gte: todayMidnight };
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(events);
}

// POST /api/events
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const event = await prisma.event.create({
    data: {
      ...parsed.data,
      userId,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      tags: parsed.data.tags ?? [],
    },
  });

  return NextResponse.json(event, { status: 201 });
}

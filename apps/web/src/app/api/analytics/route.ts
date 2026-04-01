import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/analytics?range=weekly|daily|monthly
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "weekly";

  const now = new Date();
  let rangeStart: Date;

  if (range === "daily") {
    rangeStart = new Date(now);
    rangeStart.setHours(0, 0, 0, 0);
  } else if (range === "monthly") {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    // weekly — last 7 days
    rangeStart = new Date(now);
    rangeStart.setDate(now.getDate() - 6);
    rangeStart.setHours(0, 0, 0, 0);
  }

  // Task stats
  const [allTasks, doneTasks, inProgressTasks] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: "DONE" } }),
    prisma.task.count({ where: { userId, status: "IN_PROGRESS" } }),
  ]);

  // Tasks completed per day (last 7 days)
  const completedByDay = await prisma.task.findMany({
    where: {
      userId,
      status: "DONE",
      updatedAt: { gte: rangeStart },
    },
    select: { updatedAt: true },
  });

  const dayMap: Record<string, number> = {};
  completedByDay.forEach(({ updatedAt }) => {
    const key = updatedAt.toISOString().split("T")[0];
    dayMap[key] = (dayMap[key] ?? 0) + 1;
  });

  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - 6 + i);
    const key = d.toISOString().split("T")[0];
    return { date: key, day: d.toLocaleDateString("en-US", { weekday: "short" }), completed: dayMap[key] ?? 0 };
  });

  // Category distribution
  const tasksByTag = await prisma.task.findMany({
    where: { userId },
    select: { tags: true },
  });

  const tagCounts: Record<string, number> = {};
  tasksByTag.forEach(({ tags }) => {
    tags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    });
  });

  const categoryData = Object.entries(tagCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Habit stats
  const habits = await prisma.habit.findMany({
    where: { userId, archived: false },
    include: {
      logs: {
        where: { state: "DONE" },
        orderBy: { date: "desc" },
      },
    },
  });

  const habitStats = habits.map((h) => {
    const doneDates = new Set(h.logs.map((l) => l.date));

    // Current streak
    let streak = 0;
    const d = new Date();
    while (doneDates.has(d.toISOString().split("T")[0])) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    // Best streak
    const sortedDates = [...h.logs.map((l) => l.date)].sort();
    let best = sortedDates.length > 0 ? 1 : 0;
    let cur = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { cur++; best = Math.max(best, cur); }
      else cur = 1;
    }

    // Weekly rate (0–100)
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d2 = new Date(now);
      d2.setDate(now.getDate() - 6 + i);
      return d2.toISOString().split("T")[0];
    });
    const weeklyDone = weekDays.filter((day) => doneDates.has(day)).length;
    const weeklyRate = Math.round((weeklyDone / 7) * 100);

    return {
      id: h.id,
      name: h.name,
      icon: h.icon,
      colourId: h.colourId,
      streak,
      bestStreak: best,
      weeklyRate,
    };
  });

  const completionPct = allTasks > 0 ? Math.round((doneTasks / allTasks) * 100) : 0;

  return NextResponse.json({
    summary: {
      totalTasks: allTasks,
      doneTasks,
      inProgressTasks,
      todoTasks: allTasks - doneTasks - inProgressTasks,
      completionPct,
    },
    dailyTrend,
    categoryData,
    habitStats,
    maxStreak: habitStats.reduce((acc, h) => Math.max(acc, h.streak), 0),
    avgWeeklyRate: habitStats.length > 0
      ? Math.round(habitStats.reduce((acc, h) => acc + h.weeklyRate, 0) / habitStats.length)
      : 0,
  });
}

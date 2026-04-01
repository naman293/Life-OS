import useSWR, { mutate as globalMutate } from "swr";
import { useCallback } from "react";

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`API error: ${r.status}`);
  return r.json();
});

export interface Habit {
  id: string;
  userId: string;
  name: string;
  frequency: string;
  daysOfWeek: number[];
  colourId?: string | null;
  icon?: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  state: "DONE" | "SKIPPED";
}

export function useHabits() {
  const { data, error, isLoading } = useSWR<Habit[]>("/api/habits", fetcher);
  return { habits: data ?? [], error, isLoading };
}

export function useHabitLogs(habitId: string, week?: string) {
  const url = `/api/habits/${habitId}/logs${week ? `?week=${week}` : ""}`;
  const { data, error, isLoading } = useSWR<HabitLog[]>(habitId ? url : null, fetcher);
  return { logs: data ?? [], error, isLoading };
}

// Fetches ALL logs for ALL habits for the current week in a single call per habit
// Used to power the weekly grid
export function useAllHabitLogs(habitIds: string[], week?: string) {
  const weekParam = week ?? new Date().toISOString().split("T")[0];
  // Build URLs for all habits
  const keys = habitIds.map((id) => `/api/habits/${id}/logs?week=${weekParam}`);

  const results = keys.map((key) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data } = useSWR<HabitLog[]>(key, fetcher);
    return data ?? [];
  });

  return results.flat();
}

export function useToggleLog() {
  return useCallback(async (habitId: string, date: string) => {
    const res = await fetch(`/api/habits/${habitId}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    if (!res.ok) throw new Error(await res.text());
    // Revalidate logs for this habit
    globalMutate((key: unknown) => typeof key === "string" && key.includes(`/api/habits/${habitId}/logs`), undefined, { revalidate: true });
    return res.json();
  }, []);
}

export function useCreateHabit() {
  return useCallback(async (body: Omit<Habit, "id" | "userId" | "archived" | "createdAt" | "updatedAt">) => {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const habit = await res.json();
    globalMutate("/api/habits");
    return habit as Habit;
  }, []);
}

export function useDeleteHabit() {
  return useCallback(async (id: string) => {
    const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    globalMutate("/api/habits");
  }, []);
}

// Helper: compute streak from a flat array of log dates
export function computeStreak(doneDates: Set<string>): number {
  let streak = 0;
  const d = new Date();
  while (doneDates.has(d.toISOString().split("T")[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function computeWeeklyRate(doneDates: Set<string>): number {
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 6 + i);
    return d.toISOString().split("T")[0];
  });
  const done = weekDays.filter((d) => doneDates.has(d)).length;
  return Math.round((done / 7) * 100);
}

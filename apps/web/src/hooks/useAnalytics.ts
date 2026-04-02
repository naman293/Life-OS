import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";

const fetcher = (args: string | [string, string]) => {
  const url = Array.isArray(args) ? args[0] : args;
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`API error: ${r.status}`);
    return r.json();
  });
};

export interface HabitStat {
  id: string;
  name: string;
  icon?: string | null;
  colourId?: string | null;
  streak: number;
  bestStreak: number;
  weeklyRate: number;
}

export interface AnalyticsData {
  summary: {
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionPct: number;
  };
  dailyTrend: { date: string; day: string; completed: number }[];
  categoryData: { name: string; value: number }[];
  habitStats: HabitStat[];
  maxStreak: number;
  avgWeeklyRate: number;
}

export function useAnalytics(range: "daily" | "weekly" | "monthly" = "weekly") {
  const { userId, isLoaded } = useAuth();
  const url = `/api/analytics?range=${range}`;
  const { data, error, isLoading } = useSWR<AnalyticsData>(
    isLoaded && userId ? [url, userId] : null,
    fetcher,
    { refreshInterval: 30000 } // auto-refresh every 30s
  );
  return { analytics: data ?? null, error, isLoading: isLoading || !isLoaded };
}

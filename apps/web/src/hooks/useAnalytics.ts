import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`API error: ${r.status}`);
  return r.json();
});

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
  const { data, error, isLoading } = useSWR<AnalyticsData>(
    `/api/analytics?range=${range}`,
    fetcher,
    { refreshInterval: 30000 } // auto-refresh every 30s
  );
  return { analytics: data ?? null, error, isLoading };
}

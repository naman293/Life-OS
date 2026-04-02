import useSWR, { mutate as globalMutate } from "swr";
import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

const fetcher = (args: string | [string, string]) => {
  const url = Array.isArray(args) ? args[0] : args;
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`API error: ${r.status}`);
    return r.json();
  });
};

// Shape mirroring Prisma Task model (JS-friendly casing)
export interface Task {
  id: string;
  userId: string;
  title: string;
  notes?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | null;
  dueAt?: string | null;
  scheduledAt?: string | null;
  durationMins?: number | null;
  tags: string[];
  colourId?: string | null;
  createdAt: string;
  updatedAt: string;
}

type TaskFilter = {
  status?: string;
  search?: string;
  due?: "today" | "upcoming";
};

function buildUrl(filter: TaskFilter): string {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.search) params.set("search", filter.search);
  if (filter.due)    params.set("due", filter.due);
  const qs = params.toString();
  return `/api/tasks${qs ? `?${qs}` : ""}`;
}

export function useTasks(filter: TaskFilter = {}) {
  const { userId, isLoaded } = useAuth();
  const url = buildUrl(filter);
  const { data, error, isLoading } = useSWR<Task[]>(
    isLoaded && userId ? [url, userId] : null, 
    fetcher
  );
  return { tasks: data ?? [], error, isLoading: isLoading || !isLoaded };
}

export function useCreateTask() {
  return useCallback(async (body: Omit<Task, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    const task = await res.json();
    // Revalidate all tasks keys
    globalMutate((key: unknown) => Array.isArray(key) && key[0].startsWith("/api/tasks"), undefined, { revalidate: true });
    return task as Task;
  }, []);
}

export function useUpdateTask() {
  return useCallback(async (id: string, updates: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error(await res.text());
    const task = await res.json();
    globalMutate((key: unknown) => Array.isArray(key) && key[0].startsWith("/api/tasks"), undefined, { revalidate: true });
    return task as Task;
  }, []);
}

export function useToggleTask() {
  const updateTask = useUpdateTask();
  return useCallback(async (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    return updateTask(task.id, { status: newStatus });
  }, [updateTask]);
}

export function useDeleteTask() {
  return useCallback(async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    globalMutate((key: unknown) => typeof key === "string" && key.startsWith("/api/tasks"), undefined, { revalidate: true });
  }, []);
}

export function useMoveTask() {
  const updateTask = useUpdateTask();
  return useCallback(async (id: string, status: Task["status"]) => {
    return updateTask(id, { status });
  }, [updateTask]);
}

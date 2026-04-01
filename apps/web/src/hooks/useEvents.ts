import useSWR, { mutate as globalMutate } from "swr";
import { useCallback } from "react";

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`API error: ${r.status}`);
  return r.json();
});

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  startAt: string;
  endAt: string;
  notes?: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  tags: string[];
  colourId?: string | null;
  recurrence?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useEvents(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to)   params.set("to", to);
  const url = `/api/events${params.toString() ? `?${params}` : ""}`;

  const { data, error, isLoading } = useSWR<CalendarEvent[]>(url, fetcher);
  return { events: data ?? [], error, isLoading };
}

// Helper to reliably trigger optimistic UI without needing the exact API key path
const isEventKey = (key: unknown) => typeof key === "string" && key.startsWith("/api/events");

export function useCreateEvent() {
  return useCallback(async (body: Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">) => {
    // 1. Optimistic Add
    const tempId = `temp-${Date.now()}`;
    const optimisticEvent: CalendarEvent = {
        ...body, id: tempId, userId: 'optimistic', 
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    
    globalMutate(
      isEventKey,
      (currentData: CalendarEvent[] | undefined) => [...(currentData || []), optimisticEvent],
      { revalidate: false }
    );

    // 2. Real Save
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
        // Rollback on failure
        globalMutate(isEventKey, undefined, { revalidate: true });
        throw new Error(await res.text());
    }
    const event = await res.json();
    globalMutate(isEventKey, undefined, { revalidate: true });
    return event as CalendarEvent;
  }, []);
}

export function useMoveEvent() {
  return useCallback(async (id: string, startAt: string, endAt: string) => {
    // 1. Optimistic Move
    globalMutate(
      isEventKey,
      (currentData: CalendarEvent[] | undefined) => (currentData || []).map(e => e.id === id ? { ...e, startAt, endAt, updatedAt: new Date().toISOString() } : e),
      { revalidate: false }
    );

    // 2. Real Save
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt, endAt }),
    });
    if (!res.ok) {
        globalMutate(isEventKey, undefined, { revalidate: true });
        throw new Error(await res.text());
    }
    const event = await res.json();
    globalMutate(isEventKey, undefined, { revalidate: true });
    return event as CalendarEvent;
  }, []);
}

export function useUpdateEvent() {
  return useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    // 1. Optimistic Update
    globalMutate(
      isEventKey,
      (currentData: CalendarEvent[] | undefined) => (currentData || []).map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e),
      { revalidate: false }
    );

    // 2. Real Save
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
        globalMutate(isEventKey, undefined, { revalidate: true });
        throw new Error(await res.text());
    }
    const event = await res.json();
    globalMutate(isEventKey, undefined, { revalidate: true });
    return event as CalendarEvent;
  }, []);
}

export function useDeleteEvent() {
  return useCallback(async (id: string) => {
    // 1. Optimistic Delete
    globalMutate(
      isEventKey,
      (currentData: CalendarEvent[] | undefined) => (currentData || []).filter(e => e.id !== id),
      { revalidate: false }
    );

    // 2. Real Save
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (!res.ok) {
        globalMutate(isEventKey, undefined, { revalidate: true });
        throw new Error(await res.text());
    }
    globalMutate(isEventKey, undefined, { revalidate: true });
  }, []);
}

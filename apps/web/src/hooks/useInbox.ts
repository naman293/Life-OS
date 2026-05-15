import useSWR, { mutate as globalMutate } from 'swr';
import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

const fetcher = (url: string) => fetch(url).then((r) => {
  if (!r.ok) throw new Error(`API error: ${r.status}`);
  return r.json();
});

export interface InboxItem {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export function useInbox() {
  const { userId, isLoaded } = useAuth();
  const url = '/api/inbox';
  const { data, error, isLoading } = useSWR<InboxItem[]>(
    isLoaded && userId ? url : null, 
    fetcher
  );
  return { inboxItems: data ?? [], error, isLoading: isLoading || !isLoaded };
}

export function useAddInboxItem() {
  return useCallback(async (content: string) => {
    const res = await fetch('/api/inbox', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(await res.text());
    const item = await res.json();
    globalMutate('/api/inbox');
    return item;
  }, []);
}

export function useDeleteInboxItem() {
  return useCallback(async (id: string) => {
    const res = await fetch(`/api/inbox/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    globalMutate('/api/inbox');
  }, []);
}

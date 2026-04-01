import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { SWRConfig } from "swr";
import "./globals.css";
import "./components.css";
import { AppShell } from "@/components/AppShell";
import { PomodoroProvider } from "@/components/PomodoroProvider";
import { TransitionOverlay } from "@/components/TransitionOverlay";

export const metadata: Metadata = {
  title: "Life OS — Personal Productivity Dashboard",
  description: "Your personal command center for tasks, habits, calendar events, and productivity analytics.",
  manifest: "/manifest.json",
  themeColor: "#121210",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Life OS",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
          {/* Service Worker Registration */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').catch(() => {});
                  });
                }
              `,
            }}
          />
          {/* ── Persistent transition overlay — survives page navigation ── */}
          <TransitionOverlay />
          {/* Global SWR config: aggressive caching, no refetch on focus/reconnect to avoid waterfall slowness */}
          <SWRConfig value={{
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 30_000,       // dedupe same requests within 30s
            focusThrottleInterval: 60_000,  // max once per minute if focus revalidation enabled
            keepPreviousData: true,         // show stale data immediately, refresh in background
          }}>
            <PomodoroProvider>
              <AppShell>{children}</AppShell>
            </PomodoroProvider>
          </SWRConfig>
        </body>
      </html>
    </ClerkProvider>
  );
}

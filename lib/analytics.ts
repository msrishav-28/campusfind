// CampusFind Privacy-Preserving Analytics
// Implements metrics from docs/dev/12-analytics-metrics.md without tracking personal identities.

export type AnalyticsEventName =
  | "map_view"
  | "gps_prompt"
  | "report_open"
  | "voice_start"
  | "voice_result"
  | "photo_attached"
  | "interpret_ok"
  | "interpret_fail"
  | "item_create"
  | "match_impression"
  | "match_tap"
  | "claim_start"
  | "claim_accept"
  | "share_click"
  | "item_expired";

export type AnalyticsProps = {
  campus?: string;
  type?: "lost" | "found";
  status?: string;
  has_photo?: boolean;
  has_coords?: boolean;
  source?: string;
  ms_from_sheet_open?: number;
  chars?: number;
  failed?: boolean;
  bytes?: number;
  ms?: number;
  count?: number;
  secret_used?: boolean;
  [key: string]: unknown;
};

declare global {
  interface Window {
    plausible?: (eventName: string, options?: { props?: Record<string, unknown> }) => void;
    posthog?: {
      capture: (eventName: string, props?: Record<string, unknown>) => void;
    };
  }
}

export function trackEvent(name: AnalyticsEventName, props?: AnalyticsProps): void {
  if (typeof window === "undefined") return;

  // 1. Plausible Analytics integration (if active)
  if (typeof window.plausible === "function") {
    try {
      window.plausible(name, { props: props as Record<string, unknown> });
    } catch {
      // Non-blocking
    }
  }

  // 2. PostHog integration (if active)
  if (window.posthog && typeof window.posthog.capture === "function") {
    try {
      window.posthog.capture(name, props as Record<string, unknown>);
    } catch {
      // Non-blocking
    }
  }

  // 3. Local development telemetry log
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[Analytics] ${name}`, props || {});
  }
}

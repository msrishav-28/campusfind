"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/time";
import type { ItemRecord } from "@/lib/types";

type SanitizedItem = Omit<ItemRecord, "secretHash" | "posterSessionId" | "posterUserId"> & {
  matches?: SanitizedItem[];
  isPoster?: boolean;
};

type ItemDetailViewProps = {
  campus: string;
  initialItem: SanitizedItem;
};

type ClaimItem = {
  id: string;
  claimantUserId: string;
  message: string | null;
  secretAttemptOk: boolean;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export function ItemDetailView({ campus, initialItem }: ItemDetailViewProps) {
  const [item, setItem] = useState<SanitizedItem>(initialItem);
  const [session, setSession] = useState<{ sessionId: string; userId: string | null } | null>(null);
  const [isPoster, setIsPoster] = useState(false);
  const [claims, setClaims] = useState<ClaimItem[]>([]);

  // Claim modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimSecret, setClaimSecret] = useState("");
  const [claimMessage, setClaimMessage] = useState("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimStatusMsg, setClaimStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // OTP state for unauthenticated claimants
  const [otpTarget, setOtpTarget] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpChallengeId, setOtpChallengeId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<"spam" | "inappropriate" | "wrong" | "other">("spam");
  const [reportSuccess, setReportSuccess] = useState(false);

  // Load session and check poster role
  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      const data = await res.json();
      setSession(data);

      // Check if user is poster by checking /api/[campus]/me
      const meRes = await fetch(`/api/${campus}/me`, { cache: "no-store" });
      if (meRes.ok) {
        const meData = await meRes.json();
        const own = (meData.items as SanitizedItem[])?.some((it) => it.id === item.id);
        setIsPoster(own);

        if (own) {
          // Filter claims for this item
          const itemClaims = (meData.claims as ClaimItem[])?.filter((c) => (c as unknown as { itemId: string }).itemId === item.id);
          setClaims(itemClaims || []);
        }
      }
    } catch {
      // Non-blocking
    }
  }, [campus, item.id]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Handle OTP Start
  const handleStartOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!otpTarget.trim()) return;

    try {
      setIsSendingOtp(true);
      const isEmail = otpTarget.includes("@");
      const payload = isEmail ? { email: otpTarget.trim() } : { phone: otpTarget.trim() };

      const res = await fetch("/api/auth/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setOtpChallengeId(data.challengeId);
      setOtpSent(true);
      if (data.codePreview) {
        // Preview for local / dev testing
        setOtpCode(data.codePreview);
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Error sending OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP Verify
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!otpChallengeId || !otpCode.trim()) return;

    try {
      setIsSendingOtp(true);
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: otpChallengeId, code: otpCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Invalid code");
      }

      // Session now has userId
      setSession((prev) => ({ sessionId: prev?.sessionId || "", userId: data.userId }));
      setOtpSent(false);
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Submit Claim
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimStatusMsg(null);
    setIsSubmittingClaim(true);

    try {
      const res = await fetch(`/api/${campus}/items/${item.id}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: claimSecret.trim() || null,
          message: claimMessage.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Claim could not be processed");
      }

      setClaimStatusMsg({
        ok: true,
        text: "Claim submitted! The poster has been notified. Meet at Block IV cafeteria or Block I security desk to verify in person.",
      });
      setItem((prev) => ({ ...prev, claimCount: prev.claimCount + 1 }));
    } catch (err: unknown) {
      setClaimStatusMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to submit claim",
      });
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Accept or Reject claim (poster only)
  const handleClaimAction = async (claimId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch(`/api/${campus}/claims/${claimId}/${action}`, {
        method: "POST",
      });

      if (res.ok) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, status: action === "accept" ? "accepted" : "rejected" } : c))
        );
        if (action === "accept") {
          setItem((prev) => ({ ...prev, status: "recovered" }));
        }
      }
    } catch {
      // Non-blocking
    }
  };

  // Submit abuse report
  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/${campus}/items/${item.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason }),
      });

      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => setShowReportModal(false), 1500);
      }
    } catch {
      // Non-blocking
    }
  };

  const statusBadge = () => {
    switch (item.status) {
      case "recovered":
        return <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-xs font-semibold text-blue-400">Recovered / Returned</span>;
      case "desk":
        return <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs font-semibold text-amber-400">Held at Block I Security Desk</span>;
      case "expired":
        return <span className="rounded-full bg-zinc-500/10 border border-zinc-500/30 px-2.5 py-1 text-xs font-semibold text-zinc-400">Expired (&gt;14 days)</span>;
      default:
        return (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
              item.type === "lost"
                ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            }`}
          >
            {item.type}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-4 space-y-4">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <Link href={`/${campus}`} className="flex items-center gap-1 text-emerald-400 hover:underline">
          ← Back to Campus Map
        </Link>
        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="text-zinc-400 hover:text-zinc-200"
        >
          Flag / Report
        </button>
      </div>

      {/* Main Item Card */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
        {/* Photo Container */}
        {item.photoPath ? (
          <div className="relative aspect-video w-full bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.photoPath} alt={item.title} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-zinc-950 text-4xl border-b border-zinc-800">
            {item.type === "lost" ? "🔴" : "🟢"}
          </div>
        )}

        <div className="p-5">
          {/* Status and Category */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {statusBadge()}
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">
                {item.category.replace("_", " ")}
              </span>
            </div>
            <span className="text-xs text-zinc-400">{formatTimeAgo(item.createdAt)}</span>
          </div>

          {/* Title */}
          <h1 className="mt-3 text-xl font-bold text-zinc-100">{item.title}</h1>

          {/* Location details card */}
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3.5 text-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-200">
                📍 {item.placeLabel || "Campus Location"}
              </span>
              {item.accuracyM !== null && (
                <span className="text-xs text-zinc-400">±{Math.round(item.accuracyM)} m accuracy</span>
              )}
            </div>

            {item.floor !== null && (
              <p className="text-xs text-zinc-300">
                🏢 Level: {item.floor === 0 ? "Ground Floor" : `Floor ${item.floor}`}
              </p>
            )}

            {item.note && (
              <p className="text-xs text-zinc-400 italic">
                &ldquo;{item.note}&rdquo;
              </p>
            )}

            <div className="pt-1.5">
              <Link
                href={`/${campus}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
              >
                Show on campus map →
              </Link>
            </div>
          </div>

          {/* Description & Tags */}
          {item.description && item.description !== "seed" && (
            <p className="mt-3 text-sm text-zinc-300">{item.description}</p>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Action CTAs */}
          <div className="mt-6 border-t border-zinc-800/80 pt-4">
            {isPoster ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Your Posted Pin
                </span>
                <p className="mt-1 text-xs text-zinc-300">
                  You created this post. Check below for any student claims or updates.
                </p>
              </div>
            ) : item.status === "open" && item.type === "found" ? (
              <div>
                <button
                  type="button"
                  onClick={() => setShowClaimModal(true)}
                  className="w-full rounded-2xl bg-emerald-500 py-3.5 text-center text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  This is mine — Claim item
                </button>
                <p className="mt-2 text-center text-xs text-zinc-400">
                  You will be asked for an identifying mark or secret to prove ownership.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Poster Claim Review Section */}
      {isPoster && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg">
          <h2 className="text-base font-semibold text-zinc-100">Claims on this item ({claims.length})</h2>
          {claims.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-400">No students have submitted claims for this item yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">Claimant ID: {claim.claimantUserId.slice(0, 8)}...</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        claim.status === "accepted"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : claim.status === "rejected"
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {claim.status}
                    </span>
                  </div>

                  {claim.secretAttemptOk && (
                    <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300 font-medium">
                      ✓ Secret match verified: claimant provided the exact private detail!
                    </div>
                  )}

                  {claim.message && (
                    <p className="text-zinc-300">
                      <strong>Note from claimant:</strong> &ldquo;{claim.message}&rdquo;
                    </p>
                  )}

                  <p className="text-[11px] text-zinc-400">Submitted {formatTimeAgo(claim.createdAt)}</p>

                  {claim.status === "pending" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleClaimAction(claim.id, "accept")}
                        className="flex-1 rounded-xl bg-emerald-500 py-2 font-semibold text-zinc-950 hover:bg-emerald-400"
                      >
                        Accept & Mark Handed Over
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClaimAction(claim.id, "reject")}
                        className="rounded-xl border border-zinc-700 px-3 py-2 text-zinc-400 hover:bg-zinc-800"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggested Matches Section (max 3, no %) */}
      {item.matches && item.matches.length > 0 && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Suggested Matches ({item.matches.length})
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Similar opposite reports found nearby on campus. Tap to inspect.
          </p>

          <div className="mt-3 space-y-2">
            {item.matches.slice(0, 3).map((match) => (
              <Link
                key={match.id}
                href={`/${campus}/item/${match.id}`}
                className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                  {match.photoPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={match.photoPath} alt={match.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm">
                      {match.type === "lost" ? "🔴" : "🟢"}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-semibold uppercase ${
                        match.type === "lost" ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {match.type}
                    </span>
                    <span className="text-[11px] text-zinc-400">· {match.placeLabel}</span>
                  </div>
                  <p className="truncate text-xs font-medium text-zinc-200">{match.title}</p>
                </div>
                <span className="text-xs text-emerald-400">View →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 text-xs text-zinc-400 space-y-1">
        <p className="font-medium text-zinc-300">🛡️ Campus Safety Guidelines</p>
        <p>
          Always arrange handovers in open, public campus areas like the Block IV cafeteria, Block I lobby, or main gate. Never share passwords or payment details.
        </p>
      </div>

      {/* Claim Modal Sheet */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-t-3xl border border-zinc-800 bg-zinc-950 p-6 sm:rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100">Claim &ldquo;{item.title}&rdquo;</h3>
              <button
                type="button"
                onClick={() => {
                  setShowClaimModal(false);
                  setClaimStatusMsg(null);
                }}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {claimStatusMsg ? (
              <div className="py-6 text-center">
                <div className="text-3xl">{claimStatusMsg.ok ? "🎉" : "⚠️"}</div>
                <p className={`mt-2 text-sm font-semibold ${claimStatusMsg.ok ? "text-emerald-400" : "text-rose-400"}`}>
                  {claimStatusMsg.text}
                </p>
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="mt-4 rounded-xl bg-zinc-800 px-5 py-2 text-xs font-semibold text-zinc-200"
                >
                  Close
                </button>
              </div>
            ) : !session?.userId ? (
              /* Step 1: OTP Requirement */
              <div className="py-4 space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-300">
                  To prevent unauthorized claims, please verify with your campus email or phone number first.
                </div>

                {!otpSent ? (
                  <form onSubmit={handleStartOtp} className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-400">Phone or Campus Email:</label>
                      <input
                        type="text"
                        required
                        value={otpTarget}
                        onChange={(e) => setOtpTarget(e.target.value)}
                        placeholder="e.g. 9876543210 or student@christuniversity.in"
                        className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    {otpError && <p className="text-xs text-rose-400">{otpError}</p>}
                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {isSendingOtp ? "Sending code..." : "Send verification code"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div>
                      <label className="text-xs text-zinc-400">Enter 6-digit verification code sent to {otpTarget}:</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-center text-lg font-mono tracking-widest text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    {otpError && <p className="text-xs text-rose-400">{otpError}</p>}
                    <button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {isSendingOtp ? "Verifying..." : "Verify & Continue"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Step 2: Proof & Secret */
              <form onSubmit={handleClaimSubmit} className="py-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Private Identifying Detail (if you know it):
                  </label>
                  <p className="text-xs text-zinc-400">
                    If the poster set a secret (e.g. sticker name, scratch position, keychain), enter it here.
                  </p>
                  <input
                    type="text"
                    value={claimSecret}
                    onChange={(e) => setClaimSecret(e.target.value)}
                    placeholder="e.g. Cat sticker on the back"
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">
                    Message to Poster:
                  </label>
                  <textarea
                    rows={2}
                    value={claimMessage}
                    onChange={(e) => setClaimMessage(e.target.value)}
                    placeholder="Explain how you know this belongs to you, or suggest meeting at Block IV Cafeteria."
                    className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="rounded-xl bg-zinc-900/60 p-3 text-xs text-zinc-400">
                  📍 Public handovers only: arrange to meet in front of campus security or a cafeteria.
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSubmittingClaim ? "Submitting..." : "Send Claim to Poster"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-100">Report this pin</h3>
            <p className="mt-1 text-xs text-zinc-400">Help keep CampusFind safe and accurate.</p>

            {reportSuccess ? (
              <p className="mt-4 text-xs font-semibold text-emerald-400">
                Thank you. Our moderation team has received your report.
              </p>
            ) : (
              <form onSubmit={handleReport} className="mt-4 space-y-3">
                <div className="space-y-2 text-xs">
                  {(["spam", "inappropriate", "wrong", "other"] as const).map((r) => (
                    <label key={r} className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reportReason === r}
                        onChange={() => setReportReason(r)}
                        className="text-emerald-500"
                      />
                      <span className="capitalize">{r}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-rose-500 py-2 text-xs font-semibold text-white hover:bg-rose-400"
                  >
                    Submit Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

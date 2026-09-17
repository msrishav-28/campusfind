"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CampusShell } from "../_components/campus-shell";
import { formatTimeAgo } from "@/lib/time";
import type { ApiItem } from "../_components/types";
import type { ClaimRecord } from "@/lib/types";

type MePageProps = {
  params: Promise<{ campus: string }>;
};

export default function MePage({ params }: MePageProps) {
  const { campus } = use(params);

  const [items, setItems] = useState<ApiItem[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "claims">("posts");

  // OTP login / link form state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTarget, setOtpTarget] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isProcessingOtp, setIsProcessingOtp] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${campus}/me`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setClaims(data.claims ?? []);
        setUserId(data.userId ?? null);
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, [campus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClaimAction = async (claimId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch(`/api/${campus}/claims/${claimId}/${action}`, { method: "POST" });
      if (res.ok) {
        setClaims((prev) =>
          prev.map((c) => (c.id === claimId ? { ...c, status: action === "accept" ? "accepted" : "rejected" } : c))
        );
        loadData();
      }
    } catch {
      // Non-blocking
    }
  };

  const handleStartOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!otpTarget.trim()) return;

    try {
      setIsProcessingOtp(true);
      const isEmail = otpTarget.includes("@");
      const payload = isEmail ? { email: otpTarget.trim() } : { phone: otpTarget.trim() };

      const res = await fetch("/api/auth/otp/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setChallengeId(data.challengeId);
      setOtpSent(true);
      if (data.codePreview) {
        setOtpCode(data.codePreview);
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Error sending OTP");
    } finally {
      setIsProcessingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    if (!challengeId || !otpCode.trim()) return;

    try {
      setIsProcessingOtp(true);
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code: otpCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Invalid code");

      setUserId(data.userId);
      setShowOtpModal(false);
      loadData();
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setIsProcessingOtp(false);
    }
  };

  const pendingClaims = claims.filter((c) => c.status === "pending");

  return (
    <CampusShell title="My Campus Activity" subtitle="CHRIST · Bangalore Kengeri">
      <div className="mx-auto max-w-xl px-4 py-4 space-y-4">
        {/* Device Session & Verification Card */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Account Status</p>
              <div className="mt-1 flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${userId ? "bg-emerald-400" : "bg-blue-400"}`} />
                <span className="text-sm font-semibold text-zinc-100">
                  {userId ? "Verified Campus User" : "Anonymous Device Session"}
                </span>
              </div>
            </div>

            {!userId ? (
              <button
                type="button"
                onClick={() => setShowOtpModal(true)}
                className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
              >
                Link Phone / Email
              </button>
            ) : (
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400 font-medium">
                Verified
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            {userId
              ? "Your posts and claims are safely linked across devices."
              : "Posts made on this browser are tracked automatically. Link your phone or campus email to sync across other devices."}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
              activeTab === "posts"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            My Pinned Items ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("claims")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
              activeTab === "claims"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Incoming Claims
            {pendingClaims.length > 0 && (
              <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">
                {pendingClaims.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="mt-3 text-xs">Loading activity...</p>
          </div>
        ) : activeTab === "posts" ? (
          /* Pinned Items Tab */
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-zinc-200">No items pinned yet</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  When you report lost or found items on your campus, they will appear here.
                </p>
                <Link
                  href={`/${campus}/report`}
                  className="mt-4 inline-block rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
                >
                  Pin an Item Now
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={`/${campus}/item/${item.id}`}
                  className="flex items-center gap-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-3 transition hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                    {item.photoPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photoPath} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                        <span className={`h-4 w-4 rounded-full ${item.type === "lost" ? "bg-rose-500 ring-4 ring-rose-500/20" : "bg-emerald-500 ring-4 ring-emerald-500/20"}`} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          item.type === "lost"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="text-[11px] text-zinc-400">{formatTimeAgo(item.createdAt)}</span>
                      {item.claimCount > 0 && (
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-amber-300">
                          {item.claimCount} {item.claimCount === 1 ? "claim" : "claims"}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 truncate text-sm font-semibold text-zinc-100">{item.title}</h3>
                    <p className="truncate text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{item.placeLabel || "Campus spot"}</span>
                    </p>
                  </div>

                  <div className="text-zinc-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : (
          /* Incoming Claims Tab */
          <div className="space-y-3">
            {claims.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-zinc-200">No claims received</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  When other students identify their belongings in your posts, their claims will show here.
                </p>
              </div>
            ) : (
              claims.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs space-y-2.5 shadow"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">Claimant: {claim.claimantUserId.slice(0, 8)}...</span>
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
                    <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-300 font-medium flex items-center gap-1.5">
                      <svg className="w-4 h-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Secret match verified: claimant provided the exact private detail.</span>
                    </div>
                  )}

                  {claim.message && (
                    <p className="text-zinc-300">
                      <strong>Note:</strong> &ldquo;{claim.message}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span>Submitted {formatTimeAgo(claim.createdAt)}</span>
                    <Link href={`/${campus}/item/${claim.itemId}`} className="text-emerald-400 hover:underline">
                      View pinned item →
                    </Link>
                  </div>

                  {claim.status === "pending" && (
                    <div className="flex gap-2 pt-1 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => handleClaimAction(claim.id, "accept")}
                        className="flex-1 rounded-xl bg-emerald-500 py-2 font-semibold text-zinc-950 hover:bg-emerald-400"
                      >
                        Accept Claim (Item Handed Over)
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
              ))
            )}
          </div>
        )}

        {/* OTP Link Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-zinc-100">Link Campus Account</h3>
                <button type="button" onClick={() => setShowOtpModal(false)} className="text-zinc-400 hover:text-zinc-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!otpSent ? (
                <form onSubmit={handleStartOtp} className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-zinc-400">Campus Email Address:</label>
                    <input
                      type="email"
                      required
                      value={otpTarget}
                      onChange={(e) => setOtpTarget(e.target.value)}
                      placeholder="e.g. student@christuniversity.in"
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  {otpError && <p className="text-xs text-rose-400">{otpError}</p>}
                  <button
                    type="submit"
                    disabled={isProcessingOtp}
                    className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {isProcessingOtp ? "Sending code..." : "Send verification code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-zinc-400">Enter code sent to {otpTarget}:</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-center text-base font-mono tracking-widest text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  {otpError && <p className="text-xs text-rose-400">{otpError}</p>}
                  <button
                    type="submit"
                    disabled={isProcessingOtp}
                    className="w-full rounded-xl bg-emerald-500 py-2.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                  >
                    {isProcessingOtp ? "Verifying..." : "Verify & Link Account"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </CampusShell>
  );
}

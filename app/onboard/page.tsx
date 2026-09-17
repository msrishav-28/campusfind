"use client";

import { useState } from "react";
import Link from "next/link";

export default function OnboardPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [institutionType, setInstitutionType] = useState<"college" | "university" | "school" | "other">("college");
  const [city, setCity] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [deskPin, setDeskPin] = useState("1234");
  const [adminKey, setAdminKey] = useState("");
  const [lat, setLat] = useState("12.9716");
  const [lng, setLng] = useState("77.5946");
  const [fenceM, setFenceM] = useState("700");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ slug: string; name: string } | null>(null);

  const handleSlugAuto = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 15)) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 20);
      setSlug(generated);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => {
        setErrorMsg("Could not retrieve GPS coordinates. Please enter them manually.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const payload = {
        name,
        slug: slug.trim().toLowerCase(),
        institutionType,
        city,
        contactEmail,
        contactPhone,
        deskPin,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        fenceM: parseInt(fenceM, 10) || 700,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (adminKey.trim()) {
        headers["x-admin-key"] = adminKey.trim();
      }

      const res = await fetch("/api/campuses/onboard", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register institution");
      }

      setSuccessData({ slug: payload.slug, name: payload.name });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col justify-between selection:bg-emerald-500/30">
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur sticky top-0 z-30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/kengeri" className="flex items-center gap-2 font-bold tracking-tight text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <span>CampusFind</span>
          </Link>
          <Link
            href="/kengeri"
            className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition"
          >
            Go to Pilot Campus
          </Link>
        </div>
      </header>

      <main className="max-w-2xl w-full mx-auto px-4 py-10 flex-1">
        {successData ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Application Received</h1>
            <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
              Your registration for <strong className="text-emerald-300">{successData.name}</strong> has been received.
              Upon verification, your institution partition will be active at:
            </p>
            <div className="inline-block rounded-xl bg-black/60 border border-zinc-800 px-5 py-2.5 font-mono text-sm text-emerald-400">
              campusfind.app/{successData.slug}
            </div>
            <p className="text-xs text-zinc-400">
              All items, security desk logs, and building gazetteers for your institution are strictly isolated in your workspace.
            </p>
            <div className="pt-3">
              <Link
                href="/kengeri"
                className="inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
              >
                Return to CampusFind Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <span>Enterprise Multi-Tenant</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Onboard Your Campus</h1>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Register your college, university, or school on CampusFind. Each campus receives a self-contained,
                isolated lost and found portal with map snapping, student proof matching, and security desk controls.
              </p>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-start gap-2.5">
                <svg className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">Institution Profile</h2>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Institution Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleSlugAuto(e.target.value)}
                    placeholder="e.g. St. Joseph's University"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Campus Slug (URL Path)</label>
                    <div className="flex rounded-xl border border-zinc-800 bg-black overflow-hidden focus-within:border-emerald-500">
                      <span className="px-3 py-2.5 text-xs text-zinc-500 bg-zinc-900 border-r border-zinc-800 select-none">/</span>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="sju"
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Institution Type</label>
                    <select
                      value={institutionType}
                      onChange={(e) => setInstitutionType(e.target.value as typeof institutionType)}
                      className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="college">College</option>
                      <option value="university">University</option>
                      <option value="school">School</option>
                      <option value="other">Academy / Institution</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">Geographic Centroid</h2>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Use Current GPS
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Perimeter Fence Radius (Meters)</label>
                  <input
                    type="number"
                    required
                    value={fenceM}
                    onChange={(e) => setFenceM(e.target.value)}
                    min={100}
                    max={5000}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">Pins reported outside this radius trigger an off-campus perimeter warning.</p>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-300 uppercase">Administrative Contact</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Official Email</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="admin@institution.edu"
                      className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Security Desk PIN</label>
                  <input
                    type="password"
                    required
                    value={deskPin}
                    onChange={(e) => setDeskPin(e.target.value)}
                    placeholder="4-digit PIN for staff portal"
                    maxLength={8}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">Security officers use this PIN to log into the physical custody desk.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Institutional Passkey / Admin Key (Optional)</label>
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Authorized institutional passkey (if provided)"
                    className="w-full rounded-xl border border-zinc-800 bg-black px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">Required if registering without an official .edu or .edu.in institutional email domain.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {loading ? "Submitting Registration..." : "Register Campus Workspace"}
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800/60 py-6 text-center text-xs text-zinc-500">
        CampusFind Multi-Tenant Architecture · Strictly Isolated Institutional Workspaces
      </footer>
    </div>
  );
}

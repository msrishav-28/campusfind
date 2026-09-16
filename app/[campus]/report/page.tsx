"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CampusShell } from "../_components/campus-shell";
import { kengeriCampus, type KengeriPlace } from "@/lib/kengeri";
import { haversineMeters } from "@/lib/location";
import { ITEM_CATEGORIES, type ItemCategory } from "@/lib/types";

type ReportPageProps = {
  params: Promise<{ campus: string }>;
};

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  id_card: "ID Card",
  card: "Bank / Bus Card",
  phone: "Phone",
  earphones: "Earphones / Pods",
  bottle: "Water Bottle",
  umbrella: "Umbrella",
  bag: "Backpack / Bag",
  wallet: "Wallet / Purse",
  keys: "Keys",
  book: "Book / Notebook",
  bottle_other: "Flask / Thermos",
  apparel: "Jacket / Clothing",
  other: "Other Item",
};

const COMMON_COLORS = ["Black", "White", "Blue", "Brown", "Silver", "Red", "Green", "Grey"];

// Client-side photo compression: longest edge max 1600px, quality 0.82, max 2MB
async function compressPhoto(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      const maxEdge = 1600;

      if (width > maxEdge || height > maxEdge) {
        if (width > height) {
          height = Math.round((height * maxEdge) / width);
          width = maxEdge;
        } else {
          width = Math.round((width * maxEdge) / height);
          height = maxEdge;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        0.82
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };

    img.src = url;
  });
}

// Speech recognition type declaration helper
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

export default function ReportPage({ params }: ReportPageProps) {
  const { campus } = use(params);
  const router = useRouter();

  // Core fields
  const [type, setType] = useState<"lost" | "found">("found");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ItemCategory>("other");
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [secret, setSecret] = useState("");

  // Photo state
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Location state
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [offCampus, setOffCampus] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialise Geolocation
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationDenied(true);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        setDeviceCoords({ lat: latitude, lng: longitude, accuracy });

        // Check off-campus fence (700m from centroid)
        const distToCenter = haversineMeters(latitude, longitude, kengeriCampus.centroid.lat, kengeriCampus.centroid.lng);
        setOffCampus(distToCenter > kengeriCampus.fence_m);

        // Nearest place snap
        const ranked = [...kengeriCampus.places]
          .map((p) => ({ place: p, dist: haversineMeters(latitude, longitude, p.lat, p.lng) }))
          .sort((a, b) => a.dist - b.dist);

        if (ranked.length > 0 && ranked[0].dist < 40) {
          setSelectedPlaceId(ranked[0].place.id);
        }
      },
      () => {
        setIsLocating(false);
        setLocationDenied(true);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Initialise Speech Recognition
  useEffect(() => {
    const SpeechClass =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechClass) {
      setVoiceSupported(false);
      return;
    }

    try {
      const recognition = new SpeechClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from({ length: event.results.length })
          .map((_, i) => event.results[i][0].transcript)
          .join(" ");

        if (transcript.trim()) {
          setTitle(transcript.trim());
          // Simple heuristic chip inferencing
          const lower = transcript.toLowerCase();
          for (const cat of ITEM_CATEGORIES) {
            if (lower.includes(cat.replace("_", " "))) {
              setCategory(cat);
              break;
            }
          }
          for (const color of COMMON_COLORS) {
            if (lower.includes(color.toLowerCase())) {
              setSelectedColor(color);
              break;
            }
          }
        }
      };

      recognition.onerror = (event: { error: string }) => {
        setSpeechError(event.error === "not-allowed" ? "Microphone access denied" : "Could not hear clearly. Tap to type.");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      setVoiceSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    setSpeechError(null);

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const compressed = await compressPhoto(file);
      setPhotoBlob(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch {
      setSubmitError("Failed to process image. Please choose another.");
    } finally {
      setIsCompressing(false);
    }
  };

  const removePhoto = () => {
    setPhotoBlob(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Resolve active place details
  const selectedPlace: KengeriPlace | undefined = kengeriCampus.places.find((p) => p.id === selectedPlaceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const finalTitle = title.trim();
    if (!finalTitle) {
      setSubmitError("Please provide an item description or title.");
      return;
    }

    // Coordinates: from device or fallback to selected place centroid
    let lat: number;
    let lng: number;
    let source: "gps_snap" | "gps_raw" | "picked" = "picked";

    if (deviceCoords) {
      lat = deviceCoords.lat;
      lng = deviceCoords.lng;
      source = selectedPlaceId ? "gps_snap" : "gps_raw";
    } else if (selectedPlace) {
      lat = selectedPlace.lat;
      lng = selectedPlace.lng;
      source = "picked";
    } else {
      lat = kengeriCampus.centroid.lat;
      lng = kengeriCampus.centroid.lng;
      source = "picked";
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.set("type", type);
      formData.set("title", finalTitle);
      formData.set("category", category);
      formData.set("lat", String(lat));
      formData.set("lng", String(lng));
      if (deviceCoords) {
        formData.set("accuracy_m", String(Math.round(deviceCoords.accuracy)));
      }
      if (selectedPlaceId) {
        formData.set("place_id", selectedPlaceId);
        formData.set("place_label", selectedPlace?.name ?? "");
      }
      formData.set("source", source);
      if (selectedFloor !== null) {
        formData.set("floor", String(selectedFloor));
      }
      if (note.trim()) {
        formData.set("note", note.trim().slice(0, 40));
      }
      if (secret.trim()) {
        formData.set("secret", secret.trim());
      }
      if (photoBlob) {
        formData.set("photo", photoBlob, "item.jpg");
      }

      const res = await fetch(`/api/${campus}/items`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post item");
      }

      router.push(`/kengeri/item/${data.itemId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setSubmitError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <CampusShell title="Pin an Item" subtitle="CHRIST · Bangalore Kengeri">
      <div className="mx-auto max-w-xl px-4 py-4">
        {/* Type Toggle: Lost vs Found */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setType("found")}
            className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all ${
              type === "found"
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 ring-2 ring-emerald-500"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="text-2xl">🟢</div>
            <span className="mt-1 text-base font-semibold">I Found Something</span>
            <span className="text-xs text-zinc-400">Park it on the map</span>
          </button>

          <button
            type="button"
            onClick={() => setType("lost")}
            className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all ${
              type === "lost"
                ? "border-rose-500 bg-rose-500/10 text-rose-300 ring-2 ring-rose-500"
                : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
            }`}
          >
            <div className="text-2xl">🔴</div>
            <span className="mt-1 text-base font-semibold">I Lost Something</span>
            <span className="text-xs text-zinc-400">Pin last-seen spot</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Photo Section */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Photo</label>
            <p className="mt-0.5 text-xs text-zinc-400">Environment snapshot helps people recognize it immediately.</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
              id="photo-capture-input"
            />

            {photoPreview ? (
              <div className="relative mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Item capture preview" className="h-56 w-full object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute right-2 top-2 rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur hover:bg-zinc-900"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label
                htmlFor="photo-capture-input"
                className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 transition hover:border-zinc-600 hover:bg-zinc-950"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="mt-2 text-sm font-medium text-zinc-200">
                  {isCompressing ? "Compressing photo..." : "Take photo or upload"}
                </span>
                <span className="text-xs text-zinc-400">Stripped of metadata for safety</span>
              </label>
            )}

            {category === "id_card" && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                ⚠️ <strong>Privacy alert:</strong> Cover the register number or personal details on the ID card before posting.
              </div>
            )}
          </div>

          {/* Voice and Title Section */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Description</label>
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                    isListening
                      ? "animate-pulse bg-rose-500 text-white"
                      : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  {isListening ? "Listening (tap to stop)..." : "Hold or tap to speak"}
                </button>
              )}
            </div>

            <div className="mt-2.5">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g. "Black JBL earphones near Block IV cafeteria"'
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {speechError && <p className="mt-2 text-xs text-amber-400">{speechError}</p>}

            {/* Category Chips */}
            <div className="mt-4">
              <span className="text-xs font-medium text-zinc-400">Category:</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ITEM_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-full px-2.5 py-1 text-xs transition ${
                      category === cat
                        ? "bg-emerald-500 font-medium text-zinc-950"
                        : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Chips */}
            <div className="mt-3">
              <span className="text-xs font-medium text-zinc-400">Color (optional):</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COMMON_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(selectedColor === col ? null : col)}
                    className={`rounded-full px-2.5 py-1 text-xs transition ${
                      selectedColor === col
                        ? "bg-zinc-200 font-medium text-zinc-950"
                        : "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">Location on Campus</label>
              {isLocating && <span className="text-xs text-zinc-400 animate-pulse">Finding location...</span>}
            </div>

            {/* GPS Snap Notification */}
            {deviceCoords && (
              <div className="mt-2.5 flex items-center justify-between rounded-xl bg-zinc-950/80 px-3 py-2 text-xs border border-zinc-800">
                <span className="text-zinc-300">
                  📍 GPS active · <strong>±{Math.round(deviceCoords.accuracy)} m</strong> accuracy
                </span>
                <button type="button" onClick={requestLocation} className="text-emerald-400 hover:underline">
                  Refresh
                </button>
              </div>
            )}

            {locationDenied && (
              <div className="mt-2 rounded-xl bg-zinc-950/60 p-3 text-xs text-zinc-400 border border-zinc-800">
                GPS not granted. Pick the campus building below manually.
              </div>
            )}

            {offCampus && (
              <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                You look outside the Kengeri campus fence. Pick a campus place to pin it correctly.
              </div>
            )}

            {/* Place selector */}
            <div className="mt-3">
              <label className="text-xs text-zinc-400">Campus Building / Spot:</label>
              <select
                value={selectedPlaceId || ""}
                onChange={(e) => {
                  setSelectedPlaceId(e.target.value || null);
                  setSelectedFloor(null);
                }}
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose known campus location --</option>
                {kengeriCampus.places.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.name} ({place.kind})
                  </option>
                ))}
              </select>
            </div>

            {/* Floor Chips if building has floors */}
            {selectedPlace && selectedPlace.floors.length > 0 && (
              <div className="mt-3">
                <span className="text-xs font-medium text-zinc-400">Floor level:</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {selectedPlace.floors.map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => setSelectedFloor(selectedFloor === fl ? null : fl)}
                      className={`rounded-full px-3 py-1 text-xs transition ${
                        selectedFloor === fl
                          ? "bg-emerald-500 font-medium text-zinc-950"
                          : "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      {fl === 0 ? "Ground Floor" : `Floor ${fl}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Specific spot note (max 40 chars) */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Specific spot note (optional):</span>
                <span>{note.length}/40</span>
              </div>
              <input
                type="text"
                maxLength={40}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Near water cooler, 2nd table"
                className="mt-1.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Private Proof Detail Section (Optional) */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Private Ownership Secret (Optional)
            </label>
            <p className="mt-0.5 text-xs text-zinc-400">
              A private detail only the real owner knows (e.g. &ldquo;cat sticker on case&rdquo;, &ldquo;small dent on bottom&rdquo;). This is
              hashed and <strong>never published on the map</strong>.
            </p>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="e.g. Yellow keychain attached, cracked screen protector"
              className="mt-2.5 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {submitError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">{submitError}</div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex w-full items-center justify-center rounded-2xl py-3.5 text-base font-semibold transition ${
                type === "found"
                  ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  : "bg-rose-500 text-white hover:bg-rose-400"
              } disabled:opacity-50`}
            >
              {isSubmitting ? "Pinning item on map..." : "Pin it on Kengeri map"}
            </button>
            <p className="mt-2 text-center text-xs text-zinc-400">
              Unclaimed items are automatically routed to Block I security after 14 days.
            </p>
          </div>
        </form>
      </div>
    </CampusShell>
  );
}

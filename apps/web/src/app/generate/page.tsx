"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, MapPin, Wallet, Calendar, Package, CheckCircle, Plane } from "lucide-react";

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Phase = "idle" | "analyzing" | "searching" | "optimizing" | "building" | "complete";

interface StreamEvent {
  type?: string;
  status?: Phase;
  message?: string;
  data?: any;
}

function CinemaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prompt = searchParams.get("q") || "";

  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("Initializing AI...");
  const [destination, setDestination] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [days, setDays] = useState<any[]>([]);
  const [packing, setPacking] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const eventsRef = useRef<StreamEvent[]>([]);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!prompt || hasStarted.current) return;
    hasStarted.current = true;
    runGeneration();
  }, [prompt]);

  async function runGeneration() {
    setPhase("analyzing");
    setProgress(5);

    try {
      const resp = await fetch(`${AI_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!resp.body) throw new Error("No stream");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let totalDays = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: StreamEvent = JSON.parse(line.slice(6));
            eventsRef.current.push(event);

            if (event.status) {
              setPhase(event.status as Phase);
              setStatusMsg(event.message || "");
              const progressMap: Record<string, number> = {
                analyzing: 15, searching: 30, optimizing: 45, building: 60, complete: 100,
              };
              setProgress(progressMap[event.status] || progress);
            }

            if (event.type === "destination") {
              setDestination(event.data);
              setProgress(35);
            }
            if (event.type === "budget") {
              setBudget(event.data);
              setProgress(50);
            }
            if (event.type === "day") {
              totalDays++;
              setDays((prev) => [...prev, event.data]);
              setProgress(55 + totalDays * 5);
            }
            if (event.type === "packing") {
              setPacking(event.data || []);
            }
          } catch {}
        }
      }

      // Save trip to API
      setStatusMsg("Saving your cinematic itinerary...");
      setProgress(90);

      const events = eventsRef.current;
      const destEvent = events.find((e) => e.type === "destination");
      const budgetEvent = events.find((e) => e.type === "budget");
      const dayEvents = events.filter((e) => e.type === "day");
      const packingEvent = events.find((e) => e.type === "packing");

      const tripData = {
        title: prompt.substring(0, 50),
        destination: destEvent?.data?.city || "Unknown",
        latitude: destEvent?.data?.lat,
        longitude: destEvent?.data?.lng,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + (dayEvents.length || 3) * 86400000).toISOString(),
        budgetLimit: budgetEvent?.data?.total || 75000,
        days: dayEvents.map((e) => ({
          day: e.data.day,
          title: e.data.title,
          activities: (e.data.activities || []).map((a: any) => ({
            title: a.name || a.title,
            type: a.type,
            cost: a.cost || 0,
            aiNote: a.note || a.aiNote,
            isAiSuggested: true,
          })),
        })),
      };

      let tripId = "demo-trip-123";
      try {
        const res = await fetch(`${API_URL}/api/trips`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tripData),
        });
        const saved = await res.json();
        if (saved.id) tripId = saved.id;

        // Save packing list
        if (packingEvent?.data?.length > 0) {
          await fetch(`${API_URL}/api/packing/${tripId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: packingEvent?.data }),
          }).catch(() => {});
        }
      } catch {}

      setPhase("complete");
      setProgress(100);
      setStatusMsg("Your adventure awaits.");

      await new Promise((r) => setTimeout(r, 1800));
      router.push(`/trip/${tripId}`);
    } catch (err) {
      console.error(err);
      setStatusMsg("Redirecting to demo...");
      await new Promise((r) => setTimeout(r, 1200));
      router.push("/trip/demo-trip-123");
    }
  }

  const phaseColors: Record<Phase, string> = {
    idle: "from-neutral-600 to-neutral-500",
    analyzing: "from-violet-600 to-purple-500",
    searching: "from-cyan-600 to-blue-500",
    optimizing: "from-emerald-600 to-teal-500",
    building: "from-orange-600 to-amber-500",
    complete: "from-emerald-500 to-cyan-400",
  };

  const phaseLabels: Record<Phase, string> = {
    idle: "Initializing",
    analyzing: "Analyzing Travel DNA",
    searching: "Mapping Destination",
    optimizing: "Optimizing Budget",
    building: "Building Itinerary",
    complete: "Complete!",
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center overflow-hidden relative">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br ${phaseColors[phase]} blur-[120px] opacity-30`}
        />
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [1.1, 1, 1.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-600 to-blue-700 blur-[100px] opacity-25"
        />
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 flex flex-col items-center gap-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm font-medium text-neutral-400 uppercase tracking-widest"
        >
          <Sparkles size={14} className="text-cyan-400" />
          Traveloop X · AI Generation
        </motion.div>

        {/* Prompt display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="text-neutral-500 text-sm mb-3 uppercase tracking-widest">Your Request</p>
          <p className="text-2xl md:text-3xl font-semibold text-white/90 leading-snug max-w-xl">
            "{prompt}"
          </p>
        </motion.div>

        {/* Central AI orb */}
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className={`w-40 h-40 rounded-full bg-gradient-to-br ${phaseColors[phase]} opacity-20 blur-2xl absolute`}
          />
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`w-28 h-28 rounded-full bg-gradient-to-br ${phaseColors[phase]} flex items-center justify-center shadow-2xl relative`}
          >
            <Sparkles size={32} className="text-white" />
          </motion.div>
          {/* Orbiting rings */}
          {[80, 110, 140].map((size, i) => (
            <motion.div
              key={i}
              animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
              transition={{ duration: 6 + i * 2, repeat: Infinity, ease: "linear" }}
              className="absolute rounded-full border border-white/10"
              style={{ width: size * 2, height: size * 2 }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs text-neutral-500">
            <span className="font-mono uppercase tracking-widest">{phaseLabels[phase]}</span>
            <span className="font-mono">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${phaseColors[phase]}`}
            />
          </div>
          <motion.p
            key={statusMsg}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-neutral-400 font-mono text-center"
          >
            {statusMsg}
          </motion.p>
        </div>

        {/* Live data cards */}
        <div className="w-full grid grid-cols-2 gap-4">
          {destination && (
            <motion.div
              key="destination-card"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="text-cyan-400" size={18} />
              </div>
              <div>
                <p className="text-[11px] text-neutral-500 uppercase tracking-widest">Destination Locked</p>
                <p className="font-semibold text-white">{destination.city}, {destination.country}</p>
              </div>
              {destination.weather && (
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-cyan-400">{destination.weather.temp}°C</p>
                  <p className="text-[11px] text-neutral-500">{destination.weather.condition}</p>
                </div>
              )}
            </motion.div>
          )}
          {budget && (
            <motion.div
              key="budget-card"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="text-emerald-400" size={16} />
                <p className="text-[11px] text-neutral-500 uppercase tracking-widest">Budget</p>
              </div>
              <p className="font-bold text-xl text-white">₹{budget.total?.toLocaleString()}</p>
              <p className="text-xs text-emerald-400 mt-1">Saved ₹{budget.saved?.toLocaleString()}</p>
            </motion.div>
          )}
          {days.length > 0 && (
            <motion.div
              key="itinerary-card"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-purple-400" size={16} />
                <p className="text-[11px] text-neutral-500 uppercase tracking-widest">Itinerary</p>
              </div>
              <p className="font-bold text-xl text-white">{days.length} Days</p>
              <p className="text-xs text-purple-400 mt-1">{days.reduce((sum, d) => sum + (d.activities?.length || 0), 0)} Activities</p>
            </motion.div>
          )}
        </div>

        {/* Activity stream */}
        {days.length > 0 && (
          <div className="w-full flex flex-col gap-2 max-h-48 overflow-hidden">
            <p className="text-[11px] text-neutral-600 uppercase tracking-widest text-center">Live Generation Feed</p>
              {days.slice(-3).map((day, i) => (
                <motion.div
                  key={`day-${day.day}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-2.5"
                >
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse flex-shrink-0" />
                  <span className="text-xs text-neutral-400">
                    <span className="text-white font-medium">Day {day.day}</span> — {day.activities?.length || 0} activities generated
                  </span>
                  <CheckCircle size={14} className="text-emerald-500 ml-auto flex-shrink-0" />
                </motion.div>
              ))}
          </div>
        )}

        {/* Complete state */}
        {phase === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Plane className="text-emerald-400" size={28} />
            </div>
            <p className="text-lg font-semibold text-white">Your adventure is ready</p>
            <p className="text-sm text-neutral-500">Launching your dashboard...</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    }>
      <CinemaContent />
    </Suspense>
  );
}

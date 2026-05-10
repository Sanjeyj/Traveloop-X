"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, PlaneTakeoff, Loader2, MapPin, Wallet, Calendar } from "lucide-react";

export default function MagicPromptBox() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamEvents, setStreamEvents] = useState<any[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Use a ref to accumulate events so the finally block reads the latest data
  const eventsRef = useRef<any[]>([]);

  const handleGenerate = async () => {
    if (prompt.length < 5 || isGenerating) return;
    setIsGenerating(true);
    setStreamEvents([]);
    eventsRef.current = [];

    try {
      const response = await fetch("http://127.0.0.1:8000/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.body) throw new Error("No readable stream");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              eventsRef.current = [...eventsRef.current, data];
              setStreamEvents([...eventsRef.current]);
            } catch (e) {
              console.error("Parse error", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Generation failed", error);
      setIsGenerating(false);
      return;
    }

    // Read from the ref (always current) instead of state
    const events = eventsRef.current;
    const destEvent = events.find(e => e.type === 'destination');
    const budgetEvent = events.find(e => e.type === 'budget');
    const dayEvents = events.filter(e => e.type === 'day');

    try {
      const tripData = {
        title: prompt.substring(0, 40) + " Trip",
        destination: destEvent?.data.city || "Unknown",
        latitude: destEvent?.data.lat || 0,
        longitude: destEvent?.data.lng || 0,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        budgetLimit: budgetEvent?.data.total || 75000,
        days: dayEvents.map(e => ({
          day: e.data.day,
          title: e.data.title,
          activities: e.data.activities.map((a: any) => ({
            title: a.name,
            type: a.type,
            time: a.time,
            cost: a.cost || 1000
          }))
        }))
      };

      const res = await fetch("http://127.0.0.1:3001/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
      });
      
      const newTrip = await res.json();
      
      // Smooth exit transition before redirect
      setIsRedirecting(true);
      await new Promise(resolve => setTimeout(resolve, 600));

      if (newTrip.id) {
        router.push(`/trip/${newTrip.id}`);
      } else {
        router.push("/trip/demo-trip-123");
      }
    } catch (err) {
      console.error("Failed to save trip", err);
      router.push("/trip/demo-trip-123");
    }

    setIsGenerating(false);
  };

  return (
    <div id="magic-box" className="relative w-full max-w-2xl">
      {/* Redirect fade overlay */}
      <AnimatePresence>
        {isRedirecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9999] bg-neutral-950 flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-neutral-400 text-sm tracking-wide">Preparing your dashboard...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          boxShadow: isFocused 
            ? "0 0 0 2px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.2)" 
            : "0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 20px rgba(0, 0, 0, 0.5)"
        }}
        className="relative bg-neutral-900/50 backdrop-blur-xl rounded-2xl overflow-hidden transition-shadow duration-300"
      >
        {/* Animated border gradient when focused */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500 opacity-20"
              style={{ filter: "blur(20px)" }}
            />
          )}
        </AnimatePresence>

        <div className="relative flex flex-col p-2 z-10">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
            placeholder="e.g. Plan a 5-day Pondicherry trip with beaches & French Quarter under ₹50k..."
            className="w-full bg-transparent text-white placeholder-neutral-500 p-4 outline-none resize-none min-h-[80px]"
            style={{ fontSize: '1.125rem', lineHeight: '1.5' }}
          />
          
          <div className="flex justify-between items-center px-4 pb-2 pt-2 border-t border-white/5">
            <div className="flex gap-2 flex-wrap">
              {['Pondicherry', 'Goa', 'Paris', 'Tokyo', 'Bali'].map((tag) => (
                <button 
                  key={tag}
                  onClick={() => setPrompt(`Plan a 5-day trip to ${tag}`)}
                  className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs text-neutral-400 hover:text-white transition-all hover:scale-105"
                >
                  {tag}
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || prompt.length < 5}
              className={`
                group flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all
                ${prompt.length > 5 && !isGenerating
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:scale-105 hover:shadow-cyan-500/40' 
                  : 'bg-white/10 text-neutral-400 cursor-not-allowed'
                }
              `}
            >
              <span className="relative">
                {isGenerating ? "Generating..." : "Generate Magic"}
                {!isGenerating && <Sparkles size={14} className="absolute -top-1 -right-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
              </span>
              {isGenerating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <PlaneTakeoff size={18} className="group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Cinematic Live Generation Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 mt-6 bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl z-50 overflow-hidden"
          >
            {/* Cinematic background scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[200%] animate-[scan_3s_linear_infinite]" />
            
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Sparkles className="text-cyan-400 animate-pulse" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-wide text-lg">AI Itinerary Architect</h3>
                  <p className="text-sm text-cyan-400 font-mono">
                    {streamEvents.length > 0 
                      ? streamEvents[streamEvents.length - 1]?.message || "Processing data streams..."
                      : "Initializing..."}
                  </p>
                </div>
              </div>

              {/* Event Feed */}
              <div className="flex flex-col gap-3 min-h-[120px] max-h-[300px] overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {streamEvents.filter(e => e.type).map((event, i) => (
                    <motion.div
                      key={`${event.type}-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5"
                    >
                      {event.type === 'destination' && <MapPin className="text-purple-400 flex-shrink-0" size={18} />}
                      {event.type === 'budget' && <Wallet className="text-emerald-400 flex-shrink-0" size={18} />}
                      {event.type === 'day' && <Calendar className="text-blue-400 flex-shrink-0" size={18} />}
                      
                      <div className="text-sm">
                        {event.type === 'destination' && <span>Locked coordinates: <strong className="text-white">{event.data.city}, {event.data.country}</strong></span>}
                        {event.type === 'budget' && <span>Budget optimized: <strong className="text-emerald-400">Saved ₹{event.data.saved}</strong></span>}
                        {event.type === 'day' && <span>Added {event.data.title}: <strong className="text-white">{event.data.activities.length} activities</strong></span>}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

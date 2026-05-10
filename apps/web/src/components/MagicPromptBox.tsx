"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, PlaneTakeoff, Loader2 } from "lucide-react";

const SUGGESTIONS = [
  "Plan a 6-day Japan anime + street food trip under ₹80k",
  "5-day Goa beach and nightlife trip for 2 under ₹40k",
  "7-day Europe backpacking adventure under ₹1.5L",
  "4-day Pondicherry spiritual + beach retreat under ₹25k",
  "10-day Southeast Asia island hopping under ₹1L",
];

export default function MagicPromptBox() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionIdx, setSuggestionIdx] = useState(0);

  const handleGenerate = () => {
    if (prompt.trim().length < 5 || isLoading) return;
    setIsLoading(true);
    router.push(`/generate?q=${encodeURIComponent(prompt.trim())}`);
  };

  const cycleSuggestion = () => {
    const next = (suggestionIdx + 1) % SUGGESTIONS.length;
    setSuggestionIdx(next);
    setPrompt(SUGGESTIONS[next]);
  };

  return (
    <div id="magic-box" className="relative w-full max-w-2xl">
      <motion.div
        animate={{
          boxShadow: isFocused
            ? "0 0 0 2px rgba(6,182,212,0.6), 0 0 60px rgba(6,182,212,0.15)"
            : "0 0 0 1px rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.4)",
        }}
        className="relative bg-neutral-900/60 backdrop-blur-2xl rounded-2xl overflow-hidden"
      >
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-emerald-500/10 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <div className="relative z-10 flex flex-col p-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder="e.g. Plan a 6-day Japan anime + street food trip under ₹80k..."
            className="w-full bg-transparent text-white placeholder-neutral-600 p-4 outline-none resize-none min-h-[90px] text-lg leading-relaxed"
          />

          <div className="flex justify-between items-center px-4 pb-3 pt-2 border-t border-white/[0.05]">
            <div className="flex gap-2 flex-wrap">
              {["Tokyo", "Paris", "Goa", "Bali", "Singapore"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setPrompt(`Plan a 5-day trip to ${tag} under ₹60k`)}
                  className="px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.10] text-xs text-neutral-400 hover:text-white transition-all border border-white/[0.05] hover:border-white/20"
                >
                  {tag}
                </button>
              ))}
              <button
                onClick={cycleSuggestion}
                className="px-3 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-xs text-cyan-400 border border-cyan-500/20 transition-all"
              >
                ✨ Inspire me
              </button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || prompt.trim().length < 5}
              className={`group flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                prompt.trim().length >= 5 && !isLoading
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105"
                  : "bg-white/[0.06] text-neutral-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generate
                  <PlaneTakeoff size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      <p className="text-center text-[11px] text-neutral-600 mt-3 tracking-wide">
        Powered by Gemini AI · Press Enter to generate
      </p>
    </div>
  );
}

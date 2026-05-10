"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import MagicPromptBox from "@/components/MagicPromptBox";
import Globe3D from "@/components/Globe3D";
import MagneticButton from "@/components/MagneticButton";
import dynamic from "next/dynamic";
import { Sparkles, Map, Users, Shield, Zap, Globe, Brain, Layers, ArrowRight, Star, CloudRain, Wallet } from "lucide-react";
import { useRef, useState, useEffect } from "react";

// Animated counter
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = target / 60;
        const t = setInterval(() => {
          start = Math.min(start + step, target);
          setCount(Math.floor(start));
          if (start >= target) clearInterval(t);
        }, 20);
        obs.disconnect();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const FEATURES = [
  {
    icon: <Brain className="text-cyan-400" size={24} />,
    title: "Gemini AI Engine",
    desc: "Real-time itinerary generation powered by Google Gemini. Streams your perfect trip in seconds.",
    color: "from-cyan-500/10 to-blue-500/5",
    border: "border-cyan-500/20",
  },
  {
    icon: <Users className="text-purple-400" size={24} />,
    title: "Live Collaboration",
    desc: "Plan with friends in real-time. Live cursors, instant sync, activity voting — like Figma for travel.",
    color: "from-purple-500/10 to-indigo-500/5",
    border: "border-purple-500/20",
  },
  {
    icon: <CloudRain className="text-emerald-400" size={24} />,
    title: "Adaptive AI",
    desc: "Rain detected? AI automatically reshuffles your itinerary to indoor gems. Always one step ahead.",
    color: "from-emerald-500/10 to-teal-500/5",
    border: "border-emerald-500/20",
  },
  {
    icon: <Wallet className="text-amber-400" size={24} />,
    title: "Budget Intelligence",
    desc: "AI finds savings you'd never spot. \"Shift Tokyo by 2 days → save ₹12,400.\" Live expense tracking.",
    color: "from-amber-500/10 to-orange-500/5",
    border: "border-amber-500/20",
  },
  {
    icon: <Globe className="text-blue-400" size={24} />,
    title: "Offline-First PWA",
    desc: "Download your itinerary. Work without internet. Install as an app. Travel confident anywhere.",
    color: "from-blue-500/10 to-cyan-500/5",
    border: "border-blue-500/20",
  },
  {
    icon: <Shield className="text-rose-400" size={24} />,
    title: "Security Center",
    desc: "Enterprise-grade JWT auth, rate limiting, SQL injection prevention, and real-time threat monitoring.",
    color: "from-rose-500/10 to-pink-500/5",
    border: "border-rose-500/20",
  },
];

const STATS = [
  { value: 12840, suffix: "+", label: "Trips Generated" },
  { value: 98, suffix: "%", label: "AI Accuracy" },
  { value: 340, suffix: "+", label: "Destinations" },
  { value: 42, suffix: "ms", label: "Avg Response" },
];

const TESTIMONIALS = [
  { name: "Priya S.", role: "Solo Traveler", text: "Generated my entire 7-day Japan trip in 8 seconds. The packing list was scarily accurate.", rating: 5, dest: "Tokyo, Japan" },
  { name: "Arjun K.", role: "Travel Blogger", text: "The real-time collaboration blew my mind. We planned our Bali trip with 4 people simultaneously.", rating: 5, dest: "Bali, Indonesia" },
  { name: "Meera R.", role: "Budget Traveler", text: "AI found ₹18k in savings I completely missed. This should be illegal it's so good.", rating: 5, dest: "Paris, France" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white overflow-hidden selection:bg-cyan-500/30">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-cyan-900/20 blur-[160px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[160px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.03)_0%,transparent_70%)]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Traveloop <span className="text-neutral-500 font-normal">X</span></span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden md:flex gap-8 items-center text-sm text-neutral-400"
        >
          {["Features", "Demo", "Security"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-white transition-colors relative group">
              {item}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-cyan-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <MagneticButton
            onClick={() => document.getElementById("magic-box")?.scrollIntoView({ behavior: "smooth" })}
            className="px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors shadow-lg"
          >
            Try Free
          </MagneticButton>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)", y: 30 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium w-fit uppercase tracking-widest"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Powered by Gemini AI · Offline-First · Realtime
          </motion.div>

          <h1 className="text-6xl lg:text-7xl font-semibold tracking-[-0.03em] leading-[1.03] text-white">
            Your AI<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Travel OS
            </span>
          </h1>

          <p className="text-lg text-neutral-400 max-w-lg leading-relaxed">
            Describe your dream trip. Watch Gemini AI stream a complete itinerary — with live weather, budget optimization, packing lists, and real-time collaboration.
          </p>

          <MagicPromptBox />

          <div className="flex flex-wrap gap-6 text-neutral-500 text-sm">
            <div className="flex items-center gap-2"><Map size={16} className="text-cyan-400" /> Real-time Maps</div>
            <div className="flex items-center gap-2"><Users size={16} className="text-purple-400" /> Live Collab</div>
            <div className="flex items-center gap-2"><Shield size={16} className="text-emerald-400" /> Offline PWA</div>
            <div className="flex items-center gap-2"><Zap size={16} className="text-amber-400" /> Instant AI</div>
          </div>
        </motion.div>

        {/* Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[580px] w-full"
        >
          <div className="absolute inset-0 bg-neutral-900/20 border border-white/[0.05] backdrop-blur-3xl rounded-[3rem] overflow-hidden shadow-2xl">
            <Globe3D />
          </div>
          {/* Floating cards */}
          <motion.div
            animate={{ y: [-6, 6, -6] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute -left-6 top-24 bg-neutral-900/80 backdrop-blur-2xl border border-white/[0.08] p-4 rounded-2xl shadow-2xl"
          >
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">AI Insight</p>
            <p className="text-sm font-semibold text-white">Kyoto in Cherry Season</p>
            <p className="text-[11px] text-cyan-400 mt-0.5">April 1–14 · Peak bloom</p>
          </motion.div>
          <motion.div
            animate={{ y: [6, -6, 6] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1.5 }}
            className="absolute -right-4 bottom-32 bg-neutral-900/80 backdrop-blur-2xl border border-white/[0.08] p-4 rounded-2xl shadow-2xl"
          >
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Budget Saved</p>
            <p className="text-xl font-bold text-emerald-400">₹18,400</p>
            <p className="text-[11px] text-neutral-500">vs manual planning</p>
          </motion.div>
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 3 }}
            className="absolute left-8 bottom-16 bg-neutral-900/80 backdrop-blur-2xl border border-white/[0.08] px-4 py-3 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs text-neutral-300 font-medium">3 people planning live</p>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 border-y border-white/[0.04] py-16">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl font-bold text-white tracking-tight">
                <Counter target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-sm text-neutral-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-28">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-cyan-400 text-xs uppercase tracking-widest font-bold mb-4"
          >
            Why Traveloop X
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-semibold tracking-tight"
          >
            Not a travel app.<br />
            <span className="text-neutral-500">An operating system.</span>
          </motion.h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className={`p-7 rounded-3xl bg-gradient-to-br ${f.color} border ${f.border} group cursor-default`}
            >
              <div className="w-12 h-12 rounded-2xl bg-black/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">{f.title}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo CTA */}
      <section id="demo" className="relative z-10 max-w-7xl mx-auto px-8 py-20 border-t border-white/[0.04]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-950 border border-white/[0.06] p-16 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.08)_0%,transparent_70%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Live Demo Available
            </div>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-2xl">
              See the magic in under 10 seconds
            </h2>
            <p className="text-neutral-400 max-w-lg">Type any trip idea and watch Gemini AI stream your complete itinerary live — with weather, budget, activities, and packing list.</p>
            <MagneticButton
              onClick={() => document.getElementById("magic-box")?.scrollIntoView({ behavior: "smooth" })}
              className="group flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-shadow"
            >
              <Sparkles size={20} />
              Generate Your Trip
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20 border-t border-white/[0.04]">
        <h2 className="text-3xl font-semibold text-center mb-12">Loved by travelers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-4"
            >
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-neutral-300 text-sm leading-relaxed">"{t.text}"</p>
              <div className="mt-auto flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-[11px] text-neutral-500">{t.role} · {t.dest}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="relative z-10 max-w-7xl mx-auto px-8 py-16 border-t border-white/[0.04]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="text-emerald-400" size={22} />
            </div>
            <div>
              <p className="font-semibold text-white">Enterprise Security</p>
              <p className="text-sm text-neutral-500">JWT · bcrypt · Rate limiting · CSP · SQL injection prevention</p>
            </div>
          </div>
          <a href="/admin" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
            <Shield size={16} />
            View Security Center
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] mt-8">
        <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-lg font-bold text-white">Traveloop <span className="text-neutral-500 font-normal">X</span></p>
            <p className="text-sm text-neutral-600 mt-1">Plan Smarter. Travel Better. Experience More.</p>
          </div>
          <div className="flex gap-8 text-sm text-neutral-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="/admin" className="hover:text-white transition-colors">Admin</a>
          </div>
          <p className="text-xs text-neutral-700">© 2026 Traveloop X. Built for hackathon excellence.</p>
        </div>
      </footer>
    </main>
  );
}

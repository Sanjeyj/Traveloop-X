"use client";

import { motion } from "framer-motion";
import MagicPromptBox from "@/components/MagicPromptBox";
import Globe3D from "@/components/Globe3D";
import MagneticButton from "@/components/MagneticButton";
import { Sparkles, Map, Users, Shield, Play } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white overflow-hidden selection:bg-cyan-500/30">
      {/* Background Gradients & Noise */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-neutral-800/30 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-neutral-900/40 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)]" />
      </div>

      {/* Navbar placeholder */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-8 max-w-7xl mx-auto">
        <div className="text-xl font-bold tracking-tight text-white/90">
          Traveloop <span className="text-white/40 font-normal">X</span>
        </div>
        <div className="flex gap-8 items-center text-sm font-medium text-neutral-400">
          <a href="#features" className="relative group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#demo" className="relative group">
            Live Demo
            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
          </a>
          <MagneticButton 
            onClick={() => document.getElementById('magic-box')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-neutral-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Start Free
          </MagneticButton>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-32 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Column: Copy & Prompt Box */}
        <motion.div
          initial={{ opacity: 0, filter: 'blur(10px)', y: 30 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-medium w-fit uppercase tracking-widest backdrop-blur-md">
            <Sparkles size={14} className="text-neutral-400" />
            <span>Intelligent Travel OS</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-semibold tracking-[-0.03em] leading-[1.05] text-white">
            Plan smarter.<br />
            <span className="text-neutral-500">Experience more.</span>
          </h1>
          
          <p className="text-lg text-neutral-400 max-w-lg leading-relaxed font-light tracking-wide">
            The operating system that transforms chaotic planning into a seamless, collaborative, and hyper-personalized cinematic experience.
          </p>

          <div className="mt-4">
            <MagicPromptBox />
          </div>

          {/* Feature Highlights */}
          <div className="flex gap-8 mt-8 text-neutral-400">
            <div className="flex items-center gap-2">
              <Map size={20} className="text-cyan-400" />
              <span className="text-sm font-medium">Live Maps</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={20} className="text-purple-400" />
              <span className="text-sm font-medium">Collab</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={20} className="text-emerald-400" />
              <span className="text-sm font-medium">Offline First</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column: 3D Visual */}
        <motion.div
          initial={{ opacity: 0, filter: 'blur(20px)', scale: 0.95 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[600px] w-full flex items-center justify-center"
        >
          {/* Glassmorphism backing for the globe */}
          <div className="absolute inset-0 bg-neutral-900/20 border border-white/[0.05] shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl rounded-[3rem] overflow-hidden">
            <Globe3D />
          </div>
          
          {/* Floating UI Elements over the globe */}
          <motion.div 
            animate={{ y: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="absolute -left-8 top-20 bg-neutral-900/60 backdrop-blur-2xl border border-white/[0.08] p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/5 flex items-center justify-center">
                <Sparkles size={18} className="text-neutral-300" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-medium">AI Insight</p>
                <p className="text-sm font-medium text-neutral-200">Kyoto Shrine Visit</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [5, -5, 5] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
            className="absolute -right-4 bottom-32 bg-neutral-900/60 backdrop-blur-2xl border border-white/[0.08] p-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
              <div>
                <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-medium">Optimization</p>
                <p className="text-sm font-medium text-neutral-200">Saved $140</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Sparkles className="text-cyan-400" />, title: "AI Genius", desc: "Hyper-personalized routes that adapt to your mood, budget, and real-time weather." },
            { icon: <Users className="text-purple-400" />, title: "Live Sync", desc: "Collaborate in real-time with friends. See cursors, share ideas, and plan together." },
            { icon: <Shield className="text-emerald-400" />, title: "Security First", desc: "Enterprise-grade encryption for your travel data and offline-first reliability." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="relative z-10 max-w-7xl mx-auto px-8 py-24 border-t border-white/5">
        <div className="flex flex-col items-center text-center gap-6 mb-16">
          <h2 className="text-4xl font-bold tracking-tight">Experience Traveloop X</h2>
          <p className="text-neutral-400 max-w-2xl">Watch how our AI transforms a single prompt into a fully optimized, collaborative itinerary in seconds.</p>
        </div>
        
        <div className="relative aspect-video w-full rounded-[2rem] overflow-hidden border border-white/10 bg-neutral-900/50 shadow-2xl group cursor-pointer">
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all z-20">
            <div className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
              <Play size={32} fill="currentColor" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2000&auto=format&fit=crop" 
            alt="Live Demo Preview" 
            className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-700"
          />
          <div className="absolute bottom-12 left-12 z-20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Live Recording</span>
            </div>
            <p className="text-2xl font-bold">Interactive Itinerary Generation</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-8 py-16 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <p className="text-xl font-bold text-white/90">Traveloop <span className="text-white/40 font-normal">X</span></p>
            <p className="text-sm text-neutral-500 mt-1">Plan Smarter. Travel Better. Experience More.</p>
          </div>
          <div className="flex gap-8 text-sm text-neutral-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="/admin" className="hover:text-white transition-colors">Admin</a>
          </div>
          <p className="text-xs text-neutral-600">&copy; 2026 Traveloop X. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}

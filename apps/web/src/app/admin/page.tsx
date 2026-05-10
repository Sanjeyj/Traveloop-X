"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Activity, Users, Globe, Lock, AlertTriangle, Terminal } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    activeUsers: 42,
    tripsGenerated: 1284,
    apiLatency: "42ms",
    threatsBlocked: 12
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + (Math.random() > 0.5 ? 1 : -1),
        apiLatency: `${Math.floor(Math.random() * 20 + 30)}ms`
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-8 font-mono selection:bg-emerald-500/30">
      {/* Grid Pattern Overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="text-emerald-500" />
              Traveloop <span className="text-emerald-500">Security Center</span>
            </h1>
            <p className="text-neutral-500 text-xs mt-1 uppercase tracking-widest">Global Infrastructure Monitoring • v4.2.0</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-500">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEMS NOMINAL
            </div>
          </div>
        </header>

        {/* Real-time Metrics Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Active Nodes", value: metrics.activeUsers, icon: <Users size={16} />, color: "text-blue-400" },
            { label: "AI Requests", value: metrics.tripsGenerated, icon: <Zap size={16} />, color: "text-yellow-400" },
            { label: "Edge Latency", value: metrics.apiLatency, icon: <Activity size={16} />, color: "text-purple-400" },
            { label: "Threats Blocked", value: metrics.threatsBlocked, icon: <Lock size={16} />, color: "text-emerald-400" }
          ].map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-neutral-900/50 border border-white/10 p-6 rounded-lg hover:border-white/30 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{m.label}</span>
                <div className={m.color}>{m.icon}</div>
              </div>
              <div className="text-3xl font-bold tracking-tighter">{m.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Security Feed */}
          <div className="lg:col-span-2 bg-neutral-900/50 border border-white/10 rounded-lg overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14} className="text-emerald-500" /> Live Security Feed
              </span>
            </div>
            <div className="p-4 flex flex-col gap-3 font-mono text-[11px] h-[400px] overflow-y-auto custom-scrollbar">
              <div className="text-neutral-500">[11:32:04] <span className="text-emerald-500">SUCCESS</span> Socket connected: node_eu_west_1</div>
              <div className="text-neutral-500">[11:32:08] <span className="text-blue-500">INFO</span> Itinerary generated for trip_id: pondicherry_2024</div>
              <div className="text-neutral-500">[11:33:12] <span className="text-yellow-500">WARN</span> Unusual traffic spike from 192.168.1.1</div>
              <div className="text-neutral-500">[11:33:45] <span className="text-emerald-500">SUCCESS</span> Global mesh synced: 14 nodes updated</div>
              <div className="text-neutral-500">[11:34:01] <span className="text-red-500">BLOCK</span> SQLi attempt prevented on /api/auth/login</div>
              <div className="text-neutral-500">[11:35:10] <span className="text-emerald-500">SUCCESS</span> Backup rotation complete: s3_bucket_backup</div>
              <div className="text-neutral-500">[11:36:22] <span className="text-purple-500">AI</span> Prompt context analyzed: "Paris Budget Explorer"</div>
            </div>
          </div>

          {/* System Health / Globe Placeholder */}
          <div className="bg-neutral-900/50 border border-white/10 rounded-lg p-6 flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Global Coverage</span>
                <Globe size={16} className="text-blue-500" />
             </div>
             <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-32 h-32 rounded-full border border-blue-500/30 border-dashed animate-[spin_20s_linear_infinite] flex items-center justify-center">
                   <div className="w-24 h-24 rounded-full border border-blue-500/50 border-dashed animate-[spin_10s_linear_infinite_reverse]" />
                </div>
                <div className="text-center">
                   <p className="text-2xl font-bold tracking-tighter">99.99%</p>
                   <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Uptime Record</p>
                </div>
             </div>
             <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px]">
                   <span className="text-neutral-500">North America</span>
                   <span className="text-emerald-500">Online</span>
                </div>
                <div className="flex justify-between text-[10px]">
                   <span className="text-neutral-500">Europe</span>
                   <span className="text-emerald-500">Online</span>
                </div>
                <div className="flex justify-between text-[10px]">
                   <span className="text-neutral-500">Asia Pacific</span>
                   <span className="text-emerald-500">Online</span>
                </div>
             </div>
          </div>

        </div>
      </div>
    </main>
  );
}

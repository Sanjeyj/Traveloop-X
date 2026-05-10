"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, Map, Wallet, Activity, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const ADMIN_TOKEN = "traveloop-admin-2026"; // In production, this should be proper auth

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-metrics"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/metrics`, {
        headers: { "x-admin-token": ADMIN_TOKEN },
      });
      if (!res.ok) throw new Error("Failed to fetch admin metrics");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: growthData } = useQuery({
    queryKey: ["admin-growth"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/growth`, {
        headers: { "x-admin-token": ADMIN_TOKEN },
      });
      if (!res.ok) throw new Error("Failed to fetch growth data");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono text-cyan-400 uppercase tracking-widest animate-pulse">Loading Admin Systems...</p>
      </div>
    );
  }

  const { metrics, recentTrips, popularDestinations, auditLogs } = data;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        <header className="flex justify-between items-center bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Shield className="text-emerald-400" /> Admin Command Center
            </h1>
            <p className="text-neutral-400 text-sm mt-1">Live metrics and system monitoring</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Systems Operational
          </div>
        </header>

        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <Users size={16} /> <span className="text-xs uppercase font-semibold tracking-wider">Total Users</span>
            </div>
            <div className="text-3xl font-bold">{metrics.totalUsers.toLocaleString()}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl">
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Map size={16} /> <span className="text-xs uppercase font-semibold tracking-wider">Total Trips</span>
            </div>
            <div className="text-3xl font-bold">{metrics.totalTrips.toLocaleString()}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <Activity size={16} /> <span className="text-xs uppercase font-semibold tracking-wider">Activities Planned</span>
            </div>
            <div className="text-3xl font-bold">{metrics.totalActivities.toLocaleString()}</div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2">
              <Wallet size={16} /> <span className="text-xs uppercase font-semibold tracking-wider">Expenses Tracked</span>
            </div>
            <div className="text-3xl font-bold">₹{(metrics.totalExpensesTracked || 0).toLocaleString()}</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth Chart */}
          <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl flex flex-col">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="text-cyan-400" size={18} /> 30-Day Trip Generation Growth
            </h2>
            <div className="flex-1 min-h-[300px]">
              {growthData && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={growthData}>
                    <XAxis dataKey="date" stroke="#525252" fontSize={10} tickFormatter={(val) => val.split("-").slice(1).join("/")} />
                    <YAxis stroke="#525252" fontSize={10} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "12px", color: "#fff" }} 
                      itemStyle={{ color: "#06b6d4", fontWeight: "bold" }}
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Popular Destinations */}
          <div className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Popular Destinations</h2>
            <div className="flex flex-col gap-3">
              {popularDestinations.map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                  <span className="font-medium">{d.destination}</span>
                  <span className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg font-mono">
                    {d.count} Trips
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Logs */}
          <div className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl flex flex-col">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="text-amber-400" size={18} /> Security Audit Logs
            </h2>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl text-sm flex flex-col gap-1">
                  <div className="flex justify-between text-neutral-300">
                    <span className="font-medium text-white">{log.action.toUpperCase()}</span>
                    <span className="text-xs text-neutral-500">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-neutral-500">
                    <span>IP: {log.ipAddress || "Unknown"}</span>
                    <span className="truncate max-w-[200px]">User: {log.userId || "Guest"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trips */}
          <div className="bg-white/[0.03] border border-white/[0.06] p-6 rounded-2xl flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Latest Generated Trips</h2>
            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {recentTrips.map((trip: any) => (
                <div key={trip.id} className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm text-white truncate max-w-[250px]">{trip.title}</span>
                    <span className="text-xs text-neutral-500">{trip.destination}</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {new Date(trip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

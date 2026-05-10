"use client";

import { useQuery } from "@tanstack/react-query";
import { Cloud, Droplets, Wind, Sun, CloudRain, CloudLightning, Snowflake } from "lucide-react";
import { motion } from "framer-motion";
import { Weather } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const ICONS: Record<string, React.ReactNode> = {
  Clear: <Sun className="text-amber-400" size={24} />,
  Clouds: <Cloud className="text-neutral-400" size={24} />,
  Rain: <CloudRain className="text-cyan-400" size={24} />,
  Thunderstorm: <CloudLightning className="text-purple-400" size={24} />,
  Snow: <Snowflake className="text-white" size={24} />,
  Drizzle: <Droplets className="text-cyan-300" size={24} />,
};

export default function WeatherWidget({ city, lat, lng }: { city: string; lat?: number; lng?: number }) {
  const { data: weather, isLoading } = useQuery<Weather>({
    queryKey: ["weather", city],
    queryFn: async () => {
      let url = `${API_URL}/api/weather/city?city=${encodeURIComponent(city)}`;
      if (lat && lng) url += `&lat=${lat}&lon=${lng}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch weather");
      return res.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 animate-pulse h-[100px] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/[0.05] shadow-inner">
          {ICONS[weather.condition] || <Sun className="text-amber-400" size={24} />}
        </div>
        <div>
          <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-semibold">{city} Weather</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{weather.temp}°C</span>
            <span className="text-sm text-neutral-400 capitalize">{weather.description}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-sm text-neutral-400">
        <div className="flex flex-col items-end">
          <span className="flex items-center gap-1"><Droplets size={12} className="text-cyan-500" /> Humidity</span>
          <span className="font-mono text-white">{weather.humidity}%</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="flex items-center gap-1"><Wind size={12} className="text-neutral-500" /> Wind</span>
          <span className="font-mono text-white">{weather.windSpeed}m/s</span>
        </div>
      </div>
    </motion.div>
  );
}

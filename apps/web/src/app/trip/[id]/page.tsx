"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTripStore } from "@/store/tripStore";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { Map, Calendar, Wallet, Package, Users, Compass, Book, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WeatherWidget from "@/components/WeatherWidget";
import BudgetAnalytics from "@/components/BudgetAnalytics";
import AIChatbot from "@/components/AIChatbot";
import Journal from "@/components/Journal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function TripDashboard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  
  const { currentTrip, setCurrentTrip } = useTripStore();
  const { user } = useAuthStore();
  const { activeTab, setActiveTab } = useUIStore();
  const [collabUsers, setCollabUsers] = useState(1);

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/trips/${tripId}`);
      if (!res.ok) throw new Error("Failed to fetch trip");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  useEffect(() => {
    if (trip) setCurrentTrip(trip);
  }, [trip, setCurrentTrip]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
        <p className="text-cyan-400 font-mono tracking-widest uppercase text-sm animate-pulse">Loading Workspace</p>
      </div>
    );
  }

  if (!trip) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Trip not found.</div>;
  }

  const TABS = [
    { id: "itinerary", icon: <Map size={16} />, label: "Navigation" },
    { id: "budget", icon: <Wallet size={16} />, label: "Budget" },
    { id: "journal", icon: <Book size={16} />, label: "Journal" },
    { id: "packing", icon: <Package size={16} />, label: "Packing List" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-900/80 backdrop-blur-xl border-b border-white/[0.06] px-8 py-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{trip.title}</h1>
            <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.05] text-[10px] font-mono uppercase text-cyan-400">
              {trip.destination}
            </span>
          </div>
          <p className="text-sm text-neutral-400">
            {trip.startDate && !isNaN(new Date(trip.startDate).getTime()) ? new Date(trip.startDate).toLocaleDateString() : "TBD"} – {trip.endDate && !isNaN(new Date(trip.endDate).getTime()) ? new Date(trip.endDate).toLocaleDateString() : "TBD"}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <WeatherWidget city={trip.destination} lat={trip.latitude} lng={trip.longitude} />
          
          <div className="flex -space-x-3">
            {trip.members?.slice(0, 3).map((m: any, i: number) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-neutral-900 bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-xs font-bold shadow-lg">
                {m.user?.name?.[0] || 'U'}
              </div>
            ))}
            {trip.members?.length > 3 && (
              <div className="w-10 h-10 rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400 shadow-lg">
                +{trip.members.length - 3}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/[0.06] bg-neutral-900/30 p-4 flex flex-col gap-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                  : "text-neutral-400 hover:bg-white/[0.05] hover:text-white border border-transparent"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}

          <div className="mt-auto p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </div>
            <p className="text-xs text-neutral-500">Changes sync instantly across all devices.</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "itinerary" && (
                  <div className="flex flex-col gap-6 h-full">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Map size={20} className="text-cyan-400" /> Map Navigation
                      </h2>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trip.destination || '')}&destination=${encodeURIComponent(trip.destination || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-sm text-cyan-400 hover:bg-cyan-500/20 transition-colors shadow-lg flex items-center gap-2"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                    
                    <div className="bg-neutral-900 border border-white/[0.06] rounded-2xl overflow-hidden h-[500px] relative shadow-2xl">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(80%)' }}
                        src={(() => {
                          const activities = trip.days?.flatMap((d: any) => d.activities?.map((a: any) => `${a.title}, ${trip.destination}`)).filter(Boolean) || [];
                          if (activities.length >= 2) {
                            const origin = encodeURIComponent(activities[0]);
                            const dest = encodeURIComponent(activities[activities.length - 1]);
                            const waypoints = activities.slice(1, -1).slice(0, 4).map((a: any) => encodeURIComponent(a)).join('+to:');
                            return `https://maps.google.com/maps?saddr=${origin}&daddr=${waypoints ? waypoints + '+to:' : ''}${dest}&output=embed`;
                          }
                          return `https://maps.google.com/maps?q=${encodeURIComponent(trip.destination || 'World')}&output=embed`;
                        })()}
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                )}

                {activeTab === "budget" && (
                  <BudgetAnalytics 
                    tripId={tripId} 
                    budgetLimit={trip.budgetLimit || 50000} 
                    destination={trip.destination} 
                    days={trip.days} 
                  />
                )}

                {activeTab === "journal" && (
                  <Journal tripId={tripId} userId={user?.id || 'guest'} />
                )}

                {activeTab === "packing" && (
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
                    <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <Package size={20} className="text-cyan-400" /> AI Packing List
                    </h2>
                    {trip.packingList?.items ? (
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {JSON.parse(trip.packingList.items).map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                            <div className="w-5 h-5 rounded border border-neutral-600 flex items-center justify-center cursor-pointer hover:border-cyan-500 transition-colors">
                              {item.isChecked && <div className="w-3 h-3 bg-cyan-500 rounded-sm" />}
                            </div>
                            <span className={item.isChecked ? "text-neutral-500 line-through" : "text-neutral-300"}>
                              {item.name}
                            </span>
                            <span className="ml-auto text-[10px] uppercase text-neutral-600 px-2 py-1 bg-white/[0.05] rounded-md">
                              {item.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/[0.1] rounded-2xl mb-4">
                        <Package size={32} className="text-neutral-600 mb-2" />
                        <p className="text-neutral-500 text-sm">No items added to the packing list yet.</p>
                      </div>
                    )}
                    <button className="w-full py-3 border border-dashed border-white/[0.1] rounded-xl text-sm text-neutral-500 hover:text-white hover:border-white/[0.3] transition-colors">
                      + Add Packing Item
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AIChatbot tripContext={trip} />
    </div>
  );
}

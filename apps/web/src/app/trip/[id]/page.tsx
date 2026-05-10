"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Wallet, Users, Share2, Plus, Settings, CloudRain, Navigation, Sparkles, Play, ArrowLeft, Check } from "lucide-react";
import dynamic from "next/dynamic";
import LiveCursors from "@/components/LiveCursors";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-neutral-900 animate-pulse flex items-center justify-center text-neutral-500">Loading Map...</div>
});

export default function TripDashboard({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newActivity, setNewActivity] = useState({ title: "", time: "10:00 AM", cost: "" });
  const [packingList, setPackingList] = useState<any[]>([]);
  const [isPackingOpen, setIsPackingOpen] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);

  const togglePackingItem = async (idx: number) => {
    const updated = [...packingList];
    updated[idx] = { ...updated[idx], isChecked: !updated[idx].isChecked };
    setPackingList(updated);
    try {
      await fetch(`http://127.0.0.1:3001/api/packing/${unwrappedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updated })
      });
    } catch (err) { console.error('Failed to update packing', err); }
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.title || selectedDay === null) return;

    setTrip((prev: any) => {
      const newDays = [...prev.days];
      const dayIndex = newDays.findIndex((d: any) => d.day === selectedDay);
      if (dayIndex !== -1) {
        const dayId = newDays[dayIndex].id;
        // Background sync with API
        fetch(`http://127.0.0.1:3001/api/trips/days/${dayId}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newActivity.title,
            type: 'Custom',
            costEstimate: Number(newActivity.cost) || 0
          })
        });

        newDays[dayIndex].activities.push({
          id: Math.random(),
          time: newActivity.time,
          title: newActivity.title,
          type: "Custom",
          cost: Number(newActivity.cost) || 0
        });
      }
      return { ...prev, days: newDays };
    });

    setIsAddModalOpen(false);
    setNewActivity({ title: "", time: "10:00 AM", cost: "" });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    async function fetchTrip() {
      try {
        const res = await fetch(`http://127.0.0.1:3001/api/trips/${unwrappedParams.id}`);
        if (!res.ok) throw new Error("Trip not found");
        const dbTrip = await res.json();
        
        // Merge the real database trip with a mock itinerary so the demo looks populated
        // Merge the real database trip with the activities from the DB
        setTrip({
          title: dbTrip.title,
          destination: dbTrip.destination,
          latitude: dbTrip.latitude,
          longitude: dbTrip.longitude,
          budget: { total: dbTrip.budgetLimit || 80000, spent: Math.floor((dbTrip.budgetLimit || 80000) * 0.2), currency: "INR" },
          collaborators: [{ name: "You", avatar: "Y" }],
          days: dbTrip.days?.length > 0 
            ? dbTrip.days.map((d: any, i: number) => ({
                day: i + 1,
                date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                weather: { temp: "24°", condition: "Clear" }, // Mock weather for now
                activities: d.activities.map((a: any) => ({
                  id: a.id,
                  time: a.startTime ? new Date(a.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "10:00 AM",
                  title: a.title,
                  type: a.type,
                  cost: a.costEstimate || 0
                }))
              }))
            : [
                {
                  day: 1,
                  date: "Tomorrow",
                  weather: { temp: "26°", condition: "Sunny" },
                  activities: [
                    { id: 1, time: "10:00 AM", title: `Arrive at ${dbTrip.destination}`, type: "Transport", cost: 1200 },
                    { id: 2, time: "02:00 PM", title: "Check-in to Hotel", type: "Accommodation", cost: 0 },
                    { id: 3, time: "06:00 PM", title: "Evening City Walk", type: "Sightseeing", cost: 1500, aiNote: "Great time for sunset views!" },
                  ]
                }
              ]
        });
      } catch (error) {
        console.error("Failed to fetch trip", error);
        // Fallback to purely mock if DB fails
        setTrip({
          title: "Japan Anime & Neon Lights Explorer",
          destination: "Tokyo, Japan",
          budget: { total: 80000, spent: 15000, currency: "INR" },
          collaborators: [{ name: "Alex", avatar: "A" }, { name: "Sam", avatar: "S" }],
          days: [
            {
              day: 1,
              date: "Oct 12",
              weather: { temp: "22°", condition: "Clear" },
              activities: [
                { id: 1, time: "10:00 AM", title: "Arrive at Haneda Airport", type: "Transport", cost: 1200 },
              ]
            }
          ]
        });
      }
    }
    fetchTrip();

    async function fetchPacking() {
      try {
        const res = await fetch(`http://127.0.0.1:3001/api/packing/${unwrappedParams.id}`);
        const data = await res.json();
        setPackingList(data);
      } catch (err) {
        console.error("Failed to fetch packing list", err);
      }
    }
    fetchPacking();
  }, [unwrappedParams.id]);

  if (!trip) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex overflow-hidden">
      <LiveCursors roomId={unwrappedParams.id} />
      
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 z-20 lg:hidden p-2 bg-neutral-900/80 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Sidebar / Timeline */}
      <div className="w-full lg:w-[450px] flex-shrink-0 border-r border-white/[0.05] bg-neutral-950/80 backdrop-blur-3xl h-screen overflow-y-auto p-8 flex flex-col gap-10 custom-scrollbar z-10 relative">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4"
        >
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-semibold tracking-tight text-white/90 leading-tight">
              {trip.title}
            </h1>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] rounded-full transition-all text-neutral-400"
            >
              <Share2 size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <MapPin size={16} className="text-cyan-400" />
            <span>{trip.destination}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex -space-x-2">
              {trip.collaborators.map((c: any, i: number) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-xs font-bold border-2 border-neutral-900">
                  {c.avatar}
                </div>
              ))}
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs hover:bg-white/20 border-2 border-neutral-900 z-10 transition-colors">
                <Plus size={14} />
              </button>
            </div>
            <div className="text-xs text-neutral-500 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync Active
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-4 py-2.5 rounded-lg border border-cyan-400/20 hover:bg-cyan-400/20 transition-all"
            >
              <ArrowLeft size={14} /> Home
            </button>
            <button 
              onClick={() => setIsPackingOpen(!isPackingOpen)}
              className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg border transition-all ${isPackingOpen ? 'bg-white text-black border-white' : 'text-neutral-400 bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              Packing List {packingList.filter((i: any) => i.isChecked).length}/{packingList.length}
            </button>
          </div>
        </motion.div>

        {/* Budget Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="bg-neutral-900/40 border border-white/[0.05] rounded-2xl p-6 flex flex-col gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        >
          <div className="flex justify-between items-center text-[13px] text-neutral-400 font-medium">
            <div className="flex items-center gap-2 text-white/60"><Wallet size={16} /> Budget Overview</div>
            <span className="text-white/80 font-mono tracking-tight">₹{trip.budget.total} Limit</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full" 
              style={{ width: `${(trip.budget.spent / trip.budget.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 text-right">₹{trip.budget.spent} spent</p>
        </motion.div>

        {/* Packing Assistant Panel */}
        {isPackingOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-neutral-900/40 border border-white/[0.05] rounded-2xl p-6 flex flex-col gap-4 overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Packing Assistant</h3>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-md border border-cyan-500/20">AI Optimized</span>
            </div>
            <div className="flex flex-col gap-2">
              {packingList.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => togglePackingItem(idx)}
                  className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.isChecked ? 'bg-cyan-500 border-cyan-500' : 'border-white/20 group-hover:border-white/40'}`}>
                    {item.isChecked && <Check size={10} className="text-white" />}
                  </div>
                  <span className={`text-sm ${item.isChecked ? 'text-neutral-500 line-through' : 'text-neutral-300'}`}>{item.name}</span>
                  <span className="ml-auto text-[10px] text-neutral-600 uppercase tracking-tighter font-mono">{item.category}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Live Expenses Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-neutral-900/40 border border-white/[0.05] rounded-2xl p-6 flex flex-col gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.4)]"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
              <Wallet size={14} className="text-emerald-500" /> Expense Tracker
            </h3>
            <button className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 border border-white/5 transition-all">+ Add Expense</button>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: "Accommodation", amount: "₹12,000", date: "Oct 12", cat: "Stay" },
              { label: "Dining", amount: "₹4,500", date: "Oct 12", cat: "Food" },
              { label: "Transport", amount: "₹1,200", date: "Oct 12", cat: "Transit" }
            ].map((exp, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-3 bg-white/[0.02] border border-white/[0.03] rounded-xl hover:bg-white/[0.05] transition-all">
                <div className="flex flex-col">
                  <span className="text-neutral-300 font-medium">{exp.label}</span>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-tight">{exp.date} • {exp.cat}</span>
                </div>
                <span className="text-emerald-400 font-mono font-bold">{exp.amount}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar size={18} /> Itinerary
          </h2>
          
          <div className="flex flex-col gap-8">
            {trip.days.map((day: any, dayIdx: number) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: dayIdx * 0.1 }}
                key={day.day} 
                className="relative pl-4 border-l-2 border-white/10"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-neutral-900 border-2 border-cyan-500" />
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="font-semibold text-white/90">Day {day.day}</h3>
                    <p className="text-[13px] text-neutral-500">{day.date}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-full uppercase tracking-widest font-medium">
                    <CloudRain size={12} /> {day.weather.temp} {day.weather.condition}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {day.activities.map((activity: any) => (
                    <div key={activity.id} className="group bg-neutral-900/30 hover:bg-neutral-800/50 border border-white/[0.03] hover:border-white/[0.08] rounded-xl p-4 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)]">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest">{activity.time}</span>
                        <span className="text-[12px] text-neutral-400 font-mono">₹{activity.cost}</span>
                      </div>
                      <p className="font-medium text-[15px] text-white/80 group-hover:text-white transition-colors">{activity.title}</p>
                      
                      {activity.aiNote && (
                        <div className="mt-3 text-[11px] text-neutral-400 bg-white/[0.02] px-2.5 py-1.5 rounded-md border border-white/[0.05] inline-flex items-center gap-1.5 tracking-wide">
                          <Sparkles size={12} className="text-white/40" /> {activity.aiNote}
                        </div>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={() => { setSelectedDay(day.day); setIsAddModalOpen(true); }}
                    className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-xs text-neutral-500 hover:text-white hover:border-white/30 hover:bg-white/[0.02] transition-all"
                  >
                    + Add Activity
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Map Area */}
      <div className="flex-1 bg-neutral-950 relative hidden lg:block overflow-hidden">
        <div className="absolute inset-0">
          <InteractiveMap 
            isNavigating={isNavigating}
            center={[trip.latitude || 35.6762, trip.longitude || 139.6503]}
            markers={[
              { position: [trip.latitude || 35.6762, trip.longitude || 139.6503], title: trip.destination }
            ]}
          />
        </div>
        
        {/* Active Navigation Overlay */}
        {isNavigating && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl border border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(6,182,212,0.3)] flex items-center gap-4 z-20"
          >
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse">
              <Navigation className="text-cyan-400" size={24} />
            </div>
            <div>
              <p className="text-cyan-400 font-bold text-lg">Navigating to {trip.destination}</p>
              <p className="text-sm text-neutral-400">Next stop ahead • Estimated 12 mins</p>
            </div>
            <button 
              onClick={() => setIsNavigating(false)}
              className="ml-4 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              End
            </button>
          </motion.div>
        )}

        {/* Map UI Overlays */}
        <div className="absolute top-6 right-6 flex gap-2 z-10">
          <button className="p-3 bg-neutral-900/80 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
            <Settings size={20} className="text-white" />
          </button>
        </div>

        {/* Floating Route info */}
        <motion.div 
          animate={{ 
            y: isNavigating ? 100 : 0,
            opacity: isNavigating ? 0 : 1
          }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-6 z-10"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <MapPin className="text-cyan-400" size={20} />
            </div>
            <div>
              <p className="text-xs text-neutral-400">Route Overview</p>
              <p className="text-sm font-bold">5 Locations • 32 km</p>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-white/10" />
          <button 
            onClick={() => setIsNavigating(true)}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors"
          >
            Start Navigation
          </button>
        </motion.div>
      </div>

      {/* Add Activity Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-purple-500" />
            <h2 className="text-xl font-bold mb-6">Add Activity for Day {selectedDay}</h2>
            <form onSubmit={handleAddActivity} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-neutral-400 mb-1 block">Activity Title</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newActivity.title}
                  onChange={e => setNewActivity({...newActivity, title: e.target.value})}
                  className="w-full bg-neutral-950 border border-white/10 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none transition-colors"
                  placeholder="e.g. Visit Eiffel Tower"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Time</label>
                  <input 
                    type="text" 
                    value={newActivity.time}
                    onChange={e => setNewActivity({...newActivity, time: e.target.value})}
                    className="w-full bg-neutral-950 border border-white/10 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 mb-1 block">Estimated Cost (₹)</label>
                  <input 
                    type="number" 
                    value={newActivity.cost}
                    onChange={e => setNewActivity({...newActivity, cost: e.target.value})}
                    className="w-full bg-neutral-950 border border-white/10 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-neutral-200 transition-colors"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Share Modal Overlay */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Share Trip</h2>
              <button onClick={() => setIsShareModalOpen(false)} className="text-neutral-500 hover:text-white">&times;</button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Users className="text-cyan-400" size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium">Anyone with the link</p>
                  <p className="text-xs text-neutral-400">Can view and join live sync</p>
                </div>
              </div>
              
              <button 
                onClick={handleCopyLink}
                className="w-full py-3 bg-white text-black rounded-xl text-sm font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
              >
                {copied ? "Copied to clipboard!" : "Copy Link"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

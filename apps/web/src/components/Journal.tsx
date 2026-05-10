"use client";

import { useQuery } from "@tanstack/react-query";
import { Book, Plus, Camera, Trash2, Smile, Frown, Meh, Loader2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const MOODS = [
  { id: "happy", icon: <Smile size={20} className="text-emerald-400" /> },
  { id: "relaxed", icon: <Meh size={20} className="text-blue-400" /> },
  { id: "amazed", icon: <Sparkles size={20} className="text-purple-400" /> },
  { id: "tired", icon: <Frown size={20} className="text-rose-400" /> },
];

import { Sparkles } from "lucide-react";

export default function Journal({ tripId, userId }: { tripId: string, userId: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: "", notes: "", mood: "happy" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: entries = [], refetch, isLoading } = useQuery({
    queryKey: ["journal", tripId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/journal/${tripId}`);
      if (!res.ok) throw new Error("Failed to fetch journals");
      return res.json();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.title || !newEntry.notes) return;
    setIsSubmitting(true);
    try {
      await fetch(`${API_URL}/api/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          userId,
          title: newEntry.title,
          notes: newEntry.notes,
          mood: newEntry.mood,
        }),
      });
      setNewEntry({ title: "", notes: "", mood: "happy" });
      setShowAdd(false);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-cyan-400" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Book size={20} className="text-cyan-400" /> Travel Journal
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Capture your memories and thoughts</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> New Entry
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Entry Title"
                value={newEntry.title}
                onChange={e => setNewEntry({ ...newEntry, title: e.target.value })}
                className="bg-transparent border-b border-white/[0.1] pb-2 text-xl text-white outline-none focus:border-cyan-500 transition-colors placeholder-neutral-600"
              />
              <textarea
                placeholder="Write your thoughts..."
                value={newEntry.notes}
                onChange={e => setNewEntry({ ...newEntry, notes: e.target.value })}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 min-h-[120px] text-white outline-none focus:border-cyan-500/50 transition-colors placeholder-neutral-600 resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400 mr-2">Mood:</span>
                  {MOODS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setNewEntry({ ...newEntry, mood: m.id })}
                      className={`p-2 rounded-xl border transition-all ${newEntry.mood === m.id ? 'bg-white/10 border-white/20' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                    >
                      {m.icon}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !newEntry.title || !newEntry.notes}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Save Entry"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.02] rounded-2xl border border-white/[0.05] border-dashed">
            <Book size={32} className="text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400">Your journal is empty. Start writing your memories!</p>
          </div>
        ) : (
          entries.map((entry: any) => (
            <div key={entry.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{entry.title}</h3>
                  <p className="text-xs text-neutral-500">{new Date(entry.createdAt).toLocaleDateString()} · By {entry.user?.name || 'Unknown'}</p>
                </div>
                <div className="p-2 bg-white/5 rounded-xl">
                  {MOODS.find(m => m.id === entry.mood)?.icon || <Smile size={20} className="text-neutral-400" />}
                </div>
              </div>
              <p className="text-neutral-300 whitespace-pre-wrap text-sm leading-relaxed">{entry.notes}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

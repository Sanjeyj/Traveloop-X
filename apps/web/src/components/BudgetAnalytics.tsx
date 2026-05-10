"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingDown, TrendingUp, Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8000";

export default function BudgetAnalytics({ tripId, budgetLimit, destination, days }: { tripId: string, budgetLimit: number, destination: string, days: any[] }) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: "", amount: "", category: "Food" });

  const { data, refetch } = useQuery({
    queryKey: ["expenses", tripId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/expenses/${tripId}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    }
  });

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.title) return;
    try {
      await fetch(`${API_URL}/api/expenses/${tripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newExpense.title,
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
        }),
      });
      setNewExpense({ title: "", amount: "", category: "Food" });
      setShowAddForm(false);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await fetch(`${API_URL}/api/expenses/${id}`, { method: "DELETE" });
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const optimizeBudget = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch(`${AI_URL}/optimize-budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, budget: budgetLimit, days, destination }),
      });
      const data = await res.json();
      setOptimization(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const expenses = data?.expenses || [];
  const totalSpent = data?.total || 0;
  const byCategory = data?.byCategory || {};
  const remaining = budgetLimit - totalSpent;
  const percentage = Math.min(100, Math.max(0, (totalSpent / budgetLimit) * 100));

  const CATEGORIES = ["Food", "Transport", "Stay", "Activity", "Shopping", "Other"];

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2 text-neutral-400">
            <Wallet size={16} /> <span className="text-xs uppercase tracking-widest font-semibold">Total Budget</span>
          </div>
          <div className="text-3xl font-bold text-white">₹{budgetLimit.toLocaleString()}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2 text-rose-400">
            <TrendingUp size={16} /> <span className="text-xs uppercase tracking-widest font-semibold">Total Spent</span>
          </div>
          <div className="text-3xl font-bold text-rose-400">₹{totalSpent.toLocaleString()}</div>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 text-emerald-400 relative z-10">
            <TrendingDown size={16} /> <span className="text-xs uppercase tracking-widest font-semibold">Remaining</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400 relative z-10">₹{remaining.toLocaleString()}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-neutral-400">Budget Usage</span>
          <span className="text-white font-mono">{percentage.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${percentage > 90 ? "bg-rose-500" : percentage > 75 ? "bg-amber-500" : "bg-emerald-500"}`}
          />
        </div>
      </div>

      {/* AI Optimization */}
      <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Budget Optimizer</h3>
              <p className="text-sm text-neutral-400">Find hidden savings in your itinerary</p>
            </div>
          </div>
          <button
            onClick={optimizeBudget}
            disabled={isOptimizing}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isOptimizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isOptimizing ? "Analyzing..." : "Optimize Now"}
          </button>
        </div>

        <AnimatePresence>
          {optimization && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-purple-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-emerald-400 font-semibold">Potential Savings: ₹{optimization.savings?.toLocaleString() || 0}</span>
                <span className="text-neutral-500 text-sm">• {optimization.message}</span>
              </div>
              <ul className="space-y-2">
                {optimization.tips?.map((tip: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-neutral-300">
                    <span className="text-purple-400 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expenses List */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-white">Recent Expenses</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleAddExpense}
              className="flex items-center gap-3 mb-6 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl"
            >
              <input
                type="text"
                placeholder="Title (e.g. Lunch)"
                value={newExpense.title}
                onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-32 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
              />
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-32 bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button type="submit" className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold transition-colors">
                Save
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {expenses.length === 0 ? (
          <p className="text-neutral-500 text-sm text-center py-8">No expenses tracked yet.</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense: any) => (
              <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] border border-transparent hover:border-white/[0.05] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center text-xs font-semibold text-neutral-400 uppercase">
                    {expense.category.substring(0, 3)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{expense.title}</p>
                    <p className="text-xs text-neutral-500">{new Date(expense.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-rose-400">-₹{expense.amount.toLocaleString()}</p>
                  <button onClick={() => handleDeleteExpense(expense.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-md text-neutral-500 hover:text-rose-400 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

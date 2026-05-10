import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trip, Activity, Expense } from '@/types';

interface TripStore {
  currentTrip: Trip | null;
  setCurrentTrip: (trip: Trip | null) => void;
  updateActivity: (dayId: string, activity: Activity) => void;
  addExpense: (expense: Expense) => void;
  removeExpense: (expenseId: string) => void;
  offlineQueue: any[];
  addToOfflineQueue: (action: any) => void;
  clearOfflineQueue: () => void;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      currentTrip: null,
      setCurrentTrip: (trip) => set({ currentTrip: trip }),
      updateActivity: (dayId, activity) =>
        set((state) => {
          if (!state.currentTrip) return state;
          const days = state.currentTrip.days.map((day) => {
            if (day.id !== dayId) return day;
            const acts = day.activities.map((a) => (a.id === activity.id ? activity : a));
            return { ...day, activities: acts };
          });
          return { currentTrip: { ...state.currentTrip, days } };
        }),
      addExpense: (expense) =>
        set((state) => {
          if (!state.currentTrip) return state;
          const expenses = [...(state.currentTrip.expenses || []), expense];
          return { currentTrip: { ...state.currentTrip, expenses } };
        }),
      removeExpense: (expenseId) =>
        set((state) => {
          if (!state.currentTrip) return state;
          const expenses = (state.currentTrip.expenses || []).filter((e) => e.id !== expenseId);
          return { currentTrip: { ...state.currentTrip, expenses } };
        }),
      offlineQueue: [],
      addToOfflineQueue: (action) =>
        set((state) => ({ offlineQueue: [...state.offlineQueue, action] })),
      clearOfflineQueue: () => set({ offlineQueue: [] }),
    }),
    { name: 'traveloop-trip-store' }
  )
);

import { create } from 'zustand';

interface UIStore {
  isOnline: boolean;
  setOnline: (v: boolean) => void;
  isChatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isPackingOpen: boolean;
  setPackingOpen: (v: boolean) => void;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isOnline: true,
  setOnline: (v) => set({ isOnline: v }),
  isChatOpen: false,
  setChatOpen: (v) => set({ isChatOpen: v }),
  activeTab: 'itinerary',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isPackingOpen: false,
  setPackingOpen: (v) => set({ isPackingOpen: v }),
  notification: null,
  showNotification: (message, type = 'info') => {
    set({ notification: { message, type } });
    setTimeout(() => set({ notification: null }), 4000);
  },
  clearNotification: () => set({ notification: null }),
}));

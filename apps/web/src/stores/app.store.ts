import { create } from 'zustand';
import type { NetworkId } from '@baseagent/shared';

interface AppState {
  network: NetworkId;
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  setNetwork: (network: NetworkId) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  network: 'base-sepolia',
  theme: 'dark',
  sidebarOpen: true,
  commandPaletteOpen: false,
  setNetwork: (network) => set({ network }),
  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
}));

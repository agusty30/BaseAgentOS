import { describe, it, expect } from 'vitest';
import { useAppStore } from '../stores/app.store.js';

describe('useAppStore', () => {
  it('has correct initial state', () => {
    const state = useAppStore.getState();
    expect(state.network).toBe('base-sepolia');
    expect(state.theme).toBe('dark');
    expect(state.sidebarOpen).toBe(true);
    expect(state.commandPaletteOpen).toBe(false);
  });

  it('setNetwork changes network', () => {
    useAppStore.getState().setNetwork('base-mainnet');
    expect(useAppStore.getState().network).toBe('base-mainnet');
    useAppStore.getState().setNetwork('base-sepolia');
  });

  it('setTheme changes theme', () => {
    useAppStore.getState().setTheme('light');
    expect(useAppStore.getState().theme).toBe('light');
    useAppStore.getState().setTheme('dark');
  });

  it('toggleSidebar flips state', () => {
    const before = useAppStore.getState().sidebarOpen;
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(!before);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarOpen).toBe(before);
  });

  it('setCommandPaletteOpen sets directly', () => {
    useAppStore.getState().setCommandPaletteOpen(true);
    expect(useAppStore.getState().commandPaletteOpen).toBe(true);
    useAppStore.getState().setCommandPaletteOpen(false);
    expect(useAppStore.getState().commandPaletteOpen).toBe(false);
  });

  it('toggleCommandPalette flips state', () => {
    useAppStore.getState().setCommandPaletteOpen(false);
    useAppStore.getState().toggleCommandPalette();
    expect(useAppStore.getState().commandPaletteOpen).toBe(true);
    useAppStore.getState().toggleCommandPalette();
    expect(useAppStore.getState().commandPaletteOpen).toBe(false);
  });
});

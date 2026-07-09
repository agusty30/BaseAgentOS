import { create } from 'zustand';

interface MissionState {
  missions: any[];
  selectedMission: string | null;
  statusFilter: string | null;
  connected: boolean;
  setMissions: (missions: any[]) => void;
  setSelectedMission: (id: string | null) => void;
  setStatusFilter: (status: string | null) => void;
  setConnected: (connected: boolean) => void;
  addMission: (mission: any) => void;
  updateMission: (id: string, data: any) => void;
}

export const useMissionStore = create<MissionState>((set) => ({
  missions: [],
  selectedMission: null,
  statusFilter: null,
  connected: false,
  setMissions: (missions) => set({ missions }),
  setSelectedMission: (id) => set({ selectedMission: id }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setConnected: (connected) => set({ connected }),
  addMission: (mission) => set((s) => ({ missions: [mission, ...s.missions] })),
  updateMission: (id, data) => set((s) => ({
    missions: s.missions.map((m) => (m.id === id ? { ...m, ...data } : m)),
  })),
}));

import { create } from 'zustand';

interface WalletState {
  wallets: any[];
  selectedWallet: string | null;
  loading: boolean;
  setWallets: (wallets: any[]) => void;
  setSelectedWallet: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallets: [],
  selectedWallet: null,
  loading: false,
  setWallets: (wallets) => set({ wallets }),
  setSelectedWallet: (id) => set({ selectedWallet: id }),
  setLoading: (loading) => set({ loading }),
}));

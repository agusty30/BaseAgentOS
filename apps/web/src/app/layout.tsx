import type { Metadata } from 'next';
import { WalletProvider } from '@/components/providers/WalletProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'BaseAgent OS',
  description: 'Autonomous Payment & DEX Trading Platform on Base Network',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}

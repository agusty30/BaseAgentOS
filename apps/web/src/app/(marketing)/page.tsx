'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Agents', href: '#agents' },
  { label: 'How It Works', href: '#how-it-works' },
];

const STATS = [
  { value: '8', label: 'AI Agents' },
  { value: 'ERC-20', label: 'USDC' },
  { value: 'Base', label: 'Network' },
  { value: 'Real-time', label: 'Control' },
];

const FEATURES = [
  {
    icon: '💳',
    title: 'Wallet Management',
    description:
      'Secure multi-wallet infrastructure with HD derivation, key rotation, and granular access controls for every agent.',
  },
  {
    icon: '💵',
    title: 'USDC Payments',
    description:
      'Send, receive, and batch USDC payments on Base with sub-second confirmation and full audit trails.',
  },
  {
    icon: '🔄',
    title: 'DEX Trading',
    description:
      'Integrated Uniswap V3 and Aerodrome routing for optimal swaps, liquidity provision, and yield strategies.',
  },
  {
    icon: '🤖',
    title: 'AI Agent Orchestration',
    description:
      'Coordinate autonomous agents with dependency graphs, priority queues, and human-in-the-loop approval gates.',
  },
  {
    icon: '🎯',
    title: 'Strategy Engine',
    description:
      'Build composable DCA, rebalancing, and momentum strategies with backtesting and live deployment in one click.',
  },
  {
    icon: '🕹️',
    title: 'Mission Control',
    description:
      'A unified dashboard to monitor every agent, wallet, and strategy with real-time logs and performance metrics.',
  },
  {
    icon: '🛡️',
    title: 'Risk Management',
    description:
      'Configurable stop-losses, exposure limits, drawdown circuit-breakers, and anomaly detection across all positions.',
  },
  {
    icon: '📊',
    title: 'Portfolio Analytics',
    description:
      'Deep performance attribution, PnL breakdowns, gas tracking, and exportable reports for every time horizon.',
  },
];

const AGENTS = [
  {
    icon: '💸',
    name: 'Payment Agent',
    description: 'Handles USDC transfers, batch payments, and invoice settlement across wallets.',
  },
  {
    icon: '🏦',
    name: 'Treasury Agent',
    description: 'Manages reserves, yield allocation, and cash-flow forecasting for protocol funds.',
  },
  {
    icon: '📈',
    name: 'Trading Agent',
    description: 'Executes swaps on Uniswap V3 and Aerodrome with MEV-aware routing.',
  },
  {
    icon: '💼',
    name: 'Portfolio Agent',
    description: 'Tracks holdings, computes NAV, and triggers rebalancing when drift exceeds thresholds.',
  },
  {
    icon: '⚠️',
    name: 'Risk Agent',
    description: 'Monitors exposure, enforces stop-losses, and halts operations on anomaly detection.',
  },
  {
    icon: '🔔',
    name: 'Notification Agent',
    description: 'Delivers real-time alerts via webhooks, email, and in-app channels for every event.',
  },
  {
    icon: '📊',
    name: 'Analytics Agent',
    description: 'Aggregates on-chain and off-chain data into actionable performance insights.',
  },
  {
    icon: '⚡',
    name: 'Execution Agent',
    description: 'Submits, monitors, and retries transactions with gas optimization and nonce management.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Connect & Configure',
    description:
      'Set up your wallets, connect to Base Network, and configure your AI agents with custom parameters and approval workflows.',
  },
  {
    step: '02',
    title: 'Deploy Strategies',
    description:
      'Choose from DCA, portfolio rebalancing, profit-target, and momentum strategies — or compose your own with the strategy builder.',
  },
  {
    step: '03',
    title: 'Autonomous Operations',
    description:
      'AI agents execute around the clock with configurable approval gates, real-time monitoring, and automatic risk controls.',
  },
];

/* ------------------------------------------------------------------ */
/*  Glass card helper                                                  */
/* ------------------------------------------------------------------ */

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function MarketingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden scroll-smooth">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-colors duration-300',
          scrolled ? 'bg-[#050816]/80 backdrop-blur-xl' : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="BaseAgent OS" width={32} height={32} className="rounded-lg" />
            <span className="text-lg font-semibold tracking-tight text-white">
              BaseAgent OS
            </span>
          </Link>

          {/* Center nav — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-slate-400 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right — desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-300 transition-colors hover:text-white"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0045D9]"
            >
              Get Started
            </Link>
          </div>

          {/* Hamburger — mobile */}
          <button
            type="button"
            aria-label="Toggle menu"
            className="md:hidden flex flex-col gap-1.5"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span
              className={cn(
                'block h-0.5 w-6 rounded bg-white transition-transform',
                menuOpen && 'translate-y-2 rotate-45',
              )}
            />
            <span
              className={cn(
                'block h-0.5 w-6 rounded bg-white transition-opacity',
                menuOpen && 'opacity-0',
              )}
            />
            <span
              className={cn(
                'block h-0.5 w-6 rounded bg-white transition-transform',
                menuOpen && '-translate-y-2 -rotate-45',
              )}
            />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/[0.08] bg-[#050816]/95 backdrop-blur-xl px-6 pb-6 pt-4 space-y-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-slate-400 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/login"
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-[#0052FF] px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#0045D9]"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Decorative gradient orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-[#0052FF]/20 blur-[160px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-40 left-1/4 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[120px]"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent leading-tight">
            BaseAgent OS
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto">
            Autonomous Payment &amp; DEX Trading Platform on Base Network
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-[#0052FF] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#0045D9]"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              Explore Features
            </a>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <GlassCard key={s.label} className="text-center py-5">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-sm text-slate-400">{s.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl md:text-4xl font-bold text-white">
            Platform Features
          </h2>
          <p className="mt-4 text-center text-slate-400 max-w-xl mx-auto">
            Everything you need to run autonomous on-chain operations — from
            payments to portfolio management.
          </p>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <GlassCard key={f.title} className="group hover:border-white/[0.16] transition-colors">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent Showcase ─────────────────────────────────────── */}
      <section id="agents" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl md:text-4xl font-bold text-white">
            Meet the Agents
          </h2>
          <p className="mt-4 text-center text-slate-400 max-w-xl mx-auto">
            Eight specialized AI agents working together to manage your on-chain
            operations autonomously.
          </p>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AGENTS.map((a) => (
              <GlassCard key={a.name} className="group hover:border-white/[0.16] transition-colors">
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{a.icon}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-white">
                  {a.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {a.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl md:text-4xl font-bold text-white">
            How It Works
          </h2>
          <p className="mt-4 text-center text-slate-400 max-w-xl mx-auto">
            Get from zero to fully autonomous operations in three simple steps.
          </p>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <GlassCard key={s.step} className="relative">
                <span className="text-5xl font-bold text-[#0052FF]/20">
                  {s.step}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {s.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="BaseAgent OS" width={32} height={32} className="rounded-lg" />
            <div>
              <span className="text-sm font-semibold text-white">
                BaseAgent OS
              </span>
              <p className="text-xs text-slate-500">Built on Base Network</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Powered by</span>
              <img src="/base-logo.svg" alt="BASE" width={20} height={20} />
              <span className="text-xs font-semibold text-white">BASE</span>
            </div>
            <span className="text-slate-700">|</span>
            <p className="text-xs text-slate-500">
              &copy; 2026 BaseAgent OS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

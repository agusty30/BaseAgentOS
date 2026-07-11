'use client';

import { useState } from 'react';

type MissionStatus = 'planning' | 'queued' | 'running' | 'waiting_confirmation' | 'simulation' | 'executing' | 'completed' | 'failed' | 'retrying' | 'cancelled';

const statusConfig: Record<MissionStatus, { color: string; bg: string }> = {
  planning: { color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  queued: { color: 'text-slate-700 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-700' },
  running: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  waiting_confirmation: { color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  simulation: { color: 'text-cyan-700 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
  executing: { color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  completed: { color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  failed: { color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  retrying: { color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  cancelled: { color: 'text-slate-500 dark:text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
};

const mockMissions = [
  { id: '1', title: 'USDC Transfer to 0xAbC...dEf', agent: 'payment', status: 'completed' as MissionStatus, duration: '4.2s', time: '5m ago', correlationId: 'corr-001', gasUsed: '0.0012 ETH', network: 'Base Sepolia' },
  { id: '2', title: 'Swap 500 USDC → ETH', agent: 'trading', status: 'running' as MissionStatus, duration: '—', time: '2m ago', correlationId: 'corr-002', gasUsed: '—', network: 'Base Sepolia' },
  { id: '3', title: 'DCA Strategy Execution', agent: 'trading', status: 'waiting_confirmation' as MissionStatus, duration: '—', time: '10m ago', correlationId: 'corr-003', gasUsed: '—', network: 'Base Sepolia' },
  { id: '4', title: 'Portfolio Rebalance Analysis', agent: 'portfolio', status: 'completed' as MissionStatus, duration: '8.1s', time: '1h ago', correlationId: 'corr-004', gasUsed: '0.0008 ETH', network: 'Base Sepolia' },
  { id: '5', title: 'Treasury Optimization', agent: 'treasury', status: 'failed' as MissionStatus, duration: '12.3s', time: '2h ago', correlationId: 'corr-005', gasUsed: '0.0001 ETH', network: 'Base Mainnet' },
];

const mockSteps = [
  { name: 'Planner', status: 'completed', duration: '0.3s' },
  { name: 'Validator', status: 'completed', duration: '0.1s' },
  { name: 'Risk Assessment', status: 'completed', duration: '0.5s' },
  { name: 'Simulation', status: 'completed', duration: '1.2s' },
  { name: 'User Approval', status: 'completed', duration: '—' },
  { name: 'Execution', status: 'running', duration: '—' },
  { name: 'Confirmation', status: 'pending', duration: '—' },
  { name: 'Analytics', status: 'pending', duration: '—' },
];

const allStatuses: (MissionStatus | 'all')[] = ['all', 'planning', 'queued', 'running', 'waiting_confirmation', 'simulation', 'executing', 'completed', 'failed', 'retrying', 'cancelled'];

export default function MissionControlPage() {
  const [filter, setFilter] = useState<MissionStatus | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = filter === 'all' ? mockMissions : mockMissions.filter((m) => m.status === filter);
  const selectedMission = mockMissions.find((m) => m.id === selected);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mission Control</h1>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-slate-500">Live</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {allStatuses.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === s ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {filtered.map((m) => {
            const sc = statusConfig[m.status];
            return (
              <div key={m.id} onClick={() => setSelected(m.id)} className={`cursor-pointer rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-slate-800 ${selected === m.id ? 'border-brand' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900 dark:text-white">{m.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{m.agent} agent · {m.time}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}>{m.status.replace('_', ' ')}</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                  <span>Duration: {m.duration}</span>
                  <span>Gas: {m.gasUsed}</span>
                  <span>{m.network}</span>
                </div>
              </div>
            );
          })}
        </div>

        {selectedMission && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Mission Details</h2>
              <div className="flex gap-2">
                {selectedMission.status === 'waiting_confirmation' && (
                  <button className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Approve</button>
                )}
                {!['completed', 'failed', 'cancelled'].includes(selectedMission.status) && (
                  <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 dark:border-red-800">Cancel</button>
                )}
                {selectedMission.status === 'completed' && (
                  <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium dark:border-slate-600 dark:text-white">Replay</button>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Correlation ID</span><span className="font-mono text-slate-900 dark:text-white">{selectedMission.correlationId}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Agent</span><span className="text-slate-900 dark:text-white">{selectedMission.agent}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Network</span><span className="text-slate-900 dark:text-white">{selectedMission.network}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Duration</span><span className="text-slate-900 dark:text-white">{selectedMission.duration}</span></div>
            </div>

            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Execution Timeline</h3>
            <div className="space-y-0">
              {mockSteps.map((step, i) => (
                <div key={i} className="relative flex gap-3 pb-4 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${step.status === 'completed' ? 'bg-green-500' : step.status === 'running' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    {i < mockSteps.length - 1 && <div className="w-0.5 flex-1 mt-1 bg-slate-200 dark:bg-slate-700" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between pb-1">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{step.name}</span>
                    <span className="text-xs text-slate-500">{step.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

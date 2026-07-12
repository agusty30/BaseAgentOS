'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

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

const allStatuses: (MissionStatus | 'all')[] = ['all', 'running', 'waiting_confirmation', 'completed', 'failed', 'cancelled'];

export default function MissionControlPage() {
  const { accessToken } = useAuthStore();
  const [missions, setMissions] = useState<any[]>([]);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MissionStatus | 'all'>('all');
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    loadMissions();
  }, [accessToken]);

  async function loadMissions() {
    try {
      const data = await api.getMissions();
      setMissions(data || []);
    } catch {
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }

  async function selectMission(id: string) {
    setSelected(id);
    try {
      const stepsData = await api.getMissionSteps(id);
      setSteps(stepsData || []);
    } catch {
      setSteps([]);
    }
  }

  async function handleApprove(id: string) {
    try { await api.approveMission(id); loadMissions(); } catch {}
  }

  async function handleCancel(id: string) {
    try { await api.cancelMission(id); loadMissions(); } catch {}
  }

  const filtered = filter === 'all' ? missions : missions.filter((m) => m.status === filter);
  const selectedMission = missions.find((m) => m.id === selected);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

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

      {missions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">No missions yet</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Missions are created by AI agents when executing payments, trades, and strategies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {filtered.map((m: any) => {
              const sc = statusConfig[m.status as MissionStatus] || statusConfig.queued;
              return (
                <div key={m.id} onClick={() => selectMission(m.id)} className={`cursor-pointer rounded-xl border bg-white p-4 transition-all hover:shadow-md dark:bg-slate-800 ${selected === m.id ? 'border-brand' : 'border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{m.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{m.agentType} agent · {new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}>{m.status.replace('_', ' ')}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    {m.duration && <span>Duration: {m.duration}ms</span>}
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
                    <button onClick={() => handleApprove(selectedMission.id)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">Approve</button>
                  )}
                  {!['completed', 'failed', 'cancelled'].includes(selectedMission.status) && (
                    <button onClick={() => handleCancel(selectedMission.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 dark:border-red-800">Cancel</button>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Agent</span><span className="text-slate-900 dark:text-white">{selectedMission.agentType}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Network</span><span className="text-slate-900 dark:text-white">{selectedMission.network}</span></div>
                {selectedMission.txHash && <div className="flex justify-between text-sm"><span className="text-slate-500">Tx Hash</span><span className="font-mono text-xs text-slate-900 dark:text-white">{selectedMission.txHash}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-slate-500">Description</span><span className="text-slate-900 dark:text-white text-right max-w-xs">{selectedMission.description}</span></div>
              </div>

              {steps.length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Execution Steps</h3>
                  <div className="space-y-0">
                    {steps.map((step: any, i: number) => (
                      <div key={step.id || i} className="relative flex gap-3 pb-4 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${step.status === 'completed' ? 'bg-green-500' : step.status === 'running' ? 'bg-amber-500 animate-pulse' : step.status === 'failed' ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          {i < steps.length - 1 && <div className="w-0.5 flex-1 mt-1 bg-slate-200 dark:bg-slate-700" />}
                        </div>
                        <div className="flex-1 flex items-center justify-between pb-1">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{step.name}</span>
                          <span className="text-xs text-slate-500">{step.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

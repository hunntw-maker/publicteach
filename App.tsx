
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SUBJECTS, StartIcon, StopIcon, LogoIcon } from './constants';
import { TeachingMode, TeachingAction, EngagementLevel, ObservationLog } from './types';

// Use a unique key to prevent collisions on shared domains like github.io
const STORAGE_KEY = 'CHRONOS_APP_SESSION_V1';

const ModeCard: React.FC<{
  mode: TeachingMode;
  isActive: boolean;
  time: number;
  onClick: () => void;
}> = ({ mode, isActive, time, onClick }) => {
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col items-start gap-2 overflow-hidden min-h-[110px] w-full text-left ${
        isActive 
          ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-[1.02] z-10' 
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 active:scale-95'
      }`}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
      )}
      <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
        {mode}
      </span>
      <span className="text-3xl font-black font-mono tracking-tighter text-slate-100">
        {formatTime(time)}
      </span>
      {isActive && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      )}
    </button>
  );
};

const ActionButton: React.FC<{
  action: TeachingAction;
  count: number;
  onClick: () => void;
}> = ({ action, count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all flex justify-between items-center group active:scale-90"
    >
      <span className="text-slate-300 group-hover:text-amber-400 transition-colors font-bold text-sm">{action}</span>
      <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-xs font-black min-w-[2.5rem] text-center border border-amber-500/20">
        {count}
      </span>
    </button>
  );
};

const App: React.FC = () => {
  // Load initial state from LocalStorage
  const loadSavedState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to load state", e);
      return null;
    }
  };

  const initialData = loadSavedState() || {};

  const [isSessionActive, setIsSessionActive] = useState<boolean>(initialData.isSessionActive || false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(initialData.sessionStartTime || null);
  const [selectedSubject, setSelectedSubject] = useState(initialData.selectedSubject || SUBJECTS[0]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeMode, setActiveMode] = useState<TeachingMode | null>(initialData.activeMode || null);
  const [modeTimes, setModeTimes] = useState<Record<TeachingMode, number>>(initialData.modeTimes || {
    '講述教學': 0, '小組討論': 0, '實作/演算': 0, '數位運用': 0
  });
  const [actionCounts, setActionCounts] = useState<Record<TeachingAction, number>>(initialData.actionCounts || {
    '正向鼓勵': 0, '糾正規範': 0, '開放提問': 0, '封閉提問': 0, '巡視走動': 0
  });
  const [logs, setLogs] = useState<ObservationLog[]>(initialData.logs || []);
  const [engagement, setEngagement] = useState<EngagementLevel>(initialData.engagement || '中');

  // Persistence effect
  useEffect(() => {
    const state = {
      isSessionActive,
      sessionStartTime,
      selectedSubject,
      activeMode,
      modeTimes,
      actionCounts,
      logs,
      engagement
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isSessionActive, sessionStartTime, selectedSubject, activeMode, modeTimes, actionCounts, logs, engagement]);

  // Tick effect for active mode time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSessionActive && activeMode) {
      interval = setInterval(() => {
        setModeTimes(prev => ({
          ...prev,
          [activeMode]: prev[activeMode] + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, activeMode]);

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = useCallback(() => {
    if (!sessionStartTime) return 'T+00:00';
    const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `T+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [sessionStartTime]);

  const addLog = useCallback((type: ObservationLog['type'], label: string, details?: string) => {
    const newLog: ObservationLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
      relativeTime: getRelativeTime(),
      type,
      label,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  }, [getRelativeTime]);

  const handleStartSession = () => {
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    addLog('NOTE', '教學觀察開始', `科目：${selectedSubject}`);
  };

  const handleStopSession = () => {
    if (window.confirm('確定要結束本次教學觀察嗎？')) {
      setIsSessionActive(false);
      setActiveMode(null);
      addLog('NOTE', '教學觀察結束');
    }
  };

  const handleModeSwitch = (mode: TeachingMode) => {
    if (!isSessionActive) return;
    if (activeMode === mode) {
      setActiveMode(null);
      addLog('MODE_CHANGE', '暫停教學模式', mode);
    } else {
      setActiveMode(mode);
      addLog('MODE_CHANGE', '切換教學模式', mode);
    }
  };

  const handleActionClick = (action: TeachingAction) => {
    if (!isSessionActive) return;
    setActionCounts(prev => ({ ...prev, [action]: prev[action] + 1 }));
    addLog('ACTION', action);
  };

  const handleEngagementChange = (level: EngagementLevel) => {
    if (!isSessionActive) return;
    setEngagement(level);
    addLog('ENGAGEMENT', `學生參與度：${level}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <LogoIcon />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">CHRONOS <span className="text-amber-500">OBSERVER</span></h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Real-time Classroom Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-slate-400 text-xs font-black uppercase mb-1">Local Time</div>
              <div className="text-xl font-mono text-white tabular-nums">
                {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
              </div>
            </div>
            {!isSessionActive ? (
              <div className="flex items-center gap-3">
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm font-bold focus:border-amber-500 outline-none transition-colors"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button 
                  onClick={handleStartSession}
                  className="flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 rounded-xl font-black transition-all shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:scale-95"
                >
                  <StartIcon />
                  START SESSION
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-amber-500 text-xs font-black uppercase mb-1">Elapsed Time</div>
                  <div className="text-xl font-mono text-white tabular-nums">{getRelativeTime()}</div>
                </div>
                <button 
                  onClick={handleStopSession}
                  className="flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-black transition-all shadow-[0_4px_20px_rgba(220,38,38,0.3)] active:scale-95"
                >
                  <StopIcon />
                  STOP
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Metrics */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Teaching Modes */}
            <section>
              <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1 h-3 bg-amber-500 rounded-full" />
                Teaching Modes
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(Object.keys(modeTimes) as TeachingMode[]).map(mode => (
                  <ModeCard 
                    key={mode}
                    mode={mode}
                    isActive={activeMode === mode}
                    time={modeTimes[mode]}
                    onClick={() => handleModeSwitch(mode)}
                  />
                ))}
              </div>
            </section>

            {/* Actions & Engagement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-3 bg-amber-500 rounded-full" />
                  Teaching Actions
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(actionCounts) as TeachingAction[]).map(action => (
                    <ActionButton 
                      key={action}
                      action={action}
                      count={actionCounts[action]}
                      onClick={() => handleActionClick(action)}
                    />
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-3 bg-amber-500 rounded-full" />
                  Engagement Level
                </h3>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-400">Current Status</span>
                    <span className={`text-xl font-black ${engagement === '高' ? 'text-emerald-400' : engagement === '中' ? 'text-amber-400' : 'text-red-400'}`}>
                      {engagement}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['高', '中', '低'] as EngagementLevel[]).map(level => (
                      <button
                        key={level}
                        onClick={() => handleEngagementChange(level)}
                        className={`py-4 rounded-xl font-black text-sm transition-all border ${
                          engagement === level 
                            ? 'bg-amber-500 border-amber-400 text-slate-950' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Logs */}
          <div className="lg:col-span-4 flex flex-col h-full max-h-[800px]">
            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-1 h-3 bg-amber-500 rounded-full" />
              Observation Logs
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <span className="text-xs font-black text-slate-500 uppercase">Recent Events</span>
                <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">Total: {logs.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                    <LogoIcon />
                    <span className="text-xs font-black uppercase">No logs yet</span>
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="group border-l-2 border-slate-800 hover:border-amber-500/50 pl-4 py-1 transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-mono text-slate-500">{log.relativeTime}</span>
                        <span className="text-[10px] font-mono text-slate-600">{log.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black ${
                          log.type === 'MODE_CHANGE' ? 'text-amber-400' :
                          log.type === 'ACTION' ? 'text-blue-400' :
                          log.type === 'ENGAGEMENT' ? 'text-emerald-400' :
                          'text-slate-200'
                        }`}>
                          {log.label}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-slate-500 mt-1 font-medium">{log.details}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fixed missing default export
export default App;

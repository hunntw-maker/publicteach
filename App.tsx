
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SUBJECTS, StartIcon, StopIcon, LogoIcon } from './constants';
import { TeachingMode, TeachingAction, EngagementLevel, ObservationLog } from './types';

// Key for Local Storage
const STORAGE_KEY = 'CHRONOS_SESSION_DATA';

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
      className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col items-start gap-2 overflow-hidden min-h-[110px] ${
        isActive 
          ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.2)] scale-[1.02]' 
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 active:scale-95'
      }`}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
      )}
      <span className={`text-xs font-bold uppercase tracking-tighter ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
        {mode}
      </span>
      <span className="text-3xl font-black font-mono tracking-tighter text-slate-100">
        {formatTime(time)}
      </span>
      {isActive && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
      <span className="text-slate-300 group-hover:text-amber-400 transition-colors font-medium">{action}</span>
      <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-sm font-black min-w-[3rem] text-center border border-amber-500/20">
        {count}
      </span>
    </button>
  );
};

const App: React.FC = () => {
  // 1. Initial State from LocalStorage
  const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  const [isSessionActive, setIsSessionActive] = useState<boolean>(savedData.isSessionActive || false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(savedData.sessionStartTime || null);
  const [selectedSubject, setSelectedSubject] = useState(savedData.selectedSubject || SUBJECTS[0]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeMode, setActiveMode] = useState<TeachingMode | null>(savedData.activeMode || null);
  const [modeTimes, setModeTimes] = useState<Record<TeachingMode, number>>(savedData.modeTimes || {
    '講述教學': 0, '小組討論': 0, '實作/演算': 0, '數位運用': 0
  });
  const [actionCounts, setActionCounts] = useState<Record<TeachingAction, number>>(savedData.actionCounts || {
    '正向鼓勵': 0, '糾正規範': 0, '開放提問': 0, '封閉提問': 0, '巡視走動': 0
  });
  const [logs, setLogs] = useState<ObservationLog[]>(savedData.logs || []);
  const [engagement, setEngagement] = useState<EngagementLevel>(savedData.engagement || '中');
  
  const [noteText, setNoteText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(Date.now());
  const [showEngagementWarning, setShowEngagementWarning] = useState(false);

  // 2. Persist State to LocalStorage
  useEffect(() => {
    const dataToSave = {
      isSessionActive, sessionStartTime, selectedSubject, activeMode, modeTimes, actionCounts, logs, engagement
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [isSessionActive, sessionStartTime, selectedSubject, activeMode, modeTimes, actionCounts, logs, engagement]);

  // Global Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mode Timer logic
  useEffect(() => {
    let modeInterval: ReturnType<typeof setInterval> | undefined;
    if (isSessionActive && activeMode) {
      modeInterval = setInterval(() => {
        setModeTimes(prev => ({
          ...prev,
          [activeMode]: prev[activeMode] + 1
        }));
      }, 1000);
    }
    return () => {
      if (modeInterval) clearInterval(modeInterval);
    };
  }, [isSessionActive, activeMode]);

  // Engagement Check
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (isSessionActive && (Date.now() - lastActionTime > 300000)) {
        setShowEngagementWarning(true);
      } else {
        setShowEngagementWarning(false);
      }
    }, 10000);
    return () => clearInterval(checkInterval);
  }, [isSessionActive, lastActionTime]);

  const addLog = useCallback((type: ObservationLog['type'], label: string, details?: string) => {
    const now = new Date();
    const wallTimestamp = now.toLocaleTimeString('zh-TW', { hour12: false });
    
    let relativeTime = "T+00:00";
    if (sessionStartTime) {
      const elapsed = Math.floor((now.getTime() - sessionStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      relativeTime = `T+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    const newLog: ObservationLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: wallTimestamp,
      relativeTime,
      type,
      label,
      details
    };
    setLogs(prev => [newLog, ...prev]);
    setLastActionTime(Date.now());
    setShowEngagementWarning(false);
  }, [sessionStartTime]);

  const handleToggleSession = () => {
    if (!isSessionActive) {
      const startTime = Date.now();
      setSessionStartTime(startTime);
      setIsSessionActive(true);
      
      const wallTimestamp = new Date(startTime).toLocaleTimeString('zh-TW', { hour12: false });
      const newLog: ObservationLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: wallTimestamp,
        relativeTime: "T+00:00",
        type: 'ACTION',
        label: `課程開始錄製 (${selectedSubject})`,
      };
      setLogs(prev => [newLog, ...prev]);
    } else {
      setIsSessionActive(false);
      setActiveMode(null);
      addLog('ACTION', '課程錄製結束');
      setShowModal(true);
    }
  };

  const resetSession = () => {
    if (window.confirm('確定要清空當前所有紀錄嗎？此操作不可復原。')) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    }
  };

  const handleModeToggle = (mode: TeachingMode) => {
    if (!isSessionActive) return;
    if (activeMode === mode) {
      setActiveMode(null);
      addLog('MODE_CHANGE', `模式切換：結束 ${mode}`);
    } else {
      setActiveMode(mode);
      addLog('MODE_CHANGE', `模式切換：進入 ${mode}`);
    }
  };

  const handleAction = (action: TeachingAction) => {
    if (!isSessionActive) return;
    setActionCounts(prev => ({ ...prev, [action]: prev[action] + 1 }));
    addLog('ACTION', action);
  };

  const handleEngagementChange = (level: EngagementLevel) => {
    setEngagement(level);
    if (isSessionActive) {
      addLog('ENGAGEMENT', `專注度變更：${level}`);
    }
  };

  const handleSendNote = () => {
    if (!noteText.trim() || !isSessionActive) return;
    addLog('NOTE', '質性觀察紀錄', noteText);
    setNoteText('');
  };

  const totalTimeInSeconds = useMemo(() => {
    return (Object.values(modeTimes) as number[]).reduce((acc, curr) => acc + curr, 0);
  }, [modeTimes]);

  const generateReport = () => {
    const nowStr = new Date().toLocaleString('zh-TW');
    const totalMins = Math.floor(totalTimeInSeconds / 60);
    const totalSecs = totalTimeInSeconds % 60;

    let report = `================================================================\n`;
    report += `              CHRONOS 數位觀課專業報告 (產出於 GitHub Pages)\n`;
    report += `================================================================\n`;
    report += `科目: ${selectedSubject} | 日期: ${new Date().toLocaleDateString('zh-TW')}\n`;
    report += `累積時數: ${totalMins} 分 ${totalSecs} 秒\n`;
    report += `----------------------------------------------------------------\n\n`;
    
    report += `[ 教學模式統計 ]\n`;
    (Object.keys(modeTimes) as TeachingMode[]).forEach(m => {
      const mins = Math.floor(modeTimes[m] / 60);
      const secs = modeTimes[m] % 60;
      const percent = totalTimeInSeconds > 0 ? ((modeTimes[m] / totalTimeInSeconds) * 100).toFixed(1) : "0.0";
      report += `- ${m.padEnd(8, ' ')} : ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s (${percent}%)\n`;
    });
    report += `\n`;

    report += `[ 完整時間碼歷程 ]\n`;
    report += `----------------------------------------------------------------\n`;
    report += `絕對時間 | 相對時碼 | 觀課事件\n`;
    report += `----------------------------------------------------------------\n`;
    
    const sortedLogs = [...logs].reverse();
    sortedLogs.forEach(l => {
      report += `${l.timestamp.padEnd(8, ' ')} | ${l.relativeTime.padEnd(8, ' ')} | ${l.label}${l.details ? ' : ' + l.details : ''}\n`;
    });
    report += `\n----------------------------------------------------------------\n`;
    report += `END OF REPORT | 生成時間: ${nowStr}\n`;
    
    return report;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateReport());
    alert('專業觀課報告已複製。');
  };

  const downloadReport = () => {
    const content = generateReport();
    const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Chronos_${selectedSubject}_${new Date().getTime()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto p-4 md:p-6 gap-6 mb-20">
      {/* Header */}
      <header className="glass rounded-3xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-40">
        <div className="flex items-center gap-3">
          <LogoIcon />
          <h1 className="text-xl font-bold tracking-tight text-amber-500">CHRONOS</h1>
          <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block" />
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={isSessionActive}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500/50 text-sm"
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button 
            onClick={resetSession}
            className="text-[10px] text-slate-500 hover:text-red-500 uppercase font-bold tracking-widest transition-colors ml-2"
          >
            Reset Session
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-2xl font-mono text-slate-300 tracking-widest font-medium">
            {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
          </div>
          <button 
            onClick={handleToggleSession}
            className="transition-all active:scale-90 hover:brightness-125"
          >
            {isSessionActive ? <StopIcon /> : <StartIcon />}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-grow">
        <section className="md:col-span-4 flex flex-col gap-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">模式切換 (States)</h2>
          <div className="grid grid-cols-2 gap-4">
            {(Object.keys(modeTimes) as TeachingMode[]).map(mode => (
              <ModeCard 
                key={mode} 
                mode={mode} 
                isActive={activeMode === mode} 
                time={modeTimes[mode]} 
                onClick={() => handleModeToggle(mode)}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-4 flex-grow min-h-[300px]">
             <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">歷程紀錄 (Chronicle)</h2>
             <div className="bg-slate-900/40 rounded-3xl border border-slate-800 overflow-y-auto max-h-[400px] md:max-h-[600px] flex-grow scrollbar-hide log-stream-container">
                {logs.length === 0 ? (
                  <div className="p-12 text-center text-slate-700 text-sm font-medium">等待錄製中...</div>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-800/30 px-3">
                    {logs.map(log => (
                      <div key={log.id} className="p-4 flex gap-4 text-sm animate-fadeIn">
                        <div className="flex flex-col shrink-0 text-[10px] font-bold font-mono">
                          <span className="text-slate-600">{log.timestamp}</span>
                          <span className="text-amber-600/70">{log.relativeTime}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className={log.type === 'ACTION' ? 'text-amber-400 font-bold' : 'text-slate-200 font-medium'}>
                             {log.label}
                           </span>
                           {log.details && <span className="text-slate-500 text-xs mt-1 leading-relaxed">{log.details}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </section>

        <section className="md:col-span-8 flex flex-col gap-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">核心行為 (Actions)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(actionCounts) as TeachingAction[]).map(action => (
              <ActionButton 
                key={action} 
                action={action} 
                count={actionCounts[action]} 
                onClick={() => handleAction(action)}
              />
            ))}
          </div>

          {/* Aesthetic Info Box */}
          <div className="mt-4 bg-slate-900/40 rounded-[2rem] p-8 border border-slate-800/60 flex flex-col gap-8">
             <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                   <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Klimt Insights</h3>
                   <div className="flex gap-1.5 mt-1">
                      <div className="h-4 w-12 klimt-gradient rounded-full" />
                      <div className="h-4 w-4 bg-amber-200/20 rounded-full" />
                      <div className="h-4 w-8 rust-gradient rounded-full" />
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-[10px] text-slate-600 font-mono">DEPOLYED_VERSION: 1.0.2</span>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                   <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest">系統偵測提示</h4>
                   <p className="text-slate-400 text-sm leading-relaxed italic border-l-2 border-amber-900 pl-4 py-1">
                      "持續關注學生的非典型行為，結合計時與質性紀錄能產出更具說服力的觀課報告。"
                   </p>
                </div>
                <div className="aspect-video bg-slate-950/60 border border-slate-800/40 rounded-3xl flex items-center justify-center p-4">
                   <div className="flex flex-col items-center gap-2 opacity-20">
                      <div className="w-16 h-1 bg-amber-500/50 rounded-full animate-pulse" />
                      <div className="w-24 h-1 bg-amber-500/50 rounded-full" />
                      <div className="w-12 h-1 bg-amber-500/50 rounded-full animate-pulse" />
                   </div>
                </div>
             </div>
          </div>
        </section>
      </main>

      {/* Persistent Footer */}
      <footer className={`glass rounded-3xl p-5 flex flex-col md:flex-row gap-6 fixed bottom-4 left-4 right-4 z-40 transition-all duration-1000 ${showEngagementWarning ? 'animate-pulse-gold ring-2 ring-amber-500/40' : ''}`}>
        <div className="flex flex-col gap-3 min-w-[220px]">
          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2 tracking-[0.2em]">
            學生專注度
            {showEngagementWarning && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </span>
          <div className="flex gap-2">
            {(['高', '中', '低'] as EngagementLevel[]).map(level => {
              const active = engagement === level;
              const styles = {
                '高': active ? 'bg-green-500 text-slate-950' : 'bg-green-500/10 text-green-500 border-green-500/20',
                '中': active ? 'bg-yellow-500 text-slate-950' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                '低': active ? 'bg-red-500 text-slate-950' : 'bg-red-500/10 text-red-500 border-red-500/20',
              };
              return (
                <button
                  key={level}
                  onClick={() => handleEngagementChange(level)}
                  className={`flex-1 py-2 px-4 rounded-xl border text-xs font-black transition-all ${styles[level]}`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-grow flex gap-3">
          <input 
            type="text" 
            placeholder="輸入即時質性觀察心得..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendNote()}
            disabled={!isSessionActive}
            className="flex-grow bg-slate-950/80 border border-slate-800 rounded-2xl px-5 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/40 placeholder:text-slate-700 disabled:opacity-20 text-sm"
          />
          <button 
            onClick={handleSendNote}
            disabled={!isSessionActive || !noteText.trim()}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-slate-50 px-10 rounded-2xl font-bold transition-all text-sm active:scale-95 shadow-xl"
          >
            紀錄
          </button>
        </div>
      </footer>

      {/* Summary Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setShowModal(false)} />
          <div className="relative glass w-full max-w-4xl rounded-[3rem] p-10 shadow-3xl animate-scaleIn border-amber-500/10 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />
            
            <h2 className="text-4xl font-black text-amber-500 mb-10 tracking-tighter flex items-center gap-5">
               <LogoIcon />
               觀課分析摘要
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 overflow-y-auto max-h-[50vh] pr-4 scrollbar-hide">
              <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800">
                      <p className="text-slate-500 text-[10px] font-black uppercase mb-2">觀課科目</p>
                      <p className="text-2xl font-bold text-slate-100">{selectedSubject}</p>
                   </div>
                   <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800">
                      <p className="text-slate-500 text-[10px] font-black uppercase mb-2">觀課點位</p>
                      <p className="text-2xl font-bold text-slate-100">{logs.length} <span className="text-sm font-medium text-slate-500">Events</span></p>
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-1">行為分布 (Actions Heatmap)</p>
                   <div className="grid grid-cols-3 gap-3">
                      {(Object.keys(actionCounts) as TeachingAction[]).slice(0, 3).map(a => (
                        <div key={a} className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10 text-center">
                           <div className="text-3xl font-black text-amber-500">{actionCounts[a]}</div>
                           <div className="text-[10px] text-slate-500 mt-2 font-bold">{a}</div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-1">教學模式分佈 (%)</p>
                <div className="space-y-4">
                  {(Object.keys(modeTimes) as TeachingMode[]).map(m => {
                    const percent = totalTimeInSeconds > 0 ? (modeTimes[m] / totalTimeInSeconds * 100) : 0;
                    return (
                      <div key={m} className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-300">{m}</span>
                          <span className="text-amber-500 font-mono">{percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full klimt-gradient transition-all duration-1000" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-800/50 relative z-10">
              <button 
                onClick={copyToClipboard}
                className="flex-1 py-5 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-xl"
              >
                複製紀錄數據
              </button>
              <button 
                onClick={downloadReport}
                className="flex-1 py-5 px-8 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold transition-all active:scale-95 shadow-lg"
              >
                存成專業報告
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="px-8 py-5 rounded-2xl border border-slate-800 hover:bg-slate-800 text-slate-500 font-bold transition-all"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

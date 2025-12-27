
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SUBJECTS, StartIcon, StopIcon, LogoIcon } from './constants';
import { TeachingMode, TeachingAction, EngagementLevel, ObservationLog } from './types';

// Components
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
      className={`relative p-4 rounded-xl border transition-all duration-300 flex flex-col items-start gap-2 overflow-hidden ${
        isActive 
          ? 'bg-amber-950/30 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
      )}
      <span className={`text-sm font-medium ${isActive ? 'text-amber-400' : 'text-slate-400'}`}>
        {mode}
      </span>
      <span className="text-2xl font-bold font-mono tracking-wider">
        {formatTime(time)}
      </span>
      {isActive && (
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
      className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all flex justify-between items-center group active:scale-95"
    >
      <span className="text-slate-200 group-hover:text-amber-400 transition-colors">{action}</span>
      <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-md text-sm font-bold min-w-[2.5rem] text-center border border-amber-500/20">
        {count}
      </span>
    </button>
  );
};

const App: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeMode, setActiveMode] = useState<TeachingMode | null>(null);
  const [modeTimes, setModeTimes] = useState<Record<TeachingMode, number>>({
    '講述教學': 0,
    '小組討論': 0,
    '實作/演算': 0,
    '數位運用': 0
  });
  const [actionCounts, setActionCounts] = useState<Record<TeachingAction, number>>({
    '正向鼓勵': 0,
    '糾正規範': 0,
    '開放提問': 0,
    '封閉提問': 0,
    '巡視走動': 0
  });
  const [logs, setLogs] = useState<ObservationLog[]>([]);
  const [engagement, setEngagement] = useState<EngagementLevel>('中');
  const [noteText, setNoteText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(Date.now());
  const [showEngagementWarning, setShowEngagementWarning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
        label: `開始觀課 (科目：${selectedSubject})`,
      };
      setLogs(prev => [newLog, ...prev]);
    } else {
      setIsSessionActive(false);
      setActiveMode(null);
      addLog('ACTION', '結束觀課紀錄');
      setShowModal(true);
    }
  };

  const handleModeToggle = (mode: TeachingMode) => {
    if (!isSessionActive) return;
    if (activeMode === mode) {
      setActiveMode(null);
      addLog('MODE_CHANGE', `模式結束：${mode}`);
    } else {
      setActiveMode(mode);
      addLog('MODE_CHANGE', `模式切換：${mode}`);
    }
  };

  const handleAction = (action: TeachingAction) => {
    if (!isSessionActive) return;
    setActionCounts(prev => ({ ...prev, [action]: prev[action] + 1 }));
    addLog('ACTION', `教學行為：${action}`);
  };

  const handleEngagementChange = (level: EngagementLevel) => {
    setEngagement(level);
    if (isSessionActive) {
      addLog('ENGAGEMENT', `專注度更新：${level}`);
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
    const now = new Date();
    const totalMins = Math.floor(totalTimeInSeconds / 60);
    const totalSecs = totalTimeInSeconds % 60;

    let report = `================================================================\n`;
    report += `              CHRONOS 專業數位觀課分析報告\n`;
    report += `================================================================\n`;
    report += `【課程資訊】\n`;
    report += `課程科目 : ${selectedSubject}\n`;
    report += `觀課日期 : ${now.toLocaleDateString('zh-TW')}\n`;
    report += `開始時間 : ${sessionStartTime ? new Date(sessionStartTime).toLocaleTimeString('zh-TW', { hour12: false }) : '--:--'}\n`;
    report += `總計時數 : ${totalMins} 分 ${totalSecs} 秒\n`;
    report += `----------------------------------------------------------------\n\n`;
    
    report += `【教學模式分佈】\n`;
    (Object.keys(modeTimes) as TeachingMode[]).forEach(m => {
      const mins = Math.floor(modeTimes[m] / 60);
      const secs = modeTimes[m] % 60;
      const percent = totalTimeInSeconds > 0 ? ((modeTimes[m] / totalTimeInSeconds) * 100).toFixed(1) : "0.0";
      report += `- ${m.padEnd(8, ' ')} : ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s (${percent}%)\n`;
    });
    report += `\n`;

    report += `【關鍵行為統計】\n`;
    (Object.keys(actionCounts) as TeachingAction[]).forEach(a => {
      report += `- ${a.padEnd(8, ' ')} : ${actionCounts[a]} 次\n`;
    });
    report += `\n`;

    report += `【完整觀課歷程流水紀錄】\n`;
    report += `----------------------------------------------------------------\n`;
    report += `絕對時間 | 相對時碼 | 事件內容\n`;
    report += `----------------------------------------------------------------\n`;
    
    const sortedLogs = [...logs].reverse();
    sortedLogs.forEach(l => {
      report += `${l.timestamp.padEnd(8, ' ')} | ${l.relativeTime.padEnd(8, ' ')} | ${l.label}${l.details ? ' : ' + l.details : ''}\n`;
    });
    report += `\n----------------------------------------------------------------\n`;
    report += `報告產生於 CHRONOS 觀課系統 | ${now.toLocaleString('zh-TW')}\n`;
    
    return report;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateReport());
    alert('專業觀課報告已複製到剪貼簿。');
  };

  const downloadReport = () => {
    const content = generateReport();
    const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Chronos_Report_${selectedSubject}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto p-4 md:p-6 gap-6">
      <header className="glass rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-40">
        <div className="flex items-center gap-3">
          <LogoIcon />
          <h1 className="text-xl font-bold tracking-tight text-amber-500">CHRONOS</h1>
          <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block" />
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={isSessionActive}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-2xl font-mono text-slate-300 tracking-widest">
            {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
          </div>
          <button 
            onClick={handleToggleSession}
            className="transition-transform active:scale-90 hover:scale-105"
          >
            {isSessionActive ? <StopIcon /> : <StartIcon />}
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-grow">
        <section className="md:col-span-4 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest px-1">教學模式</h2>
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

          <div className="mt-4 flex flex-col gap-4 flex-grow">
             <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest px-1">即時紀錄流</h2>
             <div className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-y-auto max-h-[300px] md:max-h-[500px] flex-grow scrollbar-hide log-stream-container">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-slate-600 text-sm italic">準備就緒，請點擊開始觀課...</div>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-800/50 px-2">
                    {logs.map(log => (
                      <div key={log.id} className="p-3 flex gap-3 text-sm hover:bg-slate-800/20 transition-colors">
                        <div className="flex flex-col shrink-0 text-[10px] font-mono text-slate-500 leading-tight">
                          <span>{log.timestamp}</span>
                          <span className="text-amber-600">{log.relativeTime}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className={log.type === 'ACTION' ? 'text-amber-400 font-medium' : 'text-slate-300'}>
                             {log.label}
                           </span>
                           {log.details && <span className="text-slate-500 text-xs mt-0.5">{log.details}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </section>

        <section className="md:col-span-8 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest px-1">教學行為</h2>
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

          <div className="mt-4 bg-slate-900/60 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
             <div className="flex flex-col gap-2">
                <h3 className="text-slate-400 text-sm font-medium">觀課美學提示</h3>
                <div className="flex gap-1">
                   <div className="h-4 w-12 klimt-gradient rounded-sm" />
                   <div className="h-4 w-4 bg-amber-200/20 rounded-sm" />
                   <div className="h-4 w-8 rust-gradient rounded-sm" />
                   <div className="h-4 w-12 bg-slate-800 rounded-sm" />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">系統洞察 (AI Insight Preview)</h4>
                   <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/50 text-slate-400 text-xs leading-relaxed italic">
                      "數據顯示：在數位運用模式下，學生的參與度波動較大。建議增加開放式提問以穩定專注力。"
                   </div>
                </div>
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-800 rounded-2xl opacity-30 select-none">
                    <span className="text-[10px] text-slate-600 uppercase font-mono tracking-[0.2em]">Visual Data Kernel</span>
                </div>
             </div>
          </div>
        </section>
      </main>

      <footer className={`glass rounded-2xl p-4 flex flex-col md:flex-row gap-6 sticky bottom-4 z-40 transition-all duration-700 ${showEngagementWarning ? 'animate-pulse-gold border-amber-500/50' : ''}`}>
        <div className="flex flex-col gap-3 min-w-[200px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2 tracking-widest">
            學生專注度
            {showEngagementWarning && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
          </span>
          <div className="flex gap-2">
            {(['高', '中', '低'] as EngagementLevel[]).map(level => {
              const base = "flex-1 py-1.5 px-3 rounded-lg border text-xs transition-all duration-300";
              const styles = {
                '高': engagement === '高' ? 'bg-green-500 text-slate-950 font-bold' : 'bg-green-500/10 text-green-500 border-green-500/20',
                '中': engagement === '中' ? 'bg-yellow-500 text-slate-950 font-bold' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                '低': engagement === '低' ? 'bg-red-500 text-slate-950 font-bold' : 'bg-red-500/10 text-red-500 border-red-500/20',
              };
              return (
                <button
                  key={level}
                  onClick={() => handleEngagementChange(level)}
                  className={`${base} ${styles[level]}`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-grow flex gap-2">
          <input 
            type="text" 
            placeholder="點擊輸入質性觀察心得..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendNote()}
            disabled={!isSessionActive}
            className="flex-grow bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-slate-600 disabled:opacity-20 text-sm transition-all"
          />
          <button 
            onClick={handleSendNote}
            disabled={!isSessionActive || !noteText.trim()}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white px-8 rounded-xl font-medium transition-all text-sm active:scale-95"
          >
            發送
          </button>
        </div>
      </footer>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative glass w-full max-w-3xl rounded-[2rem] p-10 shadow-2xl animate-scaleIn border-amber-500/20">
            <h2 className="text-4xl font-black text-amber-500 mb-8 tracking-tighter flex items-center gap-4">
              <span className="w-12 h-12 rounded-full klimt-gradient flex items-center justify-center text-slate-900">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </span>
              觀課任務完成
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 overflow-y-auto max-h-[50vh] pr-4 scrollbar-hide">
              <div className="space-y-6">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-2">課程關鍵指標</p>
                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">目標科目</span>
                      <span className="text-slate-100 font-bold">{selectedSubject}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">數據量能</span>
                      <span className="text-slate-100 font-bold">{logs.length} 筆項目</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-2">行為頻次 Top 3</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(actionCounts) as TeachingAction[]).slice(0, 3).map(a => (
                      <div key={a} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                         <div className="text-xl font-black text-amber-500">{actionCounts[a]}</div>
                         <div className="text-[10px] text-slate-500 mt-1">{a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-2">模式時效分配</p>
                <div className="space-y-2">
                  {(Object.keys(modeTimes) as TeachingMode[]).map(m => {
                    const percent = totalTimeInSeconds > 0 ? (modeTimes[m] / totalTimeInSeconds * 100) : 0;
                    return (
                      <div key={m} className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>{m}</span>
                          <span>{Math.floor(modeTimes[m]/60)}m {modeTimes[m]%60}s</span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full klimt-gradient" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-800/50">
              <button 
                onClick={copyToClipboard}
                className="flex-1 py-5 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all transform active:scale-95 flex items-center justify-center gap-3"
              >
                複製紀錄數據 (Clipboard)
              </button>
              <button 
                onClick={downloadReport}
                className="flex-1 py-5 px-8 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold transition-all transform active:scale-95"
              >
                存成 TXT 報告
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="px-8 py-5 rounded-2xl border border-slate-800 hover:bg-slate-800 text-slate-500 font-medium transition-all"
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

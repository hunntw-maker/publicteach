import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { SUBJECTS, StartIcon, StopIcon, LogoIcon } from './constants';
import { TeachingMode, TeachingAction, EngagementLevel, ObservationLog, SessionStats } from './types';

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
          ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_10px_#f59e0b]" />
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
      <span className="bg-amber-500/20 text-amber-500 px-2 py-1 rounded-md text-sm font-bold min-w-[2rem] text-center border border-amber-500/30">
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

  // Timers
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

  // Engagement Reminder (5 mins)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (isSessionActive && (Date.now() - lastActionTime > 300000)) { // 5 mins
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
    
    // Calculate elapsed time code if session is active
    let durationString = "";
    if (sessionStartTime) {
      const elapsed = Math.floor((now.getTime() - sessionStartTime) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      durationString = `[T+${mins}:${secs.toString().padStart(2, '0')}]`;
    }

    const newLog: ObservationLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: wallTimestamp,
      type,
      label: durationString ? `${durationString} ${label}` : label,
      details
    };
    setLogs(prev => [newLog, ...prev]);
    setLastActionTime(Date.now());
    setShowEngagementWarning(false);
  }, [sessionStartTime]);

  const handleToggleSession = () => {
    if (!isSessionActive) {
      const now = Date.now();
      setSessionStartTime(now);
      setIsSessionActive(true);
      // We pass the start time directly because the state won't update in time for addLog inside this closure
      const wallTimestamp = new Date(now).toLocaleTimeString('zh-TW', { hour12: false });
      const newLog: ObservationLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: wallTimestamp,
        type: 'ACTION',
        label: `開始觀課 (科目：${selectedSubject})`,
      };
      setLogs(prev => [newLog, ...prev]);
    } else {
      setIsSessionActive(false);
      setActiveMode(null);
      addLog('ACTION', '停止觀課');
      setShowModal(true);
    }
  };

  const handleModeToggle = (mode: TeachingMode) => {
    if (!isSessionActive) return;
    if (activeMode === mode) {
      setActiveMode(null);
      addLog('MODE_CHANGE', `停用模式：${mode}`);
    } else {
      setActiveMode(mode);
      addLog('MODE_CHANGE', `啟用模式：${mode}`);
    }
  };

  const handleAction = (action: TeachingAction) => {
    if (!isSessionActive) return;
    setActionCounts(prev => ({ ...prev, [action]: prev[action] + 1 }));
    addLog('ACTION', `觸發行為：${action}`);
  };

  const handleEngagementChange = (level: EngagementLevel) => {
    setEngagement(level);
    if (isSessionActive) {
      addLog('ENGAGEMENT', `學生專注度變更：${level}`);
    }
  };

  const handleSendNote = () => {
    if (!noteText.trim() || !isSessionActive) return;
    addLog('NOTE', '輸入質性紀錄', noteText);
    setNoteText('');
  };

  const totalTimeInSeconds = useMemo(() => {
    // Explicitly type acc and curr as numbers to avoid 'unknown' type errors during reduce
    return Object.values(modeTimes).reduce((acc: number, curr: number) => acc + curr, 0);
  }, [modeTimes]);

  const generateReport = () => {
    const nowStr = new Date().toLocaleString('zh-TW');
    const totalMins = Math.floor(totalTimeInSeconds / 60);
    const totalSecs = totalTimeInSeconds % 60;

    let report = `================================================\n`;
    report += `          Chronos 數位觀課報告 - ${selectedSubject}\n`;
    report += `================================================\n`;
    report += `產出時間: ${nowStr}\n`;
    report += `總教學時數 (累計): ${totalMins}分${totalSecs}秒\n`;
    report += `------------------------------------------------\n\n`;
    
    report += `[ 教學模式統計 ]\n`;
    (Object.keys(modeTimes) as TeachingMode[]).forEach(m => {
      const mins = Math.floor(modeTimes[m] / 60);
      const secs = modeTimes[m] % 60;
      const percent = totalTimeInSeconds > 0 ? ((modeTimes[m] / totalTimeInSeconds) * 100).toFixed(1) : 0;
      report += `- ${m.padEnd(6, ' ')}: ${mins.toString().padStart(2, '0')}分${secs.toString().padStart(2, '0')}秒 (${percent}%)\n`;
    });
    report += `\n`;

    report += `[ 教學行為次數 ]\n`;
    (Object.keys(actionCounts) as TeachingAction[]).forEach(a => {
      report += `- ${a.padEnd(6, ' ')}: ${actionCounts[a]} 次\n`;
    });
    report += `\n`;

    report += `[ 完整歷程記錄 (包含時間碼) ]\n`;
    report += `------------------------------------------------\n`;
    report += `時間代碼 | 絕對時間 | 紀錄內容\n`;
    report += `------------------------------------------------\n`;
    
    // Sort logs chronologically (earliest first) for the final report
    const sortedLogs = [...logs].reverse();
    sortedLogs.forEach(l => {
      // The label already contains the [T+...] part from addLog
      report += `${l.timestamp.padEnd(8, ' ')} | ${l.label}${l.details ? ' - ' + l.details : ''}\n`;
    });
    report += `\n------------------------------------------------\n`;
    report += `END OF REPORT\n`;
    
    return report;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateReport());
    alert('觀課報告已格式化並複製到剪貼簿。');
  };

  const downloadReport = () => {
    const content = generateReport();
    const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Chronos_觀課報告_${selectedSubject}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto p-4 md:p-6 gap-6">
      {/* Header */}
      <header className="glass rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-40">
        <div className="flex items-center gap-3">
          <LogoIcon />
          <h1 className="text-xl font-bold tracking-tight text-amber-500">CHRONOS</h1>
          <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block" />
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            disabled={isSessionActive}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50"
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

      {/* Main Dashboard */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-grow">
        {/* Left: Teaching Modes */}
        <section className="md:col-span-4 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest px-1">教學模式 (States)</h2>
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
             <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest px-1">即時紀錄流 (Log Stream)</h2>
             <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-y-auto max-h-[300px] md:max-h-none flex-grow scrollbar-hide">
                {logs.length === 0 ? (
                  <div className="p-8 text-center text-slate-600 text-sm italic">尚無紀錄...</div>
                ) : (
                  <div className="flex flex-col divide-y divide-slate-800">
                    {logs.map(log => (
                      <div key={log.id} className="p-3 flex gap-3 text-sm animate-fadeIn">
                        <span className="text-slate-500 font-mono shrink-0">{log.timestamp}</span>
                        <div className="flex flex-col">
                           <span className={log.type === 'ACTION' ? 'text-amber-400' : 'text-slate-300'}>
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

        {/* Right: Teaching Behaviors */}
        <section className="md:col-span-8 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest px-1">教學行為 (Actions)</h2>
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

          <div className="mt-4 bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col gap-6">
             <div className="flex flex-col gap-2">
                <h3 className="text-slate-400 text-sm font-medium">Klimt 藝術啟發佈局</h3>
                <div className="flex gap-1">
                   <div className="h-4 w-12 klimt-gradient rounded" />
                   <div className="h-4 w-4 bg-amber-200 rounded opacity-20" />
                   <div className="h-4 w-8 rust-gradient rounded" />
                   <div className="h-4 w-12 bg-slate-800 rounded" />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <h4 className="text-xs text-slate-500 font-bold uppercase">課堂洞察 (Insights)</h4>
                   <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 text-sm leading-relaxed">
                      系統正即時追蹤您的教學行為分佈。多樣化的提問與走動能顯著提升學生參與度。
                   </div>
                </div>
                <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-800 rounded-2xl opacity-40">
                    <span className="text-xs text-slate-600">PREVIEW DATA VISUALIZATION</span>
                </div>
             </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`glass rounded-2xl p-4 flex flex-col md:flex-row gap-6 sticky bottom-4 z-40 transition-all duration-500 ${showEngagementWarning ? 'animate-pulse-gold border-amber-500/50' : ''}`}>
        <div className="flex flex-col gap-3 min-w-[200px]">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
            學生專注度 (Engagement)
            {showEngagementWarning && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
          </span>
          <div className="flex gap-2">
            {(['高', '中', '低'] as EngagementLevel[]).map(level => {
              const colorMap = { '高': 'bg-green-500/20 text-green-500 border-green-500/30', '中': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30', '低': 'bg-red-500/20 text-red-500 border-red-500/30' };
              const activeColorMap = { '高': 'bg-green-500 text-slate-950 font-bold', '中': 'bg-yellow-500 text-slate-950 font-bold', '低': 'bg-red-500 text-slate-950 font-bold' };
              return (
                <button
                  key={level}
                  onClick={() => handleEngagementChange(level)}
                  className={`flex-1 py-1 px-3 rounded-lg border text-sm transition-all ${
                    engagement === level ? activeColorMap[level] : colorMap[level]
                  }`}
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
            placeholder="輸入質性觀察紀錄..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendNote()}
            disabled={!isSessionActive}
            className="flex-grow bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 placeholder:text-slate-600 disabled:opacity-30"
          />
          <button 
            onClick={handleSendNote}
            disabled={!isSessionActive || !noteText.trim()}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white px-6 rounded-xl font-medium transition-colors"
          >
            發送
          </button>
        </div>
      </footer>

      {/* Modal System */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative glass w-full max-w-2xl rounded-3xl p-8 shadow-2xl animate-scaleIn border-amber-500/20">
            <h2 className="text-3xl font-bold text-amber-500 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-full klimt-gradient flex items-center justify-center text-white">✓</span>
              觀課結束報告
            </h2>
            
            <div className="space-y-6 max-h-[60vh] overflow-y-auto scrollbar-hide pr-2">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">課程資訊</p>
                  <p className="text-slate-200 font-medium">{selectedSubject} ({new Date().toLocaleDateString()})</p>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">紀錄總數</p>
                  <p className="text-slate-200 font-medium">{logs.length} 筆項目</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">教學模式分配</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(modeTimes) as TeachingMode[]).map(m => (
                    <div key={m} className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 text-sm">{m}</span>
                      <span className="text-amber-500 font-mono">
                        {Math.floor(modeTimes[m] / 60)}:{ (modeTimes[m] % 60).toString().padStart(2, '0') }
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-slate-500 text-xs uppercase tracking-widest font-bold">重點行為數據</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   {(Object.keys(actionCounts) as TeachingAction[]).slice(0, 3).map(a => (
                     <div key={a} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                        <div className="text-2xl font-bold text-slate-200">{actionCounts[a]}</div>
                        <div className="text-xs text-slate-500 mt-1">{a}</div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={copyToClipboard}
                className="flex-1 py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-2"
              >
                複製紀錄 (Copy)
              </button>
              <button 
                onClick={downloadReport}
                className="flex-1 py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold transition-all flex items-center justify-center gap-2"
              >
                下載 TXT (UTF-8)
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="sm:w-20 py-4 rounded-2xl border border-slate-700 hover:bg-slate-800 text-slate-400 font-medium transition-all"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
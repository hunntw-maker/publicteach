
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';

// --- Constants ---
const SUBJECTS = ['國文', '英文', '數學', '社會', '自然', '科技', '體育', '藝術', '綜合'];
const STORAGE_KEY = 'CHRONOS_V1_STABLE';

// --- Icons ---
const LogoIcon = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-amber-500 fill-current">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
    </svg>
);

const StartIcon = () => (
    <svg viewBox="0 0 100 100" className="w-10 h-10">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="8 4" className="animate-[spin_10s_linear_infinite]" />
        <path d="M40 35 L70 50 L40 65 Z" fill="#fbbf24" />
    </svg>
);

const StopIcon = () => (
    <svg viewBox="0 0 100 100" className="w-10 h-10">
        <rect x="30" y="30" width="40" height="40" rx="4" fill="#ef4444" />
    </svg>
);

// --- Sub-components ---
// Fix: Use React.FC to handle React-internal props like 'key' correctly.
const ModeCard: React.FC<{ mode: string, isActive: boolean, time: number, onClick: () => void }> = ({ mode, isActive, time, onClick }) => {
    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <button
            onClick={onClick}
            className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col items-start gap-1 overflow-hidden min-h-[100px] w-full text-left ${
                isActive 
                    ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] scale-[1.02] z-10' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 active:scale-95'
            }`}
        >
            {isActive && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />}
            <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>{mode}</span>
            <span className="text-3xl font-black font-mono tracking-tighter text-slate-100">{formatTime(time)}</span>
            {isActive && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
        </button>
    );
};

// Fix: Use React.FC to handle React-internal props like 'key' correctly.
const ActionButton: React.FC<{ action: string, count: number, onClick: () => void }> = ({ action, count, onClick }) => (
    <button
        onClick={onClick}
        className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all flex justify-between items-center group active:scale-90"
    >
        <span className="text-slate-300 group-hover:text-amber-400 transition-colors font-bold text-sm">{action}</span>
        <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg text-xs font-black min-w-[2.5rem] text-center border border-amber-500/20">{count}</span>
    </button>
);

// --- Main App ---
const App = () => {
    const loadState = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    };

    const initial = loadState() || {};

    const [isSessionActive, setIsSessionActive] = useState(initial.isSessionActive || false);
    const [sessionStartTime, setSessionStartTime] = useState(initial.sessionStartTime || null);
    const [selectedSubject, setSelectedSubject] = useState(initial.selectedSubject || SUBJECTS[0]);
    const [activeMode, setActiveMode] = useState(initial.activeMode || null);
    const [modeTimes, setModeTimes] = useState(initial.modeTimes || { '講述教學': 0, '小組討論': 0, '實作/演算': 0, '數位運用': 0 });
    const [actionCounts, setActionCounts] = useState(initial.actionCounts || { '正向鼓勵': 0, '糾正規範': 0, '開放提問': 0, '封閉提問': 0, '巡視走動': 0 });
    const [logs, setLogs] = useState(initial.logs || []);
    const [engagement, setEngagement] = useState(initial.engagement || '中');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [noteText, setNoteText] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ isSessionActive, sessionStartTime, selectedSubject, activeMode, modeTimes, actionCounts, logs, engagement }));
    }, [isSessionActive, sessionStartTime, selectedSubject, activeMode, modeTimes, actionCounts, logs, engagement]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let interval: any;
        if (isSessionActive && activeMode) {
            interval = setInterval(() => {
                setModeTimes((prev: any) => ({ ...prev, [activeMode]: prev[activeMode] + 1 }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isSessionActive, activeMode]);

    const getRelativeTime = useCallback(() => {
        if (!sessionStartTime) return 'T+00:00';
        const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        return `T+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }, [sessionStartTime]);

    const addLog = useCallback((type: string, label: string, details?: string) => {
        const newLog = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString('zh-TW', { hour12: false }),
            relativeTime: getRelativeTime(),
            type, label, details
        };
        setLogs((prev: any) => [newLog, ...prev]);
    }, [getRelativeTime]);

    const handleToggleSession = () => {
        if (!isSessionActive) {
            setIsSessionActive(true);
            setSessionStartTime(Date.now());
            addLog('ACTION', '觀課開始錄製', `科目：${selectedSubject}`);
        } else {
            if (confirm('確定結束觀課？數據將保留。')) {
                setIsSessionActive(false);
                setActiveMode(null);
                addLog('ACTION', '觀課結束');
                setShowSummary(true);
            }
        }
    };

    const resetAll = () => {
        if (confirm('確定重置所有數據？此操作不可復原。')) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    };

    const handleModeSwitch = (mode: string) => {
        if (!isSessionActive) return;
        if (activeMode === mode) {
            setActiveMode(null);
            addLog('MODE_CHANGE', `停止模式：${mode}`);
        } else {
            setActiveMode(mode);
            addLog('MODE_CHANGE', `進入模式：${mode}`);
        }
    };

    const handleAction = (action: string) => {
        if (!isSessionActive) return;
        setActionCounts((prev: any) => ({ ...prev, [action]: prev[action] + 1 }));
        addLog('ACTION', action);
    };

    const handleSendNote = () => {
        if (!noteText.trim() || !isSessionActive) return;
        addLog('NOTE', '觀察備註', noteText);
        setNoteText('');
    };

    const totalS = useMemo(() => Object.values(modeTimes).reduce((a, b) => (a as number) + (b as number), 0) as number, [modeTimes]);

    const getReport = () => {
        let r = `--- CHRONOS 專業觀課報告 ---\n日期: ${new Date().toLocaleDateString('zh-TW')} | 科目: ${selectedSubject}\n\n`;
        r += `[模式分配]\n`;
        Object.keys(modeTimes).forEach((k: any) => {
            const p = totalS > 0 ? ((modeTimes as any)[k] / totalS * 100).toFixed(1) : 0;
            r += `${k}: ${Math.floor((modeTimes as any)[k] / 60)}m ${(modeTimes as any)[k] % 60}s (${p}%)\n`;
        });
        r += `\n[行為統計]\n`;
        Object.keys(actionCounts).forEach((k: any) => r += `${k}: ${(actionCounts as any)[k]} 次\n`);
        r += `\n[詳細歷程]\n時間 | 相對 | 事件\n`;
        [...logs].reverse().forEach((l: any) => r += `${l.timestamp} | ${l.relativeTime} | ${l.label}${l.details ? ' : ' + l.details : ''}\n`);
        return r;
    };

    return (
        <div className="min-h-screen p-4 md:p-8 flex flex-col gap-8 max-w-6xl mx-auto mb-24">
            <header className="glass rounded-3xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-40">
                <div className="flex items-center gap-3">
                    <LogoIcon />
                    <h1 className="text-xl font-black tracking-tighter text-amber-500">CHRONOS</h1>
                    <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block" />
                    <select 
                        value={selectedSubject} 
                        onChange={e => setSelectedSubject(e.target.value)}
                        disabled={isSessionActive}
                        className="bg-slate-900 border border-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={resetAll} className="text-[10px] text-slate-600 font-bold hover:text-red-500 ml-2">RESET</button>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-2xl font-mono tabular-nums font-bold text-slate-300">
                        {currentTime.toLocaleTimeString('zh-TW', { hour12: false })}
                    </div>
                    <button onClick={handleToggleSession} className="active:scale-90 transition-transform">
                        {isSessionActive ? <StopIcon /> : <StartIcon />}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
                <section className="lg:col-span-4 space-y-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">教學模式</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.keys(modeTimes).map((m: any) => (
                            <ModeCard key={m} mode={m} isActive={activeMode === m} time={(modeTimes as any)[m]} onClick={() => handleModeSwitch(m)} />
                        ))}
                    </div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">即時紀錄</h3>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl h-[400px] overflow-y-auto scrollbar-hide log-stream-container">
                        {logs.length === 0 ? <div className="p-10 text-center text-slate-700 text-xs italic font-bold">Waiting for recording...</div> : (
                            <div className="divide-y divide-slate-800/30">
                                {logs.map((l: any) => (
                                    <div key={l.id} className="p-4 flex gap-4 text-xs animate-fadeIn">
                                        <div className="flex flex-col shrink-0 font-mono text-[9px] font-bold text-slate-500">
                                            <span>{l.timestamp}</span>
                                            <span className="text-amber-600/60">{l.relativeTime}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className={l.type === 'ACTION' ? 'text-amber-400 font-bold' : 'text-slate-200 font-medium'}>{l.label}</span>
                                            {l.details && <span className="text-slate-500 text-[10px]">{l.details}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="lg:col-span-8 space-y-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">教學行為</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.keys(actionCounts).map((a: any) => (
                            <ActionButton key={a} action={a} count={(actionCounts as any)[a]} onClick={() => handleAction(a)} />
                        ))}
                    </div>
                    <div className="bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-800/50 flex flex-col gap-10">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-tighter">Visual Analytics Preview</h4>
                                <div className="flex gap-1">
                                    <div className="w-12 h-3 klimt-gradient rounded-full" /><div className="w-4 h-3 bg-slate-800 rounded-full" /><div className="w-8 h-3 rust-gradient rounded-full" />
                                </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-700">KERNEL_V1.0.4_DEPLOY</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="p-6 bg-slate-950/40 rounded-3xl border border-amber-900/20">
                                <p className="text-slate-400 text-xs italic leading-relaxed">"系統建議：目前提問行為集中於課程前段。嘗試在實作/演算模式中導入更多開放式引導，能進一步深化學生的後設認知。"</p>
                            </div>
                            <div className="flex items-center justify-center opacity-10"><LogoIcon /><LogoIcon /><LogoIcon /></div>
                        </div>
                    </div>
                </section>
            </div>

            <footer className="glass rounded-3xl p-5 fixed bottom-6 left-6 right-6 z-40 flex flex-col md:flex-row gap-6">
                <div className="flex flex-col gap-2 min-w-[220px]">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Engagement</span>
                    <div className="flex gap-1.5">
                        {['高', '中', '低'].map(l => (
                            <button 
                                key={l} 
                                onClick={() => setEngagement(l as any)}
                                className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                                    engagement === l 
                                        ? (l==='高'?'bg-emerald-500 text-slate-950':l==='中'?'bg-amber-500 text-slate-950':'bg-red-500 text-slate-950')
                                        : 'bg-slate-800/50 text-slate-500 border-slate-800'
                                }`}
                            >{l}</button>
                        ))}
                    </div>
                </div>
                <div className="flex-grow flex gap-3">
                    <input 
                        type="text" placeholder="輸入質性觀察心得..." value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSendNote()}
                        disabled={!isSessionActive}
                        className="flex-grow bg-slate-950/80 border border-slate-800 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <button onClick={handleSendNote} disabled={!isSessionActive || !noteText.trim()} className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-slate-50 px-8 rounded-2xl font-black text-xs active:scale-95 shadow-xl">紀錄</button>
                </div>
            </footer>

            {showSummary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
                    <div className="glass w-full max-w-4xl rounded-[3rem] p-10 shadow-3xl border-amber-500/10 relative overflow-hidden">
                        <h2 className="text-4xl font-black text-amber-500 mb-8 tracking-tighter">觀課任務總結</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10 max-h-[50vh] overflow-y-auto pr-4 scrollbar-hide">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 mb-2">觀課科目</p>
                                        <p className="text-xl font-bold">{selectedSubject}</p>
                                    </div>
                                    <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800">
                                        <p className="text-[10px] font-black text-slate-500 mb-2">事件總數</p>
                                        <p className="text-xl font-bold">{logs.length} <span className="text-[10px] text-slate-600">Events</span></p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">教學模式佔比</p>
                                    <div className="space-y-3">
                                        {Object.keys(modeTimes).map((m: any) => {
                                            const p = totalS > 0 ? ((modeTimes as any)[m] / totalS * 100) : 0;
                                            return (
                                                <div key={m} className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-bold"><span className="text-slate-400">{m}</span><span className="text-amber-500">{p.toFixed(0)}%</span></div>
                                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden"><div className="h-full klimt-gradient transition-all" style={{width: `${p}%`}} /></div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">核心行為分布</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.keys(actionCounts).map((a: any) => (
                                        <div key={a} className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800 flex flex-col">
                                            <span className="text-2xl font-black text-amber-500">{(actionCounts as any)[a]}</span>
                                            <span className="text-[10px] font-bold text-slate-500">{a}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-800">
                            <button onClick={() => {navigator.clipboard.writeText(getReport()); alert('已複製專業報告。')}} className="flex-1 py-5 rounded-2xl bg-amber-500 text-slate-950 font-black active:scale-95 shadow-xl">複製文字報告</button>
                            <button onClick={() => setShowSummary(false)} className="px-10 py-5 rounded-2xl border border-slate-800 text-slate-500 font-bold hover:bg-slate-800">返回修正</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);

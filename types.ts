
export type TeachingMode = '講述教學' | '小組討論' | '實作/演算' | '數位運用';
export type TeachingAction = '正向鼓勵' | '糾正規範' | '開放提問' | '封閉提問' | '巡視走動';
export type EngagementLevel = '高' | '中' | '低';

export interface ObservationLog {
  id: string;
  timestamp: string;      // 絕對時間 (如 14:30:05)
  relativeTime: string;   // 相對時間碼 (如 T+05:12)
  type: 'MODE_CHANGE' | 'ACTION' | 'ENGAGEMENT' | 'NOTE';
  label: string;
  details?: string;
}

export interface SessionStats {
  startTime: number | null;
  endTime: number | null;
  modes: Record<TeachingMode, number>;
  actions: Record<TeachingAction, number>;
  logs: ObservationLog[];
}

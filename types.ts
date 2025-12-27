
export type TeachingMode = '講述教學' | '小組討論' | '實作/演算' | '數位運用';
export type TeachingAction = '正向鼓勵' | '糾正規範' | '開放提問' | '封閉提問' | '巡視走動';
export type EngagementLevel = '高' | '中' | '低';

export interface ObservationLog {
  id: string;
  timestamp: string;
  type: 'MODE_CHANGE' | 'ACTION' | 'ENGAGEMENT' | 'NOTE';
  label: string;
  details?: string;
  duration?: number;
}

export interface SessionStats {
  startTime: number | null;
  endTime: number | null;
  modes: Record<TeachingMode, number>;
  actions: Record<TeachingAction, number>;
  logs: ObservationLog[];
}

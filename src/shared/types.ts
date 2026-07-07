export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak'
export type TimerStatus = 'idle' | 'running' | 'paused'

export interface TimerSettings {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
}

export interface DailyStats {
  completedPomodoros: number
  focusMinutes: number
}

export interface TimerSnapshot {
  phase: TimerPhase
  status: TimerStatus
  remainingMs: number
  startedAt: number | null
  endsAt: number | null
  completedPomodorosInCycle: number
}

export interface TimerState extends TimerSnapshot {
  settings: TimerSettings
  todayStats: DailyStats
  recentStats: Array<{
    date: string
    stats: DailyStats
  }>
}

export interface PomodoroApi {
  getState: () => Promise<TimerState>
  start: () => Promise<TimerState>
  pause: () => Promise<TimerState>
  resume: () => Promise<TimerState>
  reset: () => Promise<TimerState>
  skip: () => Promise<TimerState>
  updateSettings: (settings: TimerSettings) => Promise<TimerState>
  onStateChange: (callback: (state: TimerState) => void) => () => void
}

export const defaultSettings: TimerSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4
}

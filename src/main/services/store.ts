import Store from 'electron-store'
import { defaultSettings, type DailyStats, type TimerSettings, type TimerSnapshot } from '../../shared/types'

interface AppStoreSchema {
  settings: TimerSettings
  statsByDay: Record<string, DailyStats>
  snapshot: TimerSnapshot
}

const defaultSnapshot: TimerSnapshot = {
  phase: 'focus',
  status: 'idle',
  remainingMs: defaultSettings.focusMinutes * 60 * 1000,
  startedAt: null,
  endsAt: null,
  completedPomodorosInCycle: 0
}

const store = new Store<AppStoreSchema>({
  defaults: {
    settings: defaultSettings,
    statsByDay: {},
    snapshot: defaultSnapshot
  }
})

export function getSettings(): TimerSettings {
  return store.get('settings')
}

export function setSettings(settings: TimerSettings): void {
  store.set('settings', settings)
}

export function getSnapshot(): TimerSnapshot {
  return store.get('snapshot')
}

export function setSnapshot(snapshot: TimerSnapshot): void {
  store.set('snapshot', snapshot)
}

export function getStatsByDay(): Record<string, DailyStats> {
  return store.get('statsByDay')
}

export function addFocusStats(dateKey: string, focusMinutes: number): Record<string, DailyStats> {
  const statsByDay = store.get('statsByDay')
  const current = statsByDay[dateKey] ?? { completedPomodoros: 0, focusMinutes: 0 }

  store.set('statsByDay', {
    ...statsByDay,
    [dateKey]: {
      completedPomodoros: current.completedPomodoros + 1,
      focusMinutes: current.focusMinutes + focusMinutes
    }
  })

  return store.get('statsByDay')
}

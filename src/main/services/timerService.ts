import { addFocusStats, getSettings, getSnapshot, getStatsByDay, setSettings, setSnapshot } from './store'
import { notifyPhaseCompleted } from './notificationService'
import { type DailyStats, type TimerPhase, type TimerSettings, type TimerState, defaultSettings } from '../../shared/types'

const SECOND = 1000
const MINUTE = 60 * SECOND

type StateListener = (state: TimerState) => void

export class TimerService {
  private interval: NodeJS.Timeout | null = null
  private listeners = new Set<StateListener>()
  private settings = sanitizeSettings(getSettings())
  private snapshot = getSnapshot()

  constructor() {
    this.rehydrateSnapshot()
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): TimerState {
    this.refreshRunningSnapshot()
    return this.buildState()
  }

  start(): TimerState {
    this.refreshRunningSnapshot()

    if (this.snapshot.status === 'paused') {
      return this.resume()
    }

    if (this.snapshot.status === 'running') {
      return this.buildState()
    }

    const remainingMs = this.normalizeRemainingMs(this.snapshot.phase, this.snapshot.remainingMs)
    this.snapshot = {
      ...this.snapshot,
      status: 'running',
      remainingMs,
      startedAt: Date.now(),
      endsAt: Date.now() + remainingMs
    }

    this.ensureTicker()
    this.persistAndEmit()
    return this.buildState()
  }

  pause(): TimerState {
    this.refreshRunningSnapshot()

    if (this.snapshot.status !== 'running') {
      return this.buildState()
    }

    this.snapshot = {
      ...this.snapshot,
      status: 'paused',
      startedAt: null,
      endsAt: null
    }

    this.persistAndEmit()
    return this.buildState()
  }

  resume(): TimerState {
    this.refreshRunningSnapshot()

    if (this.snapshot.status !== 'paused') {
      return this.buildState()
    }

    this.snapshot = {
      ...this.snapshot,
      status: 'running',
      startedAt: Date.now(),
      endsAt: Date.now() + this.snapshot.remainingMs
    }

    this.ensureTicker()
    this.persistAndEmit()
    return this.buildState()
  }

  reset(): TimerState {
    this.refreshRunningSnapshot()
    this.snapshot = this.createSnapshot(this.snapshot.phase, 'idle', this.snapshot.completedPomodorosInCycle)
    this.persistAndEmit()
    return this.buildState()
  }

  skip(): TimerState {
    this.refreshRunningSnapshot()
    this.completeCurrentPhase({
      countFocusCompletion: false,
      trackStats: false,
      notify: false,
      completedAt: Date.now()
    })
    return this.buildState()
  }

  updateSettings(nextSettings: TimerSettings): TimerState {
    this.settings = sanitizeSettings(nextSettings)
    setSettings(this.settings)

    if (this.snapshot.status === 'idle') {
      this.snapshot = this.createSnapshot(this.snapshot.phase, 'idle', this.snapshot.completedPomodorosInCycle)
    } else if (this.snapshot.status === 'paused') {
      this.snapshot = {
        ...this.snapshot,
        remainingMs: this.normalizeRemainingMs(this.snapshot.phase, this.snapshot.remainingMs)
      }
    }

    this.persistAndEmit()
    return this.buildState()
  }

  private buildState(): TimerState {
    const statsByDay = getStatsByDay()
    const todayKey = getLocalDateKey(new Date())
    const todayStats = statsByDay[todayKey] ?? emptyStats()
    const recentStats = Object.entries(statsByDay)
      .sort(([left], [right]) => right.localeCompare(left))
      .slice(0, 7)
      .map(([date, stats]) => ({ date, stats }))

    return {
      ...this.snapshot,
      settings: this.settings,
      todayStats,
      recentStats
    }
  }

  private rehydrateSnapshot(): void {
    const snapshot = getSnapshot()
    this.settings = sanitizeSettings(getSettings())

    if (snapshot.status === 'running' && snapshot.endsAt !== null) {
      const remainingMs = snapshot.endsAt - Date.now()

      if (remainingMs > 0) {
        this.snapshot = {
          ...snapshot,
          remainingMs
        }
        setSnapshot(this.snapshot)
        return
      }

      this.snapshot = {
        ...snapshot,
        remainingMs: 0
      }
      this.completeCurrentPhase({
        countFocusCompletion: true,
        trackStats: true,
        notify: false,
        completedAt: snapshot.endsAt
      })
      return
    }

    this.snapshot = {
      ...snapshot,
      remainingMs: this.normalizeRemainingMs(snapshot.phase, snapshot.remainingMs)
    }
    setSnapshot(this.snapshot)
  }

  private ensureTicker(): void {
    if (this.interval) {
      return
    }

    this.interval = setInterval(() => {
      const changedPhase = this.refreshRunningSnapshot()
      if (!changedPhase && this.snapshot.status === 'running') {
        this.emitState()
      }
      this.stopTickerIfIdle()
    }, SECOND)
  }

  private stopTickerIfIdle(): void {
    if (!this.interval || this.snapshot.status === 'running') {
      return
    }

    clearInterval(this.interval)
    this.interval = null
  }

  private refreshRunningSnapshot(): boolean {
    if (this.snapshot.status !== 'running' || this.snapshot.endsAt === null) {
      return false
    }

    const remainingMs = this.snapshot.endsAt - Date.now()
    if (remainingMs > 0) {
      this.snapshot = {
        ...this.snapshot,
        remainingMs
      }
      return false
    }

    this.completeCurrentPhase({
      countFocusCompletion: true,
      trackStats: true,
      notify: true,
      completedAt: this.snapshot.endsAt
    })
    return true
  }

  private completeCurrentPhase(options: {
    countFocusCompletion: boolean
    trackStats: boolean
    notify: boolean
    completedAt: number
  }): void {
    const completedPhase = this.snapshot.phase
    let completedPomodorosInCycle = this.snapshot.completedPomodorosInCycle

    if (completedPhase === 'focus' && options.countFocusCompletion) {
      completedPomodorosInCycle += 1

      if (options.trackStats) {
        addFocusStats(getLocalDateKey(new Date(options.completedAt)), this.settings.focusMinutes)
      }
    }

    const nextPhase = this.getNextPhase(completedPhase, completedPomodorosInCycle)
    const nextCycleCount = completedPhase === 'longBreak' ? 0 : completedPomodorosInCycle

    this.snapshot = this.createSnapshot(nextPhase, 'idle', nextCycleCount)

    if (options.notify) {
      notifyPhaseCompleted(completedPhase)
    }

    this.persistAndEmit()
  }

  private getNextPhase(currentPhase: TimerPhase, completedPomodorosInCycle: number): TimerPhase {
    if (currentPhase === 'focus') {
      return completedPomodorosInCycle > 0 && completedPomodorosInCycle % this.settings.longBreakInterval === 0
        ? 'longBreak'
        : 'shortBreak'
    }

    return 'focus'
  }

  private getPhaseDurationMs(phase: TimerPhase): number {
    switch (phase) {
      case 'focus':
        return this.settings.focusMinutes * MINUTE
      case 'shortBreak':
        return this.settings.shortBreakMinutes * MINUTE
      case 'longBreak':
        return this.settings.longBreakMinutes * MINUTE
    }
  }

  private normalizeRemainingMs(phase: TimerPhase, remainingMs: number): number {
    const phaseDurationMs = this.getPhaseDurationMs(phase)
    if (remainingMs <= 0) {
      return phaseDurationMs
    }

    return Math.min(remainingMs, phaseDurationMs)
  }

  private createSnapshot(phase: TimerPhase, status: 'idle' | 'running' | 'paused', completedPomodorosInCycle: number) {
    const remainingMs = this.getPhaseDurationMs(phase)

    if (status === 'running') {
      return {
        phase,
        status,
        remainingMs,
        startedAt: Date.now(),
        endsAt: Date.now() + remainingMs,
        completedPomodorosInCycle
      }
    }

    return {
      phase,
      status,
      remainingMs,
      startedAt: null,
      endsAt: null,
      completedPomodorosInCycle
    }
  }

  private persistAndEmit(): void {
    setSnapshot(this.snapshot)
    this.emitState()
    this.stopTickerIfIdle()
  }

  private emitState(): void {
    const state = this.buildState()
    for (const listener of this.listeners) {
      listener(state)
    }
  }
}

function sanitizeSettings(settings: TimerSettings): TimerSettings {
  return {
    focusMinutes: clampInteger(settings.focusMinutes, 1, 180, defaultSettings.focusMinutes),
    shortBreakMinutes: clampInteger(settings.shortBreakMinutes, 1, 60, defaultSettings.shortBreakMinutes),
    longBreakMinutes: clampInteger(settings.longBreakMinutes, 1, 120, defaultSettings.longBreakMinutes),
    longBreakInterval: clampInteger(settings.longBreakInterval, 2, 12, defaultSettings.longBreakInterval)
  }
}

function clampInteger(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Math.round(value)))
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function emptyStats(): DailyStats {
  return {
    completedPomodoros: 0,
    focusMinutes: 0
  }
}

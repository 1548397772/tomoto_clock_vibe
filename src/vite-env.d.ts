import type { PomodoroApi } from './src/shared/types'

declare global {
  interface Window {
    pomodoro: PomodoroApi
  }
}

export {}

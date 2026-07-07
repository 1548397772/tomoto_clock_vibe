import { useEffect, useState } from 'react'
import type { TimerState } from '@shared/types'
import { TimerCard } from './components/TimerCard'
import { SettingsPanel } from './components/SettingsPanel'
import { StatsPanel } from './components/StatsPanel'

export default function App() {
  const [state, setState] = useState<TimerState | null>(null)

  useEffect(() => {
    let mounted = true

    void window.pomodoro.getState().then((nextState: TimerState) => {
      if (mounted) {
        setState(nextState)
      }
    })

    const unsubscribe = window.pomodoro.onStateChange((nextState: TimerState) => {
      setState(nextState)
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  if (!state) {
    return <main className="app-shell loading-shell">正在加载番茄钟…</main>
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <span className="app-kicker">温暖 · 柔和 · 简洁</span>
        <h1>Tomoto Clock</h1>
        <p>极简桌面番茄钟，支持托盘常驻、桌面提醒和本地统计。</p>
      </header>

      <TimerCard
        state={state}
        onStart={() => void window.pomodoro.start()}
        onPause={() => void window.pomodoro.pause()}
        onResume={() => void window.pomodoro.resume()}
        onReset={() => void window.pomodoro.reset()}
        onSkip={() => void window.pomodoro.skip()}
      />

      <div className="detail-grid">
        <SettingsPanel
          settings={state.settings}
          onSave={async settings => {
            await window.pomodoro.updateSettings(settings)
          }}
        />

        <StatsPanel state={state} />
      </div>
    </main>
  )
}

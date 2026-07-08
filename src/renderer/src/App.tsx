import { useEffect, useState } from 'react'
import type { TimerPhase, TimerState, TimerStatus } from '@shared/types'
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

  const todayProgress = getTodayProgress(state)

  return (
    <main className="app-shell">
      <header className="panel panel--header app-header">
        <div className="app-header__text">
          <span className="app-kicker">桌面专注仪表盘</span>
          <h1>Tomoto Clock</h1>
          <p>把当前专注、今日进展和接下来要做的事收在同一个窗口里。</p>
        </div>
        <div className="app-header__meta">
          <span className="meta-pill">{getPhaseHeadline(state.phase)}</span>
          <span className="meta-pill meta-pill--muted">{getStatusHeadline(state.status)}</span>
        </div>
      </header>

      <section className="hero-grid">
        <TimerCard
          state={state}
          onStart={() => void window.pomodoro.start()}
          onPause={() => void window.pomodoro.pause()}
          onResume={() => void window.pomodoro.resume()}
          onReset={() => void window.pomodoro.reset()}
          onSkip={() => void window.pomodoro.skip()}
        />

        <section className="panel dashboard-summary">
          <div className="section-header section-header--compact">
            <div>
              <h2>今日进展</h2>
              <p className="subtle-text">快速确认今天已经推进了多少，再继续下一轮。</p>
            </div>
          </div>

          <div className="summary-grid">
            <article className="summary-card summary-card--accent">
              <span className="summary-card__label">完成番茄</span>
              <strong>{state.todayStats.completedPomodoros}</strong>
              <small>次专注回合</small>
            </article>
            <article className="summary-card">
              <span className="summary-card__label">专注时间</span>
              <strong>{state.todayStats.focusMinutes}</strong>
              <small>分钟累计</small>
            </article>
          </div>

          <article className="progress-card">
            <div className="progress-card__header">
              <span>长休息进度</span>
              <strong>
                {todayProgress.completedInCycle}/{state.settings.longBreakInterval}
              </strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span className="progress-track__fill" style={{ width: `${todayProgress.progressPercent}%` }} />
            </div>
            <p className="subtle-text">{todayProgress.message}</p>
          </article>
        </section>
      </section>

      <div className="detail-grid">
        <StatsPanel state={state} />
        <SettingsPanel
          settings={state.settings}
          onSave={async settings => {
            await window.pomodoro.updateSettings(settings)
          }}
        />
      </div>
    </main>
  )
}

function getPhaseHeadline(phase: TimerPhase) {
  switch (phase) {
    case 'focus':
      return '当前是专注阶段'
    case 'shortBreak':
      return '当前是短休息阶段'
    case 'longBreak':
      return '当前是长休息阶段'
  }
}

function getStatusHeadline(status: TimerStatus) {
  switch (status) {
    case 'idle':
      return '准备开始'
    case 'running':
      return '后台计时中'
    case 'paused':
      return '已暂停'
  }
}

function getTodayProgress(state: TimerState) {
  const completedInCycle = Math.min(state.completedPomodorosInCycle, state.settings.longBreakInterval)
  const progressPercent = Math.min((completedInCycle / state.settings.longBreakInterval) * 100, 100)
  const remaining = Math.max(state.settings.longBreakInterval - completedInCycle, 0)

  let message = '本轮节奏已经到达长休息节点。'
  if (state.phase === 'longBreak') {
    message = '当前就在长休息阶段，休整后会回到下一轮专注。'
  } else if (remaining === 1) {
    message = '再完成 1 个番茄，就能进入长休息。'
  } else if (remaining > 1) {
    message = `再完成 ${remaining} 个番茄，就能进入长休息。`
  }

  return {
    completedInCycle,
    progressPercent,
    message
  }
}

import type { TimerPhase, TimerState, TimerStatus } from '@shared/types'

interface TimerCardProps {
  state: TimerState
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onSkip: () => void
}

export function TimerCard({ state, onStart, onPause, onResume, onReset, onSkip }: TimerCardProps) {
  return (
    <section className="panel panel--hero timer-card">
      <div className="timer-card__topline">
        <div className="phase-badge phase-badge--accent">{getPhaseLabel(state.phase)}</div>
        <span className={`status-dot status-dot--${state.status}`}>{getStatusLabel(state.status)}</span>
      </div>

      <div className="timer-card__body">
        <div className="timer-overline">本轮剩余时间</div>
        <div className="timer-value">{formatDuration(state.remainingMs)}</div>
        <div className="timer-status">{getStatusDescription(state.status)}</div>
      </div>

      <div className="button-row button-row--primary">
        {renderPrimaryButton(state.status, { onStart, onPause, onResume })}
        <button className="secondary-button" onClick={onReset}>
          重置
        </button>
      </div>

      <div className="button-row button-row--secondary">
        <button className="ghost-button ghost-button--wide" onClick={onSkip}>
          跳过当前阶段
        </button>
      </div>
    </section>
  )
}

function renderPrimaryButton(
  status: TimerStatus,
  actions: { onStart: () => void; onPause: () => void; onResume: () => void }
) {
  if (status === 'running') {
    return (
      <button className="primary-button primary-button--hero" onClick={actions.onPause}>
        暂停专注
      </button>
    )
  }

  if (status === 'paused') {
    return (
      <button className="primary-button primary-button--hero" onClick={actions.onResume}>
        继续本轮
      </button>
    )
  }

  return (
    <button className="primary-button primary-button--hero" onClick={actions.onStart}>
      开始专注
    </button>
  )
}

function getPhaseLabel(phase: TimerPhase) {
  switch (phase) {
    case 'focus':
      return '专注中'
    case 'shortBreak':
      return '短休息'
    case 'longBreak':
      return '长休息'
  }
}

function getStatusLabel(status: TimerStatus) {
  switch (status) {
    case 'idle':
      return '待开始'
    case 'running':
      return '进行中'
    case 'paused':
      return '已暂停'
  }
}

function getStatusDescription(status: TimerStatus) {
  switch (status) {
    case 'idle':
      return '准备好后直接开始，本轮会自动进入后台计时。'
    case 'running':
      return '当前正在计时，关闭窗口后也会继续推进。'
    case 'paused':
      return '时间已停住，可以继续本轮或重新开始。'
  }
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

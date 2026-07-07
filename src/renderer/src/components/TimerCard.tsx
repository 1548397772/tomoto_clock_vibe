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
    <section className="panel timer-card">
      <div className="phase-badge phase-badge--accent">{getPhaseLabel(state.phase)}</div>
      <div className="timer-value">{formatDuration(state.remainingMs)}</div>
      <div className="timer-status">{getStatusLabel(state.status)}</div>
      <div className="button-row">
        {renderPrimaryButton(state.status, { onStart, onPause, onResume })}
        <button className="secondary-button" onClick={onReset}>
          重置
        </button>
        <button className="ghost-button" onClick={onSkip}>
          跳过阶段
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
      <button className="primary-button" onClick={actions.onPause}>
        暂停
      </button>
    )
  }

  if (status === 'paused') {
    return (
      <button className="primary-button" onClick={actions.onResume}>
        继续
      </button>
    )
  }

  return (
    <button className="primary-button" onClick={actions.onStart}>
      开始
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
      return '准备开始'
    case 'running':
      return '进行中'
    case 'paused':
      return '已暂停'
  }
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

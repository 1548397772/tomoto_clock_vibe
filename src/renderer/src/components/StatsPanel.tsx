import type { TimerState } from '@shared/types'

interface StatsPanelProps {
  state: TimerState
}

export function StatsPanel({ state }: StatsPanelProps) {
  return (
    <section className="panel">
      <div className="section-header">
        <h2>统计</h2>
        <span className="subtle-text">最近 7 天</span>
      </div>
      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-label">今日番茄</span>
          <strong>{state.todayStats.completedPomodoros}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">今日专注分钟</span>
          <strong>{state.todayStats.focusMinutes}</strong>
        </div>
      </div>
      <div className="stats-list">
        {state.recentStats.length === 0 ? (
          <div className="empty-state">今天开始你的第一个番茄钟吧。</div>
        ) : (
          state.recentStats.map(({ date, stats }) => (
            <div className="stats-row" key={date}>
              <span>{date}</span>
              <span>
                {stats.completedPomodoros} 个番茄 · {stats.focusMinutes} 分钟
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

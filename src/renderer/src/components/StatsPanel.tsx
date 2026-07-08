import type { TimerState } from '@shared/types'

interface StatsPanelProps {
  state: TimerState
}

export function StatsPanel({ state }: StatsPanelProps) {
  return (
    <section className="panel panel--soft">
      <div className="section-header">
        <div>
          <h2>统计面板</h2>
          <p className="subtle-text">今天的累计表现，以及最近 7 天的专注记录。</p>
        </div>
        <span className="subtle-text">最近 7 天</span>
      </div>

      <div className="stats-summary stats-summary--dashboard">
        <div className="stat-card stat-card--dashboard">
          <span className="stat-label">今日番茄</span>
          <strong>{state.todayStats.completedPomodoros}</strong>
          <small>完成轮次</small>
        </div>
        <div className="stat-card stat-card--dashboard stat-card--muted">
          <span className="stat-label">今日专注分钟</span>
          <strong>{state.todayStats.focusMinutes}</strong>
          <small>累计时长</small>
        </div>
      </div>

      <div className="stats-list stats-list--dashboard">
        {state.recentStats.length === 0 ? (
          <div className="empty-state empty-state--dashboard">今天开始你的第一个番茄钟吧。</div>
        ) : (
          state.recentStats.map(({ date, stats }) => (
            <article className="stats-row stats-row--dashboard" key={date}>
              <div className="stats-row__date">
                <span>{date}</span>
                <small>专注记录</small>
              </div>
              <div className="stats-row__value">
                <strong>{stats.completedPomodoros}</strong>
                <span>{stats.focusMinutes} 分钟</span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import type { TimerSettings } from '@shared/types'

interface SettingsPanelProps {
  settings: TimerSettings
  onSave: (settings: TimerSettings) => Promise<void>
}

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    setDraft(settings)
  }, [settings.focusMinutes, settings.shortBreakMinutes, settings.longBreakMinutes, settings.longBreakInterval])

  const changed = useMemo(
    () =>
      draft.focusMinutes !== settings.focusMinutes ||
      draft.shortBreakMinutes !== settings.shortBreakMinutes ||
      draft.longBreakMinutes !== settings.longBreakMinutes ||
      draft.longBreakInterval !== settings.longBreakInterval,
    [draft, settings]
  )

  return (
    <section className="panel panel--soft">
      <div className="section-header">
        <div>
          <h2>节奏设置</h2>
          <p className="subtle-text">调整每一轮专注与休息时长，保存后会立即生效。</p>
        </div>
        <button className="ghost-button" onClick={() => setDraft(settings)} disabled={!changed}>
          还原
        </button>
      </div>

      <div className="settings-grid settings-grid--dashboard">
        <label className="setting-card">
          <span className="setting-card__label">专注分钟</span>
          <input
            type="number"
            min={1}
            max={180}
            value={draft.focusMinutes}
            onChange={event => setDraft({ ...draft, focusMinutes: Number(event.target.value) })}
          />
          <small className="setting-card__hint">建议保持 20–50 分钟。</small>
        </label>
        <label className="setting-card">
          <span className="setting-card__label">短休息分钟</span>
          <input
            type="number"
            min={1}
            max={60}
            value={draft.shortBreakMinutes}
            onChange={event => setDraft({ ...draft, shortBreakMinutes: Number(event.target.value) })}
          />
          <small className="setting-card__hint">适合快速恢复专注节奏。</small>
        </label>
        <label className="setting-card">
          <span className="setting-card__label">长休息分钟</span>
          <input
            type="number"
            min={1}
            max={120}
            value={draft.longBreakMinutes}
            onChange={event => setDraft({ ...draft, longBreakMinutes: Number(event.target.value) })}
          />
          <small className="setting-card__hint">给连续专注后的完整休整。</small>
        </label>
        <label className="setting-card">
          <span className="setting-card__label">长休息频率</span>
          <input
            type="number"
            min={2}
            max={12}
            value={draft.longBreakInterval}
            onChange={event => setDraft({ ...draft, longBreakInterval: Number(event.target.value) })}
          />
          <small className="setting-card__hint">完成几个番茄后进入长休息。</small>
        </label>
      </div>

      <div className="settings-actions">
        <div className={`settings-indicator${changed ? ' settings-indicator--active' : ''}`}>
          {changed ? '检测到未保存改动' : '当前设置已同步'}
        </div>
        <button className="primary-button primary-button--full" onClick={() => void onSave(draft)} disabled={!changed}>
          保存设置
        </button>
      </div>
    </section>
  )
}

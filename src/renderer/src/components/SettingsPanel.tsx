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
    <section className="panel">
      <div className="section-header">
        <h2>设置</h2>
        <button className="ghost-button" onClick={() => setDraft(settings)} disabled={!changed}>
          还原
        </button>
      </div>
      <div className="settings-grid">
        <label>
          <span>专注分钟</span>
          <input
            type="number"
            min={1}
            max={180}
            value={draft.focusMinutes}
            onChange={event => setDraft({ ...draft, focusMinutes: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>短休息分钟</span>
          <input
            type="number"
            min={1}
            max={60}
            value={draft.shortBreakMinutes}
            onChange={event => setDraft({ ...draft, shortBreakMinutes: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>长休息分钟</span>
          <input
            type="number"
            min={1}
            max={120}
            value={draft.longBreakMinutes}
            onChange={event => setDraft({ ...draft, longBreakMinutes: Number(event.target.value) })}
          />
        </label>
        <label>
          <span>几个番茄后长休息</span>
          <input
            type="number"
            min={2}
            max={12}
            value={draft.longBreakInterval}
            onChange={event => setDraft({ ...draft, longBreakInterval: Number(event.target.value) })}
          />
        </label>
      </div>
      <button className="primary-button primary-button--full" onClick={() => void onSave(draft)} disabled={!changed}>
        保存设置
      </button>
    </section>
  )
}

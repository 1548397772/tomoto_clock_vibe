import { Menu, Tray, type BrowserWindow, nativeImage } from 'electron'
import type { TimerState } from '../../shared/types'

export class TrayService {
  private tray: Tray | null = null
  private state: TimerState | null = null

  constructor(private readonly onCommand: {
    showWindow: () => void
    start: () => void
    pause: () => void
    resume: () => void
    reset: () => void
    quit: () => void
  }) {}

  init(window: BrowserWindow): void {
    if (this.tray) {
      return
    }

    this.tray = new Tray(createTrayIcon())
    this.tray.setToolTip('Tomoto Clock')
    this.tray.on('double-click', () => this.onCommand.showWindow())
    this.tray.on('click', () => this.onCommand.showWindow())
    this.renderMenu(window)
  }

  update(state: TimerState, window: BrowserWindow): void {
    this.state = state

    if (!this.tray) {
      this.init(window)
    }

    this.tray?.setToolTip(this.getTooltip(state))
    this.renderMenu(window)
  }

  private renderMenu(window: BrowserWindow): void {
    if (!this.tray) {
      return
    }

    const state = this.state
    const statusLabel = state ? `${this.getPhaseName(state)} · ${formatDuration(state.remainingMs)}` : '未开始'
    const isRunning = state?.status === 'running'
    const isPaused = state?.status === 'paused'

    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: statusLabel, enabled: false },
        { type: 'separator' },
        { label: '显示窗口', click: () => this.onCommand.showWindow() },
        { label: '开始', enabled: !isRunning, click: () => this.onCommand.start() },
        { label: '暂停', enabled: isRunning, click: () => this.onCommand.pause() },
        { label: '继续', enabled: isPaused, click: () => this.onCommand.resume() },
        { label: '重置', click: () => this.onCommand.reset() },
        {
          label: window.isVisible() ? '隐藏窗口' : '显示窗口',
          click: () => {
            if (window.isVisible()) {
              window.hide()
            } else {
              this.onCommand.showWindow()
            }
          }
        },
        { type: 'separator' },
        { label: '退出', click: () => this.onCommand.quit() }
      ])
    )
  }

  private getTooltip(state: TimerState): string {
    return `Tomoto Clock\n${this.getPhaseName(state)} · ${formatDuration(state.remainingMs)}`
  }

  private getPhaseName(state: TimerState): string {
    switch (state.phase) {
      case 'focus':
        return '专注'
      case 'shortBreak':
        return '短休息'
      case 'longBreak':
        return '长休息'
    }
  }
}

function createTrayIcon() {
  const image = nativeImage.createFromDataURL(
    'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="17" r="11" fill="#ef4444" />
          <rect x="13" y="4" width="6" height="5" rx="2" fill="#14532d" />
          <path d="M11 6c1.5-2 4-3 6-3 2.5 0 4.5 1 6 3" fill="none" stroke="#166534" stroke-width="2" stroke-linecap="round" />
          <circle cx="16" cy="17" r="6" fill="#fff7ed" />
        </svg>
      `)
  )

  image.setTemplateImage(true)
  return image
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

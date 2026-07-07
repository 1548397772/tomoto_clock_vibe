import { Notification, shell } from 'electron'
import type { TimerPhase } from '../../shared/types'

function getPhaseLabel(phase: TimerPhase): string {
  switch (phase) {
    case 'focus':
      return '专注时间结束'
    case 'shortBreak':
      return '短休息结束'
    case 'longBreak':
      return '长休息结束'
  }
}

function getBody(phase: TimerPhase): string {
  switch (phase) {
    case 'focus':
      return '休息一下，再回来继续。'
    case 'shortBreak':
    case 'longBreak':
      return '准备开始下一轮专注。'
  }
}

export function notifyPhaseCompleted(phase: TimerPhase): void {
  if (Notification.isSupported()) {
    new Notification({
      title: getPhaseLabel(phase),
      body: getBody(phase),
      silent: false
    }).show()
  }

  shell.beep()
}

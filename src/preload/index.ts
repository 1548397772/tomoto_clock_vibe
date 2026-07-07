import { contextBridge, ipcRenderer } from 'electron'
import type { PomodoroApi, TimerSettings } from '../shared/types'

const api: PomodoroApi = {
  getState: () => ipcRenderer.invoke('timer:getState'),
  start: () => ipcRenderer.invoke('timer:start'),
  pause: () => ipcRenderer.invoke('timer:pause'),
  resume: () => ipcRenderer.invoke('timer:resume'),
  reset: () => ipcRenderer.invoke('timer:reset'),
  skip: () => ipcRenderer.invoke('timer:skip'),
  updateSettings: (settings: TimerSettings) => ipcRenderer.invoke('timer:updateSettings', settings),
  onStateChange: callback => {
    const listener = (_event: Electron.IpcRendererEvent, state: Awaited<ReturnType<PomodoroApi['getState']>>) => {
      callback(state)
    }

    ipcRenderer.on('timer:state', listener)
    return () => {
      ipcRenderer.removeListener('timer:state', listener)
    }
  }
}

contextBridge.exposeInMainWorld('pomodoro', api)

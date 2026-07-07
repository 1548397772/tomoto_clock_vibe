import { ipcMain } from 'electron'
import { TimerService } from './services/timerService'

export function registerIpcHandlers(timerService: TimerService): void {
  ipcMain.handle('timer:getState', () => timerService.getState())
  ipcMain.handle('timer:start', () => timerService.start())
  ipcMain.handle('timer:pause', () => timerService.pause())
  ipcMain.handle('timer:resume', () => timerService.resume())
  ipcMain.handle('timer:reset', () => timerService.reset())
  ipcMain.handle('timer:skip', () => timerService.skip())
  ipcMain.handle('timer:updateSettings', (_event, settings) => timerService.updateSettings(settings))
}

import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers } from './ipc'
import { TimerService } from './services/timerService'
import { TrayService } from './services/trayService'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

const timerService = new TimerService()
const trayService = new TrayService({
  showWindow: () => {
    if (!mainWindow) {
      return
    }

    if (!mainWindow.isVisible()) {
      mainWindow.show()
    }

    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }

    mainWindow.focus()
  },
  start: () => {
    timerService.start()
  },
  pause: () => {
    timerService.pause()
  },
  resume: () => {
    timerService.resume()
  },
  reset: () => {
    timerService.reset()
  },
  quit: () => {
    isQuitting = true
    app.quit()
  }
})

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 420,
    height: 560,
    minWidth: 380,
    minHeight: 520,
    show: false,
    title: 'Tomoto Clock',
    backgroundColor: '#f6efe7',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  window.on('close', event => {
    if (isQuitting) {
      return
    }

    event.preventDefault()
    window.hide()
  })

  window.once('ready-to-show', () => {
    window.show()
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

app.whenReady().then(() => {
  registerIpcHandlers(timerService)

  mainWindow = createWindow()
  const unsubscribe = timerService.subscribe(state => {
    if (!mainWindow) {
      return
    }

    mainWindow.webContents.send('timer:state', state)
    trayService.update(state, mainWindow)
  })

  app.on('before-quit', () => {
    isQuitting = true
    unsubscribe()
  })

  trayService.init(mainWindow)
  trayService.update(timerService.getState(), mainWindow)

  app.on('activate', () => {
    if (!mainWindow) {
      mainWindow = createWindow()
      trayService.init(mainWindow)
    }

    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      mainWindow.focus()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    return
  }
})

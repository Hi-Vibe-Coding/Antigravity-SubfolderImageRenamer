import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const currentDir = path.dirname(fileURLToPath(import.meta.url))

process.env.DIST = path.join(currentDir, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    title: '子文件夹图片自动化命名工具',
    width: 1080,
    height: 760,
    minWidth: 860,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC || '', 'icon.ico'),
    webPreferences: {
      preload: path.join(currentDir, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC Handlers
ipcMain.handle('dialog:select-folders', async () => {
  if (!win) return []
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'multiSelections'],
    title: '选择子文件夹'
  })
  if (result.canceled) {
    return []
  }
  return result.filePaths
})

ipcMain.handle('path:verify-folders', async (_event, paths: string[]) => {
  const verified: { path: string; name: string }[] = []
  for (const p of paths) {
    try {
      const stat = await fs.promises.stat(p)
      if (stat.isDirectory()) {
        verified.push({
          path: p,
          name: path.basename(p)
        })
      }
    } catch (e) {
      // ignore invalid paths
    }
  }
  return verified
})

const SUPPORTED_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

export interface ScanItem {
  id: string
  folderPath: string
  folderName: string
  fileName: string
  fileExt: string
  filePath: string
  isPureNumber: boolean
  targetName: string
  targetPath: string
  checked: boolean
  status: 'pending' | 'success' | 'error' | 'skipped'
  errorMsg?: string
}

ipcMain.handle('scanner:scan-subfolders', async (_event, folderPaths: string[]) => {
  const results: ScanItem[] = []

  for (const folderPath of folderPaths) {
    try {
      const folderStat = await fs.promises.stat(folderPath)
      if (!folderStat.isDirectory()) continue

      const folderName = path.basename(folderPath)
      const entries = await fs.promises.readdir(folderPath, { withFileTypes: true })

      for (const entry of entries) {
        if (!entry.isFile()) continue

        const ext = path.extname(entry.name).toLowerCase()
        if (!SUPPORTED_EXTS.has(ext)) continue

        const baseName = path.basename(entry.name, path.extname(entry.name))
        const isPureNumber = /^\d+$/.test(baseName)
        const filePath = path.join(folderPath, entry.name)

        let targetName = entry.name
        let targetPath = filePath

        if (isPureNumber) {
          targetName = `${folderName}__${entry.name}`
          targetPath = path.join(folderPath, targetName)
        }

        results.push({
          id: `${folderPath}::${entry.name}`,
          folderPath,
          folderName,
          fileName: entry.name,
          fileExt: ext,
          filePath,
          isPureNumber,
          targetName,
          targetPath,
          checked: isPureNumber, // 符合纯数字默认勾选
          status: 'pending'
        })
      }
    } catch (err: any) {
      console.error(`Error scanning folder ${folderPath}:`, err)
    }
  }

  return results
})

ipcMain.handle('scanner:execute-rename', async (event, items: ScanItem[]) => {
  const total = items.length
  let current = 0
  const results: ScanItem[] = []

  for (const item of items) {
    current++
    if (!item.checked || !item.isPureNumber) {
      results.push({ ...item, status: 'skipped' })
      event.sender.send('rename-progress', { current, total, item: { ...item, status: 'skipped' } })
      continue
    }

    // 检查原文件是否存在
    if (!fs.existsSync(item.filePath)) {
      const errItem = { ...item, status: 'error' as const, errorMsg: '原文件不存在' }
      results.push(errItem)
      event.sender.send('rename-progress', { current, total, item: errItem })
      continue
    }

    // 检查目标文件是否已存在（避免覆盖已有文件）
    if (fs.existsSync(item.targetPath) && item.filePath.toLowerCase() !== item.targetPath.toLowerCase()) {
      const errItem = { ...item, status: 'error' as const, errorMsg: '目标文件名已存在' }
      results.push(errItem)
      event.sender.send('rename-progress', { current, total, item: errItem })
      continue
    }

    try {
      await fs.promises.rename(item.filePath, item.targetPath)
      const successItem = { ...item, status: 'success' as const }
      results.push(successItem)
      event.sender.send('rename-progress', { current, total, item: successItem })
    } catch (err: any) {
      const errItem = { ...item, status: 'error' as const, errorMsg: err.message || '重命名失败' }
      results.push(errItem)
      event.sender.send('rename-progress', { current, total, item: errItem })
    }
  }

  return results
})

ipcMain.handle('shell:open-path', async (_event, filePath: string) => {
  if (fs.existsSync(filePath)) {
    shell.showItemInFolder(filePath)
    return true
  }
  return false
})

app.whenReady().then(createWindow)

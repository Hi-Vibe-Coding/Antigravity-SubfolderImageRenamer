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
    title: 'Antigravity-SubfolderImageRenamer(v0.0.1)',
    width: 1080,
    height: 760,
    minWidth: 860,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC || '', 'icon.ico'),
    webPreferences: {
      preload: path.join(currentDir, 'preload.cjs'),
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

  // 阻止 Electron 窗口因拖拽文件而意外导航或弹出新窗口
  win.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })
  win.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }
  })
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

// 模式2：父文件夹扫描（如 Bracelet 下有 B0-001, B0-002，扫描这些子文件夹第一层图片）
ipcMain.handle('scanner:scan-parentfolders', async (_event, parentFolderPaths: string[]) => {
  const results: ScanItem[] = []

  for (const parentPath of parentFolderPaths) {
    try {
      const parentStat = await fs.promises.stat(parentPath)
      if (!parentStat.isDirectory()) continue

      // 读取父文件夹下的所有子文件夹（如 B0-001, B0-002...）
      const subEntries = await fs.promises.readdir(parentPath, { withFileTypes: true })

      for (const subEntry of subEntries) {
        if (!subEntry.isDirectory()) continue

        const subFolderPath = path.join(parentPath, subEntry.name)
        const subFolderName = subEntry.name

        try {
          const files = await fs.promises.readdir(subFolderPath, { withFileTypes: true })
          for (const fileEntry of files) {
            if (!fileEntry.isFile()) continue

            const ext = path.extname(fileEntry.name).toLowerCase()
            if (!SUPPORTED_EXTS.has(ext)) continue

            const baseName = path.basename(fileEntry.name, path.extname(fileEntry.name))
            const isPureNumber = /^\d+$/.test(baseName)
            const filePath = path.join(subFolderPath, fileEntry.name)

            let targetName = fileEntry.name
            let targetPath = filePath

            if (isPureNumber) {
              // 关键：以所属直接子文件夹名（如 B0-001）为前缀
              targetName = `${subFolderName}__${fileEntry.name}`
              targetPath = path.join(subFolderPath, targetName)
            }

            results.push({
              id: `${subFolderPath}::${fileEntry.name}`,
              folderPath: subFolderPath,
              folderName: subFolderName, // 显示直接子文件夹名称（例如 B0-001）
              fileName: fileEntry.name,
              fileExt: ext,
              filePath,
              isPureNumber,
              targetName,
              targetPath,
              checked: isPureNumber,
              status: 'pending'
            })
          }
        } catch (subErr) {
          console.error(`Error scanning subfolder ${subFolderPath}:`, subErr)
        }
      }
    } catch (err: any) {
      console.error(`Error scanning parent folder ${parentPath}:`, err)
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

import { contextBridge, ipcRenderer, webUtils } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolders: () => ipcRenderer.invoke('dialog:select-folders'),
  verifyFolderPaths: (paths: string[]) => ipcRenderer.invoke('path:verify-folders', paths),
  scanSubfolders: (folderPaths: string[]) => ipcRenderer.invoke('scanner:scan-subfolders', folderPaths),
  scanParentfolders: (parentFolderPaths: string[]) => ipcRenderer.invoke('scanner:scan-parentfolders', parentFolderPaths),
  executeRename: (items: any[]) => {
    // 剥离 Vue 响应式 Proxy 对象，防止 Structured Clone Algorithm 抛出克隆异常
    const plain = JSON.parse(JSON.stringify(items))
    return ipcRenderer.invoke('scanner:execute-rename', plain)
  },
  onRenameProgress: (callback: (progress: { current: number; total: number; item: any }) => void) => {
    const subscription = (_event: any, value: any) => callback(value)
    ipcRenderer.on('rename-progress', subscription)
    return () => ipcRenderer.removeListener('rename-progress', subscription)
  },
  openPathInExplorer: (filePath: string) => ipcRenderer.invoke('shell:open-path', filePath),
  getPathForFile: (file: File) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file)
      }
    } catch (e) {
      // fallback
    }
    return (file as any).path || ''
  }
})

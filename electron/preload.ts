import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolders: () => ipcRenderer.invoke('dialog:select-folders'),
  verifyFolderPaths: (paths: string[]) => ipcRenderer.invoke('path:verify-folders', paths),
  scanSubfolders: (folderPaths: string[]) => ipcRenderer.invoke('scanner:scan-subfolders', folderPaths),
  executeRename: (items: any[]) => ipcRenderer.invoke('scanner:execute-rename', items),
  onRenameProgress: (callback: (progress: { current: number; total: number; item: any }) => void) => {
    const subscription = (_event: any, value: any) => callback(value)
    ipcRenderer.on('rename-progress', subscription)
    return () => ipcRenderer.removeListener('rename-progress', subscription)
  },
  openPathInExplorer: (filePath: string) => ipcRenderer.invoke('shell:open-path', filePath)
})

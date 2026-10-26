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

export interface FolderItem {
  id: string
  path: string
  name: string
}

export interface ElectronAPI {
  selectFolders: () => Promise<string[]>
  verifyFolderPaths: (paths: string[]) => Promise<{ path: string; name: string }[]>
  scanSubfolders: (folderPaths: string[]) => Promise<ScanItem[]>
  scanParentfolders: (parentFolderPaths: string[]) => Promise<ScanItem[]>
  executeRename: (items: ScanItem[]) => Promise<ScanItem[]>
  onRenameProgress: (callback: (progress: { current: number; total: number; item: ScanItem }) => void) => () => void
  openPathInExplorer: (filePath: string) => Promise<boolean>
  getPathForFile: (file: File) => string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

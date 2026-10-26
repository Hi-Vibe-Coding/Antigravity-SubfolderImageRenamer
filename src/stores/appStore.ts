import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FolderItem, ScanItem } from '../types/electron'
import { ElMessage } from 'element-plus'

export type OperationMode = 'subfolder' | 'parentfolder'

export const useAppStore = defineStore('app', () => {
  const currentMode = ref<OperationMode>('subfolder')
  const folders = ref<FolderItem[]>([])
  const isScanning = ref(false)
  const hasScanned = ref(false)
  const scanResults = ref<ScanItem[]>([])
  const isRenaming = ref(false)
  const hasRenamed = ref(false)
  const renameProgress = ref({ current: 0, total: 0, percent: 0 })
  const renameSummary = ref({ success: 0, error: 0, skipped: 0 })

  // 模式文本映射
  const modeLabels: Record<OperationMode, string> = {
    subfolder: '模式1：子文件夹模式',
    parentfolder: '模式2：父文件夹模式'
  }

  const currentModeLabel = computed(() => modeLabels[currentMode.value])

  // 待处理（符合纯数字命名）的文件项数量
  const eligibleItems = computed(() => scanResults.value.filter(item => item.isPureNumber))
  // 选中的待处理项
  const selectedEligibleItems = computed(() => eligibleItems.value.filter(item => item.checked))

  // 添加文件夹（去重）
  async function addFolders(paths: string[]) {
    if (isScanning.value || hasScanned.value) {
      ElMessage.warning('当前已开始扫描或已完成扫描，如需添加新文件夹请先重置')
      return
    }

    if (!paths || paths.length === 0) return

    const verified = await window.electronAPI.verifyFolderPaths(paths)
    if (verified.length === 0) {
      ElMessage.warning('未检测到有效的文件夹')
      return
    }

    let addedCount = 0
    for (const item of verified) {
      const exists = folders.value.some(f => f.path.toLowerCase() === item.path.toLowerCase())
      if (!exists) {
        folders.value.push({
          id: item.path,
          path: item.path,
          name: item.name
        })
        addedCount++
      }
    }

    if (addedCount > 0) {
      ElMessage.success(`成功添加 ${addedCount} 个文件夹`)
    } else {
      ElMessage.info('所选文件夹已在列表中')
    }
  }

  // 移除单个文件夹
  function removeFolder(id: string) {
    if (hasScanned.value) return
    folders.value = folders.value.filter(f => f.id !== id)
  }

  // 开始扫描
  async function startScan() {
    if (folders.value.length === 0) {
      ElMessage.warning(currentMode.value === 'subfolder' ? '请先添加至少一个子文件夹' : '请先添加至少一个父文件夹')
      return
    }

    isScanning.value = true
    try {
      const folderPaths = folders.value.map(f => f.path)
      let results: ScanItem[] = []
      if (currentMode.value === 'subfolder') {
        results = await window.electronAPI.scanSubfolders(folderPaths)
      } else {
        results = await window.electronAPI.scanParentfolders(folderPaths)
      }

      scanResults.value = results
      hasScanned.value = true

      const matchCount = results.filter(r => r.isPureNumber).length
      ElMessage.success(`扫描完成！共发现 ${results.length} 个图片文件，其中 ${matchCount} 个符合纯数字改名条件`)
    } catch (err: any) {
      ElMessage.error(`扫描失败：${err.message || '未知错误'}`)
    } finally {
      isScanning.value = false
    }
  }

  // 开始重命名
  async function startRename() {
    const targets = selectedEligibleItems.value
    if (targets.length === 0) {
      ElMessage.warning('没有选中的可改名文件')
      return
    }

    isRenaming.value = true
    hasRenamed.value = false
    renameSummary.value = { success: 0, error: 0, skipped: 0 }
    renameProgress.value = { current: 0, total: targets.length, percent: 0 }

    const removeListener = window.electronAPI.onRenameProgress(prog => {
      renameProgress.value = {
        current: prog.current,
        total: prog.total,
        percent: Math.round((prog.current / prog.total) * 100)
      }

      // 更新对应项状态
      const targetIndex = scanResults.value.findIndex(item => item.id === prog.item.id)
      if (targetIndex !== -1) {
        scanResults.value[targetIndex].status = prog.item.status
        scanResults.value[targetIndex].errorMsg = prog.item.errorMsg
        if (prog.item.status === 'success') {
          scanResults.value[targetIndex].fileName = prog.item.targetName
          scanResults.value[targetIndex].filePath = prog.item.targetPath
          scanResults.value[targetIndex].isPureNumber = false
        }
      }
    })

    try {
      const plainTargets = JSON.parse(JSON.stringify(targets))
      const results = await window.electronAPI.executeRename(plainTargets)

      // 无论 IPC 进度事件是否有微弱延迟，以主进程返回的最终结果为准全量核对
      let successCount = 0
      let errorCount = 0
      let skippedCount = 0

      for (const res of results) {
        const targetIndex = scanResults.value.findIndex(item => item.id === res.id)
        if (targetIndex !== -1) {
          scanResults.value[targetIndex].status = res.status
          scanResults.value[targetIndex].errorMsg = res.errorMsg
          if (res.status === 'success') {
            scanResults.value[targetIndex].fileName = res.targetName
            scanResults.value[targetIndex].filePath = res.targetPath
            scanResults.value[targetIndex].isPureNumber = false
            successCount++
          } else if (res.status === 'error') {
            errorCount++
          } else {
            skippedCount++
          }
        }
      }

      renameSummary.value = {
        success: successCount,
        error: errorCount,
        skipped: skippedCount
      }

      renameProgress.value = {
        current: targets.length,
        total: targets.length,
        percent: 100
      }
      hasRenamed.value = true

      if (errorCount === 0) {
        ElMessage.success(`批量改名成功！共重命名 ${successCount} 个文件`)
      } else {
        ElMessage.warning(`批量改名完成：成功 ${successCount} 个，失败 ${errorCount} 个`)
      }
    } catch (err: any) {
      ElMessage.error(`改名过程发生异常：${err.message || '未知错误'}`)
    } finally {
      removeListener()
      isRenaming.value = false
    }
  }

  // 重置状态
  function resetAll() {
    folders.value = []
    scanResults.value = []
    hasScanned.value = false
    isScanning.value = false
    isRenaming.value = false
    hasRenamed.value = false
    renameProgress.value = { current: 0, total: 0, percent: 0 }
    renameSummary.value = { success: 0, error: 0, skipped: 0 }
  }

  // 重新选择文件/返回上一阶段
  function rescanOrModifyFolders() {
    hasScanned.value = false
    scanResults.value = []
    hasRenamed.value = false
    renameProgress.value = { current: 0, total: 0, percent: 0 }
    renameSummary.value = { success: 0, error: 0, skipped: 0 }
  }

  return {
    currentMode,
    currentModeLabel,
    folders,
    isScanning,
    hasScanned,
    scanResults,
    isRenaming,
    hasRenamed,
    renameProgress,
    renameSummary,
    eligibleItems,
    selectedEligibleItems,
    addFolders,
    removeFolder,
    startScan,
    startRename,
    resetAll,
    rescanOrModifyFolders
  }
})

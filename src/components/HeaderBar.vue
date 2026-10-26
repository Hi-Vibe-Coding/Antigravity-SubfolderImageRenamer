<template>
  <header class="app-header">
    <div class="logo-area">
      <div class="app-icon">
        <el-icon :size="22" color="#409eff"><PictureFilled /></el-icon>
      </div>
      <div class="title-wrap">
        <span class="app-title">文件夹图片自动化命名工具</span>
        <span class="app-subtitle">{{ store.currentModeLabel }}</span>
      </div>
    </div>

    <div class="action-area">
      <!-- 操作模式 下拉菜单按钮 -->
      <el-dropdown trigger="click" @command="handleModeChange">
        <el-button type="primary" plain class="mode-btn">
          <el-icon class="el-icon--left"><Operation /></el-icon>
          操作模式: {{ store.currentMode === 'subfolder' ? '模式1：子文件夹' : '模式2：父文件夹' }}
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="subfolder" :disabled="store.currentMode === 'subfolder'">
              <el-icon><Folder /></el-icon>
              <span>模式1：子文件夹模式</span>
            </el-dropdown-item>
            <el-dropdown-item command="parentfolder" :disabled="store.currentMode === 'parentfolder'">
              <el-icon><FolderOpened /></el-icon>
              <span>模式2：父文件夹模式</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button
        v-if="store.folders.length > 0"
        type="info"
        text
        bg
        :disabled="store.isScanning || store.isRenaming"
        @click="handleReset"
      >
        <el-icon class="el-icon--left"><Refresh /></el-icon>
        重置清空
      </el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAppStore, type OperationMode } from '../stores/appStore'
import { ElMessageBox } from 'element-plus'

const store = useAppStore()

function handleModeChange(mode: OperationMode) {
  if (mode === store.currentMode) return
  if (store.folders.length > 0 || store.hasScanned) {
    ElMessageBox.confirm('切换操作模式将清空当前已添加的文件夹和扫描数据，是否继续？', '切换模式确认', {
      confirmButtonText: '确定切换',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      store.resetAll()
      store.currentMode = mode
    }).catch(() => {})
  } else {
    store.currentMode = mode
  }
}

function handleReset() {
  ElMessageBox.confirm('确定要清空当前的文件夹和已扫描数据吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.resetAll()
  }).catch(() => {})
}
</script>

<style scoped>
.app-header {
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #ecf5ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-wrap {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.app-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.action-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-btn {
  font-weight: 500;
}
</style>

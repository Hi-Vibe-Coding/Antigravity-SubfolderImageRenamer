<template>
  <div
    class="dropzone-container"
    :class="{ 'is-dragover': isDragOver, 'is-disabled': store.isScanning || store.hasScanned }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- 空状态：尚未添加文件夹 -->
    <div v-if="store.folders.length === 0" class="empty-state">
      <div class="empty-icon-wrap">
        <el-icon :size="56" color="#94a3b8"><FolderAdd /></el-icon>
      </div>
      <h3 class="empty-title">
        拖拽{{ store.currentMode === 'subfolder' ? '子文件夹' : '父文件夹' }}到此处，或点击按钮添加
      </h3>
      <p class="empty-desc">
        {{ store.currentMode === 'subfolder' 
           ? '模式1：支持拖入或多次添加目标子文件夹，系统将扫描每个子文件夹的第一层图片' 
           : '模式2：父文件夹模式，添加如 Bracelet 等父级，系统自动扫描其下所有子文件夹的第一层图片' }}
      </p>
      <el-button
        type="primary"
        size="large"
        :icon="Plus"
        class="add-btn"
        :disabled="store.isScanning || store.hasScanned"
        @click="handleSelectFolders"
      >
        添加{{ store.currentMode === 'subfolder' ? '子文件夹' : '父文件夹' }}
      </el-button>
    </div>

    <!-- 存在已添加文件夹时的网格展示区 -->
    <div v-else class="content-state">
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="folder-count-badge">已添加 {{ store.folders.length }} 个{{ store.currentMode === 'subfolder' ? '子文件夹' : '父文件夹' }}</span>
          <span v-if="store.hasScanned" class="lock-tip">
            <el-icon><Lock /></el-icon> 扫描已开始，文件夹列表已锁定
          </span>
        </div>
        <div class="toolbar-right">
          <el-button
            type="primary"
            plain
            size="default"
            :icon="Plus"
            :disabled="store.isScanning || store.hasScanned"
            @click="handleSelectFolders"
          >
            继续添加{{ store.currentMode === 'subfolder' ? '子文件夹' : '父文件夹' }}
          </el-button>
        </div>
      </div>

      <!-- 文件夹小图标列表/网格展示 -->
      <div class="folder-grid">
        <div
          v-for="folder in store.folders"
          :key="folder.id"
          class="folder-card"
          :title="folder.path"
        >
          <!-- 文件夹上方精致生动的大图标 -->
          <div class="folder-icon-box">
            <svg class="folder-svg-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- 文件夹背板 -->
              <path d="M8 15C8 12.7909 9.79086 11 12 11H25.1716C26.2324 11 27.2498 11.4214 28 12.1716L32.8284 17C33.5786 17.7502 34.596 18.1716 35.6569 18.1716H52C54.2091 18.1716 56 19.9624 56 22.1716V48C56 50.2091 54.2091 52 52 52H12C9.79086 52 8 50.2091 8 48V15Z" fill="#D97706"/>
              <!-- 文件夹内衬白纸效果 -->
              <rect x="14" y="16" width="36" height="10" rx="2" fill="#FFFFFF" fill-opacity="0.9"/>
              <!-- 文件夹正面盖板 (明亮温暖的黄金渐变) -->
              <path d="M8 23C8 20.7909 9.79086 19 12 19H52C54.2091 19 56 20.7909 56 23V48C56 50.2091 54.2091 52 52 52H12C9.79086 52 8 50.2091 8 48V23Z" fill="url(#front_grad)"/>
              <!-- 顶部微光高光 -->
              <path d="M12 20H52C53.6569 20 55 21.3431 55 23V24H9V23C9 21.3431 10.3431 20 12 20Z" fill="#FEF3C7" fill-opacity="0.5"/>
              <defs>
                <linearGradient id="front_grad" x1="32" y1="19" x2="32" y2="52" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#FBBF24"/>
                  <stop offset="1" stop-color="#F59E0B"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <!-- 文件夹名称文本 (如 B0-001) -->
          <div class="folder-name" :title="folder.name">{{ folder.name }}</div>
          <button
            v-if="!store.isScanning && !store.hasScanned"
            class="remove-btn"
            title="移除此文件夹"
            @click.stop="store.removeFolder(folder.id)"
          >
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>

        <!-- 快速添加卡片插槽 -->
        <div
          v-if="!store.isScanning && !store.hasScanned"
          class="folder-card add-card"
          @click="handleSelectFolders"
        >
          <el-icon :size="24" color="#94a3b8"><Plus /></el-icon>
          <span class="add-text">添加文件夹</span>
        </div>
      </div>

      <!-- 拖拽提示遮罩 -->
      <div v-if="isDragOver && !store.isScanning && !store.hasScanned" class="dragover-overlay">
        <el-icon :size="48" color="#409eff"><UploadFilled /></el-icon>
        <span>松开鼠标添加文件夹</span>
      </div>

      <!-- 右下方“开始扫描”按钮（仅在未完成扫描时显示） -->
      <div class="bottom-action-panel">
        <div class="action-hint">
          <el-icon><InfoFilled /></el-icon>
          <span>
            {{ store.currentMode === 'subfolder' 
               ? '将扫描各子文件夹第一层的 png, jpg, jpeg, webp 格式图片' 
               : '将自动扫描父级目录下全部子文件夹第一层的 png, jpg, jpeg, webp 格式图片' }}
          </span>
        </div>
        <el-button
          type="primary"
          size="large"
          class="scan-action-btn"
          :loading="store.isScanning"
          :disabled="store.isScanning || store.folders.length === 0"
          @click="store.startScan"
        >
          <el-icon class="el-icon--left"><Search /></el-icon>
          开始扫描
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/appStore'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const store = useAppStore()
const isDragOver = ref(false)
let dragCounter = 0

async function handleSelectFolders() {
  if (store.isScanning || store.hasScanned) return
  try {
    const paths = await window.electronAPI.selectFolders()
    if (paths && paths.length > 0) {
      await store.addFolders(paths)
    }
  } catch (err: any) {
    ElMessage.error(`选择文件夹出错: ${err.message}`)
  }
}

function handleDragEnter(e: DragEvent) {
  if (store.isScanning || store.hasScanned) return
  dragCounter++
  isDragOver.value = true
}

function handleDragOver(e: DragEvent) {
  if (store.isScanning || store.hasScanned) return
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy'
  }
  isDragOver.value = true
}

function handleDragLeave(e: DragEvent) {
  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    isDragOver.value = false
  }
}

async function handleDrop(e: DragEvent) {
  dragCounter = 0
  isDragOver.value = false
  if (store.isScanning || store.hasScanned) return

  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return

  const paths: string[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    let p = ''
    if (window.electronAPI && typeof window.electronAPI.getPathForFile === 'function') {
      p = window.electronAPI.getPathForFile(file)
    } else {
      p = (file as any).path || ''
    }
    if (p) {
      paths.push(p)
    }
  }

  if (paths.length > 0) {
    await store.addFolders(paths)
  }
}
</script>

<style scoped>
.dropzone-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #ffffff;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;
  margin: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.dropzone-container.is-dragover {
  border-color: #409eff;
  background-color: #f0f7ff;
}

.dropzone-container.is-disabled {
  border-style: solid;
  border-color: #e5e7eb;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon-wrap {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #64748b;
  max-width: 460px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.add-btn {
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.25);
}

.content-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  position: relative;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.folder-count-badge {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  background-color: #f1f5f9;
  padding: 4px 12px;
  border-radius: 16px;
}

.lock-tip {
  font-size: 13px;
  color: #e6a23c;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
}

.folder-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px;
  align-content: flex-start;
  padding-right: 8px;
  max-height: calc(100vh - 270px);
}

.folder-card {
  position: relative;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.2s ease;
  user-select: none;
}

.folder-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.folder-icon-box {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-svg-icon {
  width: 52px;
  height: 52px;
  filter: drop-shadow(0 3px 4px rgba(217, 119, 6, 0.2));
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.folder-card:hover .folder-svg-icon {
  transform: scale(1.08) translateY(-2px);
  filter: drop-shadow(0 6px 8px rgba(217, 119, 6, 0.28));
}

.folder-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 4px;
}

.remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background-color: rgba(203, 213, 225, 0.6);
  color: #475569;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.remove-btn:hover {
  background-color: #ef4444;
  color: #ffffff;
}

.add-card {
  border-style: dashed;
  cursor: pointer;
  justify-content: center;
  background-color: #fafbfc;
}

.add-card:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.add-text {
  font-size: 12px;
  color: #64748b;
  margin-top: 6px;
}

.dragover-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(240, 247, 255, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  border-radius: 10px;
  z-index: 10;
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.bottom-action-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  margin-top: 12px;
}

.action-hint {
  font-size: 13px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.scan-action-btn {
  min-width: 140px;
  font-weight: 600;
}
</style>

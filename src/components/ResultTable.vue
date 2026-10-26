<template>
  <div class="result-table-container">
    <div class="table-header-toolbar">
      <div class="summary-info">
        <span class="badge badge-total">共扫描 {{ store.scanResults.length }} 个文件</span>
        <span class="badge badge-match">符合纯数字改名 {{ store.eligibleItems.length }} 个</span>
        <span class="badge badge-selected">已勾选 {{ store.selectedEligibleItems.length }} 个</span>
      </div>

      <div class="batch-actions">
        <el-button size="small" @click="handleSelectAll(true)">全选符合项</el-button>
        <el-button size="small" @click="handleSelectAll(false)">取消全选</el-button>
        <el-button size="small" type="primary" plain @click="store.rescanOrModifyFolders">
          <el-icon class="el-icon--left"><Back /></el-icon>
          返回增减文件夹
        </el-button>
      </div>
    </div>

    <!-- 文件列表表格 -->
    <div class="table-wrapper">
      <el-table
        :data="store.scanResults"
        style="width: 100%"
        height="100%"
        stripe
        border
        empty-text="未扫描到匹配的图片文件"
      >
        <!-- 勾选列 -->
        <el-table-column width="60" align="center">
          <template #default="{ row }">
            <el-checkbox
              v-if="row.isPureNumber"
              v-model="row.checked"
              :disabled="store.isRenaming || row.status === 'success'"
            />
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <!-- 所属子文件夹 -->
        <el-table-column prop="folderName" label="所属文件夹" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="folder-cell">
              <el-icon color="#e6a23c"><Folder /></el-icon>
              <span>{{ row.folderName }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 原文件名 -->
        <el-table-column prop="fileName" label="原文件名" width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="file-cell">
              <el-icon color="#409eff"><Picture /></el-icon>
              <span :class="{ 'highlight-name': row.isPureNumber }">{{ row.fileName }}</span>
            </div>
          </template>
        </el-table-column>

        <!-- 改名预览描述：如 1.png -> E1-013__1.png -->
        <el-table-column label="改名操作描述" min-width="260">
          <template #default="{ row }">
            <div v-if="row.isPureNumber" class="rename-desc">
              <span class="old-tag">{{ row.fileName }}</span>
              <el-icon class="arrow-icon"><Right /></el-icon>
              <span class="new-tag">{{ row.targetName }}</span>
            </div>
            <div v-else class="non-match-desc">
              <el-tag type="info" size="small" effect="plain">非纯数字，不重命名</el-tag>
            </div>
          </template>
        </el-table-column>

        <!-- 执行状态 -->
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'success'" type="success" size="small">
              已改名
            </el-tag>
            <el-tag v-else-if="row.status === 'error'" type="danger" size="small" :title="row.errorMsg">
              失败
            </el-tag>
            <el-tag v-else-if="row.status === 'skipped'" type="info" size="small">
              已跳过
            </el-tag>
            <el-tag v-else-if="row.isPureNumber" type="warning" size="small">
              待处理
            </el-tag>
            <el-tag v-else type="info" size="small">
              保持原样
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作定位 -->
        <el-table-column label="定位" width="80" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              title="在系统资源管理器中定位"
              @click="openLocation(row.filePath)"
            >
              <el-icon><FolderOpened /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/appStore'

const store = useAppStore()

function handleSelectAll(check: boolean) {
  for (const item of store.scanResults) {
    if (item.isPureNumber && item.status !== 'success') {
      item.checked = check
    }
  }
}

function openLocation(path: string) {
  window.electronAPI.openPathInExplorer(path)
}
</script>

<style scoped>
.result-table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin: 16px;
  overflow: hidden;
}

.table-header-toolbar {
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  background-color: #fafbfc;
}

.summary-info {
  display: flex;
  gap: 8px;
}

.badge {
  font-size: 13px;
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.badge-total {
  background-color: #f1f5f9;
  color: #475569;
}

.badge-match {
  background-color: #fef3c7;
  color: #b45309;
}

.badge-selected {
  background-color: #dbeafe;
  color: #1d4ed8;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
}

.folder-cell,
.file-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.highlight-name {
  font-weight: 600;
  color: #d97706;
}

.rename-desc {
  display: flex;
  align-items: center;
  gap: 8px;
}

.old-tag {
  color: #64748b;
  font-family: monospace;
  background-color: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.arrow-icon {
  color: #94a3b8;
  font-size: 14px;
}

.new-tag {
  color: #059669;
  font-weight: 600;
  font-family: monospace;
  background-color: #ecfdf5;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #a7f3d0;
}

.non-match-desc {
  display: flex;
  align-items: center;
}

.text-muted {
  color: #cbd5e1;
}
</style>

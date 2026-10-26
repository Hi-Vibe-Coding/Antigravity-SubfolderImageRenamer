<template>
  <footer class="app-footer">
    <div class="progress-wrap">
      <div v-if="store.isRenaming || store.renameProgress.total > 0" class="progress-info">
        <span class="progress-text">
          {{ store.isRenaming ? '正在改名中...' : '改名完成' }}
          ({{ store.renameProgress.current }} / {{ store.renameProgress.total }})
        </span>
        <el-progress
          :percentage="store.renameProgress.percent"
          :status="store.renameProgress.percent === 100 ? 'success' : undefined"
          :stroke-width="10"
          striped
          :striped-flow="store.isRenaming"
          style="width: 260px"
        />
      </div>
      <div v-else class="idle-info">
        <span v-if="store.hasScanned">
          已就绪：共 {{ store.selectedEligibleItems.length }} 个文件等待重命名
        </span>
        <span v-else>
          提示：添加子文件夹并点击“开始扫描”后，可执行改名
        </span>
      </div>
    </div>

    <div class="action-wrap">
      <el-button
        type="primary"
        size="large"
        class="rename-btn"
        :loading="store.isRenaming"
        :disabled="!store.hasScanned || store.selectedEligibleItems.length === 0 || store.isRenaming"
        @click="confirmRename"
      >
        <el-icon class="el-icon--left"><EditPen /></el-icon>
        开始改名操作 ({{ store.selectedEligibleItems.length }})
      </el-button>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useAppStore } from '../stores/appStore'
import { ElMessageBox } from 'element-plus'

const store = useAppStore()

function confirmRename() {
  const count = store.selectedEligibleItems.length
  ElMessageBox.confirm(
    `即将对选中的 ${count} 个纯数字命名的图片进行批量重命名（添加子文件夹前缀），此操作将直接修改磁盘文件名称，是否确认继续？`,
    '执行改名确认',
    {
      confirmButtonText: '确认改名',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    store.startRename()
  }).catch(() => {})
}
</script>

<style scoped>
.app-footer {
  height: 68px;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.02);
}

.progress-wrap {
  display: flex;
  align-items: center;
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-text {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.idle-info {
  font-size: 13px;
  color: #6b7280;
}

.action-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rename-btn {
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(64, 158, 255, 0.3);
}
</style>

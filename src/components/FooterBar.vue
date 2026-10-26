<template>
  <footer class="app-footer">
    <div class="progress-wrap">
      <div v-if="store.isRenaming || store.hasRenamed" class="progress-info">
        <span class="progress-text">
          <template v-if="store.isRenaming">
            <el-icon class="is-loading"><Loading /></el-icon>
            正在改名中... ({{ store.renameProgress.current }} / {{ store.renameProgress.total }})
          </template>
          <template v-else>
            <el-icon color="#67c23a" :size="16"><CircleCheckFilled /></el-icon>
            改名已完成：成功 {{ store.renameSummary.success }} 个
            <span v-if="store.renameSummary.error > 0" class="text-danger">（失败 {{ store.renameSummary.error }} 个）</span>
          </template>
        </span>
        <el-progress
          :percentage="store.renameProgress.percent"
          :status="store.renameSummary.error > 0 ? 'warning' : 'success'"
          :stroke-width="10"
          striped
          :striped-flow="store.isRenaming"
          style="width: 240px"
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
      <!-- 路径与改名示例按钮 -->
      <el-button
        type="info"
        plain
        size="large"
        class="example-btn"
        @click="showExampleDialog = true"
      >
        <el-icon class="el-icon--left"><Document /></el-icon>
        路径与改名示例
      </el-button>

      <el-button
        v-if="store.hasRenamed && store.selectedEligibleItems.length === 0"
        type="success"
        plain
        size="large"
        @click="store.rescanOrModifyFolders"
      >
        <el-icon class="el-icon--left"><RefreshRight /></el-icon>
        已全部完成 (返回增减文件夹)
      </el-button>
      <el-button
        v-else
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

    <!-- 路径与改名示例小面板弹窗 -->
    <el-dialog
      v-model="showExampleDialog"
      title="路径与改名示例"
      width="580px"
      append-to-body
      center
      destroy-on-close
    >
      <div class="example-panel-content">
        <div class="example-desc-hint">
          结构说明：在各直接子文件夹（如 <code>B0-001</code>）下的纯数字图片，将自动添加该子文件夹名作为前缀：
        </div>
        <pre class="example-code-block"><code>Bracelet/ (父文件夹)
 ├── B0-001/ (子文件夹)
 │    ├── 1.png   ──>  改名为: B0-001__1.png
 │    ├── 2.png   ──>  改名为: B0-001__2.png
 │    └── 3.png   ──>  改名为: B0-001__3.png
 ├── B0-002/ (子文件夹)
 │    └── 1.png   ──>  改名为: B0-002__1.png
 ├── B0-003/ (子文件夹)
 │    └── 2.png   ──>  改名为: B0-003__2.png
 └── B0-004/ (子文件夹)
      └── 3.png   ──>  改名为: B0-004__3.png</code></pre>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" size="default" @click="showExampleDialog = false">我知道了</el-button>
        </div>
      </template>
    </el-dialog>
  </footer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../stores/appStore'
import { ElMessageBox } from 'element-plus'

const store = useAppStore()
const showExampleDialog = ref(false)

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
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.text-danger {
  color: #ef4444;
  margin-left: 4px;
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

.example-btn {
  font-weight: 500;
}

.example-panel-content {
  padding: 0 8px;
}

.example-desc-hint {
  font-size: 13px;
  color: #475569;
  margin-bottom: 12px;
  line-height: 1.6;
}

.example-desc-hint code {
  background-color: #fef3c7;
  color: #b45309;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-weight: 600;
}

.example-code-block {
  background-color: #0f172a;
  color: #38bdf8;
  font-family: Consolas, 'Cascadia Code', 'Fira Code', Menlo, Monaco, monospace;
  font-size: 13px;
  line-height: 1.65;
  padding: 16px 18px;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid #1e293b;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.25);
  margin: 0;
}

.example-code-block code {
  white-space: pre;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}
</style>

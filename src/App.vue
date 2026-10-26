<template>
  <div class="app-layout">
    <!-- 顶部操作栏 -->
    <HeaderBar />

    <!-- 主体内容区 -->
    <main class="main-content">
      <!-- 模式1 / 模式2：若尚未扫描，显示文件夹添加与拖拽区域；扫描后显示结果表格 -->
      <transition name="fade-slide" mode="out-in">
        <FolderDropZone v-if="!store.hasScanned" />
        <ResultTable v-else />
      </transition>
    </main>

    <!-- 底部操作与进度条栏 -->
    <FooterBar />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import FolderDropZone from './components/FolderDropZone.vue'
import ResultTable from './components/ResultTable.vue'
import FooterBar from './components/FooterBar.vue'
import { useAppStore } from './stores/appStore'

const store = useAppStore()

function preventDefaultDrag(e: DragEvent) {
  e.preventDefault()
}

onMounted(() => {
  // 全局拦截窗口任何区域的拖拽默认行为，避免浏览器导航或打开空白新窗口
  window.addEventListener('dragover', preventDefaultDrag, false)
  window.addEventListener('drop', preventDefaultDrag, false)
})

onUnmounted(() => {
  window.removeEventListener('dragover', preventDefaultDrag)
  window.removeEventListener('drop', preventDefaultDrag)
})
</script>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #f1f5f9;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 视图切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

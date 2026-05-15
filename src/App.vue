<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import ChatWindow from './components/ChatWindow.vue'
import MemoryPanel from './components/MemoryPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import { useChat } from './composables/useChat'
import { useApp } from './composables/useApp'

const app = useApp()
const appReady = ref(false)
const showMemory = ref(false)
const showSettings = ref(false)

const {
  conversations, messages, isLoading, error,
  activeConversationId,
  loadConversations, selectConversation,
  newConversation, sendMessage,
  renameConversation, deleteConversationById, togglePinConversation,
} = useChat()

onMounted(async () => {
  try {
    await app.init()
    appReady.value = true
    loadConversations()
  } catch (e: any) {
    error.value = '初始化失败: ' + e.message
    appReady.value = true
  }
})
</script>

<template>
  <div class="app-container">
    <div v-if="!appReady" class="loading-screen">
      <div class="spinner" />
      <p class="loading-text">加载中...</p>
    </div>

    <template v-else>
      <Sidebar
        :conversations="conversations"
        :active-id="activeConversationId"
        @new-conversation="newConversation"
        @select-conversation="selectConversation"
        @rename-conversation="renameConversation"
        @delete-conversation="deleteConversationById"
        @toggle-pin="togglePinConversation"
        @open-memory="showMemory = true"
        @open-settings="showSettings = true"
      />
      <main class="main-area">
        <ChatWindow
          :conversation-id="activeConversationId"
          :messages="messages"
          :is-loading="isLoading"
          :error="error"
          @send="(t: string) => sendMessage(t)"
        />
      </main>
    </template>

    <!-- Memory Modal -->
    <Teleport to="body">
      <div v-if="showMemory" class="modal-overlay" @click.self="showMemory = false">
        <div class="modal-content modal-lg">
          <button class="modal-close" @click="showMemory = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <MemoryPanel @close="showMemory = false" />
        </div>
      </div>
    </Teleport>

    <!-- Settings Modal -->
    <Teleport to="body">
      <div v-if="showSettings" class="modal-overlay" @click.self="showSettings = false">
        <div class="modal-content modal-md">
          <button class="modal-close" @click="showSettings = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <SettingsPanel @close="showSettings = false" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: #f5f5f5;
  color: #1a1a1a;
  position: relative;
}

.loading-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #d1d5db;
  border-top-color: #6b7280;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Modal styles (can't use scoped with Teleport, use deep or global) */
:global(.modal-overlay) {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

:global(.modal-content) {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
  animation: modal-in 0.15s ease-out;
}

:global(.modal-lg) {
  width: 680px;
  max-width: 90vw;
}

:global(.modal-md) {
  width: 520px;
  max-width: 90vw;
}

:global(.modal-close) {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  z-index: 10;
  transition: all 0.15s;
}

:global(.modal-close:hover) {
  background: #e5e7eb;
  color: #374151;
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>

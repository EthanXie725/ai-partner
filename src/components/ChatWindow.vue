<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import MessageBubble from './MessageBubble.vue'
import type { Message, SearchResult } from '@/types'
import { loadConfig, saveConfig } from '@/config'

const props = defineProps<{
  conversationId: string | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  searchStatus: 'idle' | 'searching' | 'done' | 'failed'
  searchResultCount: number
  messageSearchResults: Record<string, SearchResult[]>
  messageReasoning: Record<string, string>
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const inputText = ref('')
const messagesContainer = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()

const config = loadConfig()
const webSearchEnabled = ref(config.enableWebSearch)
const thinkingEnabled = ref(config.enableThinking)

function toggleWebSearch() {
  webSearchEnabled.value = !webSearchEnabled.value
  const cfg = loadConfig()
  cfg.enableWebSearch = webSearchEnabled.value
  saveConfig(cfg)
}

function toggleThinking() {
  thinkingEnabled.value = !thinkingEnabled.value
  const cfg = loadConfig()
  cfg.enableThinking = thinkingEnabled.value
  saveConfig(cfg)
}

watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }
)

function autoResize() {
  const el = textareaRef.value
  if (el) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text || props.isLoading) return
  emit('send', text)
  inputText.value = ''
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="chat-container">
    <!-- Empty state -->
    <div v-if="!conversationId" class="empty-state">
      <div class="empty-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h2 class="empty-title">开始新的对话</h2>
      <p class="empty-desc">点击「新对话」开始聊天</p>
    </div>

    <!-- Chat -->
    <template v-else>
      <!-- New conversation: centered welcome -->
      <div v-if="messages.length === 0 && !isLoading" class="empty-state">
        <div class="empty-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 class="welcome-title">有什么我能帮助你的吗？</h2>
      </div>

      <template v-else>
        <div ref="messagesContainer" class="messages-area">
          <div class="messages-inner">
            <MessageBubble
              v-for="msg in messages"
              :key="msg.id"
              :message="msg"
              :search-results="messageSearchResults[msg.id] || []"
              :reasoning="messageReasoning[msg.id] || ''"
            />

            <!-- Typing -->
            <div v-if="isLoading" class="typing-indicator">
              <div class="typing-bubble">
                <span class="dot" style="animation-delay: 0ms" />
                <span class="dot" style="animation-delay: 150ms" />
                <span class="dot" style="animation-delay: 300ms" />
              </div>
            </div>

            <!-- Error -->
            <div v-if="error" class="error-banner">
              {{ error }}
            </div>
          </div>
        </div>
      </template>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-toolbar">
          <button
            class="search-toggle"
            :class="{ active: webSearchEnabled }"
            @click="toggleWebSearch"
            :title="webSearchEnabled ? '联网搜索已开启' : '联网搜索已关闭'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
            <span>联网搜索</span>
          </button>
          <span v-if="searchStatus === 'searching'" class="search-status searching">搜索中…</span>
          <span v-else-if="searchStatus === 'done'" class="search-status done">已搜索到 {{ searchResultCount }} 条结果</span>
          <span v-else-if="searchStatus === 'failed'" class="search-status failed">搜索无结果</span>
          <div class="toolbar-spacer" />
          <button
            class="thinking-toggle"
            :class="{ active: thinkingEnabled }"
            @click="toggleThinking"
            :title="thinkingEnabled ? '深度思考已开启' : '深度思考已关闭'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1010 10M12 2v4M12 2l3 3M12 2l-3 3M22 12h-4M22 12l-3-3M22 12l-3 3"/>
            </svg>
            <span>深度思考</span>
          </button>
        </div>
        <div class="input-inner">
          <textarea
            ref="textareaRef"
            v-model="inputText"
            @keydown="handleKeydown"
            @input="autoResize"
            placeholder="输入消息，Enter 发送"
            rows="1"
            class="chat-input"
            :disabled="isLoading"
          />
          <button
            @click="handleSend"
            :disabled="isLoading || !inputText.trim()"
            class="send-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

/* Empty state */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  background: #f3f4f6;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  margin-bottom: 24px;
}

.empty-title {
  font-size: 18px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 6px;
}

.welcome-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.empty-desc {
  font-size: 14px;
  color: #9ca3af;
}

/* Messages */
.messages-area {
  flex: 1;
  overflow-y: auto;
}

.messages-inner {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.typing-indicator {
  display: flex;
  justify-content: flex-start;
}

.typing-bubble {
  background: #f3f4f6;
  border-radius: 16px;
  padding: 14px 20px;
  display: flex;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: bounce 1.2s infinite;
}

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.error-banner {
  display: flex;
  justify-content: center;
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
}

/* Input */
.input-area {
  padding: 0 16px 16px;
}

.input-toolbar {
  max-width: 700px;
  margin: 0 auto 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.input-inner {
  max-width: 700px;
  margin: 0 auto;
  position: relative;
}

.chat-input {
  width: 100%;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px 56px 14px 20px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  line-height: 1.5;
  transition: border-color 0.15s;
}

.chat-input:focus {
  border-color: #d1d5db;
}

.chat-input::placeholder {
  color: #9ca3af;
}

.send-btn {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111827;
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.search-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #9ca3af;
  cursor: pointer;
  padding: 5px 10px;
  font-size: 12px;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
}

.search-toggle:hover {
  background: #e5e7eb;
  color: #6b7280;
}

.search-toggle.active {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #3b82f6;
}

.search-toggle.active:hover {
  background: #dbeafe;
}

.toolbar-spacer {
  flex: 1;
}

.thinking-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #9ca3af;
  cursor: pointer;
  padding: 5px 10px;
  font-size: 12px;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
}

.thinking-toggle:hover {
  background: #e5e7eb;
  color: #6b7280;
}

.thinking-toggle.active {
  background: #fef3c7;
  border-color: #fbbf24;
  color: #d97706;
}

.thinking-toggle.active:hover {
  background: #fde68a;
}

.search-status {
  font-size: 12px;
  transition: opacity 0.2s;
}

.search-status.searching {
  color: #3b82f6;
  animation: pulse 1.2s ease-in-out infinite;
}

.search-status.done {
  color: #10b981;
}

.search-status.failed {
  color: #9ca3af;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.send-btn:hover:not(:disabled) {
  background: #1f2937;
}

.send-btn:disabled {
  background: #e5e7eb;
  cursor: not-allowed;
  color: #9ca3af;
}
</style>

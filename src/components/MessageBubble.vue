<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Message, SearchResult } from '@/types'

const props = defineProps<{
  message: Message
  searchResults?: SearchResult[]
  reasoning?: string
}>()

const showReasoning = ref(false)

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  if (d >= todayStart) return hhmm
  if (d >= yesterdayStart) return `昨天 ${hhmm}`
  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}/${d.getDate()} ${hhmm}`
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hhmm}`
}

// Parse [N] citations from content and resolve to actual search results
const citedSources = computed(() => {
  if (!props.searchResults?.length) return []
  const regex = /\[(\d+)\]/g
  const indices: number[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(props.message.content || '')) !== null) {
    const idx = parseInt(match[1]) - 1
    if (idx >= 0 && idx < props.searchResults.length && !indices.includes(idx)) {
      indices.push(idx)
    }
  }
  return indices.map(i => props.searchResults![i])
})
</script>

<template>
  <div class="bubble-row" :class="message.role">
    <div class="bubble-wrapper" :class="message.role">

      <!-- Reasoning / Thinking block -->
      <div v-if="reasoning" class="reasoning-block">
        <button class="reasoning-toggle" @click="showReasoning = !showReasoning">
          <svg
            class="reasoning-arrow"
            :class="{ open: showReasoning }"
            width="12" height="12" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span>已深度思考</span>
          <span class="reasoning-duration">{{ reasoning.length }} 字</span>
        </button>
        <div v-if="showReasoning" class="reasoning-content">{{ reasoning }}</div>
      </div>

      <!-- Cited sources -->
      <div v-if="citedSources.length > 0" class="sources-block">
        <div class="sources-title">引用来源</div>
        <div v-for="(src, i) in citedSources" :key="i" class="source-card">
          <div class="source-num">{{ i + 1 }}</div>
          <div class="source-body">
            <a :href="src.url" target="_blank" class="source-title">{{ src.title }}</a>
            <p class="source-snippet">{{ src.content }}</p>
          </div>
        </div>
      </div>

      <!-- Message bubble -->
      <div class="bubble" :class="message.role">
        {{ message.content || ' ' }}
        <span v-if="message.role === 'assistant' && !message.content" class="cursor" />
      </div>
      <div class="time" :class="message.role">{{ formatTime(message.createdAt) }}</div>
    </div>
  </div>
</template>

<style scoped>
.bubble-row {
  display: flex;
}

.bubble-row.user {
  justify-content: flex-end;
}

.bubble-row.assistant {
  justify-content: flex-start;
}

.bubble-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 75%;
}

.bubble-wrapper.user {
  align-items: flex-end;
}

.bubble-wrapper.assistant {
  align-items: flex-start;
}

.bubble {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.bubble.user {
  background: #1a1a2e;
  color: #fff;
  border-radius: 16px 16px 4px 16px;
}

.bubble.assistant {
  background: #f3f4f6;
  color: #1f2937;
  border-radius: 16px 16px 16px 4px;
}

.time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  padding: 0 4px;
}

.cursor {
  display: inline-block;
  width: 6px;
  height: 14px;
  background: #6b7280;
  animation: blink 1s step-end infinite;
  border-radius: 2px;
  vertical-align: middle;
  margin-left: 2px;
}

@keyframes blink {
  50% { opacity: 0; }
}

/* Reasoning block */
.reasoning-block {
  width: 100%;
  margin-bottom: 8px;
}

.reasoning-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  color: #92400e;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}

.reasoning-toggle:hover {
  background: #fde68a;
}

.reasoning-arrow {
  transition: transform 0.2s;
}

.reasoning-arrow.open {
  transform: rotate(90deg);
}

.reasoning-duration {
  font-size: 11px;
  color: #b45309;
  opacity: 0.7;
}

.reasoning-content {
  margin-top: 8px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: #78350f;
  white-space: pre-wrap;
}

/* Sources block */
.sources-block {
  width: 100%;
  margin-bottom: 8px;
}

.sources-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
}

.source-card {
  display: flex;
  gap: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
}

.source-num {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
}

.source-body {
  flex: 1;
  min-width: 0;
}

.source-title {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #2563eb;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}

.source-title:hover {
  text-decoration: underline;
}

.source-snippet {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

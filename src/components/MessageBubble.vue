<script setup lang="ts">
import type { Message } from '@/types'

const props = defineProps<{
  message: Message
}>()

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
</script>

<template>
  <div class="bubble-row" :class="message.role">
    <div class="bubble-wrapper" :class="message.role">
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
  max-width: 70%;
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
</style>

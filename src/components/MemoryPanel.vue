<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMemory } from '@/composables/useMemory'

defineEmits<{ close: [] }>()

const { facts, semanticMemories, isLoading, loadFacts, loadSemanticMemories, removeFact, removeSemanticMemory } = useMemory()

const userMemories = computed(() => semanticMemories.value.filter(m => m.memoryType === 'user'))
const assistantMemories = computed(() => semanticMemories.value.filter(m => m.memoryType === 'assistant'))

onMounted(() => {
  loadFacts()
  loadSemanticMemories()
})
</script>

<template>
  <div class="memory-panel">
    <div class="panel-body">
      <!-- Facts -->
      <section>
        <h2 class="panel-title">记忆</h2>
        <h3 class="section-title">事实记忆 · {{ facts.length }}</h3>
        <div v-if="isLoading" class="hint">加载中...</div>
        <div v-else-if="facts.length === 0" class="hint">
          暂无记忆。在对话中分享关于你的信息，我会自动记住。
        </div>
        <div v-else class="fact-list">
          <div v-for="fact in facts" :key="fact.id" class="fact-item">
            <div class="fact-content">
              <span class="fact-subject">{{ fact.subject }}</span>
              <span class="fact-predicate">{{ fact.predicate }}</span>
              <span class="fact-object">{{ fact.object }}</span>
            </div>
            <button class="del-btn" @click="removeFact(fact.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Semantic Memories -->
      <section>
        <h3 class="section-title">用户记忆 · {{ userMemories.length }}</h3>
        <div v-if="userMemories.length === 0" class="hint">暂无用户记忆。</div>
        <div v-else class="summary-list">
          <div v-for="mem in userMemories" :key="mem.id" class="summary-item summary-user">
            <div class="summary-content">
              <p class="summary-text">{{ mem.summary }}</p>
              <p class="summary-time">{{ new Date(mem.createdAt).toLocaleString('zh-CN') }}</p>
            </div>
            <button class="del-btn" @click="removeSemanticMemory(mem.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section>
        <h3 class="section-title">AI 回复记忆 · {{ assistantMemories.length }}</h3>
        <div v-if="assistantMemories.length === 0" class="hint">暂无 AI 回复记忆。</div>
        <div v-else class="summary-list">
          <div v-for="mem in assistantMemories" :key="mem.id" class="summary-item summary-assistant">
            <div class="summary-content">
              <p class="summary-text">{{ mem.summary }}</p>
              <p class="summary-time">{{ new Date(mem.createdAt).toLocaleString('zh-CN') }}</p>
            </div>
            <button class="del-btn" @click="removeSemanticMemory(mem.id)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.memory-panel {
  padding: 28px 28px 20px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24px;
}

.panel-body {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #9ca3af;
  margin-bottom: 10px;
}

.hint {
  color: #9ca3af;
  font-size: 14px;
}

.fact-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px 16px;
  transition: background 0.15s;
}

.fact-item:hover {
  background: #f3f4f6;
}

.fact-content {
  font-size: 14px;
}

.fact-subject {
  color: #1f2937;
  font-weight: 500;
}

.fact-predicate {
  color: #9ca3af;
  margin: 0 6px;
}

.fact-object {
  color: #4b5563;
}

.del-btn {
  color: #d1d5db;
  background: none;
  border: none;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
}

.fact-item:hover .del-btn {
  opacity: 1;
}

.del-btn:hover {
  color: #f87171;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  border-radius: 10px;
  padding: 12px 16px;
  transition: background 0.15s;
}

.summary-item:hover {
  background: #f3f4f6;
}

.summary-user {
  border-left: 3px solid #3b82f6;
}

.summary-assistant {
  border-left: 3px solid #10b981;
}

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-text {
  font-size: 14px;
  color: #374151;
}

.summary-time {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 6px;
}

.summary-item .del-btn {
  opacity: 0;
}

.summary-item:hover .del-btn {
  opacity: 1;
}
</style>

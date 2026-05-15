<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Conversation } from '@/types'

const props = defineProps<{
  conversations: Conversation[]
  activeId: string | null
}>()

const emit = defineEmits<{
  'new-conversation': []
  'select-conversation': [id: string]
  'rename-conversation': [id: string, title: string]
  'delete-conversation': [id: string]
  'toggle-pin': [id: string]
  'open-memory': []
  'open-settings': []
}>()

// Context menu state
const menuTarget = ref<string | null>(null)
const renamingId = ref<string | null>(null)
const renameText = ref('')
const deleteConfirmId = ref<string | null>(null)

function openMenu(id: string, e: MouseEvent) {
  e.stopPropagation()
  menuTarget.value = menuTarget.value === id ? null : id
}

function closeMenu() {
  menuTarget.value = null
}

function startRename(id: string, currentTitle: string) {
  renamingId.value = id
  renameText.value = currentTitle || ''
  menuTarget.value = null
}

function submitRename(id: string) {
  const text = renameText.value.trim()
  if (text) {
    emit('rename-conversation', id, text)
  }
  renamingId.value = null
}

function cancelRename() {
  renamingId.value = null
}

function handleDelete(id: string) {
  deleteConfirmId.value = id
  menuTarget.value = null
}

function confirmDelete(id: string) {
  emit('delete-conversation', id)
  deleteConfirmId.value = null
}

function cancelDelete() {
  deleteConfirmId.value = null
}

// Time category helpers
function getDayStart(ts: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function getTimeCategory(ts: number): string {
  const now = Date.now()
  const todayStart = getDayStart(now)
  const yesterdayStart = todayStart - 86400000
  const day7Start = todayStart - 7 * 86400000
  const day30Start = todayStart - 30 * 86400000

  if (ts >= todayStart) return '今天'
  if (ts >= yesterdayStart) return '昨天'
  if (ts >= day7Start) return '7天内'
  if (ts >= day30Start) return '30天内'
  return '更早'
}

interface TimeGroup {
  label: string
  conversations: Conversation[]
}

const groups = computed(() => {
  const pinned: Conversation[] = []
  const byCategory = new Map<string, Conversation[]>()

  for (const conv of props.conversations) {
    if (conv.pinned) {
      pinned.push(conv)
      continue
    }
    const cat = getTimeCategory(conv.updatedAt)
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(conv)
  }

  // Sort within each category by updatedAt DESC
  const sortDesc = (a: Conversation, b: Conversation) => b.updatedAt - a.updatedAt
  for (const [, list] of byCategory) list.sort(sortDesc)
  pinned.sort(sortDesc)

  const result: TimeGroup[] = []
  const categoryOrder = ['今天', '昨天', '7天内', '30天内', '更早']

  if (pinned.length > 0) {
    result.push({ label: '置顶', conversations: pinned })
  }
  for (const cat of categoryOrder) {
    if (byCategory.has(cat) && byCategory.get(cat)!.length > 0) {
      result.push({ label: cat, conversations: byCategory.get(cat)! })
    }
  }

  return result
})
</script>

<template>
  <aside class="sidebar" @click="closeMenu">
    <!-- New Chat Button -->
    <div class="sidebar-header">
      <button class="new-chat-btn" @click.stop="emit('new-conversation')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 4v16m8-8H4" />
        </svg>
        新对话
      </button>
    </div>

    <!-- Conversation List -->
    <div class="conv-list">
      <template v-if="conversations.length > 0">
        <template v-for="group in groups" :key="group.label">
          <div class="group-header">{{ group.label }}</div>
          <div
            v-for="conv in group.conversations"
            :key="conv.id"
            class="conv-item"
            :class="{ active: conv.id === activeId }"
          >
            <!-- Delete confirmation -->
            <div v-if="deleteConfirmId === conv.id" class="delete-overlay">
              <span class="delete-text">确认删除？</span>
              <button class="delete-yes" @click.stop="confirmDelete(conv.id)">删除</button>
              <button class="delete-no" @click.stop="cancelDelete()">取消</button>
            </div>

            <!-- Rename input -->
            <div v-else-if="renamingId === conv.id" class="rename-row" @click.stop>
              <input
                v-model="renameText"
                class="rename-input"
                @keydown.enter="submitRename(conv.id)"
                @keydown.escape="cancelRename"
                @blur="submitRename(conv.id)"
                autofocus
              />
            </div>

            <!-- Normal state -->
            <template v-else>
              <div class="conv-content" @click="emit('select-conversation', conv.id)">
                <svg v-if="conv.pinned" class="pin-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                </svg>
                <span class="conv-title">{{ conv.title || '新对话' }}</span>
              </div>
              <button class="menu-btn" @click="(e) => openMenu(conv.id, e)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>

              <!-- Dropdown -->
              <div v-if="menuTarget === conv.id" class="dropdown" @click.stop>
                <button class="dropdown-item" @click="startRename(conv.id, conv.title)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  重命名
                </button>
                <button class="dropdown-item" @click="emit('toggle-pin', conv.id); menuTarget = null">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                  </svg>
                  {{ conv.pinned ? '取消置顶' : '置顶' }}
                </button>
                <button class="dropdown-item danger" @click="handleDelete(conv.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  删除
                </button>
              </div>
            </template>
          </div>
        </template>
      </template>
      <div v-else class="empty-hint">暂无对话</div>
    </div>

    <!-- Bottom Navigation -->
    <div class="bottom-nav">
      <button class="nav-btn" @click="emit('open-memory')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        记忆
      </button>
      <button class="nav-btn" @click="emit('open-settings')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        设置
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 12px 12px 8px;
}

.new-chat-btn {
  width: 100%;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s;
}

.new-chat-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}

.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}

.group-header {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.5px;
}

.conv-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
  transition: all 0.15s;
  margin-bottom: 1px;
}

.conv-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.conv-item.active {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

.conv-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  min-width: 0;
}

.pin-icon {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.4);
}

.conv-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Three-dot menu button */
.menu-btn {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: none;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  margin-right: 4px;
  transition: all 0.15s;
}

.conv-item:hover .menu-btn {
  display: flex;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
}

/* Dropdown */
.dropdown {
  position: absolute;
  right: 8px;
  top: 36px;
  background: #2a2a4a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  z-index: 100;
  min-width: 130px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.dropdown-item {
  width: 100%;
  padding: 8px 10px;
  background: none;
  border: none;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.1s;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.dropdown-item.danger:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

/* Rename */
.rename-row {
  flex: 1;
  padding: 6px 8px;
}

.rename-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  outline: none;
}

.rename-input:focus {
  border-color: rgba(255, 255, 255, 0.5);
}

/* Delete confirmation */
.delete-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
}

.delete-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  flex: 1;
}

.delete-yes,
.delete-no {
  padding: 3px 8px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.delete-yes {
  background: rgba(239, 68, 68, 0.7);
  color: #fff;
}

.delete-yes:hover {
  background: rgba(239, 68, 68, 0.9);
}

.delete-no {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
}

.delete-no:hover {
  background: rgba(255, 255, 255, 0.2);
}

.empty-hint {
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
  text-align: center;
  margin-top: 24px;
}

.bottom-nav {
  padding: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-btn {
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.15s;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.8);
}

.nav-btn svg {
  flex-shrink: 0;
}
</style>

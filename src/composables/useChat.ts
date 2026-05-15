import { ref } from 'vue'
import type { Conversation, Message } from '@/types'
import { useApp } from './useApp'

export function useChat() {
  const conversations = ref<Conversation[]>([])
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const activeConversationId = ref<string | null>(null)
  const error = ref<string | null>(null)

  async function loadConversations() {
    const app = useApp()
    conversations.value = await app.repos.getAllConversations()
  }

  async function loadMessages(conversationId: string) {
    const app = useApp()
    messages.value = await app.repos.getMessagesByConversation(conversationId)
  }

  async function selectConversation(id: string) {
    activeConversationId.value = id
    await loadMessages(id)
  }

  async function newConversation() {
    activeConversationId.value = crypto.randomUUID()
    messages.value = []
    error.value = null
  }

  async function renameConversation(id: string, title: string) {
    const app = useApp()
    await app.repos.updateConversationTitle(id, title)
    await loadConversations()
  }

  async function deleteConversationById(id: string) {
    const app = useApp()
    await app.repos.deleteConversation(id)
    if (activeConversationId.value === id) {
      activeConversationId.value = null
      messages.value = []
    }
    await loadConversations()
  }

  async function togglePinConversation(id: string) {
    const app = useApp()
    const conv = conversations.value.find(c => c.id === id)
    const now = Date.now()
    await app.repos.updateConversationPinned(id, conv?.pinned ? 0 : now)
    await loadConversations()
  }

  async function sendMessage(text: string): Promise<Message | null> {
    const app = useApp()
    if (!activeConversationId.value) return null

    const conversationId = activeConversationId.value
    isLoading.value = true
    error.value = null

    // Ensure conversation exists in DB (INSERT IGNORE handles duplicates)
    await app.repos.createConversation(conversationId)

    // Save user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'user',
      content: text,
      createdAt: Date.now(),
    }
    await app.repos.createMessage(userMsg)
    messages.value = [...messages.value, userMsg]

    // Get history for AI context
    const history = await app.repos.getMessagesByConversation(conversationId)
    const recentHistory = history.slice(0, -1)

    let fullResponse = ''
    try {
      if (app.memoryManager) {
        for await (const chunk of app.memoryManager.chatWithMemory(recentHistory, text)) {
          fullResponse += chunk
        }
      } else {
        throw new Error('请先配置 API Key')
      }
    } catch (err: any) {
      error.value = err.message
      fullResponse = `错误: ${err.message}`
    }

    // Save assistant message
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: 'assistant',
      content: fullResponse,
      createdAt: Date.now(),
    }
    await app.repos.createMessage(assistantMsg)
    await app.repos.updateConversationTime(conversationId)

    // Auto-title (set on first message)
    const title = text.slice(0, 30) + (text.length > 30 ? '...' : '')
    await app.repos.updateConversationTitle(conversationId, title)

    messages.value = [...messages.value, assistantMsg]

    // Async: extract memories
    app.memoryManager?.processTurn(text, fullResponse, conversationId, assistantMsg.id)

    isLoading.value = false
    await loadConversations()
    return assistantMsg
  }

  return {
    conversations, messages, isLoading, error,
    activeConversationId,
    loadConversations, selectConversation,
    newConversation, sendMessage, loadMessages,
    renameConversation, deleteConversationById, togglePinConversation,
  }
}

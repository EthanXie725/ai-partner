import { ref } from 'vue'
import type { Conversation, Message, SearchResult } from '@/types'
import { useApp } from './useApp'
import { searchWeb } from '@/api/repositories'
import { loadConfig } from '@/config'

export function useChat() {
  const conversations = ref<Conversation[]>([])
  const messages = ref<Message[]>([])
  const isLoading = ref(false)
  const activeConversationId = ref<string | null>(null)
  const error = ref<string | null>(null)
  const searchStatus = ref<'idle' | 'searching' | 'done' | 'failed'>('idle')
  const searchResultCount = ref(0)
  const messageSearchResults = ref<Record<string, SearchResult[]>>({})
  const messageReasoning = ref<Record<string, string>>({})
  const reasoningContent = ref('')

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

    // Web search (if enabled)
    let searchResults: SearchResult[] | undefined
    const config = loadConfig()
    if (config.enableWebSearch) {
      searchStatus.value = 'searching'
      searchResultCount.value = 0
      try {
        searchResults = await searchWeb(text)
        searchResultCount.value = searchResults?.length ?? 0
        searchStatus.value = searchResults && searchResults.length > 0 ? 'done' : 'failed'
      } catch (e) {
        console.error('[search] failed:', e)
        searchStatus.value = 'failed'
      }
    }

    // Capture reasoning content
    let currentReasoning = ''

    try {
      if (app.memoryManager) {
        const opts = {
          thinking: config.enableThinking,
          onReasoning: (text: string) => { currentReasoning = text },
        }
        for await (const chunk of app.memoryManager.chatWithMemory(recentHistory, text, searchResults, opts.thinking, opts.onReasoning)) {
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

    // Store search results and reasoning for this message
    if (searchResults && searchResults.length > 0) {
      messageSearchResults.value[assistantMsg.id] = searchResults
    }
    if (currentReasoning) {
      messageReasoning.value[assistantMsg.id] = currentReasoning
    }

    // Async: extract memories
    app.memoryManager?.processTurn(text, fullResponse, conversationId, assistantMsg.id)

    isLoading.value = false
    await loadConversations()
    return assistantMsg
  }

  return {
    conversations, messages, isLoading, error, searchStatus, searchResultCount,
    messageSearchResults, messageReasoning,
    activeConversationId,
    loadConversations, selectConversation,
    newConversation, sendMessage, loadMessages,
    renameConversation, deleteConversationById, togglePinConversation,
  }
}

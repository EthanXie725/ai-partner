import type { AIProvider, MemoryType } from '@/types'
import * as repos from '@/api/repositories'

interface MemoryEntry {
  id: string
  conversationId: string
  memoryType: MemoryType
  summary: string
  embedding: number[]
  createdAt: number
}

/**
 * Semantic store with vector search backed by MySQL persistence.
 * Each conversation turn generates two separate memories:
 * - 'user' memory: what the user talked about / asked / shared
 * - 'assistant' memory: a brief note on what the AI responded
 */
export class SemanticStore {
  private chatProvider: AIProvider
  private embedProvider: AIProvider | null
  private entries: MemoryEntry[] = []
  private loaded = false

  /** chatProvider generates summaries; embedProvider (optional) creates vectors. */
  constructor(chatProvider: AIProvider, embedProvider: AIProvider | null) {
    this.chatProvider = chatProvider
    this.embedProvider = embedProvider
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    try {
      this.entries = await repos.getAllSemanticMemories()
    } catch {
      // Backend not available, start empty
    }
    this.loaded = true
  }

  /**
   * Generate user-focused and assistant-focused summaries,
   * store them locally and persist to the backend.
   */
  async addMemory(conversationId: string, userMessage: string, assistantResponse: string): Promise<void> {
    const memos = await this.generateBothSummaries(userMessage, assistantResponse)

    for (const { memoryType, summary } of memos) {
      if (!summary) continue

      let embedding: number[] = []
      if (this.embedProvider) {
        try {
          const result = await this.embedProvider.embed([summary])
          embedding = result[0] || []
        } catch {
          // Embedding unavailable, store without vector
        }
      }

      const entry: MemoryEntry = {
        id: crypto.randomUUID(),
        conversationId,
        memoryType,
        summary,
        embedding,
        createdAt: Date.now(),
      }

      this.entries.push(entry)

      // Persist to backend (fire-and-forget)
      repos.createSemanticMemory(entry).catch(() => {})
    }
  }

  /**
   * Search for semantically similar past memories, prioritizing user memories.
   */
  async search(query: string, topK = 5): Promise<MemoryEntry[]> {
    await this.ensureLoaded()
    if (this.entries.length === 0 || !this.embedProvider) return []

    let queryEmbedding: number[]
    try {
      const result = await this.embedProvider.embed([query])
      queryEmbedding = result[0] || []
    } catch {
      return []
    }
    if (queryEmbedding.length === 0) return []

    const scored = this.entries.map(entry => ({
      entry,
      score: this.cosineSimilarity(queryEmbedding, entry.embedding),
    }))

    scored.sort((a, b) => b.score - a.score)

    // Take top results, then re-sort by type so user memories come first
    return scored.slice(0, topK).sort((a, b) => {
      if (a.entry.memoryType !== b.entry.memoryType) {
        return a.entry.memoryType === 'user' ? -1 : 1
      }
      return b.score - a.score
    }).map(s => s.entry)
  }

  /**
   * Format search results for inclusion in a system prompt.
   */
  formatMemoriesForPrompt(memories: MemoryEntry[]): string {
    if (memories.length === 0) return ''

    const userMemories = memories.filter(m => m.memoryType === 'user')
    const assistantMemories = memories.filter(m => m.memoryType === 'assistant')

    const parts: string[] = []

    if (userMemories.length > 0) {
      const lines = userMemories.map(m => `- ${m.summary}`)
      parts.push(`用户之前聊过的话题：\n${lines.join('\n')}`)
    }
    if (assistantMemories.length > 0) {
      const lines = assistantMemories.map(m => `- ${m.summary}`)
      parts.push(`你之前给过的回复：\n${lines.join('\n')}`)
    }

    return parts.join('\n\n')
  }

  private async generateBothSummaries(
    userMessage: string,
    assistantResponse: string
  ): Promise<{ memoryType: MemoryType; summary: string }[]> {
    const userSummary = await this.generateSummary(
      userMessage,
      assistantResponse,
      'user'
    )
    const assistantSummary = await this.generateSummary(
      userMessage,
      assistantResponse,
      'assistant'
    )

    return [
      { memoryType: 'user' as const, summary: userSummary },
      { memoryType: 'assistant' as const, summary: assistantSummary },
    ]
  }

  private async generateSummary(
    userMessage: string,
    assistantResponse: string,
    memoryType: MemoryType
  ): Promise<string> {
    const instruction = memoryType === 'user'
      ? '总结这段对话中用户所说的核心内容（用户问了什么、分享了什么、对什么感兴趣），不超过20个字。只返回总结文本。'
      : '用一句话概述你（AI）在这段对话中回复了什么，不超过20个字。只返回总结文本。'

    const prompt = `${instruction}

用户: ${userMessage}
AI: ${assistantResponse}

总结：`

    const chunks: string[] = []
    for await (const chunk of this.chatProvider.chat([
      { role: 'user', content: prompt, id: '', conversationId: '', createdAt: 0 },
    ])) {
      chunks.push(chunk)
    }

    return chunks.join('').trim()
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    if (normA === 0 || normB === 0) return 0
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  async getAll(): Promise<MemoryEntry[]> {
    await this.ensureLoaded()
    return [...this.entries]
  }

  /** Remove a single entry from the in-memory cache (called after DB delete). */
  removeEntry(id: string): void {
    this.entries = this.entries.filter(e => e.id !== id)
  }
}

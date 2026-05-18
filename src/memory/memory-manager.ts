import type { AIProvider, Message, Fact, SearchResult } from '@/types'
import { FactStore } from './fact-store'
import { SemanticStore } from './semantic-store'

function getDateContext(): string {
  const now = new Date()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const w = weekdays[now.getDay()]
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `当前日期和时间：${y}年${m}月${d}日 ${w} ${h}:${min}`
}

const SYSTEM_BASE = `你是一个有记忆能力的聊天伙伴，能记住用户告诉你的关于他们自己的信息。

回答原则：
- 直接、简洁地回答用户的问题
- 如果用户之前告诉过你关于他们的信息（会以"关于用户的已知信息"提供），一定要在回答中自然地引用这些信息，让用户感受到你记住了他们
- "用户之前聊过的话题"和"你之前给过的回复"是过去对话的记忆摘要，可参考以保持连贯
- 只有在用户表现出兴趣或追问时，再深入展开话题
- 不要主动编造关于用户的个人信息`

export class MemoryManager {
  public factStore: FactStore
  public semanticStore: SemanticStore
  private provider: AIProvider

  constructor(provider: AIProvider, embedProvider?: AIProvider | null) {
    this.provider = provider
    this.factStore = new FactStore(provider)
    this.semanticStore = new SemanticStore(provider, embedProvider)
  }

  /**
   * Build a system prompt enriched with facts and semantic memories.
   */
  async buildSystemPrompt(userMessage: string): Promise<string> {
    const parts: string[] = [getDateContext(), SYSTEM_BASE]

    // Retrieve facts
    const facts = await this.factStore.getAllFacts()
    if (facts.length > 0) {
      parts.push(this.factStore.formatFactsForPrompt(facts))
    }

    // Retrieve semantic memories
    const memories = await this.semanticStore.search(userMessage, 3)
    if (memories.length > 0) {
      parts.push(this.semanticStore.formatMemoriesForPrompt(memories))
    }

    return parts.join('\n\n')
  }

  /**
   * After each conversation turn, extract and store new memories.
   */
  async processTurn(
    userMessage: string,
    assistantResponse: string,
    conversationId: string,
    assistantMsgId: string
  ): Promise<void> {
    // Extract facts asynchronously
    try {
      const facts = await this.factStore.extractFacts(userMessage, assistantResponse, assistantMsgId)
      if (facts.length > 0) {
        await this.factStore.saveFacts(facts)
      }
    } catch (e) {
      console.error('[memory] fact extraction failed:', e)
    }

    // Add semantic memory asynchronously
    try {
      await this.semanticStore.addMemory(conversationId, userMessage, assistantResponse)
    } catch (e) {
      console.error('[memory] semantic memory failed:', e)
    }
  }

  formatSearchResultsForPrompt(results: SearchResult[]): string {
    const parts = results.map((r, i) =>
      `[${i + 1}] ${r.title}\n    来源: ${r.url}\n    摘要: ${r.content}`
    )
    return `以下是与用户问题相关的网络搜索结果（供参考，请基于这些信息回答）：\n\n${parts.join('\n\n')}\n\n请基于上述搜索结果回答用户的问题。如果搜索结果与问题无关，请忽略。引用来源时标注编号。`
  }

  /**
   * Chat with memory-enhanced context.
   */
  async *chatWithMemory(
    messages: Message[],
    userMessage: string,
    searchResults?: SearchResult[],
    thinking?: boolean,
    onReasoning?: (text: string) => void,
  ): AsyncIterable<string> {
    const systemPrompt = await this.buildSystemPrompt(userMessage)

    // Append search results if available
    const finalPrompt = searchResults && searchResults.length > 0
      ? systemPrompt + '\n\n' + this.formatSearchResultsForPrompt(searchResults)
      : systemPrompt

    const fullMessages: Message[] = [
      { role: 'system', content: finalPrompt, id: 'system', conversationId: '', createdAt: 0 } as Message,
      ...messages,
      { role: 'user', content: userMessage, id: 'current-user', conversationId: '', createdAt: 0 } as Message,
    ]

    yield* this.provider.chat(fullMessages, { thinking, onReasoning })
  }
}

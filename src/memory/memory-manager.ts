import type { AIProvider, Message, Fact } from '@/types'
import { FactStore } from './fact-store'
import { SemanticStore } from './semantic-store'

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
    const parts: string[] = [SYSTEM_BASE]

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

  /**
   * Chat with memory-enhanced context.
   */
  async *chatWithMemory(
    messages: Message[],
    userMessage: string
  ): AsyncIterable<string> {
    const systemPrompt = await this.buildSystemPrompt(userMessage)

    const fullMessages: Message[] = [
      { role: 'system', content: systemPrompt, id: 'system', conversationId: '', createdAt: 0 } as Message,
      ...messages,
      { role: 'user', content: userMessage, id: 'current-user', conversationId: '', createdAt: 0 } as Message,
    ]

    yield* this.provider.chat(fullMessages)
  }
}

import type { Fact, AIProvider } from '@/types'
import * as repos from '@/api/repositories'

/** Check if two strings are essentially identical after normalization. */
function isSame(a: string, b: string): boolean {
  const norm = (s: string) => s.trim().toLowerCase().replace(/[。，！？、\s]+/g, '')
  return norm(a) === norm(b)
}

function isDuplicate(newFact: { subject: string; predicate: string; object: string }, existing: Fact): boolean {
  return isSame(newFact.subject, existing.subject)
    && isSame(newFact.predicate, existing.predicate)
    && isSame(newFact.object, existing.object)
}

export class FactStore {
  private provider: AIProvider

  constructor(provider: AIProvider) {
    this.provider = provider
  }

  /**
   * Use LLM to extract structured facts from a conversation exchange.
   */
  async extractFacts(userMessage: string, assistantResponse: string, sourceMsgId: string): Promise<Fact[]> {
    const prompt = `从以下对话中提取关于"用户"的事实信息。每条事实以 JSON 数组格式返回，每条包含 subject, predicate, object 字段。
只提取明确的、有价值的事实，不要推测。如果没有值得记住的事实，返回空数组 []。

对话：
用户: ${userMessage}
AI: ${assistantResponse}

请只返回 JSON 数组，不要有其他内容。例如：
[{"subject": "用户", "predicate": "喜欢", "object": "喝咖啡"}]
`

    const chunks: string[] = []
    for await (const chunk of this.provider.chat([
      { role: 'user', content: prompt, id: '', conversationId: '', createdAt: 0 }
    ])) {
      chunks.push(chunk)
    }

    let raw = chunks.join('').trim()
    // Strip markdown code fences if the model wraps JSON in them
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    try {
      const extracted = JSON.parse(raw)
      if (!Array.isArray(extracted)) {
        console.warn('[fact-store] AI response is not array:', raw.slice(0, 200))
        return []
      }
      return extracted.map((item: any) => ({
        id: crypto.randomUUID(),
        subject: item.subject || '用户',
        predicate: item.predicate || '',
        object: item.object || '',
        confidence: 0.8,
        sourceMsgId,
        createdAt: Date.now(),
      }))
    } catch (e) {
      console.warn('[fact-store] failed to parse AI response:', raw.slice(0, 200), e)
      return []
    }
  }

  /**
   * Save extracted facts to the database, skipping exact duplicates.
   */
  async saveFacts(facts: Fact[]): Promise<void> {
    const existing = await repos.getAllFacts()
    for (const fact of facts) {
      const dup = existing.some(e => isDuplicate(fact, e))
      if (!dup) {
        await repos.createFact(fact)
      }
    }
  }

  /**
   * Get all stored facts for memory injection.
   */
  async getAllFacts(): Promise<Fact[]> {
    return repos.getAllFacts()
  }

  /**
   * Format facts for inclusion in a system prompt.
   */
  formatFactsForPrompt(facts: Fact[]): string {
    if (facts.length === 0) return ''
    const lines = facts.map(f => `- ${f.subject} ${f.predicate} ${f.object}`)
    return `关于用户的已知信息（请务必在回答中引用这些你已记住的用户信息）：\n${lines.join('\n')}`
  }

  /**
   * Remove a fact by ID.
   */
  async deleteFact(id: string): Promise<void> {
    await repos.deleteFact(id)
  }
}

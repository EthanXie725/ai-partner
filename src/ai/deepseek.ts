import type { AIProvider, Message, ChatOptions } from '@/types'

export class DeepseekProvider implements AIProvider {
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor(config: { apiKey: string; baseUrl: string; model: string }) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl
    this.model = config.model
  }

  async *chat(messages: Message[], options?: ChatOptions): AsyncIterable<string> {
    const model = options?.thinking ? 'deepseek-reasoner' : this.model
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: false,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Deepseek API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    const reasoning = data.choices?.[0]?.message?.reasoning_content
    const content = data.choices?.[0]?.message?.content ?? ''

    // Only capture reasoning when thinking mode is explicitly enabled
    if (reasoning && options?.thinking && options?.onReasoning) {
      options.onReasoning(reasoning)
    }
    yield content
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    })

    if (response.status === 404) {
      // Embeddings endpoint not supported by this provider/model
      return []
    }

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Deepseek Embedding error: ${response.status} ${err}`)
    }

    const data = await response.json()
    return data.data.map((d: { embedding: number[] }) => d.embedding)
  }
}

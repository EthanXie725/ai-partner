import type { AIProvider, AppConfig, Message, ChatOptions } from '@/types'
import { DeepseekProvider } from './deepseek'

/**
 * Wraps a provider so embed() calls go through the backend proxy
 * (avoids CORS issues with providers like DashScope).
 */
class ProxyEmbedProvider implements AIProvider {
  private inner: AIProvider
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor(inner: AIProvider, apiKey: string, baseUrl: string, model: string) {
    this.inner = inner
    this.apiKey = apiKey
    this.baseUrl = baseUrl
    this.model = model
  }

  async *chat(messages: Message[], options?: ChatOptions) {
    yield* this.inner.chat(messages, options)
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetch('/api/proxy/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: this.apiKey,
        baseUrl: this.baseUrl,
        model: this.model,
        input: texts,
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data?.map((d: { embedding: number[] }) => d.embedding) ?? []
  }
}

export function createProvider(config: AppConfig): AIProvider {
  switch (config.provider) {
    case 'deepseek':
      return new DeepseekProvider(config.deepseek)
    case 'openai':
      return new DeepseekProvider(config.openai)
    case 'claude':
      throw new Error('Claude provider not yet implemented')
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}

/** Remove trailing /v1 from a base URL (the code already adds /v1 to paths). */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/v1\/?$/, '')
}

export function createEmbedProvider(config: AppConfig): AIProvider | null {
  const ec = config.embedding
  if (!ec.provider) return null

  const baseUrl = normalizeBaseUrl(ec.baseUrl)

  // Providers whose base URL contains "dashscope" need a backend proxy (CORS).
  const needsProxy = baseUrl.includes('dashscope')

  if (needsProxy) {
    const inner = new DeepseekProvider({ apiKey: ec.apiKey, baseUrl, model: ec.model })
    return new ProxyEmbedProvider(inner, ec.apiKey, baseUrl, ec.model)
  }

  return new DeepseekProvider({ apiKey: ec.apiKey, baseUrl, model: ec.model })
}

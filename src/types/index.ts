export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  pinned?: number
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
}

export interface Fact {
  id: string
  subject: string
  predicate: string
  object: string
  confidence: number
  sourceMsgId: string
  createdAt: number
}

export type MemoryType = 'user' | 'assistant'

export interface SemanticMemory {
  id: string
  conversationId: string
  memoryType: MemoryType
  summary: string
  embedding: number[]
  createdAt: number
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  thinking?: boolean
  onReasoning?: (text: string) => void
}

export interface AIProvider {
  chat(messages: Message[], options?: ChatOptions): AsyncIterable<string>
  embed(texts: string[]): Promise<number[][]>
}

export interface EmbedConfig {
  provider: 'openai' | 'deepseek' | 'dashscope' | ''
  apiKey: string
  baseUrl: string
  model: string
}

export interface AppConfig {
  provider: 'deepseek' | 'openai' | 'claude'
  deepseek: {
    apiKey: string
    baseUrl: string
    model: string
  }
  openai: {
    apiKey: string
    baseUrl: string
    model: string
  }
  claude: {
    apiKey: string
    baseUrl: string
    model: string
  }
  embedding: EmbedConfig
  enableWebSearch: boolean
  enableThinking: boolean
}

export interface SearchResult {
  title: string
  url: string
  content: string
}

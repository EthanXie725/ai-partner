import type { AppConfig } from '@/types'

const STORAGE_KEY = 'friend-config'

const defaults: AppConfig = {
  provider: 'deepseek',
  deepseek: {
    apiKey: '',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-v4-flash',
  },
  openai: {
    apiKey: '',
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o',
  },
  claude: {
    apiKey: '',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-6',
  },
  embedding: {
    provider: '',
    apiKey: '',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode',
    model: 'text-embedding-v4',
  },
}

export function loadConfig(): AppConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...defaults, ...JSON.parse(stored) }
  } catch { /* ignore */ }
  return { ...defaults }
}

export function saveConfig(config: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function getApiKey(): string {
  const config = loadConfig()
  switch (config.provider) {
    case 'deepseek': return config.deepseek.apiKey
    case 'openai': return config.openai.apiKey
    case 'claude': return config.claude.apiKey
  }
}

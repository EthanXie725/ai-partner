import { ref } from 'vue'
import * as repos from '@/api/repositories'
import { createProvider, createEmbedProvider } from '@/ai/factory'
import { MemoryManager } from '@/memory/memory-manager'
import { loadConfig } from '@/config'
import type { AppConfig } from '@/types'

let app: ReturnType<typeof createApp> | null = null

function createApp() {
  const config = ref<AppConfig>(loadConfig())
  const initialized = ref(false)

  let provider = createProvider(config.value)
  let embedProvider = createEmbedProvider(config.value)
  let memoryManager = new MemoryManager(provider, embedProvider)

  async function init() {
    initialized.value = true
  }

  function reloadProvider() {
    config.value = loadConfig()
    provider = createProvider(config.value)
    embedProvider = createEmbedProvider(config.value)
    memoryManager = new MemoryManager(provider, embedProvider)
  }

  return {
    config, initialized, provider, memoryManager, repos,
    init, reloadProvider,
  }
}

export function useApp() {
  if (!app) app = createApp()
  return app
}

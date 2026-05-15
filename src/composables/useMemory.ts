import { ref } from 'vue'
import type { Fact } from '@/types'
import { useApp } from './useApp'

export function useMemory() {
  const facts = ref<Fact[]>([])
  const semanticMemories = ref<{ id: string; conversationId: string; memoryType: string; summary: string; createdAt: number }[]>([])
  const isLoading = ref(false)

  async function loadFacts() {
    const app = useApp()
    facts.value = await app.repos.getAllFacts()
  }

  async function loadSemanticMemories() {
    const app = useApp()
    if (app.memoryManager) {
      const entries = await app.memoryManager.semanticStore.getAll()
      semanticMemories.value = entries.map(e => ({
        id: e.id,
        conversationId: e.conversationId,
        memoryType: e.memoryType,
        summary: e.summary,
        createdAt: e.createdAt,
      }))
    }
  }

  async function removeFact(factId: string) {
    const app = useApp()
    await app.repos.deleteFact(factId)
    facts.value = facts.value.filter(f => f.id !== factId)
  }

  async function removeSemanticMemory(memoryId: string) {
    const app = useApp()
    await app.repos.deleteSemanticMemory(memoryId)
    app.memoryManager?.semanticStore.removeEntry(memoryId)
    semanticMemories.value = semanticMemories.value.filter(m => m.id !== memoryId)
  }

  return { facts, semanticMemories, isLoading, loadFacts, loadSemanticMemories, removeFact, removeSemanticMemory }
}

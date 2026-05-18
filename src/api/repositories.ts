import type { Conversation, Message, Fact, SearchResult } from '@/types'
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from './client'

// --- Conversations ---

export async function getAllConversations(): Promise<Conversation[]> {
  return apiGet<Conversation[]>('/conversations')
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const res = await fetch(`/api/conversations/${id}`)
  if (res.status === 404) return undefined
  if (!res.ok) throw new ApiError(res.status, `GET /conversations/${id} failed`)
  return res.json()
}

export async function createConversation(id: string, title = ''): Promise<Conversation> {
  return apiPost<Conversation>('/conversations', { id, title })
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await apiPatch(`/conversations/${id}/title`, { title })
}

export async function updateConversationPinned(id: string, pinned: number): Promise<void> {
  await apiPatch(`/conversations/${id}/pinned`, { pinned })
}

export async function updateConversationTime(id: string): Promise<void> {
  await apiPatch(`/conversations/${id}/time`, {})
}

export async function deleteConversation(id: string): Promise<void> {
  await apiDelete(`/conversations/${id}`)
}

// --- Messages ---

export async function getMessagesByConversation(conversationId: string): Promise<Message[]> {
  return apiGet<Message[]>(`/conversations/${conversationId}/messages`)
}

export async function getLastMessages(conversationId: string, limit: number): Promise<Message[]> {
  return apiGet<Message[]>(`/conversations/${conversationId}/messages/last/${limit}`)
}

export async function createMessage(msg: Message): Promise<Message> {
  return apiPost<Message>(`/conversations/${msg.conversationId}/messages`, msg)
}

// --- Facts ---

export async function getAllFacts(): Promise<Fact[]> {
  return apiGet<Fact[]>('/facts')
}

export async function getFactsBySubject(subject: string): Promise<Fact[]> {
  return apiGet<Fact[]>(`/facts?subject=${encodeURIComponent(subject)}`)
}

export async function createFact(fact: Fact): Promise<Fact> {
  return apiPost<Fact>('/facts', fact)
}

export async function deleteFact(id: string): Promise<void> {
  await apiDelete(`/facts/${id}`)
}

// --- Semantic Memories ---

export async function getAllSemanticMemories(): Promise<{ id: string; conversationId: string; memoryType: string; summary: string; embedding: number[]; createdAt: number }[]> {
  return apiGet('/semantic-memories')
}

export async function createSemanticMemory(memory: {
  id: string
  conversationId: string
  memoryType: string
  summary: string
  embedding: number[]
  createdAt: number
}): Promise<void> {
  await apiPost('/semantic-memories', memory)
}

export async function deleteSemanticMemory(id: string): Promise<void> {
  await apiDelete(`/semantic-memories/${id}`)
}

// --- Web Search ---

export async function searchWeb(query: string): Promise<SearchResult[]> {
  const res = await apiPost<{ results: SearchResult[] }>('/search', { query })
  return res.results
}

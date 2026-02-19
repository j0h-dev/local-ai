import type { Conversation } from '@/types/conversation'
import type { ConversationRepository } from './conversation-repository'

const STORAGE_KEY = 'local-ai:conversations'

export class LocalStorageConversationRepository
  implements ConversationRepository
{
  async getAll(): Promise<Conversation[]> {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Conversation[]
  }

  async getById(id: string): Promise<Conversation | null> {
    const all = await this.getAll()
    return all.find((c) => c.id === id) ?? null
  }

  async save(conversation: Conversation): Promise<void> {
    const all = await this.getAll()
    const idx = all.findIndex((c) => c.id === conversation.id)
    if (idx >= 0) {
      all[idx] = conversation
    } else {
      all.unshift(conversation)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  }

  async delete(id: string): Promise<void> {
    const all = await this.getAll()
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(all.filter((c) => c.id !== id)),
    )
  }
}

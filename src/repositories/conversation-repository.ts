import type { Conversation } from '@/types/conversation'

export interface ConversationRepository {
  getAll(): Promise<Conversation[]>
  getById(id: string): Promise<Conversation | null>
  save(conversation: Conversation): Promise<void>
  delete(id: string): Promise<void>
}

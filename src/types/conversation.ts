import type { UIMessage } from 'ai'

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  model: string
  messages: UIMessage[]
  messageModels: Record<string, string>
}

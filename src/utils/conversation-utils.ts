import type { UIMessage } from 'ai'

export function deriveTitle(messages: UIMessage[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return 'New Chat'
  const text = first.parts
    .filter((p) => p.type === 'text')
    .map((p) => p.text)
    .join(' ')
    .trim()
  if (!text) return 'New Chat'
  return text.length > 40 ? `${text.slice(0, 40)}\u2026` : text
}

export function formatRelativeDate(timestamp: number): string {
  const now = new Date()
  const date = new Date(timestamp)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  )
  const diffDays = Math.round(
    (todayStart.getTime() - dateStart.getTime()) / 86400000,
  )
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString()
}

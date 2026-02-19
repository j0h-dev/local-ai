import { useChat } from '@ai-sdk/react'
import { useEffect, useRef, useState } from 'react'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import { useOllamaModels } from '@/hooks/use-ollama-models'
import type { Conversation } from '@/types/conversation'
import { deriveTitle } from '@/utils/conversation-utils'
import { LocalChatTransport } from '@/utils/local-chat-transport'

type UseChatSessionOptions = {
  onTextReset: () => void
  activeConversationId: string | null
  activeConversation: Conversation | null
  onSave: (conversation: Conversation) => void
}

export function useChatSession({
  onTextReset,
  activeConversationId,
  activeConversation,
  onSave,
}: UseChatSessionOptions) {
  const [model, setModel] = useState<string>('')
  const [messageModels, setMessageModels] = useState<Record<string, string>>({})
  const pendingModelRef = useRef<string>('')
  const messageModelsRef = useRef<Record<string, string>>({})
  const activeConversationRef = useRef<Conversation | null>(activeConversation)
  activeConversationRef.current = activeConversation
  const { data: ollamaModels = [], isLoading: modelsLoading } =
    useOllamaModels()

  useEffect(() => {
    if (ollamaModels.length > 0 && !model) {
      setModel(ollamaModels[0].name)
    }
  }, [ollamaModels, model])

  // Restore model and messageModels when switching to a saved conversation.
  // We read from the ref so the effect only re-runs when the id changes, not
  // on every render when activeConversation object reference changes.
  useEffect(() => {
    // activeConversationId is intentionally listed as the only dependency —
    // we want this to fire exactly when the active conversation switches.
    void activeConversationId
    const conv = activeConversationRef.current
    if (conv?.model) {
      setModel(conv.model)
    }
    const initialMessageModels = conv?.messageModels ?? {}
    setMessageModels(initialMessageModels)
    messageModelsRef.current = initialMessageModels
  }, [activeConversationId])

  const { messages, sendMessage, status, regenerate } = useChat({
    id: activeConversationId ?? undefined,
    messages: activeConversation?.messages,
    transport: new LocalChatTransport(),
    onError: (error: Error) => {
      console.error(error)
    },
    onFinish: ({ messages: finishedMessages, isAbort }) => {
      if (isAbort || !activeConversationId) return
      const lastMsg = finishedMessages[finishedMessages.length - 1]
      const finalMessageModels = lastMsg
        ? { ...messageModelsRef.current, [lastMsg.id]: pendingModelRef.current }
        : messageModelsRef.current
      const conversation: Conversation = {
        id: activeConversationId,
        title: deriveTitle(finishedMessages),
        createdAt: activeConversation?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        model,
        messages: finishedMessages,
        messageModels: finalMessageModels,
      }
      onSave(conversation)
    },
  })

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (
      lastMessage?.role === 'assistant' &&
      pendingModelRef.current &&
      !messageModels[lastMessage.id]
    ) {
      const updated = {
        ...messageModels,
        [lastMessage.id]: pendingModelRef.current,
      }
      setMessageModels(updated)
      messageModelsRef.current = updated
    }
  }, [messages, messageModels])

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)
    if (!(hasText || hasAttachments)) {
      return
    }
    pendingModelRef.current = model
    sendMessage(
      {
        text: message.text || 'Sent with attachments',
        files: message.files,
      },
      {
        body: {
          model: model,
        },
      },
    )
    onTextReset()
  }

  const handleRegenerate = () => {
    pendingModelRef.current = model
    regenerate({
      body: {
        model: model,
      },
    })
  }

  return {
    model,
    setModel,
    ollamaModels,
    modelsLoading,
    messages,
    status,
    messageModels,
    handleSubmit,
    handleRegenerate,
  }
}

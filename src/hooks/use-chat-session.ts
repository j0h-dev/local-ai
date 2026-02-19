import { useChat } from '@ai-sdk/react'
import { useEffect, useRef, useState } from 'react'
import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import { useOllamaModels } from '@/hooks/use-ollama-models'
import { LocalChatTransport } from '@/utils/local-chat-transport'

type UseChatSessionOptions = {
  onTextReset: () => void
}

export function useChatSession({ onTextReset }: UseChatSessionOptions) {
  const [model, setModel] = useState<string>('')
  const [messageModels, setMessageModels] = useState<Record<string, string>>({})
  const pendingModelRef = useRef<string>('')
  const { data: ollamaModels = [], isLoading: modelsLoading } =
    useOllamaModels()

  useEffect(() => {
    if (ollamaModels.length > 0 && !model) {
      setModel(ollamaModels[0].name)
    }
  }, [ollamaModels, model])

  const { messages, sendMessage, status, regenerate } = useChat({
    transport: new LocalChatTransport(),
    onError: (error: Error) => {
      console.error(error)
    },
  })

  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (
      lastMessage?.role === 'assistant' &&
      pendingModelRef.current &&
      !messageModels[lastMessage.id]
    ) {
      setMessageModels((prev) => ({
        ...prev,
        [lastMessage.id]: pendingModelRef.current,
      }))
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

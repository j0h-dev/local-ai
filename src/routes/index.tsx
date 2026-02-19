import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { ChatMessageList } from '@/components/chat-message-list'
import { ModelManagerDialog } from '@/components/model-manager-dialog'
import { useChatSession } from '@/hooks/use-chat-session'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [text, setText] = useState<string>('')
  const {
    model,
    setModel,
    ollamaModels,
    modelsLoading,
    messages,
    status,
    messageModels,
    handleSubmit,
    handleRegenerate,
  } = useChatSession({ onTextReset: () => setText('') })

  return (
    <div className="w-full h-full grow flex flex-col p-8">
      <Conversation>
        <ConversationContent>
          <ChatMessageList
            messages={messages}
            messageModels={messageModels}
            onRegenerate={handleRegenerate}
          />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
        {/*<PromptInputHeader>
          <PromptInputAttachmentsDisplay />
        </PromptInputHeader>*/}
        <PromptInputBody>
          <PromptInputTextarea
            onChange={(e) => setText(e.target.value)}
            value={text}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
            <PromptInputSelect
              onValueChange={(value) => {
                setModel(value)
              }}
              value={model}
              disabled={modelsLoading || ollamaModels.length === 0}
            >
              <PromptInputSelectTrigger>
                <PromptInputSelectValue
                  placeholder={modelsLoading ? 'Loading...' : 'Select model'}
                />
              </PromptInputSelectTrigger>
              <PromptInputSelectContent>
                {ollamaModels.map((m) => (
                  <PromptInputSelectItem key={m.name} value={m.name}>
                    {m.name}
                  </PromptInputSelectItem>
                ))}
              </PromptInputSelectContent>
            </PromptInputSelect>
            <ModelManagerDialog />
          </PromptInputTools>
          <PromptInputSubmit disabled={!text && !status} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}

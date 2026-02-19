import type { UIMessage } from 'ai'
import { CopyIcon, RefreshCcwIcon } from 'lucide-react'
import { Fragment } from 'react'
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'

type ChatMessageListProps = {
  messages: UIMessage[]
  messageModels: Record<string, string>
  onRegenerate: () => void
}

export function ChatMessageList({
  messages,
  messageModels,
  onRegenerate,
}: ChatMessageListProps) {
  return (
    <>
      {messages.map((message, messageIndex) => {
        const isLastMessage = messageIndex === messages.length - 1

        return (
          <div className="flex flex-col gap-3" key={message.id}>
            {message.role === 'assistant' && messageModels[message.id] && (
              <p>{messageModels[message.id]}</p>
            )}

            {/* Reasoning */}
            {message.parts.map((part, i) => {
              if (part.type !== 'reasoning') {
                return null
              }

              return (
                <Reasoning
                  key={`${message.id}-${i}`}
                  className="w-full"
                  isStreaming={part.state === 'streaming'}
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              )
            })}

            {message.parts.map((part, i) => {
              switch (part.type) {
                case 'text': {
                  return (
                    <Fragment key={`${message.id}-${i}`}>
                      <Message from={message.role}>
                        <MessageContent>
                          <MessageResponse>{part.text}</MessageResponse>
                        </MessageContent>
                      </Message>
                      {message.role === 'assistant' && isLastMessage && (
                        <MessageActions>
                          <MessageAction onClick={onRegenerate} label="Retry">
                            <RefreshCcwIcon className="size-3" />
                          </MessageAction>
                          <MessageAction
                            onClick={() =>
                              navigator.clipboard.writeText(part.text)
                            }
                            label="Copy"
                          >
                            <CopyIcon className="size-3" />
                          </MessageAction>
                        </MessageActions>
                      )}
                    </Fragment>
                  )
                }
                default:
                  return null
              }
            })}
          </div>
        )
      })}
    </>
  )
}

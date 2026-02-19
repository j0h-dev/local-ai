import { nanoid } from 'nanoid'
import * as React from 'react'
import { conversationRepository } from '@/repositories'
import type { Conversation } from '@/types/conversation'

type ConversationState = {
  conversations: Conversation[]
  activeConversationId: string | null
  isLoading: boolean
}

type ConversationAction =
  | { type: 'LOAD_SUCCESS'; conversations: Conversation[] }
  | { type: 'SET_ACTIVE'; id: string | null }
  | { type: 'UPSERT'; conversation: Conversation }
  | { type: 'DELETE'; id: string }

function reducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return { ...state, conversations: action.conversations, isLoading: false }
    case 'SET_ACTIVE':
      return { ...state, activeConversationId: action.id }
    case 'UPSERT': {
      const idx = state.conversations.findIndex(
        (c) => c.id === action.conversation.id,
      )
      if (idx >= 0) {
        const next = [...state.conversations]
        next[idx] = action.conversation
        return { ...state, conversations: next }
      }
      return {
        ...state,
        conversations: [action.conversation, ...state.conversations],
      }
    }
    case 'DELETE':
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.id),
        activeConversationId:
          state.activeConversationId === action.id
            ? null
            : state.activeConversationId,
      }
    default:
      return state
  }
}

type ConversationContextValue = {
  conversations: Conversation[]
  activeConversationId: string | null
  activeConversation: Conversation | null
  isLoading: boolean
  setActive: (id: string | null) => void
  createNew: () => string
  saveConversation: (conversation: Conversation) => void
  deleteConversation: (id: string) => void
}

const ConversationContext =
  React.createContext<ConversationContextValue | null>(null)

export function ConversationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, dispatch] = React.useReducer(reducer, {
    conversations: [],
    activeConversationId: null,
    isLoading: true,
  })

  React.useEffect(() => {
    conversationRepository.getAll().then((conversations) => {
      dispatch({ type: 'LOAD_SUCCESS', conversations })
    })
  }, [])

  const setActive = React.useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE', id })
  }, [])

  const createNew = React.useCallback(() => {
    const id = nanoid()
    const now = Date.now()
    const placeholder: Conversation = {
      id,
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
      model: '',
      messages: [],
      messageModels: {},
    }
    dispatch({ type: 'UPSERT', conversation: placeholder })
    dispatch({ type: 'SET_ACTIVE', id })
    conversationRepository.save(placeholder)
    return id
  }, [])

  const saveConversation = React.useCallback((conversation: Conversation) => {
    dispatch({ type: 'UPSERT', conversation })
    conversationRepository.save(conversation)
  }, [])

  const deleteConversation = React.useCallback((id: string) => {
    dispatch({ type: 'DELETE', id })
    conversationRepository.delete(id)
  }, [])

  const activeConversation = React.useMemo(
    () =>
      state.conversations.find((c) => c.id === state.activeConversationId) ??
      null,
    [state.conversations, state.activeConversationId],
  )

  const value = React.useMemo(
    () => ({
      conversations: state.conversations,
      activeConversationId: state.activeConversationId,
      activeConversation,
      isLoading: state.isLoading,
      setActive,
      createNew,
      saveConversation,
      deleteConversation,
    }),
    [
      state.conversations,
      state.activeConversationId,
      activeConversation,
      state.isLoading,
      setActive,
      createNew,
      saveConversation,
      deleteConversation,
    ],
  )

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  )
}

export function useConversations(): ConversationContextValue {
  const ctx = React.useContext(ConversationContext)
  if (!ctx) {
    throw new Error('useConversations must be used within ConversationProvider')
  }
  return ctx
}

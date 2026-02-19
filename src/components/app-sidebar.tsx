import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useConversations } from '@/contexts/conversation-context'
import { formatRelativeDate } from '@/utils/conversation-utils'

export function AppSidebar() {
  const {
    conversations,
    activeConversationId,
    createNew,
    setActive,
    deleteConversation,
  } = useConversations()

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const handleNewChat = () => {
    createNew()
  }

  const handleDelete = (id: string) => {
    if (pendingDeleteId === id) {
      deleteConversation(id)
      setPendingDeleteId(null)
    } else {
      setPendingDeleteId(id)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-between p-3">
        <span className="text-sm font-semibold text-sidebar-foreground">
          Local AI
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={handleNewChat}
          title="New Chat"
        >
          <PlusIcon className="size-4" />
          <span className="sr-only">New Chat</span>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Conversations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations.map((conversation) => (
                <SidebarMenuItem key={conversation.id}>
                  <SidebarMenuButton
                    isActive={conversation.id === activeConversationId}
                    onClick={() => setActive(conversation.id)}
                    className="flex flex-col items-start gap-0.5 h-auto py-2"
                  >
                    <span className="truncate w-full text-left text-sm">
                      {conversation.title}
                    </span>
                    <span className="text-xs text-sidebar-foreground/50">
                      {formatRelativeDate(conversation.updatedAt)}
                    </span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    onClick={() => handleDelete(conversation.id)}
                    title={
                      pendingDeleteId === conversation.id
                        ? 'Click again to confirm'
                        : 'Delete'
                    }
                    onBlur={() => setPendingDeleteId(null)}
                    className={
                      pendingDeleteId === conversation.id
                        ? 'text-destructive opacity-100'
                        : undefined
                    }
                  >
                    <Trash2Icon />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

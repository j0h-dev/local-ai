import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ConversationProvider } from '@/contexts/conversation-context'

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  return (
    <TooltipProvider>
      <ConversationProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </ConversationProvider>
    </TooltipProvider>
  )
}

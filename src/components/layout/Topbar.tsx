import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { messages } from '@/config/messages'
import type { AuthUser } from '@/types/auth'

export function Topbar({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {user.municipality?.city ?? messages.app.subtitle}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">{user.name || user.email}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onLogout}>
            <LogOut className="size-4" aria-hidden />
            {messages.nav.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

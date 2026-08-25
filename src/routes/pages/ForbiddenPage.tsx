import { useNavigate } from 'react-router-dom'
import { FullScreenMessage } from '@/components/common/FullScreenMessage'
import { Button } from '@/components/ui/button'
import { LOGIN_ROUTE } from '@/config/constants'
import { messages } from '@/config/messages'
import { useAuth } from '@/hooks/useAuth'

/**
 * Shown to a user with a valid session but a role that cannot operate the
 * panel (citizens and validators use the mobile app).
 */
export function ForbiddenPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <FullScreenMessage
      title={messages.forbidden.title}
      description={messages.forbidden.description}
    >
      <Button
        variant="outline"
        onClick={() =>
          void logout().then(() => navigate(LOGIN_ROUTE, { replace: true }))
        }
      >
        {messages.forbidden.logout}
      </Button>
    </FullScreenMessage>
  )
}

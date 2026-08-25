import { Link } from 'react-router-dom'
import { FullScreenMessage } from '@/components/common/FullScreenMessage'
import { Button } from '@/components/ui/button'
import { messages } from '@/config/messages'
import { useAuth } from '@/hooks/useAuth'
import { homeRouteFor } from '@/routes/routeAccess'

export function NotFoundPage() {
  const { role } = useAuth()

  return (
    <FullScreenMessage
      title={messages.notFound.title}
      description={messages.notFound.description}
    >
      <Button asChild variant="outline">
        <Link to={homeRouteFor(role)}>{messages.notFound.back}</Link>
      </Button>
    </FullScreenMessage>
  )
}

import { useState } from 'react'
import { toast } from 'sonner'
import { normalizeError } from '@/api/client'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { QueryState } from '@/components/common/QueryState'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { messages } from '@/config/messages'
import {
  type PrivacyDecision,
  usePrivacyRequests,
  useResolvePrivacyRequest,
} from './api/privacyRequests'
import { PrivacyRequestsTable } from './components/PrivacyRequestsTable'
import { useNow } from './deadline'
import type { PrivacyRequest, PrivacyRequestState } from './types'

const HTTP_CONFLICT = 409

/**
 * US-043 — bandeja de solicitudes por dato personal visible.
 *
 * Es una sección propia y no un filtro de la bandeja municipal: la resuelve el
 * admin de la plataforma, de todas las municipalidades, y el agente no la ve.
 *
 * Las dos decisiones piden confirmación. La de eliminar, además, dice que es
 * irreversible: el archivo se borra del servidor, no se esconde.
 */
export function PrivacyRequestsPage() {
  const [tab, setTab] = useState<PrivacyRequestState>('pending')
  const pending = usePrivacyRequests('pending')
  const resolved = usePrivacyRequests('resolved')
  const resolve = useResolvePrivacyRequest()
  const now = useNow()
  const [decision, setDecision] = useState<{
    request: PrivacyRequest
    decision: PrivacyDecision
  } | null>(null)

  const confirm = async () => {
    if (!decision) return
    try {
      await resolve.mutateAsync({
        id: decision.request.id,
        decision: decision.decision,
      })
    } catch (error) {
      const apiError = normalizeError(error)
      toast.error(
        apiError.status === HTTP_CONFLICT
          ? messages.privacy.alreadyResolved
          : apiError.message,
      )
      setDecision(null)
      return
    }
    toast.success(
      decision.decision === 'dismiss'
        ? messages.privacy.dismissed
        : decision.request.image.kind === 'report'
          ? messages.privacy.removedReport
          : messages.privacy.removedEvidence,
    )
    setDecision(null)
  }

  const removing = decision?.decision === 'remove-image'

  return (
    <div className="space-y-6">
      <PageHeader
        title={messages.privacy.title}
        description={messages.privacy.description}
      />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as PrivacyRequestState)}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="pending">
            {messages.privacy.tabPending}
            {pending.data && ` (${pending.data.length})`}
          </TabsTrigger>
          <TabsTrigger value="resolved">{messages.privacy.tabResolved}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent>
              <QueryState
                isPending={pending.isPending}
                isError={pending.isError}
                error={pending.error}
                onRetry={() => void pending.refetch()}
                isEmpty={pending.data?.length === 0}
                emptyMessage={messages.privacy.emptyPending}
              >
                <PrivacyRequestsTable
                  requests={pending.data ?? []}
                  variant="pending"
                  now={now}
                  onDecide={(request, chosen) =>
                    setDecision({ request, decision: chosen })
                  }
                />
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardContent>
              <QueryState
                isPending={resolved.isPending}
                isError={resolved.isError}
                error={resolved.error}
                onRetry={() => void resolved.refetch()}
                isEmpty={resolved.data?.length === 0}
                emptyMessage={messages.privacy.emptyResolved}
              >
                <PrivacyRequestsTable
                  requests={resolved.data ?? []}
                  variant="resolved"
                  now={now}
                />
              </QueryState>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(open) => !open && setDecision(null)}
        title={removing ? messages.privacy.removeTitle : messages.privacy.dismissTitle}
        description={
          removing
            ? messages.privacy.removeDescription
            : messages.privacy.dismissDescription
        }
        confirmLabel={
          removing ? messages.privacy.removeConfirm : messages.privacy.dismissConfirm
        }
        variant={removing ? 'destructive' : 'default'}
        isPending={resolve.isPending}
        onConfirm={() => void confirm()}
      />
    </div>
  )
}

import { QueryState } from '@/components/common/QueryState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { messages } from '@/config/messages'
import { useMunicipalAgents } from './api/agents'
import { useMunicipalities } from './api/municipalities'
import { AgentFormDialog } from './components/AgentFormDialog'

/** US-017 — alta y listado de agentes municipales (solo admin de plataforma). */
export function AgentsPage() {
  const agents = useMunicipalAgents()
  const municipalities = useMunicipalities()

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>{messages.agents.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {municipalities.data?.length === 0
              ? messages.agents.noMunicipalities
              : messages.agents.description}
          </p>
        </div>
        <AgentFormDialog municipalities={municipalities.data ?? []} />
      </CardHeader>
      <CardContent>
        <QueryState
          isPending={agents.isPending}
          isError={agents.isError}
          error={agents.error}
          onRetry={() => void agents.refetch()}
          isEmpty={agents.data?.length === 0}
          emptyMessage={messages.agents.empty}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{messages.agents.name}</TableHead>
                <TableHead>{messages.agents.email}</TableHead>
                <TableHead>{messages.agents.municipality}</TableHead>
                <TableHead className="w-56" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.data?.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>{agent.email}</TableCell>
                  <TableCell>{agent.municipality?.city ?? '—'}</TableCell>
                  <TableCell>
                    {agent.must_change_password && (
                      <Badge variant="secondary">
                        {messages.agents.pendingPassword}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueryState>
      </CardContent>
    </Card>
  )
}

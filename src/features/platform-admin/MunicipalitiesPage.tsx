import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { QueryState } from '@/components/common/QueryState'
import { Button } from '@/components/ui/button'
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
import { formatDate } from '@/lib/format'
import { useDeleteMunicipality, useMunicipalities } from './api/municipalities'
import {
  CreateMunicipalityDialog,
  MunicipalityFormDialog,
} from './components/MunicipalityFormDialog'
import type { MunicipalityDetail } from './types'

const labels = messages.municipalities

/** US-017 — alta, edición, baja y listado de municipalidades. */
export function MunicipalitiesPage() {
  const query = useMunicipalities()
  const deleteMunicipality = useDeleteMunicipality()
  const [pendingDeletion, setPendingDeletion] = useState<MunicipalityDetail | null>(
    null,
  )

  const confirmDeletion = async () => {
    if (!pendingDeletion) return
    await deleteMunicipality.mutateAsync(pendingDeletion.id)
    toast.success(labels.deleted)
    setPendingDeletion(null)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{labels.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{labels.description}</p>
          </div>
          <CreateMunicipalityDialog />
        </CardHeader>
        <CardContent>
          <QueryState
            isPending={query.isPending}
            isError={query.isError}
            error={query.error}
            onRetry={() => void query.refetch()}
            isEmpty={query.data?.length === 0}
            emptyMessage={labels.empty}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{labels.city}</TableHead>
                  <TableHead>{labels.province}</TableHead>
                  <TableHead className="w-32">{labels.radius}</TableHead>
                  <TableHead className="w-24">{labels.reports}</TableHead>
                  <TableHead className="w-24">{labels.users}</TableHead>
                  <TableHead className="w-32">{labels.createdAt}</TableHead>
                  <TableHead className="w-44">{labels.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data?.map((municipality) => (
                  <TableRow key={municipality.id}>
                    <TableCell className="font-medium">
                      {/* Entrar al municipio muestra sus reportes. */}
                      <Link
                        to={`/municipalidades/${municipality.id}`}
                        className="text-primary hover:underline"
                      >
                        {municipality.city}
                      </Link>
                    </TableCell>
                    <TableCell>{municipality.province}</TableCell>
                    <TableCell>
                      {municipality.coverage_radius_km
                        ? `${Number(municipality.coverage_radius_km)} km`
                        : labels.noCenter}
                    </TableCell>
                    <TableCell>{municipality.report_count}</TableCell>
                    <TableCell>{municipality.user_count}</TableCell>
                    <TableCell>{formatDate(municipality.created_at)}</TableCell>
                    <TableCell className="flex gap-2">
                      <MunicipalityFormDialog
                        municipality={municipality}
                        trigger={<Button variant="outline">{labels.edit}</Button>}
                      />
                      <Button
                        variant="ghost"
                        onClick={() => setPendingDeletion(municipality)}
                      >
                        {labels.delete}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </QueryState>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingDeletion !== null}
        onOpenChange={(open) => !open && setPendingDeletion(null)}
        title={labels.deleteTitle}
        description={
          pendingDeletion
            ? `${labels.deleteDescription} ${labels.deleteWithData(
                pendingDeletion.report_count,
                pendingDeletion.user_count,
              )}`
            : labels.deleteDescription
        }
        confirmLabel={labels.deleteConfirm}
        variant="destructive"
        isPending={deleteMunicipality.isPending}
        onConfirm={() => void confirmDeletion()}
      />
    </>
  )
}

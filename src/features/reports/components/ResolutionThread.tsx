import { Camera, ShieldAlert, Wrench } from 'lucide-react'
import { messages } from '@/config/messages'
import { OperatorLink } from '@/features/areas/components/OperatorLink'
import { formatDateTime } from '@/lib/format'
import type { PanelReportDetail, ResolutionAppeal, ResolutionEvidence } from '../types'

/**
 * El historial de cierres y objeciones del reporte (US-046 y US-048).
 *
 * Se muestran **todos** los cierres, no el último: cuando hubo una apelación
 * quedan dos partes de trabajo y la gracia es poder compararlos, que es lo que
 * pide el escenario 9 de US-048. La objeción va intercalada entre el cierre que
 * objetó y el que vino después, en el orden en que ocurrió.
 *
 * En el panel se ve **quién** ejecutó cada cierre. Ante el ciudadano responde
 * el área operativa; la identidad del operario es para auditar, y esa es la
 * diferencia entre este componente y el de la app móvil.
 */
export function ResolutionThread({ report }: { report: PanelReportDetail }) {
  if (report.resolution_evidences.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {messages.reportDetail.resolutionEmpty}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {report.resolution_evidences.map((evidence, index) => (
        <div key={evidence.id} className="space-y-3">
          <EvidenceCard
            evidence={evidence}
            // Numerado solo cuando hay más de uno: "Cierre 1" sobre un cierre
            // único es una etiqueta que no distingue nada.
            attempt={report.resolution_evidences.length > 1 ? index + 1 : null}
          />
          {report.resolution_appeals
            .filter((appeal) => appeal.evidence?.id === evidence.id)
            .map((appeal) => (
              <AppealCard key={appeal.id} appeal={appeal} />
            ))}
        </div>
      ))}
    </div>
  )
}

function EvidenceCard({
  evidence,
  attempt,
}: {
  evidence: ResolutionEvidence
  attempt: number | null
}) {
  return (
    <div className="overflow-hidden rounded-lg border-l-2 border-status-resolved bg-status-resolved/5">
      <div className="space-y-1.5 p-3">
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold tracking-wide text-status-resolved uppercase">
          <Wrench className="size-3.5" aria-hidden />
          {attempt === null
            ? messages.reportDetail.resolution
            : messages.reportDetail.resolutionAttempt(attempt)}
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-line">
          {evidence.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(evidence.created_at)}
          {evidence.operational_area
            ? ` · ${messages.reportDetail.resolutionBy(evidence.operational_area.name)}`
            : ''}
        </p>
        {/* Solo en el panel: ante el vecino responde el área (US-038). El
            nombre abre su perfil, igual que el del vecino y el del validador
            en esta misma pantalla. */}
        {evidence.operator && (
          <p className="text-xs text-muted-foreground">
            <OperatorLink operator={evidence.operator} />
          </p>
        )}
      </div>
      {evidence.photo && (
        <img src={evidence.photo} alt="" className="max-h-64 w-full object-cover" />
      )}
    </div>
  )
}

function AppealCard({ appeal }: { appeal: ResolutionAppeal }) {
  return (
    // Sangrada bajo el cierre que objeta, y en rojo: es la contraparte de ese
    // cierre, no un evento suelto de la misma jerarquía.
    <div className="ml-4 overflow-hidden rounded-lg border-l-2 border-status-rejected bg-status-rejected/5">
      <div className="space-y-1.5 p-3">
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold tracking-wide text-status-rejected uppercase">
          <ShieldAlert className="size-3.5" aria-hidden />
          {messages.reportDetail.appeal}
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-line">{appeal.reason}</p>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(appeal.created_at)}
          {appeal.author ? ` · ${appeal.author.name}` : ''}
        </p>
      </div>
      {appeal.photo && (
        <img src={appeal.photo} alt="" className="max-h-64 w-full object-cover" />
      )}
    </div>
  )
}

/** El plazo que le queda al vecino para objetar, si es que corre alguno. */
export function ObjectionDeadline({ report }: { report: PanelReportDetail }) {
  if (report.objection_deadline === null) return null

  return (
    <p className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
      <Camera className="size-3.5 shrink-0" aria-hidden />
      {messages.reportDetail.objectionDeadline(
        formatDateTime(report.objection_deadline),
      )}
    </p>
  )
}

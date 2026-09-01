import { useEffect, useState, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { messages } from '@/config/messages'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  REPORT_CATEGORIES,
  REPORT_STATUS_ORDER,
  type ReportCategory,
  type ReportFilters as Filters,
  type ReportOrdering,
  type ReportStatus,
} from '../types'
import { MultiSelectFilter } from './MultiSelectFilter'

const ZONE_DEBOUNCE_MS = 350

const ORDERING_LABELS: Record<ReportOrdering, string> = {
  '-created_at': messages.reports.ordering.newest,
  created_at: messages.reports.ordering.oldest,
  '-like_count': messages.reports.ordering.mostLiked,
  like_count: messages.reports.ordering.leastLiked,
}

/**
 * Un filtro con su rótulo.
 *
 * Estado y categoría no tenían rótulo visible —solo `aria-label`— y quedaban
 * desalineados con los otros cuatro, que sí lo tenían. Con todos rotulados
 * igual, la barra se lee como una sola fila de controles y no como dos grupos
 * distintos que casualmente están juntos.
 */
function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-medium tracking-wide text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  )
}

interface ReportFiltersProps {
  filters: Filters
  orderings: readonly ReportOrdering[]
  isFiltered: boolean
  onChange: (patch: Partial<Filters>) => void
  onClear: () => void
}

export function ReportFilters({
  filters,
  orderings,
  isFiltered,
  onChange,
  onClear,
}: ReportFiltersProps) {
  // El input de texto se maneja local y se propaga con debounce, para no
  // disparar una request por tecla.
  const [zoneDraft, setZoneDraft] = useState(filters.zone)
  const [syncedZone, setSyncedZone] = useState(filters.zone)
  const debouncedZone = useDebouncedValue(zoneDraft, ZONE_DEBOUNCE_MS)

  // Si la URL cambia desde afuera —el botón de limpiar, el botón atrás del
  // navegador— el borrador se reajusta durante el render, que es el patrón que
  // React recomienda para esto en lugar de un efecto.
  if (filters.zone !== syncedZone) {
    setSyncedZone(filters.zone)
    setZoneDraft(filters.zone)
  }

  useEffect(() => {
    if (debouncedZone !== filters.zone) onChange({ zone: debouncedZone })
    // `filters.zone` queda fuera a propósito: el efecto reacciona al debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedZone])

  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-4 rounded-xl border bg-muted/40 p-3">
      <FilterField label={messages.reports.filters.status}>
        <MultiSelectFilter
          label={messages.reports.filters.status}
          emptyLabel={messages.reports.filters.allStatuses}
          options={REPORT_STATUS_ORDER}
          optionLabel={(status: ReportStatus) => messages.reports.status[status]}
          selected={filters.statuses}
          onChange={(statuses) => onChange({ statuses })}
        />
      </FilterField>

      <FilterField label={messages.reports.filters.category}>
        <MultiSelectFilter
          label={messages.reports.filters.category}
          emptyLabel={messages.reports.filters.allCategories}
          options={REPORT_CATEGORIES}
          optionLabel={(category: ReportCategory) =>
            messages.reports.category[category]
          }
          selected={filters.categories}
          onChange={(categories) => onChange({ categories })}
        />
      </FilterField>

      <FilterField label={messages.reports.filters.zone} htmlFor="zone-filter">
        <InputGroup className="w-56 bg-background">
          <InputGroupAddon>
            <Search className="size-4" aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            id="zone-filter"
            value={zoneDraft}
            placeholder={messages.reports.filters.zonePlaceholder}
            onChange={(event) => setZoneDraft(event.target.value)}
          />
        </InputGroup>
      </FilterField>

      <FilterField label={messages.reports.filters.createdFrom} htmlFor="created-from">
        <Input
          id="created-from"
          type="date"
          className="bg-background"
          value={filters.createdFrom}
          onChange={(event) => onChange({ createdFrom: event.target.value })}
        />
      </FilterField>

      <FilterField label={messages.reports.filters.createdTo} htmlFor="created-to">
        <Input
          id="created-to"
          type="date"
          className="bg-background"
          value={filters.createdTo}
          onChange={(event) => onChange({ createdTo: event.target.value })}
        />
      </FilterField>

      <FilterField label={messages.reports.filters.ordering} htmlFor="ordering">
        <Select
          value={filters.ordering}
          onValueChange={(value) => onChange({ ordering: value as ReportOrdering })}
        >
          <SelectTrigger id="ordering" className="w-48 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderings.map((ordering) => (
              <SelectItem key={ordering} value={ordering}>
                {ORDERING_LABELS[ordering]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      {isFiltered && (
        <Button
          variant="ghost"
          size="lg"
          onClick={onClear}
          className="text-muted-foreground"
        >
          <X className="size-4" aria-hidden />
          {messages.reports.filters.clear}
        </Button>
      )}
    </div>
  )
}

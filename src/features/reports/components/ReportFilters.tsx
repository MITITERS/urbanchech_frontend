import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <div className="flex flex-wrap items-end gap-3">
      <MultiSelectFilter
        label={messages.reports.filters.status}
        emptyLabel={messages.reports.filters.allStatuses}
        options={REPORT_STATUS_ORDER}
        optionLabel={(status: ReportStatus) => messages.reports.status[status]}
        selected={filters.statuses}
        onChange={(statuses) => onChange({ statuses })}
      />
      <MultiSelectFilter
        label={messages.reports.filters.category}
        emptyLabel={messages.reports.filters.allCategories}
        options={REPORT_CATEGORIES}
        optionLabel={(category: ReportCategory) => messages.reports.category[category]}
        selected={filters.categories}
        onChange={(categories) => onChange({ categories })}
      />

      <div className="grid gap-1.5">
        <Label htmlFor="zone-filter">{messages.reports.filters.zone}</Label>
        <Input
          id="zone-filter"
          value={zoneDraft}
          placeholder={messages.reports.filters.zonePlaceholder}
          onChange={(event) => setZoneDraft(event.target.value)}
          className="w-56"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="created-from">{messages.reports.filters.createdFrom}</Label>
        <Input
          id="created-from"
          type="date"
          value={filters.createdFrom}
          onChange={(event) => onChange({ createdFrom: event.target.value })}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="created-to">{messages.reports.filters.createdTo}</Label>
        <Input
          id="created-to"
          type="date"
          value={filters.createdTo}
          onChange={(event) => onChange({ createdTo: event.target.value })}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="ordering">{messages.reports.filters.ordering}</Label>
        <Select
          value={filters.ordering}
          onValueChange={(value) => onChange({ ordering: value as ReportOrdering })}
        >
          <SelectTrigger id="ordering" className="w-48">
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
      </div>

      {isFiltered && (
        <Button variant="ghost" onClick={onClear}>
          {messages.reports.filters.clear}
        </Button>
      )}
    </div>
  )
}

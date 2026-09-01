import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'

const SIZE_CLASS = {
  sm: 'size-7 text-[0.625rem]',
  md: 'size-8 text-[0.6875rem]',
} as const

/**
 * Las iniciales de una persona en un disco.
 *
 * Ninguna de las cuentas del panel tiene foto, así que esto no reemplaza a un
 * avatar: es un ancla visual. En una tabla de veinte filas de nombres, la
 * primera columna sin ninguna marca se lee como un párrafo; con el disco, cada
 * fila arranca en un punto fijo y el ojo baja derecho.
 */
export function InitialsAvatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: keyof typeof SIZE_CLASS
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground',
        SIZE_CLASS[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

/** Formatting helpers for user-facing values. Locale is fixed to es-AR. */

const LOCALE = 'es-AR'

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

/**
 * Cuántos tramos de la dirección se muestran cuando hay que acortarla.
 *
 * Tres alcanzan para ubicar a alguien —«Banco Patagonia, 1145, Santa Fe»— y el
 * resto es lo que agrega el geocodificador: barrio, municipio, pedanía,
 * departamento, provincia, país y código postal. En una fila de tabla o en una
 * tarjeta, esa cola no informa y empuja el ancho.
 */
const ADDRESS_PARTS = 3

/**
 * La dirección, sin la cola administrativa del geocodificador.
 *
 * Nominatim devuelve la jerarquía completa separada por comas. Se conservan los
 * primeros tramos, que son los que identifican el lugar, y se corta el resto.
 * Si la dirección es corta o la escribió una persona a mano, vuelve igual.
 */
export function shortAddress(value: string | null | undefined): string {
  if (!value) return ''
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length <= ADDRESS_PARTS) return parts.join(', ')
  return parts.slice(0, ADDRESS_PARTS).join(', ')
}

/**
 * Iniciales de una persona, para el avatar de la topbar.
 *
 * Toma la primera letra del primer y del último tramo del nombre. Si lo que
 * llega es un correo —el nombre puede venir vacío—, se queda con la primera
 * letra de la parte local, que es lo único que identifica algo ahí.
 */
export function initials(value: string): string {
  const name = value.trim()
  if (name === '') return '?'
  if (name.includes('@')) return name[0].toUpperCase()

  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}

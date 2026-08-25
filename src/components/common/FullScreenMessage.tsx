import type { ReactNode } from 'react'

/** Centered single-message screen: loading, empty and error states reuse it. */
export function FullScreenMessage({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {description && (
        <p className="max-w-prose text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  )
}

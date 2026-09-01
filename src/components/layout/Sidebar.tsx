import { NavLink } from 'react-router-dom'
import { Building2, FileText, ShieldCheck, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandMark, BrandWordmark } from '@/components/common/Brand'
import { messages } from '@/config/messages'
import { canAccessPath } from '@/routes/routeAccess'
import type { Role } from '@/types/auth'

interface NavItem {
  to: string
  label: string
  icon: typeof FileText
}

/**
 * Orden del menú, pensado para los dos roles a la vez.
 *
 * El admin ve municipalidades → agentes → validadores: de lo más general a lo
 * más específico, que es como se dan de alta. El agente ve reportes →
 * validadores, con su pantalla de trabajo primero. Reportes va en el medio para
 * que las dos lecturas salgan bien de una sola lista: el filtro por rol lo saca
 * del menú del admin, que los mira por municipalidad.
 */
const NAV_ITEMS: readonly NavItem[] = [
  { to: '/municipalidades', label: messages.nav.municipalities, icon: Building2 },
  { to: '/agentes', label: messages.nav.agents, icon: ShieldCheck },
  { to: '/reportes', label: messages.nav.reports, icon: FileText },
  { to: '/validadores', label: messages.nav.validators, icon: Users },
]

export function Sidebar({ role }: { role: Role }) {
  // Se filtra con la misma tabla que guarda las rutas: así el sidebar no puede
  // ofrecer un destino que después rebota con «permisos insuficientes».
  const items = NAV_ITEMS.filter((item) => canAccessPath(role, item.to))

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b px-5">
        <BrandMark size="sm" />
        <BrandWordmark className="text-lg" />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {/*
                  La barrita de la izquierda es lo que hace que la sección
                  actual se vea de un vistazo: el relleno solo, tan tenue,
                  obligaba a leer las cuatro etiquetas para ubicarse.
                */}
                <span
                  aria-hidden
                  className={cn(
                    'brand-gradient absolute inset-y-2 left-0 w-[3px] rounded-r-full transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <Icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground/70 group-hover:text-foreground',
                  )}
                  aria-hidden
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 p-3">
        <div className="rounded-lg bg-muted/60 px-3 py-2.5">
          <p className="text-xs font-medium text-foreground">{messages.app.subtitle}</p>
          <p className="text-[0.6875rem] tracking-wide text-muted-foreground">
            {messages.app.tagline}
          </p>
        </div>
      </div>
    </aside>
  )
}

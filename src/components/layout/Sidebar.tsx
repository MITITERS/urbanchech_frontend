import { NavLink } from 'react-router-dom'
import { Building2, FileText, ShieldCheck, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    <aside className="hidden w-60 shrink-0 border-r bg-sidebar md:block">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <span className="text-lg font-semibold">{messages.app.name}</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60',
              )
            }
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { CHANGE_PASSWORD_ROUTE, LOGIN_ROUTE } from '@/config/constants'
import { AgentsPage } from '@/features/platform-admin/AgentsPage'
import { MunicipalitiesPage } from '@/features/platform-admin/MunicipalitiesPage'
import { MunicipalityDetailPage } from '@/features/platform-admin/MunicipalityDetailPage'
import { ValidatorsPage } from '@/features/validators/ValidatorsPage'
import { ChangePasswordPage } from '@/routes/pages/ChangePasswordPage'
import { ForbiddenPage } from '@/routes/pages/ForbiddenPage'
import { LoginPage } from '@/routes/pages/LoginPage'
import { NotFoundPage } from '@/routes/pages/NotFoundPage'
import { ReportDetailPage } from '@/features/reports/ReportDetailPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { HomeRedirect } from '@/routes/HomeRedirect'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { ADMIN_ONLY, AGENT_ONLY } from '@/routes/routeAccess'
import { PANEL_ROLES } from '@/types/auth'

/**
 * Route tree. Paths are in Spanish because they are user visible; everything
 * else stays in English, per the repository convention.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path={LOGIN_ROUTE} element={<LoginPage />} />
      <Route path="/sin-permisos" element={<ForbiddenPage />} />

      {/* Authenticated but outside the shell: nothing else is reachable until
          the temporary password is replaced. */}
      <Route element={<ProtectedRoute />}>
        <Route path={CHANGE_PASSWORD_ROUTE} element={<ChangePasswordPage />} />
      </Route>

      {/* La raíz manda a la primera pantalla del rol, no a una fija. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeRedirect />} />
      </Route>

      {/* El listado global de reportes es del agente. El admin los mira por
          municipalidad, desde la ficha de cada una. */}
      <Route element={<ProtectedRoute allowedRoles={AGENT_ONLY} />}>
        <Route element={<AppShell />}>
          <Route path="/reportes" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* El detalle de un reporte y los validadores: los dos roles del panel. */}
      <Route element={<ProtectedRoute allowedRoles={PANEL_ROLES} />}>
        <Route element={<AppShell />}>
          <Route path="/reportes/:id" element={<ReportDetailPage />} />
          <Route path="/validadores" element={<ValidatorsPage />} />
        </Route>
      </Route>

      {/* Platform-admin-only area (US-017). */}
      <Route element={<ProtectedRoute allowedRoles={ADMIN_ONLY} />}>
        <Route element={<AppShell />}>
          <Route path="/municipalidades" element={<MunicipalitiesPage />} />
          <Route path="/municipalidades/:id" element={<MunicipalityDetailPage />} />
          <Route path="/agentes" element={<AgentsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

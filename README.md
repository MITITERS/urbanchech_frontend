# UrbanCheck — Panel municipal

Panel web de gestión de reportes urbanos, de uso exclusivo del personal de las
municipalidades desde equipos de escritorio. Los ciudadanos y los validadores no
acceden a esta aplicación: usan la app móvil.

| Repositorio                    | Tecnología                                 | Rol                         |
| ------------------------------ | ------------------------------------------ | --------------------------- |
| `MITITERS/urbancheck_backend`  | Django REST Framework + PostgreSQL/PostGIS | API                         |
| `MITITERS/urbancheck_frontend` | Vite + React + TypeScript                  | Panel municipal (este repo) |
| `MITITERS/urbancheck_mobile`   | Expo + React Native + TypeScript           | App ciudadano y validador   |

**Regla transversal:** todo usuario municipal opera exclusivamente sobre los
datos de su propia municipalidad. La API filtra por jurisdicción del lado del
servidor, así que el frontend **nunca** envía el `id` de municipalidad como
parámetro ni ofrece selectores de municipio.

## Stack

| Capa                | Herramienta                                 |
| ------------------- | ------------------------------------------- |
| Build               | Vite 8 + React 19 + TypeScript 6 (`strict`) |
| Estilos             | Tailwind CSS v4                             |
| Componentes         | shadcn/ui (estilo `radix-nova`)             |
| Estado del servidor | TanStack Query + axios                      |
| Estado de UI        | `useState` / Context                        |
| Routing             | React Router                                |
| Formularios         | React Hook Form + Zod                       |
| Mapas               | Leaflet + `react-leaflet` + OpenStreetMap   |
| Tiempo real         | Polling (`refetchInterval`), no WebSockets  |
| Tests               | Vitest + React Testing Library              |
| Calidad             | ESLint + Prettier + Husky + lint-staged     |
| Contenedores        | Docker + Docker Compose                     |

Toda la infraestructura corre on-premise: no se usa ningún servicio cloud
(AWS, GCP, Azure, Vercel, Netlify) ni SDKs que requieran cuenta en la nube.

## Cómo levantar el proyecto

### Local (sin Docker)

```bash
npm install
cp .env.example .env      # ajustá VITE_API_PROXY_TARGET si hace falta
npm run dev               # http://localhost:5173
```

El backend tiene que estar corriendo en `http://localhost:8000` (o donde apunte
`VITE_API_PROXY_TARGET`).

### Con Docker

El backend vive en su propio repositorio y su propio proyecto de Compose.
Levantalo primero, porque es el que crea la red a la que se engancha este
servicio:

```bash
# en urbancheck_backend/
docker compose -f docker-compose.local.yml up

# en urbancheck_frontend/
docker compose up          # http://localhost:5173, con hot reload
```

El contenedor de desarrollo monta el código fuente y proxea `/api` y
`/_allauth` al servicio `django` por la red interna de Compose. Si tu proyecto
de backend tiene otro nombre, la red cambia: mirá `docker network ls` y
exportá `BACKEND_NETWORK=<nombre>`.

Imagen de producción (build con Node, servida por nginx):

```bash
docker build --target runtime -t urbancheck_frontend .
docker run -p 8080:80 -e API_UPSTREAM=http://django:8000 urbancheck_frontend
```

## Variables de entorno

Se versiona `.env.example`; `.env` está en `.gitignore` y nunca se commitea.
Las variables están tipadas en `src/vite-env.d.ts`, así que `import.meta.env`
tiene autocompletado.

| Variable                | Default                 | Para qué sirve                                                                                                                                                                                                                     |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`          | _(vacío)_               | `baseURL` de axios. Vacío significa mismo origen: el dev server y nginx proxean hacia el backend, y no hay CORS que configurar. Poné una URL absoluta solo si el backend vive en otro origen (requiere CORS del lado del backend). |
| `VITE_API_PROXY_TARGET` | `http://localhost:8000` | A dónde reenvía el proxy del dev server. Dentro de Compose: `http://django:8000`. Solo desarrollo.                                                                                                                                 |
| `VITE_USE_POLLING`      | `false`                 | `true` para que Vite detecte cambios por polling. Necesario con bind mounts en Docker sobre macOS/Windows.                                                                                                                         |
| `API_UPSTREAM`          | `http://django:8000`    | Backend al que apunta nginx en la imagen de producción. No es una variable de Vite: se lee al arrancar el contenedor.                                                                                                              |

## Scripts

| Script                                             | Qué hace                           |
| -------------------------------------------------- | ---------------------------------- |
| `npm run dev`                                      | Dev server con HMR                 |
| `npm run build`                                    | Typecheck + bundle de producción   |
| `npm run preview`                                  | Sirve el bundle ya construido      |
| `npm run lint` / `lint:fix`                        | ESLint sobre todo el repo          |
| `npm run format` / `format:check`                  | Prettier                           |
| `npm run typecheck`                                | `tsc -b`, sin emitir               |
| `npm run test`                                     | Vitest en modo run                 |
| `npm run test:watch` / `test:ui` / `test:coverage` | Vitest interactivo, UI y cobertura |

El hook de `pre-commit` (Husky + lint-staged) corre ESLint `--fix` y Prettier
sobre los archivos staged: un commit con un error de lint se rechaza.

## Estructura

```
src/
  api/
    client.ts           # instancia única de axios + interceptores
    endpoints.ts        # rutas de la API centralizadas
    auth.ts             # sesión: login, logout, usuario actual
  components/
    ui/                 # shadcn (generado por CLI, no se edita a mano)
    layout/             # AppShell, Sidebar, Topbar
    common/             # componentes propios reutilizables
  features/             # una carpeta por dominio funcional (vacío por ahora)
  hooks/                # hooks transversales
  lib/
    utils.ts            # cn() y helpers
    queryClient.ts      # configuración de TanStack Query
    queryKeys.ts        # convención de query keys
    session.ts          # persistencia del token
  providers/            # AuthProvider, QueryProvider, AppProviders
  routes/
    index.tsx           # definición del router
    ProtectedRoute.tsx  # guarda por autenticación y por rol
    pages/              # pantallas transversales (login, errores, placeholders)
  types/                # tipos e interfaces compartidos del dominio
  config/
    constants.ts        # intervalo de polling, page size, rutas clave
    messages.ts         # todos los textos visibles al usuario
  test/                 # setup global y helpers de testing
```

Cada carpeta de `features/` es autocontenida y agrupa sus propios
`components/`, `hooks/`, `api/` y `types.ts`. Un feature no importa desde el
interior de otro: lo compartido sube a `components/common/`, `hooks/` o
`types/`.

## Convenciones

**Ramas:** `main` protegida, `develop` de integración,
`feature/<clave-jira>-descripcion-corta` para el trabajo. Los merges a
`develop` van por Pull Request con al menos una aprobación.

**Commits:** [Conventional Commits](https://www.conventionalcommits.org)
(`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).

**Tags:** `v<sprint>.<minor>`.

**Idioma:** el código, los nombres de variables, funciones, componentes y los
comentarios se escriben en **inglés**. Los textos visibles al usuario van en
**español**, centralizados en `src/config/messages.ts` — nunca hardcodeados
dentro de un componente. Las rutas de la URL también son visibles, así que van
en español (`/reportes`, `/usuarios`).

**TypeScript:** `strict: true`. Está prohibido `any` (ESLint lo rechaza); usar
`unknown` con narrowing donde no haya tipo conocido.

**Colores:** se definen como variables CSS de shadcn en `src/index.css` y se
usan por su clase semántica (`bg-primary`, `text-muted-foreground`,
`bg-status-resolved`). Ningún componente hardcodea un color.

## Decisiones técnicas

### Tiempo real por polling, no WebSockets

El listado de reportes refresca solo, con `refetchInterval` apuntando a
`POLLING_INTERVAL_MS` (30 s, en `src/config/constants.ts`), más
`refetchOnWindowFocus: true` para que volver a la pestaña actualice al
instante.

Se descarta Django Channels + Redis porque agrega infraestructura, un segundo
protocolo de transporte y manejo de reconexión, para un panel interno con pocos
usuarios concurrentes y una tolerancia de latencia de decenas de segundos. Si
en un sprint futuro aparece un requisito de latencia sub-segundo, se reevalúa.

### Un solo origen: el API va proxeada

`VITE_API_URL` viene vacía a propósito. El navegador pide `/api/...` al mismo
origen que sirve la app, y el proxy (el dev server en desarrollo, nginx en la
imagen de producción) lo reenvía al backend. Así no hay CORS que configurar en
ningún entorno, y el contenedor de desarrollo puede hablarle al servicio
`django` por la red interna de Compose. Si algún despliegue necesita apuntar a
otro origen, `VITE_API_URL` sigue estando disponible.

### Almacenamiento del token: `localStorage`

El backend usa django-allauth en modo _headless app_, que no setea cookie
`httpOnly`: el token tiene que viajar en el header `X-Session-Token`, así que
JavaScript necesita poder leerlo. Entre los dos stores accesibles desde JS,
`localStorage` le gana a `sessionStorage` porque los agentes trabajan con
varias pestañas y `sessionStorage` obligaría a un login por pestaña. El
trade-off es que un XSS expondría el token; lo aceptamos porque el panel no
renderiza HTML provisto por usuarios. Todo pasa por `src/lib/session.ts`, así
que cambiar de store es tocar un solo archivo.

### Refresh de sesión

allauth headless no tiene _refresh token grant_. Ante un `401`, el interceptor
de respuesta revalida la sesión una única vez (`GET /_allauth/app/v1/auth/session`,
que además rota el token si el backend lo decide) y reintenta el request
original. Si eso falla, limpia la sesión y manda al login. La marca
`_retriedAfterRefresh` en la config del request evita el bucle.

### Errores normalizados

Todo error de la API se colapsa a `{ status, message, fieldErrors }` en
`src/api/client.ts`, cubriendo las tres formas que produce el backend: errores
de campo de DRF, `detail` de DRF y el sobre `errors[]` de allauth. Los
componentes no interpretan payloads crudos. `isApiError()` es el type guard.

### Roles

El panel solo admite `ADMIN_PLATAFORMA` y `AGENTE_MUNICIPAL`. Cualquier otro rol
con sesión válida ve la pantalla de permisos insuficientes, no una redirección
silenciosa: rebotarlo al login parecería una contraseña mal puesta.

La traducción de los valores que manda la API (`admin_plataforma`,
`agente_municipal`, `validador`, `ciudadano`) a las constantes del panel vive en
un único lugar: `ROLE_BY_API_VALUE` en `src/api/auth.ts`. Un valor desconocido
degrada a `CITIZEN`, que es el rol con menos privilegios.

### Alta de municipalidad: provincia → ciudad → radio

El alta es una cascada: se elige la provincia de una lista, eso carga sus
localidades, y elegir una deja puesto el centro del área de cobertura con el
**centroide oficial**. Al administrador solo le queda ajustar el radio.

El catálogo sale de [Georef](https://apis.datos.gob.ar/georef/), el servicio de
división política del Estado argentino, y llega **proxeado por el backend**
igual que Nominatim: el panel no le pega a un tercero y el cacheo vive en un
solo lugar. La provincia entera se trae de una —ninguna pasa de unas pocas
centenas de localidades— y el filtrado por texto ocurre en el cliente, así que
escribir el nombre no dispara una request por tecla.

Dos caminos de escape, porque el formulario no puede depender de que un servicio
externo esté arriba:

- Si Georef no contesta el listado de provincias, se usa una lista estática con
  los códigos INDEC.
- Si no contesta el de localidades, el campo de ciudad pasa a texto libre y el
  centro se marca haciendo clic en el mapa.

### El administrador de plataforma ve reportes por municipio

Es la única lectura del panel que cruza jurisdicciones, y está acotada al rol
`ADMIN_PLATAFORMA`: entrar a una municipalidad muestra sus reportes en lista y
en mapa, igual que la app móvil. El agente municipal sigue viendo solo lo suyo
y recibe `403` si intenta esa ruta.

El mapa dibuja además el área de cobertura del municipio, porque el círculo y
los puntos juntos explican por qué esos reportes y no otros cayeron ahí.

### Superficie de API propia para el panel

El panel consume `/api/panel/...`, no los mismos endpoints que la app móvil. En
el backend esas vistas pasan todas por la capa de jurisdicción, así que un
agente no puede ver datos de otro municipio ni aunque lo pida explícitamente.
Consecuencia visible acá: **pedir un reporte de otra jurisdicción devuelve 404,
no 403**, y el panel lo muestra como "no existe".

### Filtros en la query string

Los filtros y la paginación del listado de reportes viven en la URL, no en
estado del componente (`useReportFilters`). Es lo que permite compartir una
vista filtrada y lo que la hace sobrevivir a un refresh; además la query key
sale de una única fuente, así que el caché no puede desincronizarse de lo que el
agente está mirando.

`status=` vacío significa "el agente limpió el filtro", que es distinto de no
haberlo tocado: sin el parámetro se aplican los tres estados que requieren
atención (Pendiente de Validación, Reportado, En proceso). El default es del
frontend; el endpoint sin parámetros devuelve todos los estados.

### Las acciones de estado las decide el backend

El detalle del reporte trae `available_transitions` calculado desde la máquina
de estados del backend, y el panel renderiza solo eso. No dibuja cinco botones
para deshabilitar cuatro, y la lógica de transiciones sigue viviendo en un solo
lado. Un `409` significa que la vista quedó desactualizada: se avisa y se
recarga el detalle.

### `field` en lugar de `form` (shadcn)

El componente `form` de shadcn quedó reemplazado por `field` en la versión
actual del registro: la integración con React Hook Form ahora se arma con
`Controller` + `<Field>` / `<FieldLabel>` / `<FieldError>`. `src/routes/pages/LoginPage.tsx`
es el ejemplo canónico a copiar.

### Convención de query keys

Documentada en `src/lib/queryKeys.ts`. Las keys van de lo general a lo
específico — `['reportes', 'list', filtros]`, `['reportes', 'detail', id]` — para
que invalidar por prefijo alcance a todas las listas filtradas de una. Ningún
componente arma una key inline.

### Roles

El panel solo admite `ADMIN_PLATAFORMA` y `AGENTE_MUNICIPAL`, y cada uno ve lo
suyo: las municipalidades y los agentes son del administrador de la plataforma;
los reportes y los validadores, del agente municipal. Cualquier otro rol con
sesión válida recibe la pantalla de permisos insuficientes.

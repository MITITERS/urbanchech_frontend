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

### El reporte se nombra por su número de municipio

En pantalla —la tabla, el encabezado del detalle, el popup del mapa— el reporte
se muestra como `#{number}`, que es su número **dentro de su municipalidad** y
como lo nombran el vecino y el municipio. Los enlaces y las llamadas a la API
siguen usando el `id`, que es lo único único en toda la base.

El `?? report.id` de esos tres lugares es un resguardo para un reporte sin
numerar, que hoy no puede existir: el backend lo asigna al crear.

### El proxy preserva el `Host` (y por eso se ven las fotos)

Las tres reglas del proxy —`/api`, `/_allauth`, `/media`— van **sin
`changeOrigin`**, y no es un olvido.

DRF arma las URLs absolutas de los archivos subidos con `build_absolute_uri()`,
o sea a partir del header `Host`. Con `changeOrigin: true` el backend recibe el
host del destino y el detalle de un reporte responde
`http://django:8000/media/...`: un host que solo existe dentro de la red de
Docker. El navegador no lo resuelve y **las fotos quedan en gris**, sin error en
consola ni request fallida en la API.

Preservar el `Host` es además lo que hace verdadero el "un solo origen": la
respuesta trae `http://localhost:5173/media/...` y la sirve el mismo proxy.

La contrapartida es que el `Host` del navegador tiene que estar en el
`ALLOWED_HOSTS` de Django. En local se resuelve con `DJANGO_ALLOWED_HOSTS`, que
ya existía para el mismo tipo de caso (probar desde un dispositivo en la LAN).

Hay un test que lo cubre (`src/test/viteProxy.test.ts`), porque el fallo es
silencioso y `changeOrigin: true` es lo que uno escribe por reflejo.

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

Los dos roles llegan a todo lo que les corresponde; lo que cambia es el alcance
de los datos, y ese recorte lo hace el backend, no la navegación. `ROUTE_ACCESS`
es la única tabla de acceso, y hoy dice:

| Ruta                           | Quién   |
| ------------------------------ | ------- |
| `/reportes` (listado)          | agente  |
| `/reportes/:id` (detalle)      | los dos |
| `/validadores`                 | los dos |
| `/municipalidades`, `/agentes` | admin   |

La única entrada `exact` de la tabla es el listado de reportes, justamente para
separarlo del detalle: el admin no tiene un listado global —mira los reportes por
municipalidad— pero sí abre el detalle, que es a donde lleva esa tabla. Gana la
primera coincidencia, así que la entrada exacta va antes que la de prefijo.

La traducción de los valores que manda la API (`admin_plataforma`,
`agente_municipal`, `validador`, `ciudadano`) a las constantes del panel vive en
un único lugar: `ROLE_BY_API_VALUE` en `src/api/auth.ts`. Un valor desconocido
degrada a `CITIZEN`, que es el rol con menos privilegios.

### Validadores: una pantalla, dos alcances

`/validadores` la comparten los dos roles del panel porque hacen lo mismo; lo
único que cambia es el alcance y de dónde sale la municipalidad:

|                         | Agente municipal        | Admin de plataforma        |
| ----------------------- | ----------------------- | -------------------------- |
| Ve                      | los de su municipalidad | los de todas, con filtro   |
| Al dar de alta          | se le asigna la suya    | la elige, y es obligatoria |
| Columna «Municipalidad» | no (sería constante)    | sí                         |

La ramificación es por rol dentro de `ValidatorsPage`, y no dos páginas: la
tabla, la baja lógica y la reactivación son idénticas, y duplicarlas era
garantizar que se fueran separando.

`ValidatorFormDialog` decide si dibuja el selector por la prop `municipalities`:
si llega la lista hay selector y el campo es obligatorio; si no llega, el backend
asigna la del agente autenticado. No mira el rol por su cuenta para que el mismo
componente sirva en cualquier contexto.

El agente **no** pide `/api/municipalities/`: no elige municipalidad y además la
API se la respondería con `403`. Por eso `useMunicipalities()` acepta `enabled`.

### Habilitados y archivados: dos pestañas, dos consultas

Las dos pantallas de cuentas de trabajo —agentes y validadores— tienen las
mismas dos pestañas: **Habilitados**, que es el trabajo de todos los días, y
**Archivados**, las cuentas dadas de baja. Desactivar mueve la fila de una a la
otra, reactivar la trae de vuelta.

Cada archivado es de su pantalla: un agente archivado no aparece entre los
validadores archivados ni al revés. Son dos secciones distintas porque son dos
cosas distintas.

El corte lo hace el servidor con `?state=active|inactive`, no la pantalla: una
cuenta archivada no tiene que viajar en la respuesta del listado principal ni
ocuparle el paginado a las que sí trabajan.

Las **dos** consultas se piden juntas y no solo la de la pestaña visible. Es lo
que pone el número en el rótulo desde el primer render —«Archivados (3)» sin
tener que entrar— y hace instantáneo el cambio de pestaña. Son dos listas
chicas; si algún día dejan de serlo, se pide solo la visible y el número pasa a
salir del `count` del paginado.

La tabla vive en un componente propio (`AgentsTable`, `ValidatorsTable`) que las
dos pestañas comparten: muestran lo mismo y se diferencian solo en qué hace el
botón de la fila. Desactivar pide confirmación; reactivar no, porque no le saca
nada a nadie.

### Agentes municipales: el mismo tablero que el de validadores

`/agentes` es la misma pantalla que `/validadores` con otro sujeto: tabla con
estado y cifra de actividad, alta con contraseña temporal, y baja lógica con
confirmación. Es la misma gestión —una cuenta de trabajo— y por eso se ve igual.

También comparten el **filtro por municipalidad**: el mismo selector, y vale
para las dos pestañas —habilitados y archivados son dos cortes de la misma
lista, así que elegir un municipio no saca de la pestaña en la que estabas—.

Una limitación heredada, igual en las dos pantallas: el selector se arma con
`/api/municipalities/`, que devuelve solo las municipalidades **activas**. El
personal de una municipalidad dada de baja sigue apareciendo en «Todas las
municipalidades», pero no se lo puede aislar con el filtro.

Dos diferencias, y las dos son del dominio, no de la pantalla:

- **Quién la opera**: solo el administrador de la plataforma. Un agente no da de
  baja a otro; eso lo decide la plataforma, no el municipio.
- **Qué se pierde**: el validador deja de validar en terreno, el agente deja de
  operar el panel. Ninguno pierde la cuenta.

La cifra de actividad es `management_count`, los cambios de estado que hizo desde
el panel: el equivalente de `validation_count` en la tabla del validador.

Son dos páginas y no una parametrizada, a diferencia de `ValidatorsPage`, porque
lo que comparten es la forma y no el comportamiento: distinto endpoint, distinto
permiso, distinto alcance y distintos textos. Unificarlas habría dejado un
componente con más ramas que contenido.

### Dar de baja una municipalidad archiva a su personal

La baja de un municipio desactiva a sus agentes y validadores, que pasan a la
pestaña Archivados de cada pantalla. Como es una consecuencia que ocurre en otro
lado, la pantalla la dice **dos veces**: el diálogo de confirmación la advierte
antes —cuando el municipio tiene personal— y el toast posterior informa cuántas
cuentas quedaron archivadas, con el número que devuelve el propio `DELETE`.

Volver a dar de alta el municipio **no** reactiva a nadie: hay que hacerlo de a
uno desde el archivado. El aviso del diálogo lo dice, para que la baja no se
sienta como algo que se deshace con un clic.

La mutación invalida también `userKeys.all`: sin eso, las tablas de agentes y
validadores seguirían mostrándolos habilitados hasta recargar la página.

En el archivado, el botón **Reactivar** de una cuenta cuya municipalidad está
dada de baja aparece **deshabilitado y con el motivo en el `title`**, no
escondido: esconderlo dejaría al admin sin saber por qué no puede. El backend lo
rechaza igual con un `400`, y ese rechazo ahora se muestra como toast de error
—antes quedaba como promesa sin atrapar, o sea en la consola.

### Una cuenta dada de baja se frena en la puerta

`ProtectedRoute` corta antes de renderizar nada cuando `user.isActive` es falso,
y muestra qué pasó y cómo salir. La alternativa era dejarla entrar a una pantalla
en la que cada consulta responde `403`: la sesión sigue siendo válida, lo que
cambió es que el backend ya no le contesta nada del panel.

El dato llega en `is_work_account_active` desde `/api/users/me/`, y se asume
habilitada si el campo no viene: es lo que hacía un backend anterior a la baja
lógica de agentes.

### Alta de municipalidad: provincia → ciudad → límite

El alta es una cascada: se elige la provincia de una lista, eso carga sus
localidades, y elegir una encuadra el mapa en el **centroide oficial** de la
ciudad. Ahí el administrador traza el límite haciendo clic: cada clic agrega un
vértice, y a partir del tercero el polígono se cierra solo.

Antes esto era un círculo con un radio en kilómetros, y no alcanzaba. Villa
María y Villa Nueva están pegadas y las separa el río Ctalamochita: cualquier
círculo lo bastante grande para cubrir una entera se comía parte de la otra,
porque un círculo no puede saber que hay un límite en el medio. El polígono sí
sigue ese límite, y por eso la ayuda del campo pide explícitamente seguir los
bordes reales.

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

### El admin no tiene módulo de reportes: los ve por municipalidad

`/reportes` —el listado global— es del agente municipal. El administrador de la
plataforma llega a los reportes desde la ficha de cada municipalidad, que es
donde tienen contexto: un listado global suelto sería una segunda puerta a lo
mismo, con la jurisdicción como una columna más en vez de como el marco.

Sí abre el **detalle** de un reporte (`/reportes/:id`), que es a donde lleva esa
tabla y donde viven las acciones de estado. Esa diferencia entre listado y
detalle es lo que hace que `ROUTE_ACCESS` tenga una entrada `exact`: la primera
coincidencia gana, así que la entrada exacta del listado va antes que la del
detalle.

### El perfil de un vecino es un diálogo, no una página

Tocar el nombre del autor de un reporte —o el de cualquier comentario— abre su
perfil en un `Dialog`. No es una ruta a propósito: el agente está triando un
reporte y mandarlo a otra pantalla le hace perder eso de vista. Lo que necesita
saber del vecino entra en una tarjeta.

Las dos consultas se disparan **al abrir**, no al renderizar: un reporte con
diez comentarios traería diez perfiles que nadie miró.

**Medida fija.** El diálogo mide siempre lo mismo, tenga la persona un reporte o
veinte, y la lista es la única zona que scrollea. Dos detalles que lo sostienen:
`flex` pisa la grilla del `DialogContent` base —una grilla no achica a sus hijos
por debajo de su contenido, así que una dirección larga estiraba el modal entero
y aparecía una barra horizontal— y `min-w-0` en la columna deja que el `truncate`
funcione.

Las direcciones se muestran con `shortAddress()`: Nominatim devuelve la
jerarquía completa —«…, Municipio de Villa María, Pedanía Villa María,
Departamento General San Martín, Córdoba, X5900, Argentina»— y en una fila de dos
renglones esa cola no informa. Se conservan los tres primeros tramos, que son los
que ubican el lugar, y la dirección completa queda en el `title`.

Dos reglas que conviven ahí, y no dicen lo mismo:

- **El perfil respeta la privacidad del vecino.** Si lo tiene en privado, no se
  muestran su antigüedad ni su total de reportes, aunque quien mire sea del
  municipio. Es la misma respuesta que recibe cualquiera; el backend no hace
  excepciones por rol.
- **Sus reportes en la jurisdicción se muestran igual.** Son datos que ese
  municipio ya gestiona y que ve en su propio listado: el perfil no le enseña
  nada que no tuviera a un clic.

El listado va por `/api/panel/reports/?author=<id>` y no por el feed ciudadano.
Es lo que hace que el filtro se aplique **sobre** el queryset ya acotado por
jurisdicción: un agente ve lo que esa persona reportó en su municipio, nunca su
actividad en otro.

### Quién decidió el reporte en terreno, y su perfil

El detalle muestra **quién salió a mirarlo y qué decidió** —«Validó» o
«Rechazó»—, junto a la fecha y al vecino que lo creó. Lo ven los dos roles del
panel, que es lo que hace falta para poder preguntarle a esa persona.

El dato ya viajaba dentro del historial de cambios, pero ahí está mezclado con
las acciones del municipio y sin distinguir quién es cada uno: había que leer la
lista entera y saber que «Pendiente de Validación → Reportado» es la validación.

**Lo resuelve el servidor** (`validation`), no el panel. Deducirlo del historial
por el estado de llegada estaría mal por partida doble: `reactivar` también deja
el reporte en _Reportado_ y `cancelar` también lo deja en _Cancelado_, pero las
dos las ejecuta un agente desde el panel. La decisión se identifica por la
transición completa, desde _Pendiente de validación_.

#### El perfil del validador

Tocar su nombre abre un diálogo con **lo que decidió en tu jurisdicción**, con
el mismo patrón que el perfil del vecino: es un diálogo y no una ruta porque
quien lo abre está mirando un reporte, y mandarlo a otra pantalla le hace perder
eso de vista. La consulta se dispara solo al abrir.

Lo que cambia respecto del vecino es qué se lista: al vecino se le muestran los
reportes que **creó**; al validador, los que **decidió**.

Cada fila lleva dos insignias, y no son lo mismo: **qué decidió el validador** y
**cómo terminó el reporte**. Uno que él validó y el municipio canceló después
figura como _Cancelado_, igual que uno que él rechazó — sin separarlos, el
perfil le atribuiría un rechazo que no hizo. Por eso el listado del panel anota
la decisión por fila cuando se lo filtra con `?validated_by=`, en lugar de
dejar que el panel la deduzca del estado.

### El «volver» del detalle depende del rol

Los dos roles llegan al detalle de un reporte desde lugares distintos, así que el
botón de volver no puede ser fijo: el agente viene del listado, que es suyo; el
administrador viene de la ficha de una municipalidad. Mandarlo al listado —que es
lo que hacía— lo dejaba en «permisos insuficientes», y llegando desde ahí no
tenía forma de volver.

Para el admin el destino sale de `report.municipality`, que por eso viaja en el
detalle del panel. Mientras el reporte carga, el botón apunta al listado de
municipalidades y se afina cuando llega la jurisdicción.

### La pantalla de permisos insuficientes tiene dos casos

No es lo mismo una cuenta que **no opera el panel** que una que sí lo opera y
entró a una sección de otro rol:

|         | Ciudadano o validador     | Personal del panel             |
| ------- | ------------------------- | ------------------------------ |
| Mensaje | «usá la aplicación móvil» | «esta sección no es de tu rol» |
| Salida  | cerrar sesión             | volver a su sección            |

(La cuenta **dada de baja** es un tercer caso y vive aparte, en
`ProtectedRoute`: ahí el rol es correcto y el problema es el estado de la
cuenta.)

Decirle a un administrador que use la app móvil es falso, y ofrecerle solo
cerrar sesión lo deja sin salida — que es lo que pasaba al llegar ahí por el
historial del navegador.

### Orden del menú

Una sola lista para los dos roles, ordenada para que las dos lecturas salgan
bien. El admin ve **municipalidades → agentes → validadores**: de lo más general
a lo más específico, que es el orden en que se dan de alta. El agente ve
**reportes → validadores**, con su pantalla de trabajo primero. Reportes va en
el medio de la lista para que el filtro por rol produzca las dos.

### El administrador de plataforma ve reportes por municipio

La vista dentro de cada municipalidad sigue existiendo y está acotada al rol
`ADMIN_PLATAFORMA`: entrar a una municipalidad muestra sus reportes en lista y
en mapa, igual que la app móvil. Es la lectura en contexto de un municipio; el
listado de `/reportes` es la de gestión.

La lista es **la misma que la del agente**, con sus filtros, su orden y su
paginado: sale del mismo `/api/panel/reports/` acotado con `?municipality=<id>`,
no de un endpoint aparte. Tener dos listas distintas terminaba en que el
administrador miraba los reportes de un municipio sin poder filtrarlos, que era
justo lo que sí podía hacer el agente sobre los mismos datos.

El filtro por municipalidad no es un agujero en la jurisdicción: el backend lo
aplica sobre el queryset que la capa de jurisdicción ya acotó, así que a un
agente solo podría achicarle la lista, nunca mostrarle otra.

El mapa dibuja además el límite del municipio, porque el polígono y los puntos
juntos explican por qué esos reportes y no otros cayeron ahí.

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

### Sistema visual: tokens, capa de tema y marca

Toda la paleta vive en `src/index.css` como variables de shadcn. Los
componentes usan las clases semánticas (`bg-primary`, `text-muted-foreground`,
`bg-status-resolved`) y **nunca** escriben un color a mano.

- **Los colores salen del logo de la app móvil** (`urbancheck_mobile/assets/urbancheck_logo.png`),
  medidos sobre el archivo: azul `#0370CE` (primario), verde `#03CB95` y azul
  petróleo `#083150`. Los neutros llevan una pizca de ese azul (hue 250) en
  lugar de ser grises puros, para que los bordes y los textos secundarios
  pertenezcan a la misma familia que la marca.
- **Los estados del reporte necesitan estar en `@theme inline`.** Las variables
  `--status-*` existían sueltas, así que `bg-status-resolved` no generaba
  ninguna regla y todos los badges se veían grises. Una variable de color solo
  se convierte en utilidad si está mapeada como `--color-*` dentro de
  `@theme inline`.
- **La capa de tema va fuera de toda capa CSS.** `src/components/ui/` lo genera
  el CLI y no se edita a mano, así que el ajuste fino de tablas, campos y
  diálogos se hace contra los `data-slot` que esos componentes emiten. Ese
  bloque **no** puede ir dentro de `@layer components`: los componentes traen
  sus medidas como clases de Tailwind (`p-2`, `px-2`, `[--card-spacing:…]`), que
  viven en la capa `utilities`, y en la cascada una capa le gana a la anterior
  sin importar la especificidad. Adentro de una capa, esas reglas se escriben y
  no pintan nada. La contracara es que lo declarado ahí ya no se puede pisar con
  una clase en el call site: por eso solo entran medidas y colores de base, y la
  elevación de las tarjetas sí queda en `@layer components`, donde una pantalla
  todavía puede pedir otra sombra.
- **Los assets de marca están en `public/`** (`urbancheck-mark.png`,
  `favicon.png`, `apple-touch-icon.png`), derivados del PNG del móvil con el
  fondo blanco pasado a transparente. El pin se usa como
  imagen; la palabra «UrbanCheck» se compone con tipografía en
  `src/components/common/Brand.tsx`, para que quede nítida en cualquier tamaño y
  siga al tema.

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

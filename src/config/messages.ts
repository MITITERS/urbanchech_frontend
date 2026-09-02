/**
 * Every user-facing string lives here: components never hardcode Spanish text.
 * Kept as a flat, nested-by-area object so it can be swapped for a real i18n
 * library later without touching call sites.
 */
export const messages = {
  app: {
    name: 'UrbanCheck',
    subtitle: 'Panel municipal',
    /** Bajada del logo, la misma que usa la app móvil. */
    tagline: 'Comunidad Conectada',
    /** Rótulo del dato que la topbar muestra a la izquierda. */
    municipalityLabel: 'Municipio',
  },
  nav: {
    reports: 'Reportes',
    validators: 'Validadores',
    municipalities: 'Municipalidades',
    agents: 'Agentes municipales',
    logout: 'Cerrar sesión',
  },
  common: {
    cancel: 'Cancelar',
    save: 'Guardar',
    saving: 'Guardando…',
    retry: 'Reintentar',
    loadError: 'No pudimos cargar la información.',
    empty: 'Todavía no hay nada para mostrar.',
    yes: 'Sí',
    no: 'No',
  },
  municipalities: {
    title: 'Municipalidades',
    description:
      'Municipios habilitados en la plataforma. El área de cobertura decide qué reportes le llegan a cada uno.',
    create: 'Registrar municipalidad',
    createTitle: 'Nueva municipalidad',
    editTitle: 'Editar municipalidad',
    city: 'Ciudad',
    province: 'Provincia',
    coverage: 'Área de cobertura',
    coverageHelp:
      'Elegí la provincia y la ciudad: el mapa se ubica solo y ahí trazás el límite.',
    provincePlaceholder: 'Elegí una provincia',
    provinceLoading: 'Cargando provincias…',
    cityPlaceholder: 'Elegí una ciudad',
    citySearch: 'Escribí el nombre…',
    cityLoading: 'Cargando ciudades…',
    cityNeedsProvince: 'Elegí primero la provincia',
    cityNoMatches: 'No hay ciudades con ese nombre.',
    cityUnavailable:
      'No pudimos cargar las ciudades de esa provincia. Marcá el centro en el mapa.',
    boundary: 'Límite del municipio',
    boundaryHelp:
      'Hacé clic en el mapa para marcar los vértices del límite. Seguí los bordes reales —un río, una ruta— para que no se pise con el municipio de al lado.',
    boundaryEmpty: 'Todavía no marcaste ningún punto.',
    boundaryPoints: (count: number) =>
      count === 1 ? '1 punto marcado' : `${count} puntos marcados`,
    boundaryTooFew: (missing: number) =>
      missing === 1
        ? 'Falta 1 punto para cerrar el área.'
        : `Faltan ${missing} puntos para cerrar el área.`,
    boundaryUndo: 'Deshacer',
    boundaryClear: 'Borrar todo',
    boundaryColumn: 'Límite',
    boundaryPointsShort: (count: number) => `${count} puntos`,
    noBoundary: 'Sin límite trazado',
    reports: 'Reportes',
    users: 'Usuarios',
    createdAt: 'Alta',
    actions: 'Acciones',
    edit: 'Editar',
    delete: 'Eliminar',
    empty: 'Todavía no hay municipalidades registradas.',
    created: 'Municipalidad registrada.',
    updated: 'Municipalidad actualizada.',
    deleted: 'Municipalidad eliminada.',
    deletedWithStaff: (users: number) =>
      users === 1
        ? 'Municipalidad eliminada. Su cuenta de trabajo quedó archivada.'
        : `Municipalidad eliminada. Sus ${users} cuentas de trabajo quedaron archivadas.`,
    deleteTitle: '¿Eliminar esta municipalidad?',
    deleteDescription:
      'Deja de recibir reportes nuevos y desaparece del listado. Sus reportes y usuarios se conservan para no perder el historial.',
    deleteStaffWarning:
      'Sus agentes y validadores quedan desactivados: pasan al archivado de cada sección y dejan de trabajar. Si volvés a dar de alta la municipalidad, hay que reactivarlos de a uno.',
    deleteWithData: (reports: number, users: number) =>
      `Tiene ${reports} ${reports === 1 ? 'reporte' : 'reportes'} y ${users} ${users === 1 ? 'usuario' : 'usuarios'} asociados.`,
    deleteConfirm: 'Eliminar municipalidad',
    backToList: 'Volver a municipalidades',
    detailReports: 'Reportes del municipio',
    viewList: 'Lista',
    viewMap: 'Mapa',
    noReports: 'Este municipio todavía no recibió reportes.',
    noMarkers: 'Ninguno de los reportes tiene coordenadas para ubicar en el mapa.',
    coverageOf: (city: string) => `Cobertura de ${city}`,
  },
  reports: {
    title: 'Reportes',
    description: 'Reclamos recibidos en tu municipio.',
    empty: 'No hay reportes que coincidan con los filtros.',
    /** Salida al detalle desde una superficie que no es la tabla: el mapa. */
    openDetail: 'Ver el reporte',
    columns: {
      id: '#',
      category: 'Categoría',
      status: 'Estado',
      createdAt: 'Fecha',
      address: 'Ubicación',
      likes: 'Likes',
      operativeArea: 'Área operativa',
    },
    filters: {
      status: 'Estado',
      category: 'Categoría',
      zone: 'Zona',
      zonePlaceholder: 'Buscar por dirección…',
      createdFrom: 'Desde',
      createdTo: 'Hasta',
      ordering: 'Ordenar por',
      clear: 'Limpiar filtros',
      clearDate: 'Quitar la fecha',
      allStatuses: 'Todos los estados',
      allCategories: 'Todas las categorías',
      selected: (count: number) => `${count} seleccionados`,
    },
    ordering: {
      newest: 'Más recientes',
      oldest: 'Más antiguos',
      mostLiked: 'Más apoyados',
      leastLiked: 'Menos apoyados',
    },
    pagination: {
      summary: (from: number, to: number, total: number) => `${from}–${to} de ${total}`,
      previous: 'Anterior',
      next: 'Siguiente',
      pageSize: 'Reportes por página',
      perPage: (size: number) => `${size} por página`,
    },
    status: {
      pendiente_validacion: 'Pendiente de Validación',
      reportado: 'Reportado',
      en_proceso: 'En proceso',
      resuelto: 'Resuelto',
      cancelado: 'Cancelado',
      archivado: 'Archivado',
    },
    category: {
      bache: 'Bache',
      alumbrado: 'Alumbrado',
      basura: 'Basura',
      semaforo: 'Semáforo',
      vereda: 'Vereda',
      otro: 'Otro',
    },
  },
  profile: {
    title: 'Perfil del vecino',
    memberSince: 'Vecino desde',
    reports: 'Reportes',
    reportsHere: 'Reportes en tu municipio',
    reportsInMunicipality: (city: string) => `Reportes en ${city}`,
    private:
      'Este vecino tiene su perfil en privado, así que no se muestran su antigüedad ni su actividad en la plataforma.',
    noReports: 'No tiene reportes en esta jurisdicción.',
    close: 'Cerrar',
    openReport: 'Ver reporte',
  },
  reportDetail: {
    backToList: 'Volver al listado',
    backToMunicipality: 'Volver a la municipalidad',
    notFound: 'Ese reporte no existe o no pertenece a tu municipio.',
    description: 'Descripción',
    location: 'Ubicación',
    noLocation: 'El reporte no tiene coordenadas cargadas.',
    author: 'Vecino',
    likes: 'Apoyos',
    comments: 'Comentarios',
    noComments: 'Todavía no hay comentarios.',
    history: 'Historial de cambios',
    historyEmpty: 'Sin movimientos registrados.',
    initialStatus: 'Alta del reporte',
    reason: 'Motivo',
    actions: 'Acciones',
    awaitingValidation:
      'Este reporte aguarda validación en terreno. Hasta que un validador lo confirme, no hay acciones disponibles desde el panel.',
    finalStatus: 'El reporte llegó a un estado final: no admite más cambios.',
    reasonLabel: 'Motivo de la cancelación',
    reasonPlaceholder: 'Contale al vecino por qué no se puede avanzar.',
    confirmTitle: (action: string) => `¿${action} este reporte?`,
    updated: 'El estado del reporte se actualizó.',
    conflict: 'El reporte cambió de estado mientras lo mirabas. Actualizamos la vista.',
  },
  transitions: {
    procesar: {
      label: 'Comenzar gestión',
      description: 'El reporte pasa a En proceso y el vecino recibe el aviso.',
    },
    resolver: {
      label: 'Confirmar resolución',
      description:
        'El reporte pasa a Resuelto. Es un estado final: no admite cambios posteriores.',
    },
    cancelar: {
      label: 'Cancelar',
      description:
        'El reporte pasa a Cancelado, deja de verse en el feed y en el mapa, y no admite cambios posteriores.',
    },
    archivar: {
      label: 'Archivar',
      description:
        'El reporte pasa a Archivado y deja de verse en el feed y en el mapa.',
    },
    reactivar: {
      label: 'Reactivar',
      description: 'El reporte vuelve a Reportado y recupera su visibilidad pública.',
    },
  },
  validators: {
    title: 'Validadores',
    description:
      'Personal habilitado para verificar en terreno si un reporte corresponde a un problema real. Se dan de alta en tu municipalidad.',
    adminDescription:
      'Personal habilitado para verificar en terreno si un reporte corresponde a un problema real. Elegí en qué municipalidad se da de alta cada uno.',
    noMunicipalities: 'Registrá una municipalidad antes de dar de alta validadores.',
    create: 'Dar de alta un validador',
    createTitle: 'Nuevo validador',
    municipality: 'Municipalidad',
    municipalityPlaceholder: 'Elegí una municipalidad',
    filterByMunicipality: 'Filtrar por municipalidad',
    allMunicipalities: 'Todas las municipalidades',
    name: 'Nombre',
    email: 'Correo electrónico',
    temporaryPassword: 'Contraseña temporal',
    temporaryPasswordHint:
      'El validador la usa una sola vez: la app le exige cambiarla antes de habilitar la validación.',
    state: 'Estado',
    validations: 'Validaciones',
    active: 'Activo',
    inactive: 'Inactivo',
    pendingPassword: 'Contraseña temporal pendiente',
    empty: 'Todavía no diste de alta ningún validador.',
    emptyForMunicipality: 'Esta municipalidad todavía no tiene validadores.',
    created: 'Validador dado de alta.',
    deactivate: 'Desactivar',
    activate: 'Reactivar',
    deactivateTitle: '¿Desactivar a este validador?',
    deactivateDescription:
      'Pierde la posibilidad de validar reportes, pero conserva su acceso a la aplicación como ciudadano común. Las validaciones que ya ejecutó se mantienen en el historial.',
    deactivateConfirm: 'Desactivar validador',
    deactivated: 'El validador ya no puede validar. Lo movimos a Archivados.',
    activated: 'El validador vuelve a estar habilitado.',
    tabActive: 'Habilitados',
    tabArchived: 'Archivados',
    emptyArchived: 'No hay validadores archivados.',
    emptyArchivedForMunicipality: 'Esta municipalidad no tiene validadores archivados.',
    archivedHint:
      'Los validadores que desactivás quedan acá, fuera del listado principal. Reactivá uno para que vuelva a la pestaña Habilitados.',
    cannotReactivate:
      'Su municipalidad está dada de baja. Volvé a darla de alta para poder reactivar a este validador.',
  },
  agents: {
    title: 'Agentes municipales',
    description:
      'Cuentas habilitadas para gestionar el panel de cada municipio. El agente debe cambiar su contraseña en el primer ingreso.',
    create: 'Dar de alta un agente',
    createTitle: 'Nuevo agente municipal',
    name: 'Nombre',
    email: 'Correo electrónico',
    temporaryPassword: 'Contraseña temporal',
    temporaryPasswordHint:
      'El agente la usa una sola vez: el sistema le exige cambiarla al ingresar.',
    municipality: 'Municipalidad',
    municipalityPlaceholder: 'Elegí una municipalidad',
    pendingPassword: 'Contraseña temporal pendiente',
    empty: 'Todavía no hay agentes municipales dados de alta.',
    created: 'Agente municipal dado de alta.',
    state: 'Estado',
    managed: 'Gestiones',
    active: 'Activo',
    inactive: 'Inactivo',
    deactivate: 'Desactivar',
    activate: 'Reactivar',
    deactivateTitle: '¿Desactivar a este agente municipal?',
    deactivateDescription:
      'Deja de operar el panel de su municipalidad de inmediato. La cuenta no se elimina —puede iniciar sesión y el panel le explica qué pasó— y todo lo que gestionó sigue en el historial de cada reporte, con su nombre.',
    deactivateConfirm: 'Desactivar agente',
    deactivated: 'El agente ya no opera el panel. Lo movimos a Archivados.',
    activated: 'El agente vuelve a operar el panel.',
    tabActive: 'Habilitados',
    tabArchived: 'Archivados',
    emptyArchived: 'No hay agentes archivados.',
    filterByMunicipality: 'Filtrar por municipalidad',
    allMunicipalities: 'Todas las municipalidades',
    emptyForMunicipality: 'Esta municipalidad todavía no tiene agentes.',
    emptyArchivedForMunicipality: 'Esta municipalidad no tiene agentes archivados.',
    archivedHint:
      'Los agentes que desactivás quedan acá, fuera del listado principal. Reactivá uno para que vuelva a la pestaña Habilitados.',
    cannotReactivate:
      'Su municipalidad está dada de baja. Volvé a darla de alta para poder reactivar a este agente.',
    noMunicipalities:
      'Registrá primero una municipalidad para poder darle de alta su agente.',
  },
  auth: {
    loginTitle: 'Ingresar al panel',
    email: 'Correo electrónico',
    password: 'Contraseña',
    submit: 'Ingresar',
    submitting: 'Ingresando…',
    invalidCredentials: 'Correo o contraseña incorrectos.',
    sessionExpired: 'Tu sesión expiró. Ingresá nuevamente.',
    checkingSession: 'Verificando sesión…',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
  },
  changePassword: {
    title: 'Cambiá tu contraseña',
    description:
      'Estás usando una contraseña temporal. Definí una nueva para continuar.',
    currentPassword: 'Contraseña actual',
    newPassword: 'Contraseña nueva',
    confirmPassword: 'Repetir contraseña nueva',
    submit: 'Guardar contraseña',
  },
  errors: {
    unexpected: 'Ocurrió un error inesperado. Intentá de nuevo.',
    network: 'No pudimos comunicarnos con el servidor.',
    notFound: 'No encontramos lo que buscabas.',
    forbidden: 'No tenés permisos para realizar esta acción.',
  },
  forbidden: {
    title: 'Permisos insuficientes',
    description:
      'Esta aplicación es de uso exclusivo del personal municipal. Si sos ciudadano o validador, usá la aplicación móvil de UrbanCheck.',
    // Para quien sí opera el panel pero entró a una sección de otro rol.
    sectionTitle: 'Esta sección no es de tu rol',
    sectionDescription:
      'Tu cuenta opera el panel, pero esta pantalla pertenece a otro rol. Volvé a tu sección para seguir trabajando.',
    goHome: 'Volver a mi sección',
    logout: 'Cerrar sesión',
    // Para una cuenta de trabajo dada de baja por el admin de la plataforma.
    deactivatedTitle: 'Tu cuenta está desactivada',
    deactivatedDescription:
      'El administrador de la plataforma desactivó tu cuenta, así que por ahora no podés operar el panel. Escribile si creés que es un error: tus datos y todo lo que gestionaste siguen intactos.',
  },
  notFound: {
    title: 'Página no encontrada',
    description: 'La dirección a la que quisiste entrar no existe.',
    back: 'Volver al inicio',
  },
} as const

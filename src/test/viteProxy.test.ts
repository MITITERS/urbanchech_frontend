import { describe, expect, it } from 'vitest'
import type { ProxyOptions, UserConfig } from 'vite'
import viteConfig from '../../vite.config'

/**
 * El proxy del dev server tiene que **preservar el `Host` original**.
 *
 * DRF arma las URLs absolutas de los archivos subidos con
 * `build_absolute_uri()`, o sea a partir de ese header. Con `changeOrigin: true`
 * el backend recibe el Host del destino y responde
 * `http://django:8000/media/...`: un host que solo existe dentro de la red de
 * Docker, que el navegador no resuelve y que deja las fotos en gris.
 *
 * Es un fallo silencioso —no hay error en consola ni request fallida en la API,
 * solo una imagen que no carga—, y `changeOrigin: true` es lo que uno escribe
 * por reflejo al montar un proxy. De ahí este test.
 */
async function resolveProxy(): Promise<Record<string, string | ProxyOptions>> {
  const resolved = (await (typeof viteConfig === 'function'
    ? viteConfig({ command: 'serve', mode: 'development' })
    : viteConfig)) as UserConfig

  const proxy = resolved.server?.proxy
  if (!proxy) throw new Error('El dev server tiene que proxear la API.')
  return proxy
}

describe('proxy del dev server', () => {
  it('proxea la API, allauth y los archivos subidos', async () => {
    const proxy = await resolveProxy()

    expect(Object.keys(proxy).sort()).toEqual(['/_allauth', '/api', '/media'])
  })

  it('no reescribe el Host: es de donde salen las URLs de las fotos', async () => {
    const proxy = await resolveProxy()

    for (const [prefix, options] of Object.entries(proxy)) {
      expect(
        typeof options === 'string' ? undefined : options.changeOrigin,
        `${prefix} no debe usar changeOrigin`,
      ).toBeFalsy()
    }
  })
})

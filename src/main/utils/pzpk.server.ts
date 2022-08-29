import { createServer, type Server, type ServerResponse, type IncomingMessage } from 'http'
import type { PZLoader } from 'pzpack'
import * as mime from 'mime'
import { appLogger } from './logger'

const parseRange = (range: string | undefined, total: number) => {
  if (!range) return undefined

  const parts = range
    .trim()
    .replace(/bytes=/, '')
    .split('-')
  const start = parseInt(parts[0], 10)
  const end = Math.min(total - 1, parts[1] ? parseInt(parts[1], 10) : total - 1)

  return { start, end }
}

class EleanorServer {
  private server?: Server
  private port?: number

  private bindingLoader?: PZLoader
  private bindingHash?: string

  binding(hash: string, loader: PZLoader) {
    if (ENV_DEV) appLogger.debug('EleanorServer binding:' + hash)
    this.bindingHash = hash
    this.bindingLoader = loader
  }
  unbind () {
    this.bindingHash = undefined
    this.bindingLoader = undefined
  }
  close() {
    if (this.server) {
      this.server.close()
      this.server = undefined
    }
  }
  start(port: number, force?: boolean) {
    if (this.server) {
      if (!force) return
      this.close()
    }

    this.port = port
    this.server = createServer((req, res) => {
      this.process(req, res)
    })

    return new Promise<void>((resolve) => {
      this.server!.listen(this.port, () => {
        if (ENV_DEV) appLogger.debug('EleanorServer start at port ' + this.port)
        resolve()
      })
    })
  }

  private async process(req: IncomingMessage, res: ServerResponse) {
    if (!req.url) return this.responseError(res)
    if (!this.bindingHash || !this.bindingLoader) return this.responseError(res, 500, 'pzpack file not opened')

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
    if (ENV_DEV) appLogger.debug('EleanorServer request: ' + parsedUrl.toString())
    const pathname = decodeURI(parsedUrl.pathname)

    if (pathname.startsWith('/file/')) {
      return this.responseFile(pathname, req, res)
    } else {
      return this.responseError(res, 404, `${parsedUrl.pathname} not found`)
    }
  }
  private responseError(res: ServerResponse, code = 500, err?: string) {
    res.writeHead(
      code,
      this.createHead({
        'content-type': 'text/html; charset=utf-8',
      }),
    )
    res.end(err || 'Unknown Error')
  }
  private async responseFile(pathname: string, req: IncomingMessage, res: ServerResponse) {
    if (!this.bindingLoader) {
      return this.responseError(res, 500, 'pzpack file not opened')
    }
    const pathParts = pathname.split('/').filter(s => !!s)
    if (this.bindingHash !== pathParts[1]) {
      return this.responseError(res, 403, 'hash check failed')
    }
    const fid = parseInt(pathParts[2], 10)

    const loader = this.bindingLoader
    const idx = loader.index
    const file = idx.fileOfId(fid)
    if (!file) return this.responseError(res, 404, 'file not found')

    const range = parseRange(req.headers && req.headers.range, file.originSize)
    const start = range?.start ?? 0
    const end = (range?.end ?? file.originSize - 1) + 1
    const chunksize = end - start
    const contentType = mime.getType(file.fullname) ?? 'application/octet-stream'

    if (ENV_DEV) appLogger.debug(`request file: start = ${start}, end=${end}, size = ${file.originSize}, chunk = ${chunksize}`)
    if (range) {
      res.writeHead(
        206,
        this.createHead({
          'Content-Range': `bytes ${start}-${end - 1}/${file.originSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        }),
      )
    } else {
      res.writeHead(
        200,
        this.createHead({
          'content-type': contentType,
          'content-length': chunksize,
        }),
      )
    }
    if (req.method === 'HEAD') {
      res.end()
      return
    }

    let offset = start
    const reader = loader.craeteFileReader(file)
    const writeRes = async () => {
      const data = await reader.readByBlock(offset, end)
      res.write(data)

      offset += data.byteLength
      if (offset >= end) {
        if (ENV_DEV) appLogger.debug(`response file length = ${offset}`)
        res.end()
      }
    }

    res.on('close', () => {
      appLogger.info('file response close')
    })
    res.on('drain', () => {
      writeRes()
    })
    writeRes()
  }

  private createHead(headStatus: Record<string, string | number>) {
    return Object.assign(
      {
        server: 'pzmv-simple-server',
        'cache-control': 'max-age=3600',
        'access-control-allow-headers': 'Origin, X-Requested-With, Content-Type, Accept, Range',
        'access-control-allow-origin': '*',
      },
      headStatus,
    )
  }
}

export type { EleanorServer }
export const instance = new EleanorServer()

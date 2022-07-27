import { createServer, type Server, type ServerResponse, type IncomingMessage } from 'http'
import type { PZLoader } from 'pzpack'
import { AppLogger } from './logger'

/*
  url matching
  /:id/videos
  /:id/playlist.pls
  /:id/:fid/:filename
 */

type ErrorResult = {
  type: 'error'
  message: string
}
type PlaylistResult = {
  type: 'playlist'
}
type FileResult = {
  type: 'file'
  fid: number
  filename: string
}
type PathMatchingResult = ErrorResult | PlaylistResult | FileResult

class EleanorServer {
  private server?: Server
  private port?: number

  private bindingLoader?: PZLoader
  private bindingHash?: string
  binding(hash: string, loader: PZLoader) {
    this.bindingHash = hash
    this.bindingLoader = loader
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
        AppLogger.debug('EleanorServer start at port ' + this.port)
        resolve()
      })
    })
  }

  private parsePath(p: string): PathMatchingResult {
    const items = p.split('/').filter((n) => n !== '')
    if (items[0] !== this.bindingHash!) {
      return {
        type: 'error',
        message: 'loader hash invalid',
      }
    }

    if (items.length === 2 && items[1] === 'playlist.pls') {
      return { type: 'playlist' }
    }
    if (items.length === 3) {
      const fid = parseInt(items[1], 10)
      const filename = items[2] === 'play.mpd' ? 'output.mpd' : items[2]

      return {
        type: 'file',
        fid,
        filename,
      }
    }

    return { type: 'error', message: 'url invalid' }
  }
  private async process(req: IncomingMessage, res: ServerResponse) {
    if (!req.url) return this.responseError(res)
    if (!this.bindingHash || !this.bindingLoader) return this.responseError(res, 'pzpack file not opened')

    const parsedUrl = new URL(req.url, `http://${req.headers.host}`)
    AppLogger.debug('EleanorServer request: ' + parsedUrl.toString())
    const pathname = decodeURI(parsedUrl.pathname)
    const presult = this.parsePath(pathname)

    switch (presult.type) {
      case 'file':
        return this.responseFile(res, presult)
      case 'playlist':
        return this.responsePlaylist(res)
      case 'error':
        return this.responseError(res, presult.message)
      default:
        return this.responseError(res)
    }
  }

  private responseError(res: ServerResponse, err?: string) {
    res.writeHead(
      500,
      this.createHead({
        'content-type': 'text/html; charset=utf-8',
      }),
    )
    res.end(err || 'Unknown Error')
  }
  private responsePlaylist(res: ServerResponse) {
    const loader = this.bindingLoader!
    if (loader.type !== 'PZVIDEO') {
      return this.responseError(res, 'opened file is not a pzvideo file')
    }

    const idx = loader.loadIndex()
    const { folders } = idx.getChildren(idx.root)
    const texts = ['[playlist]']
    folders.forEach((f, i) => {
      texts.push(`File${i + 1}=http://localhost:${this.port}/${this.bindingHash}/${f.id}/play.mpd`)
      texts.push(`Title${i + 1}=${f.name}`)
    })
    texts.push('')
    texts.push('NumberOfEntries=' + folders.length)
    texts.push('Version=2')
    const data = texts.join('\n')

    res.writeHead(
      200,
      this.createHead({
        'content-type': 'application/text; charset=utf-8',
        'cache-control': 'no-store',
      }),
    )
    res.end(data)
  }
  private async responseFile(res: ServerResponse, options: FileResult) {
    const loader = this.bindingLoader!

    const idx = loader.loadIndex()
    const file = idx.findFile(options.fid, options.filename)
    if (!file) return this.responseError(res, 'file not found')
    res.writeHead(
      200,
      this.createHead({
        'content-type':
          options.filename === 'output.mpd'
            ? 'application/dash+xml; charset=utf-8'
            : 'application/octet-stream; charset=utf-8',
      }),
    )

    const reader = loader.fileReader(file)
    let notEnd = true
    while (notEnd) {
      const result = await reader.read(65536)
      res.write(result.data)
      notEnd = !result.end
    }
    reader.destory()

    res.end()
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

import type { PZFilePacked, PZLoader, PZFolder } from 'pzpack'
import { parseStringPromise } from 'xml2js'
import { default as parseXsdDuration } from 'parse-xsd-duration'

export const mergeCls = (...cls: (string | undefined | boolean)[]) => {
  return cls.filter((c) => typeof c === 'string').join(' ')
}

export const formatSize = (size: number, fixed: number = 1) => {
  const unit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

  let c = 0
  let res = size
  while (res > 1000 && c < unit.length) {
    res = res / 1024
    c++
  }
  return `${res.toFixed(fixed)} ${unit[c]}`
}

export const isImageFile = (file: PZFilePacked) => {
  return ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'].includes(file.ext)
}

export const FirstLetterUpper = (str: string) => {
  return str[0].toUpperCase() + str.slice(1)
}

export const parseVideoTime = async (loader: PZLoader, videoFolder: PZFolder) => {
  if (loader.type !== 'PZVIDEO') return 0

  const idx = loader.loadIndex()
  const mpdFile = idx.findFile(videoFolder.id, 'output.mpd')
  if (!mpdFile) return 0

  const data = await loader.loadFileAsync(mpdFile)
  const xmlStr = data.toString('utf8')
  const xmlObj = await parseStringPromise(xmlStr)

  const duration = xmlObj?.MPD?.$?.mediaPresentationDuration as string
  if (!duration) return 0

  const time = parseXsdDuration(duration)
  return time
}

export const formatTime = (timeSeconds: number) => {
  const hours = Math.trunc(timeSeconds / 3600)
  const minutes = Math.trunc(timeSeconds / 60) % 60
  const seconds = Math.trunc(timeSeconds) % 60

  const f2 = (s: number) => {
    return ('00' + s.toString()).slice(-2)
  }

  return `${f2(hours)}:${f2(minutes)}:${f2(seconds)}`
}

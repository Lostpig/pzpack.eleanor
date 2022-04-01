import type { PZFilePacked, PZFolder } from 'pzpack'
import { parseStringPromise } from 'xml2js'
import { default as parseXsdDuration } from 'parse-xsd-duration'
import { formatTime, createUrl } from '../lib/utils'

export { formatTime, createUrl }

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

export const parseVideoTime = async (port: number, videoFolder: PZFolder) => {
  const url = createUrl(port, videoFolder.id, 'output.mpd')
  const resp = await fetch(url)
  const xmlText = await resp.text()
  const xmlObj = await parseStringPromise(xmlText)

  const duration = xmlObj?.MPD?.$?.mediaPresentationDuration as string
  if (!duration) return 0

  const time = parseXsdDuration(duration)
  return time
}

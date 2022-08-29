import { type PZFilePacked, PZExceptions } from 'pzpack'
import { formatTime, formatFileSize, createFileUrl, lazyValue } from '../lib/utils'
import type { TFunction } from 'react-i18next'
import { errorCodes } from 'lib/exceptions'

export { formatTime, formatFileSize, createFileUrl, lazyValue }

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
  return ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'].includes(file.ext.toLowerCase())
}
export const isVideoFile = (file: PZFilePacked) => {
  return ['.mp4', '.mkv', '.avi', '.wmv', '.rmvb', '.mts'].includes(file.ext.toLowerCase())
}

export const FirstLetterUpper = (str: string) => {
  return str[0].toUpperCase() + str.slice(1)
}

export const defFilters = {
  PZPack: { name: 'PZPack', extensions: ['pzpk'] },
  PZPwBook: { name: 'PZPasswordBook', extensions: ['pzpwb'] },
}

const chars = '!@#$%^&*()-=_+[]{}:;<>,.?~1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const randomPassword = () => {
  const l = chars.length
  const p = []
  for (let i = 0; i < 24; i++) {
    const x = Math.floor(Math.random() * l)
    p.push(chars[x])
  }
  return p.join('')
}

export const errorMessage = (err: unknown, t: TFunction<"translation", undefined>) => {
  if (err instanceof Error) {
    if (PZExceptions.isPZError(err)) {
      return t(err.errorCode, err.params)
    } else {
      return t(errorCodes.Other, { message: err.message ?? '' })
    }
  } else {
    const e = err as any
    if (e?.errorCode) {
      return t(e.errorCode, e?.params)
    }
  }

  return t(errorCodes.Unknown, { message: '' })
}
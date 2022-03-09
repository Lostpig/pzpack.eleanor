import { PZFilePacked } from 'pzpack'

export const mergeCls = (...cls: (string | undefined | boolean)[]) => {
  return cls.filter((c) => typeof c === 'string').join(' ')
}

export const formatSize = (size: number, fixed: number = 1) => {
  const unit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

  let c = 0
  while (size > 1000 && c < unit.length) {
    size = size / 1024
    c++
  }
  return `${size.toFixed(fixed)} ${unit[c]}`
}

export const isImageFile = (file: PZFilePacked) => {
  return ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'].includes(file.ext)
}

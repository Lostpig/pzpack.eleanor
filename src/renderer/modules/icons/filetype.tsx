import React from 'react'

const getFileTypeImg = (type: string | undefined) => {
  const t = type?.toLowerCase() ?? ''

  let img = 'unknown.png'
  if (t === 'folder') {
    img = 'folder.png'
  } else if (['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'].includes(t)) {
    img = 'image.png'
  } else if (['.mp4', '.avi', '.mkv', '.wmv'].includes(t)) {
    img = 'video.png'
  } else if (['.mp3', '.ogg', '.flac', '.ape'].includes(t)) {
    img = 'audio.png'
  }

  return './assets/img/' + img
}

export const FiletypeIcon = (props: { size: number; type: string }) => {
  const { size, type } = props
  const img = getFileTypeImg(type)

  return <img src={img} alt="" style={{ width: `${size}px`, height: `${size}px` }} />
}

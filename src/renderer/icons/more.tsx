import React from 'react'

export const MoreIcon = (props: { size: number }) => {
  const { size } = props
  return (
    <svg viewBox="0 0 1024 1024" version="1.1" width={size} height={size} style={{ fill: 'currentcolor' }}>
      <path d="M232 511m-56 0a56 56 0 1 0 112 0 56 56 0 1 0-112 0Z"></path>
      <path d="M512 511m-56 0a56 56 0 1 0 112 0 56 56 0 1 0-112 0Z"></path>
      <path d="M792 511m-56 0a56 56 0 1 0 112 0 56 56 0 1 0-112 0Z"></path>
    </svg>
  )
}

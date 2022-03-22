import React from 'react'

export const InfoIcon = (props: { size: number }) => {
  const { size } = props
  return (
    <svg viewBox="0 0 1024 1024" version="1.1" width={size} height={size} style={{ fill: 'currentcolor' }}>
      <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path>
      <path d="M512 336m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0Z"></path>
      <path d="M536 448h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"></path>
    </svg>
  )
}

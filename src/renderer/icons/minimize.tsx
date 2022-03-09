import React from 'react'

export const MinimizeIcon = (props: { size: number }) => {
  const { size } = props
  return (
    <svg aria-hidden="true" version="1.1" width={size} height={size} style={({ fill: 'currentcolor' })}>
      <path d="M 0,5 10,5 10,6 0,6 Z"></path>
    </svg>
  )
}

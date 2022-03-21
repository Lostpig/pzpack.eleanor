import React from 'react'

export const MaximizeIcon = (props: { size: number }) => {
  const { size } = props
  return (
    <svg aria-hidden="true" version="1.1" width={size} height={size} style={({ fill: 'currentcolor' })}>
      <path d="M 0,0 0,10 10,10 10,0 Z M 1,1 9,1 9,9 1,9 Z"></path>
    </svg>
  )
}

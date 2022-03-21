import React from 'react'

export const WindowizeIcon = (props: { size: number }): React.ReactElement => {
  const { size } = props
  return (
    <svg aria-hidden="true" version="1.1" width={size} height={size} style={({ fill: 'currentcolor' })}>
      <path d="m 2,1e-5 0,2 -2,0 0,8 8,0 0,-2 2,0 0,-8 z m 1,1 6,0 0,6 -1,0 0,-5 -5,0 z m -2,2 6,0 0,6 -6,0 z"></path>
    </svg>
  )
}

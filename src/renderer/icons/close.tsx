import React from 'react'

export const CloseIcon = (props: { size: number }) => {
  const { size } = props
  return (
    <svg aria-hidden="true" version="1.1" width={size} height={size} style={{ fill: 'currentcolor' }}>
      <path d="M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z"></path>
    </svg>
  )
}

export const CloseLargeIcon = (props: { size: number }) => {
  const { size } = props
  return (
    <svg version="1.1" viewBox="0 0 1024 1024" width={size} height={size} style={{ fill: 'currentcolor' }}>
      <path d="M563.8 512l262.5-312.9c4.4-5.2 0.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9c-4.4 5.2-0.7 13.1 6.1 13.1h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
    </svg>
  )
}

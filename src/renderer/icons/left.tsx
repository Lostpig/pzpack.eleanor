import React from 'react'

export const LeftIcon = (props: { size: number }) => {
  const { size } = props
  return (
    <svg viewBox="0 0 1024 1024" version="1.1" width={size} height={size} style={{ fill: 'currentcolor' }}>
      <path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8c-16.4 12.8-16.4 37.5 0 50.3l450.8 352.1c5.3 4.1 12.9 0.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path>
    </svg>
  )
}

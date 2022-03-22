import React from 'react'
import { mergeCls } from '../../utils'

export type PZProgressProps = {
  value: number
  total: number
  className?: string
}
export const PZProgress = (props: PZProgressProps) => {
  let perc = props.total <= 0 ? 0 : props.value / props.total
  if (perc < 0) perc = 0
  if (perc > 1) perc = 1
  const percs = (perc * 100).toFixed(1)
  
  return (
    <div className="flex items-center w-full">
      <div className={mergeCls('flex-1 border border-gray-400 dark:border-neutral-600 h-8', props.className)}>
        <div className='h-full bg-blue-500' style={{ width: `${percs}%` }}></div>
      </div>
      <div className="w-16 text-right">{percs}%</div>
    </div>
  )
}

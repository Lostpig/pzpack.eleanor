import React from 'react'
import { mergeCls } from '../../utils'

export type PZSelectProps = {
  value?: string
  items: string[] | { name: string; value: string }[]
  onChange?: (value: string) => void
  className?: string
}
export const PZSelect = (props: PZSelectProps) => {
  const changeHandler = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    const value = ev.target.value
    props.onChange?.(value)
  }
  const items = props.items.map((n) => {
    if (typeof n === 'string') return { name: n, value: n }
    else return n
  })

  return (
    <div
      className={mergeCls(
        'flex flex-col border rounded-md p-1 border-gray-400 dark:border-neutral-600 ',
        props.className,
      )}
    >
      <select onChange={changeHandler} defaultValue={props.value} className="flex-1 focus:outline-none bg-transparent">
        {items.map((item) => (
          <option key={item.value} value={item.value}>{item.name}</option>
        ))}
      </select>
    </div>
  )
}

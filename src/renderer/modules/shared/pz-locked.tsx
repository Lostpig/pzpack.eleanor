import React, { useState } from 'react'
import { mergeCls } from '../../utils'
import { LockIcon, UnLockIcon } from '../icons'

export type PZLockedProps = {
  defaultValue: boolean
  size: number
  disabled?: boolean
  title?: string
  onChange?: (value: boolean) => void
}
export const PZLocked = (props: PZLockedProps) => {
  const [value, setValue] = useState(props.defaultValue)
  const toggleValue = () => {
    const v = !value
    setValue(v)
    props.onChange?.(v)
  }

  return (
    <div
      className={mergeCls('mx-2 cursor-pointer', value ? 'text-red-600' : 'text-black dark:text-gray-50')}
      title={props.title}
      onClick={toggleValue}
    >
      {value ? <LockIcon size={props.size} /> : <UnLockIcon size={props.size} />}
    </div>
  )
}

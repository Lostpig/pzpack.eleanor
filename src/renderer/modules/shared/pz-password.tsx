import React, { useState, useImperativeHandle, useRef, forwardRef, type ForwardedRef } from 'react'
import { mergeCls } from '../../utils'
import { ViewIcon, ViewOffIcon } from '../icons'

export type PZPasswordProps = {
  onChange?: (value: string) => void
  onEnter?: () => void
  className?: string
}
export type PZPasswordRef = {
  focus: () => void
  value: string
}
export const PZPassword = forwardRef((props: PZPasswordProps, ref: ForwardedRef<PZPasswordRef>) => {
  const [pwType, setType] = useState<'text' | 'password'>('password')
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
    get value () {
      return inputRef.current?.value ?? ''
    }
  }))

  const changeHandler = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const value = ev.target.value
    props.onChange?.(value)
  }
  const enterHandler = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key.toLowerCase() === 'enter') props.onEnter?.()
  }

  return (
    <div
      className={mergeCls(
        'flex flex-col relative border rounded-md p-1 border-gray-400 dark:border-neutral-600 ',
        props.className,
      )}
    >
      <input
        ref={inputRef}
        className="flex-1 focus:outline-none bg-transparent"
        type={pwType}
        onChange={changeHandler}
        onKeyPress={enterHandler}
      />
      <span
        className="absolute flex items-center h-full right-1 top-0"
        onClick={() => setType(pwType === 'password' ? 'text' : 'password')}
      >
        {pwType === 'password' ? <ViewOffIcon size={16} /> : <ViewIcon size={16} />}
      </span>
    </div>
  )
})
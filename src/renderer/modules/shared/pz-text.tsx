import React, { useImperativeHandle, useRef, forwardRef, type ForwardedRef } from 'react'
import { mergeCls } from '../../utils'

export type PZTextProps = {
  value?: string
  binding?: string
  readonly?: boolean
  onChange?: (value: string) => void
  onEnter?: () => void
  className?: string
  type?: 'text' | 'number'
}
export type PZTextRef = {
  focus: () => void
  value: string
}
export const PZText = forwardRef((props: PZTextProps, ref: ForwardedRef<PZTextRef>) => {
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
    get value() {
      return inputRef.current?.value ?? ''
    },
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
        'flex flex-col border rounded-md p-1 border-gray-400 dark:border-neutral-600 ',
        props.className,
      )}
    >
      <input
        ref={inputRef}
        defaultValue={props.value}
        value={props.binding}
        readOnly={props.readonly}
        className="flex-1 focus:outline-none bg-transparent"
        type={props.type ?? 'text'}
        onChange={changeHandler}
        onKeyPress={enterHandler}
      />
    </div>
  )
})

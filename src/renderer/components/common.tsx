import React, { PropsWithChildren, useState, useImperativeHandle, useRef, ForwardedRef, forwardRef } from 'react'
import { mergeCls } from '../utils'
import { ViewIcon, ViewOffIcon, LockIcon, UnLockIcon } from '../icons'

export type PZButtonProps = {
  type?: 'normal' | 'primary' | 'danger' | 'link' | 'icon'
  title?: string
  className?: string
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}
const btnTypeStyle = {
  normal: mergeCls(
    'px-4 py-2 rounded bg-gray-200 text-black hover:bg-gray-300',
    'dark:bg-neutral-600 dark:hover:bg-neutral-500 dark:text-gray-50',
    'disabled:bg-neutral-300 disabled:hover:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-default',
  ),
  primary: mergeCls(
    'px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-700',
    'disabled:bg-neutral-500 disabled:hover:bg-neutral-500 disabled:text-neutral-600 disabled:cursor-default',
  ),
  danger: mergeCls(
    'px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600',
    'disabled:bg-neutral-500 disabled:hover:bg-neutral-500 disabled:text-neutral-300 disabled:cursor-default',
  ),
  link: mergeCls(
    'bg-transparent text-blue-500 hover:text-blue-700',
    'disabled:text-neutral-400 disabled:hover:text-neutral-400 disabled:cursor-default',
  ),
  icon: mergeCls(
    'bg-transparent text-black dark:text-gray-50 hover:text-blue-500',
    'disabled:text-neutral-400 disabled:hover:text-neutral-400 disabled:cursor-default',
  ),
}
export const PZButton: React.FC<PropsWithChildren<PZButtonProps>> = (props) => {
  const disabled = !!props.disabled
  const type = props.type ?? 'normal'
  const classNames = mergeCls('text-sm mx-2 font-medium focus:outline-none', btnTypeStyle[type], props.className)

  return (
    <button type="button" title={props.title} disabled={disabled} className={classNames} onClick={props.onClick}>
      {props.children}
    </button>
  )
}

export type PZPasswordProps = {
  onChange?: (value: string) => void
  onEnter?: () => void
  className?: string
}
export type PZPasswordRef = {
  focus: () => void
}
export const PZPassword = forwardRef((props: PZPasswordProps, ref: ForwardedRef<PZPasswordRef>) => {
  const [pwType, setType] = useState<'text' | 'password'>('password')
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
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

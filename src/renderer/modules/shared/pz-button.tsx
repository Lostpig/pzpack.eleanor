import React, { type PropsWithChildren } from 'react'
import { mergeCls } from '../../utils'

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
    'bg-transparent text-black dark:text-gray-50 hover:text-blue-500',
    'disabled:hover:text-black dark:disabled:hover:text-gray-50 disabled:cursor-default',
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

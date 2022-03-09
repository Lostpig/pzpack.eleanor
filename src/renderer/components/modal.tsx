import React from 'react'
import ReactDOM from 'react-dom'
import { modalState } from '../service/modal'
import { useModalState } from '../hooks/modal'
import { OpenFileDialog } from './dialogs'

let $modal: HTMLDivElement
const getModalDom = () => {
  if (!$modal) {
    $modal = document.getElementById('pz-modal') as HTMLDivElement
    if (!$modal) {
      $modal = document.createElement('div')
      $modal.id = 'pz-modal'
      document.body.appendChild($modal)
    }
  }

  return $modal
}

const ModalContainer = (props: React.PropsWithChildren<{}>) => {
  const dom = getModalDom()
  const modal = (
    <div className="fixed top-0 left-0 z-40 w-screen h-screen">
      <div className="bg-neutral-900/20 dark:bg-slate-600/70 absolute top-0 left-0 w-full h-full z-10"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">{props.children}</div>
    </div>
  )
  return ReactDOM.createPortal(modal, dom)
}

const gteModalDialog = (state: modalState) => {
  switch (state.dialog) {
    case 'open':
      return (
        <ModalContainer>
          <OpenFileDialog path={state.args[0]} />
        </ModalContainer>
      )
    case 'none':
      return null
    default:
      return (
        <ModalContainer>
          <span>{state.dialog}</span>
        </ModalContainer>
      )
  }
}

export const Modal = () => {
  const [state] = useModalState()
  const content = gteModalDialog(state)
  return content
}

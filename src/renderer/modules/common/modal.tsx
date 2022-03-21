import React from 'react'
import ReactDOM from 'react-dom'
import { useModalState } from './hooks'
import { mergeCls } from '../../utils'

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

export const ModalContext = React.createContext({ id: 0 })

const ModalContent: React.FC<{ zIndex: number; id: number }> = ({ zIndex, id, children }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full" style={{ zIndex }}>
      <ModalContext.Provider value={{ id }}>{children}</ModalContext.Provider>
    </div>
  )
}
const ModalContainer: React.FC<{ hidden: boolean }> = ({ children, hidden }) => {
  const dom = getModalDom()
  const container = (
    <div className={mergeCls('fixed top-0 left-0 z-40 w-screen h-screen', hidden ? 'hidden' : '')}>{children}</div>
  )
  return ReactDOM.createPortal(container, dom)
}

export interface ModalContentProps {
  key: number
}
export const Modal = () => {
  const state = useModalState()
  return (
    <ModalContainer hidden={state.contents.length === 0}>
      {state.contents.map((c, i) => (
        <ModalContent key={c.key} id={c.key} zIndex={1000 + i}>
          {c.element}
        </ModalContent>
      ))}
    </ModalContainer>
  )
}

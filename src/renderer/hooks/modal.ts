import { useEffect, useState } from 'react'
import { modalState, modalObservable } from '../service/modal'

export const useModalState = (): [modalState, React.Dispatch<React.SetStateAction<modalState>>] => {
  const [state, setState] = useState<modalState>({ dialog: 'none', args: [] })
  useEffect(() => {
    const subscription = modalObservable.subscribe(setState)
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return [state, setState]
}

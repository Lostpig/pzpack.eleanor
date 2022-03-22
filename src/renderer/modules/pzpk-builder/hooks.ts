import { useMemo } from 'react'
import { startPZBuild } from '../../service/pzpack'

export const useBuilder = () => {
  return useMemo(() => {
    return { startPZBuild }
  }, [])
}

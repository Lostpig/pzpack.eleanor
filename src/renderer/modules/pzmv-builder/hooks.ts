import { useCallback, useState, useMemo } from 'react'
import { PZVideo } from 'pzpack'
import { startPZMVBuild } from '../../service/pzpack'

export const useVideoCodec = (): [PZVideo.VideoCodecParam, (codec: PZVideo.VideoCodecParam) => void] => {
  const [codec, setCodec] = useState<PZVideo.VideoCodecParam>(PZVideo.getVideoDefaultParams('nvenc'))
  const dispatchCodec = useCallback(
    (patch: PZVideo.VideoCodecParam) => {
      let base: PZVideo.VideoCodecParam = codec
      if (patch.encoder !== codec.encoder) {
        if (patch.encoder === 'libx265') base = PZVideo.getVideoDefaultParams('libx265')
        else if (patch.encoder === 'nvenc') base = PZVideo.getVideoDefaultParams('nvenc')
        else base = { encoder: 'copy' }
      }
      const value = Object.assign({}, base, patch)
      setCodec(value)
    },
    [codec, setCodec],
  )

  return [codec, dispatchCodec]
}
export const useAudioCodec = (): [PZVideo.AudioCodecParam, (codec: PZVideo.AudioCodecParam) => void] => {
  const [codec, setCodec] = useState<PZVideo.AudioCodecParam>({ encoder: 'copy', bitrate: '256' })
  const dispatchCodec = useCallback(
    (patch: PZVideo.AudioCodecParam) => {
      const value = Object.assign({}, codec, patch)
      setCodec(value)
    },
    [codec, setCodec],
  )

  return [codec, dispatchCodec]
}
export const useBuilder = () => {
  return useMemo(() => {
    return { startPZMVBuild }
  }, [])
}

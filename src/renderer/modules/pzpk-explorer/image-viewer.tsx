import React, { useState, useRef, useEffect, memo, useContext, useMemo, useCallback } from 'react'
import { PZSubscription, type PZFolder, type PZLoader, type PZFilePacked } from 'pzpack'
import { useTranslation } from 'react-i18next'
import { RendererLogger } from '../../service/logger'
import { wait } from '../../../lib/utils'
import { PZButton, PZLocked } from '../shared'
import {
  UnFullscreenIcon,
  FullscreenIcon,
  CloseLargeIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ResetZoomIcon,
  LeftIcon,
  RightIcon,
} from '../icons'
import { ModalContext, useModalManager } from '../common'
import { useImageContext, ImageViewerContext } from './hooks'

type operation = 'next' | 'prev'
type ViewerContentState = {
  zoom: number
}
type ViewerContentBinding = {
  element: HTMLDivElement
  change: (url: string) => void
  lockZoom: (locked: boolean) => void
  zoomIn: () => void
  zoomOut: () => void
  zoomReset: () => void
  stateObserval: PZSubscription.PZNotify<ViewerContentState>
  actionObserval: PZSubscription.PZNotify<operation>
}
let bindingInstance: ViewerContentBinding
const zoomRange = [0.1, 5]
const bindPositionHandles = (el: HTMLDivElement, img: HTMLImageElement) => {
  const operateState = {
    keeping: false,
    startPos: [0, 0],
    lastPos: [0, 0],
  }
  const center = {
    x: el.offsetWidth / 2,
    y: el.offsetHeight / 2,
  }
  const edge = {
    x: [Math.max(0, center.x - img.offsetWidth / 2), Math.max(0, img.offsetWidth / 2 - center.x)],
    y: [Math.max(0, center.y - img.offsetHeight / 2), Math.max(0, img.offsetHeight / 2 - center.y)],
  }

  const moveTo = (x: number, y: number) => {
    let mx = x
    let my = y

    if (mx < edge.x[0]) mx = edge.x[0]
    if (mx > edge.x[1]) mx = edge.x[1]
    img.style.left = `${mx}px`

    if (my < edge.y[0]) my = edge.y[0]
    if (my > edge.y[1]) my = edge.y[1]
    img.style.top = `${my}px`
  }
  const moveImage = (x: number, y: number) => {
    const newX = img.offsetLeft + x
    const newY = img.offsetTop + y
    moveTo(newX, newY)
  }
  const onResize = () => {
    center.x = el.offsetWidth / 2
    center.y = el.offsetHeight / 2

    const xDiff = Math.max((img.offsetWidth - el.offsetWidth) / 2, 0)
    const yDiff = Math.max((img.offsetHeight - el.offsetHeight) / 2, 0)
    edge.x = [center.x - xDiff, center.x + xDiff]
    edge.y = [center.y - yDiff, center.y + yDiff]

    moveTo(img.offsetLeft, img.offsetTop)
  }

  el.addEventListener('mousedown', (ev) => {
    // only left button pressed
    if (ev.buttons === 1) {
      ev.preventDefault()

      operateState.keeping = true
      operateState.lastPos = [ev.clientX, ev.clientY]
    }
  })
  el.addEventListener('mouseup', (ev) => {
    if (ev.buttons === 1) {
      RendererLogger.debug('on buttons === 1 fired')
      ev.preventDefault()

      if (operateState.keeping) {
        operateState.keeping = false
      }
    }
  })
  el.addEventListener('mousemove', (ev) => {
    if (operateState.keeping) {
      if (ev.buttons !== 1) {
        operateState.keeping = false
        return
      }
      moveImage(ev.clientX - operateState.lastPos[0], ev.clientY - operateState.lastPos[1])
      operateState.lastPos[0] = ev.clientX
      operateState.lastPos[1] = ev.clientY
    }
  })

  const resizeOB = new ResizeObserver(onResize)
  resizeOB.observe(el)
  resizeOB.observe(img)
}
const createViewerContentBinding = () => {
  if (!bindingInstance) {
    const el = document.createElement('div')
    el.className = 'pzviewer'
    let zoom = 1
    let zoomLocked = false
    const stateSubject = new PZSubscription.PZNotify<ViewerContentState>()
    const actionSubject = new PZSubscription.PZNotify<operation>()
    const image = new Image()
    el.appendChild(image)
    const setZoom = () => {
      // image.style.transform = `scale(${zoom})`
      const w = image.naturalWidth * zoom
      const h = image.naturalHeight * zoom
      image.style.width = `${w}px`
      image.style.height = `${h}px`
      stateSubject.next({ zoom })
    }
    const computeDefaultZoom = () => {
      const w = el.clientWidth / image.naturalWidth
      const h = el.clientHeight / image.naturalHeight
      return Math.min(1, w, h)
    }
    const zoomIn = () => {
      const z = ((zoom * 10 + 1) ^ 0) / 10
      zoom = z > zoomRange[1] ? zoomRange[1] : z
      setZoom()
    }
    const zoomOut = () => {
      const z = ((zoom * 10 - 1) ^ 0) / 10
      zoom = z < zoomRange[0] ? zoomRange[0] : z
      setZoom()
    }
    const zoomReset = () => {
      zoom = computeDefaultZoom()
      setZoom()
    }
    const change = (url: string) => {
      el.classList.add('loading')
      image.src = url
    }
    image.onload = () => {
      if (!zoomLocked) {
        zoom = computeDefaultZoom()
      }
      setZoom()
      wait(100).then(() => el.classList.remove('loading'))
    }
    bindPositionHandles(el, image)
    el.addEventListener('wheel', (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      if (ev.deltaY < 0) zoomIn()
      else if (ev.deltaY > 0) zoomOut()
    })

    // mouseup event not support property 'buttons'
    let pressedButton = -1
    el.addEventListener('mousedown', (ev) => {
      if (ev.buttons === 8 || ev.buttons === 16) {
        pressedButton = ev.buttons
      }
    })
    el.addEventListener('mouseup', () => {
      if (pressedButton === 8) {
        actionSubject.next('prev')
      } else if (pressedButton === 16) {
        actionSubject.next('next')
      }
      pressedButton = -1
    })

    bindingInstance = {
      element: el,
      change,
      lockZoom: (locked: boolean) => (zoomLocked = locked),
      zoomIn,
      zoomOut,
      zoomReset,
      stateObserval: stateSubject,
      actionObserval: actionSubject,
    }
  }
  return bindingInstance
}
const clearViewerContentBinding = () => {
  if (!bindingInstance) return

  bindingInstance.element.remove()
  RendererLogger.debug('Viewer container binding removed')
}
const bindViewerContent = (container: HTMLDivElement | null) => {
  RendererLogger.debug('Viewer container binding calling')
  if (!container) {
    RendererLogger.debug('Viewer container is null')
    return
  }

  const contentBinding = createViewerContentBinding()
  container.appendChild(contentBinding.element)

  return contentBinding
}

const ViewFooterSeparator = () => {
  return <div className="mx-4 w-px h-4/5 bg-neutral-600 dark:bg-neutral-300"></div>
}
const ViewerContent: React.FC = () => {
  const { count, total, next, prev, getImage, getFile } = useContext(ImageViewerContext)
  const { id } = useContext(ModalContext)
  const { closeModal } = useModalManager()
  const [t] = useTranslation()
  const [zoom, setZoom] = useState(100)
  const [fullscreen, setFullscreen] = useState(false)
  const [contentBinding, setContent] = useState<ViewerContentBinding>()
  const containerRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>(null)

  RendererLogger.debug(`ViewerContent render: ${count} / ${total}`)

  useEffect(() => {
    const c = bindViewerContent(containerRef.current)
    setContent(c)
    return () => clearViewerContentBinding()
  }, [containerRef.current])
  useEffect(() => {
    const subscription = contentBinding?.stateObserval.subscribe((s) => {
      setZoom(s.zoom * 100)
    })
    const actSubscription = contentBinding?.actionObserval.subscribe((opt) => {
      if (opt === 'next') next()
      else if (opt === 'prev') prev()
    })

    return () => {
      subscription?.unsubscribe()
      actSubscription?.unsubscribe()
    }
  }, [contentBinding, next, prev])
  useEffect(() => {
    if (contentBinding) {
      getImage(count).then((url) => {
        contentBinding?.change(url)
      })
    }
  }, [contentBinding, getImage, count])
  const toggleFullscreen = useCallback(() => {
    if (ref.current) {
      if (!document.fullscreenElement) {
        ref.current.requestFullscreen().then(() => setFullscreen(true))
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => setFullscreen(false))
        }
      }
    }
  }, [ref.current])
  const closeViewer = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => setFullscreen(false))
    }
    closeModal(id)
  }, [closeModal, id])
  const file = useMemo(() => {
    return getFile(count)
  }, [count, getFile])

  return (
    <div ref={ref} className="absolute top-0 left-0 w-screen h-screen bg-white dark:bg-neutral-700">
      <header className="pzview-header electron-nodrag absolute top-0 left-0 w-full h-16 pb-8 z-10">
        <div className="content bg-white/70 dark:bg-neutral-800/70 flex flex-row h-8 items-center">
          <div className="flex-1 text-black dark:text-gray-50 pl-4">{file.name}</div>
          <PZButton type="icon" onClick={toggleFullscreen}>
            {fullscreen ? <UnFullscreenIcon size={24} /> : <FullscreenIcon size={24} />}
          </PZButton>
          <PZButton type="icon" onClick={closeViewer} className="hover:text-red-600">
            <CloseLargeIcon size={24} />
          </PZButton>
        </div>
      </header>
      <div className="w-full h-full overflow-hidden" ref={containerRef}></div>
      <footer className="pzview-footer absolute bottom-0 left-0 w-full h-16 z-10 pt-8">
        <div className="content bg-white/70 dark:bg-neutral-800/70 flex flex-row h-8 items-center justify-center">
          <PZButton type="icon" onClick={contentBinding?.zoomOut}>
            <ZoomOutIcon size={24} />
          </PZButton>
          <div className="text-black dark:text-gray-50">
            <span>{zoom.toFixed(0)}</span>
            <span>%</span>
          </div>
          <PZButton type="icon" onClick={contentBinding?.zoomIn}>
            <ZoomInIcon size={24} />
          </PZButton>
          <PZButton type="icon" title={t('auto zoom')} onClick={contentBinding?.zoomReset}>
            <ResetZoomIcon size={24} />
          </PZButton>
          <PZLocked defaultValue={false} size={24} title={t('lock zoom')} onChange={contentBinding?.lockZoom} />
          <ViewFooterSeparator />
          <PZButton type="icon" onClick={prev} disabled={count <= 0}>
            <LeftIcon size={24} />
          </PZButton>
          <div className="text-black dark:text-gray-50">
            <span>{count + 1}</span>
            <span className="mx-1">/</span>
            <span>{total}</span>
          </div>
          <PZButton type="icon" onClick={next} disabled={count < 0 || count >= total - 1}>
            <RightIcon size={20} />
          </PZButton>
        </div>
      </footer>
    </div>
  )
}

interface ImageViewerProps {
  loader: PZLoader
  folder: PZFolder
  initFile: PZFilePacked
}
export const ImageViewer: React.FC<ImageViewerProps> = memo((props) => {
  const context = useImageContext(props.loader, props.folder, props.initFile)

  return (
    <ImageViewerContext.Provider value={context}>
      <ViewerContent />
    </ImageViewerContext.Provider>
  )
})

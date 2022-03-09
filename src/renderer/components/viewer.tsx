import React, { useCallback, useEffect, useState, useRef } from 'react'
import ReactDOM from 'react-dom'
import { PZFilePacked, PZSubscription } from 'pzpack'
import { PZButton } from './common'
import {
  FullscreenIcon,
  UnFullscreenIcon,
  ZoomInIcon,
  ZoomOutIcon,
  CloseLargeIcon,
  LeftIcon,
  RightIcon,
} from '../icons'
import { loadImage, binding, PZLoaderObservable } from '../service/pzpack'
import { mergeCls, isImageFile } from '../utils'
import { RendererLogger } from '../service/logger'
import { wait } from '../../lib/utils'

const zoomRange = [0.1, 0.25, 0.33, 0.5, 0.66, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5]
type ViewerContentState = {
  zoom: number
}
type ViewerContentBinding = {
  element: HTMLDivElement
  change: (url: string) => void
  lockZoom: (locked: boolean) => void
  zoomIn: () => void
  zoomOut: () => void
  stateObserval: PZSubscription.PZNotify<ViewerContentState>
}

let bindingInstance: ViewerContentBinding
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
    if (x < edge.x[0]) x = edge.x[0]
    if (x > edge.x[1]) x = edge.x[1]
    img.style.left = `${x}px`

    if (y < edge.y[0]) y = edge.y[0]
    if (y > edge.y[1]) y = edge.y[1]
    img.style.top = `${y}px`
  }
  const moveImage = (x: number, y: number) => {
    const newX = img.offsetLeft + x
    const newY = img.offsetTop + y
    moveTo(newX, newY)
  }
  const onResize = () => {
    ;(center.x = el.offsetWidth / 2), (center.y = el.offsetHeight / 2)

    const xDiff = Math.max((img.offsetWidth - el.offsetWidth) / 2, 0)
    const yDiff = Math.max((img.offsetHeight - el.offsetHeight) / 2, 0)
    edge.x = [center.x - xDiff, center.x + xDiff]
    edge.y = [center.y - yDiff, center.y + yDiff]

    moveTo(img.offsetLeft, img.offsetTop)
  }

  el.addEventListener('mousedown', (ev) => {
    // only left button pressed
    if (ev.buttons === 1) {
      ev.stopPropagation()
      ev.preventDefault()

      operateState.keeping = true
      operateState.lastPos = [ev.clientX, ev.clientY]
    }
  })
  el.addEventListener('mouseup', (ev) => {
    if (ev.buttons === 1) {
      ev.stopPropagation()
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
      if (zoom >= zoomRange[zoomRange.length - 1]) return
      for (const z of zoomRange) {
        if (z > zoom) {
          zoom = z
          break
        }
      }
      setZoom()
    }
    const zoomOut = () => {
      if (zoom <= zoomRange[0]) return
      for (let i = zoomRange.length - 1; i >= 0; i--) {
        if (zoomRange[i] < zoom) {
          zoom = zoomRange[i]
          break
        }
      }
      setZoom()
    }
    const change = (url: string) => {
      image.classList.add('loading')
      image.src = url
    }
    image.onload = () => {
      if (!zoomLocked) {
        zoom = computeDefaultZoom()
      }
      setZoom()
      wait(100).then(() => image.classList.remove('loading'))
    }
    bindPositionHandles(el, image)

    bindingInstance = {
      element: el,
      change,
      lockZoom: (locked: boolean) => (zoomLocked = locked),
      zoomIn,
      zoomOut,
      stateObserval: stateSubject,
    }
  }
  return bindingInstance
}
const clearViewerContentBinding = () => {
  if (!bindingInstance) return
  bindingInstance.element.remove()
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

type operation = 'next' | 'prev' | 'close' | 'fullscreen'
type contentProps = {
  index: number
  list: PZFilePacked[]
  fullscreen: boolean
  onAction: (operate: operation) => void
}
const ViewFooterSeparator = () => {
  return <div className="mx-4 w-px h-4/5 bg-neutral-600 dark:bg-neutral-300"></div>
}
const ViewerContent: React.FC<contentProps> = (props) => {
  const { index, list, onAction, fullscreen } = props
  const file = list[index]
  RendererLogger.debug(`ViewerContent render: ${index} / ${list.length}`)

  const [zoom, setZoom] = useState(100)
  const [contentBinding, setContent] = useState<ViewerContentBinding>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const c = bindViewerContent(containerRef.current)
    setContent(c)
    return () => clearViewerContentBinding()
  }, [containerRef.current])
  useEffect(() => {
    const subscription = contentBinding?.stateObserval.subscribe((s) => {
      setZoom(s.zoom * 100)
    })
    return () => subscription?.unsubscribe()
  }, [contentBinding])
  useEffect(() => {
    if (file && contentBinding) {
      const url = loadImage(file)
      contentBinding?.change(url)
    }
  }, [contentBinding, file])

  return (
    <>
      <header className="pzview-header electron-nodrag absolute top-0 left-0 w-full h-8  z-10">
        <div className="content bg-white/50 dark:bg-neutral-800/50 flex flex-row h-full items-center">
          <div className="flex-1 text-black dark:text-gray-50 pl-4">{file.name}</div>
          <PZButton type="icon" onClick={() => onAction('fullscreen')}>
            {fullscreen ? <UnFullscreenIcon size={24} /> : <FullscreenIcon size={24} />}
          </PZButton>
          <PZButton type="icon" onClick={() => onAction('close')} className="hover:text-red-600">
            <CloseLargeIcon size={24} />
          </PZButton>
        </div>
      </header>
      <div className="w-full h-full overflow-hidden" ref={containerRef}></div>
      <footer className="pzview-footer absolute bottom-0 left-0 w-full h-8 z-10">
        <div className="content bg-white/50 dark:bg-neutral-800/50 flex flex-row h-full items-center justify-center">
          <PZButton type="icon" onClick={contentBinding?.zoomOut}>
            <ZoomOutIcon size={24} />
          </PZButton>
          <div className='text-black dark:text-gray-50'>
            <span>{zoom.toFixed(0)}</span>
            <span>%</span>
          </div>
          <PZButton type="icon" onClick={contentBinding?.zoomIn}>
            <ZoomInIcon size={24} />
          </PZButton>
          <ViewFooterSeparator />
          <PZButton type="icon" onClick={() => onAction('prev')} disabled={index <= 0}>
            <LeftIcon size={24} />
          </PZButton>
          <div className='text-black dark:text-gray-50'>
            <span>{index + 1}</span>
            <span className="mx-1">/</span>
            <span>{list.length}</span>
          </div>
          <PZButton type="icon" onClick={() => onAction('next')} disabled={index < 0 || index >= list.length - 1}>
            <RightIcon size={20} />
          </PZButton>
        </div>
      </footer>
    </>
  )
}

type ImageViewerContext = {
  file$: PZSubscription.PZBehaviorObservable<PZFilePacked | undefined>
}
const ImageViewer = (props: { context: ImageViewerContext }) => {
  const { context } = props
  const [show, setShow] = useState<boolean>(false)
  const [list, setList] = useState<PZFilePacked[]>([])
  const [index, setIndex] = useState<number>(-1)
  const ref = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)

  const close = useCallback(() => {
    setList([])
    setIndex(-1)
    setShow(false)
  }, [setShow, setList, setIndex])
  useEffect(() => {
    const fileSubscription = context.file$.subscribe((file) => {
      if (!binding.loader || !file) return close()

      const idx = binding.loader.loadIndex()
      const folder = idx.getFolder(file.pid)
      if (!folder) return close()

      const imgList = idx.getChildren(folder).files.filter(isImageFile)
      const findex = imgList.indexOf(file)
      setList(imgList)
      setIndex(findex)
      setShow(true)
    })
    const loaderSubscription = PZLoaderObservable.subscribe(() => close)

    return () => {
      fileSubscription.unsubscribe()
      loaderSubscription.unsubscribe()
    }
  }, [context])
  useEffect(() => {
    if (!show && document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setFullscreen(false))
      }
    }
  }, [show])

  const changeFile = useCallback(
    (n: number) => {
      if (n >= 0 && n < list.length) {
        setIndex(n)
      }
    },
    [list],
  )
  const toggleFullscreen = () => {
    if (ref.current) {
      if (!document.fullscreenElement) {
        ref.current.requestFullscreen().then(() => setFullscreen(true))
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => setFullscreen(false))
        }
      }
    }
  }
  const actionHandler = useCallback(
    (operate: operation) => {
      switch (operate) {
        case 'close':
          setShow(false)
          break
        case 'next':
          changeFile(index + 1)
          break
        case 'prev':
          changeFile(index - 1)
          break
        case 'fullscreen':
          toggleFullscreen()
          break
        default:
          break
      }
    },
    [index, list],
  )

  return (
    <div
      ref={ref}
      className={mergeCls(
        'fixed top-0 left-0 w-screen h-screen bg-white dark:bg-neutral-700',
        show ? 'block' : 'hidden',
      )}
    >
      {index === -1 ? null : (
        <ViewerContent index={index} list={list} fullscreen={fullscreen} onAction={actionHandler} />
      )}
    </div>
  )
}

const fileSubject = new PZSubscription.PZBehaviorNotify<PZFilePacked | undefined>(undefined)
let inited = false
const getViewerDom = () => {
  let $container = document.getElementById('pz-viewer') as HTMLDivElement
  if (!$container) {
    $container = document.createElement('div')
    $container.id = 'pz-viewer'
    document.body.appendChild($container)
  }

  return $container
}
const createImageViewerContext = () => {
  return {
    file$: fileSubject.asObservable(),
  }
}
const initViewerContainer = () => {
  if (!inited) {
    const dom = getViewerDom()
    const context = createImageViewerContext()

    return new Promise<void>((res) => {
      ReactDOM.render(<ImageViewer context={context} />, dom, () => {
        inited = true
        res()
      })
    })
  } else {
    return Promise.resolve()
  }
}
export const openViewerFile = (file: PZFilePacked) => {
  if (!isImageFile(file)) return

  initViewerContainer().then(() => {
    fileSubject.next(file)
  })
}

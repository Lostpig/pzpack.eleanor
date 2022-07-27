import * as path from 'path'
import React, { memo, useState, useContext, createContext, useMemo, useEffect, useReducer, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PZHelper, type PZFolder, type PZFileBuilding, type PZIndexBuilder } from 'pzpack'
import naturalCompare from 'natural-compare-lite'
import { useInfoDialog, useSetNamDialog } from '../common'
import { FiletypeIcon, RightIcon } from '../icons'
import { PZButton } from '../shared'
import { RendererLogger } from 'renderer/service/logger'
import { useBuilderDialogs } from './dialogs'
import { openDir, selectFiles } from '../../service/io'

type ContentContextType = {
  navigate: (folder: PZFolder) => void
}
type BuilderContextType = {
  builder: PZIndexBuilder
}
const BuilderContext = createContext<BuilderContextType>({} as BuilderContextType)
const ContentContext = createContext<ContentContextType>({ navigate: () => {} })

const getFoldersToRoot = (builder: PZIndexBuilder, folder: PZFolder) => {
  const list = []
  list.push(folder)

  let parent = builder.getFolder(folder.pid)
  while (parent) {
    list.push(parent)
    parent = builder.getFolder(parent.pid)
  }

  return list.reverse()
}
const ensureFolderRec = (builder: PZIndexBuilder, parent: PZFolder, relativePath: string) => {
  const list = relativePath.split(path.sep)
  let p = parent
  for (const n of list) {
    if (n.trim() === '') continue
    const f = builder.ensureFolder(n.trim(), p.id)
    p = f
  }
  return p
}
const addDir = async (builder: PZIndexBuilder, parent: PZFolder, dir: string) => {
  const files = await PZHelper.scanDirectory(dir)
  const dirName = path.basename(dir)

  const folder = builder.addFolder(dirName, parent.id)
  for (const file of files) {
    const relativePath = path.relative(dir, file)
    const parsedPath = path.parse(relativePath)
    const current = ensureFolderRec(builder, folder, parsedPath.dir)
    builder.addFile(file, current.id, parsedPath.base)
  }
}

const Breadcrumbs: React.FC<{ current: PZFolder; update: number }> = memo((props) => {
  const { current, update } = props
  const { builder } = useContext(BuilderContext)
  const { navigate } = useContext(ContentContext)
  const list = useMemo(() => getFoldersToRoot(builder, current), [builder, current, update])

  return (
    <div className="py-1 px-3 flex items-center justify-start shadow-sm dark:shadow-black">
      {list.map((f) => {
        const name = f.id === builder.rootId ? 'root' : f.name
        return (
          <div key={f.id}>
            <PZButton className="flex items-center" type="link" onClick={() => navigate(f)} disabled={f === current}>
              <span className="mr-4">{name}</span>
              {f === current ? null : <RightIcon size={16} />}
            </PZButton>
          </div>
        )
      })}
    </div>
  )
})
const BuilderFolder: React.FC<{ folder: PZFolder }> = memo((props) => {
  const { folder } = props
  const [t] = useTranslation()
  const { builder } = useContext(BuilderContext)
  const { navigate } = useContext(ContentContext)
  const openSetNameDialog = useSetNamDialog()
  const deleteHandler = useCallback(() => {
    builder.removeFolder(folder)
  }, [folder])
  const renameHandler = useCallback(() => {
    const sub = openSetNameDialog(folder.name)
    sub.subscribe((name) => {
      if (name) builder.moveFolder(folder, folder.pid, name)
    })
  }, [folder, builder, openSetNameDialog])

  return (
    <div
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
      onDoubleClick={() => navigate(folder)}
    >
      <FiletypeIcon type="folder" size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{folder.name}</div>
      <div className="text-right w-30 pr-4">
        <PZButton type="link" onClick={renameHandler}>
          {t('rename')}
        </PZButton>
        <PZButton type="link" onClick={deleteHandler}>
          {t('delete')}
        </PZButton>
      </div>
    </div>
  )
})
const BuilderFile: React.FC<{ file: PZFileBuilding }> = memo((props) => {
  const { file } = props
  const { builder } = useContext(BuilderContext)
  const openSetNameDialog = useSetNamDialog()
  const [t] = useTranslation()
  const deleteHandler = useCallback(() => {
    builder.removeFile(file)
  }, [file])
  const renameHandler = useCallback(() => {
    const sub = openSetNameDialog(file.name)
    sub.subscribe((name) => {
      if (name) builder.moveFile(file, file.pid, name)
    })
  }, [file, builder, openSetNameDialog])

  return (
    <div
      title={`${t('source')}: ${file.source}`}
      className="flex items-center py-1 px-4 select-none hover:bg-blue-200 dark:text-gray-50 dark:hover:bg-neutral-600"
    >
      <FiletypeIcon type={file.ext} size={20} />
      <div className="flex-1 text-ellipsis pl-4 overflow-hidden whitespace-nowrap">{file.name}</div>
      <div className="text-right pr-4">
        <PZButton type="link" onClick={renameHandler}>
          {t('rename')}
        </PZButton>
        <PZButton type="link" onClick={deleteHandler}>
          {t('delete')}
        </PZButton>
      </div>
    </div>
  )
})
const BuilderList: React.FC<{ current: PZFolder; update: number }> = memo((props) => {
  const { builder } = useContext(BuilderContext)
  const { current, update } = props
  const children = useMemo(() => builder.getChildren(props.current.id), [builder, current, update])

  return (
    <div className="flex-1 auto-scrollbar">
      {children.folders
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((f) => (
          <BuilderFolder key={f.id} folder={f} />
        ))}
      {children.files
        .sort((a, b) => naturalCompare(a.name, b.name))
        .map((f) => (
          <BuilderFile key={f.fullname} file={f} />
        ))}
    </div>
  )
})
const BuilderOperateBar: React.FC<{ current: PZFolder }> = memo(({ current }) => {
  const [t] = useTranslation()
  const { builder } = useContext(BuilderContext)
  const openSetNameDialog = useSetNamDialog()
  const { openBuildDialog } = useBuilderDialogs()
  const info = useInfoDialog()

  const createFolder = useCallback(() => {
    const sub = openSetNameDialog()
    sub.subscribe((name) => {
      if (name) builder.addFolder(name, current.id)
    })
  }, [builder, current, openSetNameDialog])
  const addFolder = useCallback(() => {
    openDir().then((dir) => {
      if (dir) addDir(builder, current, dir)
    })
  }, [builder, current])
  const addFiles = useCallback(() => {
    selectFiles().then((files) => {
      for (const file of files) {
        const filename = path.basename(file)
        builder.addFile(file, current.id, filename)
      }
    })
  }, [builder, current])
  const renameBySort = useCallback(() => {
    const children = builder.getChildren(current.id)
    const sortedFiles = children.files.sort((a, b) => naturalCompare(a.name, b.name))
    sortedFiles.forEach((f, i) => {
      const numberName = ('00000' + (i + 1)).slice(-5)
      builder.moveFile(f, f.pid, numberName + f.ext)
    })
  }, [builder, current])
  const toBuild = useCallback(() => {
    try {
      builder.checkEmpty()
      openBuildDialog(builder)
    } catch (err) {
      const msg = (err as Error)?.message ?? 'unknown error'
      info(msg, t('error'), 'error')
    }
  }, [builder])

  return (
    <div className="flex flex-row border-t px-4 py-1 border-neutral-400 dark:border-neutral-700 dark:text-gray-50">
      <div className="flex-1">
        <PZButton type="normal" onClick={createFolder}>
          {t('create folder')}
        </PZButton>
        <PZButton type="normal" onClick={addFolder}>
          {t('add folder')}
        </PZButton>
        <PZButton type="normal" onClick={addFiles}>
          {t('add files')}
        </PZButton>
        <PZButton type="normal" onClick={renameBySort}>
          {t('rename by sort')}
        </PZButton>
      </div>
      <div>
        <PZButton type="primary" onClick={toBuild}>
          {t('pack')}
        </PZButton>
      </div>
    </div>
  )
})

const BuilderContent = () => {
  const { builder } = useContext(BuilderContext)
  const [updateFlag, dispatchFlag] = useReducer((prev) => prev + 1, 0)
  const [currentFolder, setCurrentFolder] = useState(builder.getRootFolder()!)

  const context: ContentContextType = useMemo(
    () => ({ navigate: (folder) => setCurrentFolder(folder) }),
    [setCurrentFolder],
  )
  useEffect(() => {
    const subscription = builder.subscriber.subscribe(() => {
      RendererLogger.debug('PZPack builder update')
      dispatchFlag()
    })
    return () => subscription.unsubscribe()
  }, [builder, dispatchFlag])

  return (
    <div className="w-full h-full flex flex-col">
      <ContentContext.Provider value={context}>
        <Breadcrumbs current={currentFolder} update={updateFlag} />
        <BuilderList current={currentFolder} update={updateFlag} />
        <BuilderOperateBar current={currentFolder} />
      </ContentContext.Provider>
    </div>
  )
}

export const PZPackBuilder: React.FC<{ builder: PZIndexBuilder }> = memo(({ builder }) => {
  return (
    <BuilderContext.Provider value={{ builder }}>
      <BuilderContent />
    </BuilderContext.Provider>
  )
})

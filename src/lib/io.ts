import * as fs from 'fs'
import * as fsp from 'fs/promises'
import * as path from 'path'

export const checkDirExists = (dir: string) => {
  const dirExists = fs.existsSync(dir)
  if (dirExists) {
    const stats = fs.statSync(dir)
    if (!stats.isDirectory()) {
      throw new Error(`Path ${dir} is already exists and it's not a directory`)
    }
  }
  return dirExists
}
export const checkFileExists = (file: string) => {
  const fileExists = fs.existsSync(file)
  if (fileExists) {
    const stats = fs.statSync(file)
    if (!stats.isFile()) {
      throw new Error(`Path ${file} is already exists and it's not a file`)
    }
  }
  return fileExists
}
export const ensureDir = (dir: string) => {
  if (!checkDirExists(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}
export const ensureFileDir = (file: string) => {
  ensureDir(path.dirname(file))
}

export const ensureDirAsync = async (dir: string) => {
  let notDirError = false
  try {
    const stats = await fsp.stat(dir)
    if (!stats.isDirectory()) {
      notDirError = true
      throw new Error(`Path ${dir} is already exists and it's not a directory`)
    }
  } catch (e) {
    if (notDirError) throw e
    else await fsp.mkdir(dir, { recursive: true })
  }
}
export const ensureFileDirAsync = async (file: string) => {
  await ensureDir(path.dirname(file))
}

export const readJson = <T>(file: string) => {
  const text = fs.readFileSync(file, { encoding: 'utf8' })
  const json = JSON.parse(text)
  return json as T
}
export const readJsonAsync = <T>(file: string) => {
  return new Promise<T>((res, rej) => {
    fs.readFile(file, { encoding: 'utf8' }, (err, text) => {
      if (err) {
        rej(err)
        return
      }

      const json = JSON.parse(text)
      res(json)
    })
  })
}
export const writeJson = (file: string, data: unknown) => {
  const text = JSON.stringify(data, undefined, 2)
  fs.writeFileSync(file, text, { encoding: 'utf8' })
}
export const writeJsonAsync = (file: string, data: unknown) => {
  return new Promise<void>((res, rej) => {
    const text = JSON.stringify(data, undefined, 2)
    fs.writeFile(file, text, { encoding: 'utf8' }, (err) => {
      if (err) rej(err)
      else res()
    })
  })
}

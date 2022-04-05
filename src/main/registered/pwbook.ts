import { AppLogger } from '../utils/logger'
import { registerInvoke, getSender, unregisterInvoke } from '../utils/ipc'
import { type PasswordBook, openPasswordBook, createPasswordBook } from '../utils/pwbook'
import { tryOpenPZloader } from '../utils/pzpk'

let current: PasswordBook | null = null
const updateSender = getSender('pwbook:update')

const register = () => {
  registerInvoke('pwbook:add', (password: string) => {
    if (!current) {
      return { success: false, message: 'Password book not opened' }
    }

    try {
      current.add(password)
      return { success: true }
    } catch (err) {
      const message = err && (err as any).message ? (err as any).message : 'unknown error'
      AppLogger.errorStack(err)
      return { success: false, message }
    }
  })
  registerInvoke('pwbook:delete', (hash: string) => {
    if (!current) {
      return { success: false, message: 'Password book not opened' }
    }

    try {
      const deleted = current.delete(hash)
      return { success: deleted, message: '' }
    } catch (err) {
      const message = err && (err as any).message ? (err as any).message : 'unknown error'
      AppLogger.errorStack(err)
      return { success: false, message }
    }
  })
  registerInvoke('pwbook:open', async (args) => {
    try {
      if (current) await current.close()
      if (args.mode === 'open') current = await openPasswordBook(args.filename, args.masterPw)
      else current = await createPasswordBook(args.filename, args.masterPw)

      current.updater.subscribe((items) => {
        updateSender.send({ items })
      })

      return { success: true, filename: current.filename, items: current.items() }
    } catch (err) {
      const message = err && (err as any).message ? (err as any).message : 'unknown error'
      AppLogger.errorStack(err)
      return { success: false, message }
    }
  })
  registerInvoke('pwbook:current', () => {
    if (!current) {
      return { success: false, message: 'Password book not opened' }
    }
    return { success: true, filename: current.filename, items: current.items() }
  })
  registerInvoke('pwbook:close', async () => {
    if (!current) {
      return { success: false, message: 'Password book not opened' }
    }

    await current.close()
    current = null
    return { success: true }
  })
  registerInvoke('pwbook:tryopen', (filename) => {
    if (!current) {
      return { success: false, message: 'Password book not opened' }
    }

    return tryOpenPZloader(filename, current)
  })
}
const unregister = () => {
  current?.close()

  unregisterInvoke('pwbook:add')
  unregisterInvoke('pwbook:delete')
  unregisterInvoke('pwbook:open')
  unregisterInvoke('pwbook:current')
  unregisterInvoke('pwbook:close')
}

export { register, unregister }

import { appLogger } from '../utils/logger'
import { createErrorResult, errorCodes, errorHandler } from '../../lib/exceptions'
import { registerInvoke, getSender, unregisterInvoke } from '../utils/ipc'
import { type PasswordBook, openPasswordBook, createPasswordBook } from '../utils/pwbook'
import { tryOpenPZloader } from '../utils/pzpk'

let current: PasswordBook | null = null
const updateSender = getSender('pwbook:update')

const register = () => {
  registerInvoke('pwbook:add', (password: string) => {
    if (!current) {
      return createErrorResult(errorCodes.PasswordBookNotOpened)
    }

    try {
      current.add(password)
      return { success: true }
    } catch (err) {
      return errorHandler(err, appLogger)
    }
  })
  registerInvoke('pwbook:delete', (hash: string) => {
    if (!current) {
      return createErrorResult(errorCodes.PasswordBookNotOpened)
    }

    try {
      current.delete(hash)
      return { success: true }
    } catch (err) {
      return errorHandler(err, appLogger)
    }
  })
  registerInvoke('pwbook:open', async (args) => {
    try {
      if (current) await current.close()
      if (args.mode === 'open') current = await openPasswordBook(args.filename, args.masterPw)
      else current = await createPasswordBook(args.filename, args.masterPw)

      current.observer().subscribe((items) => {
        updateSender.send({ items })
      })

      return { success: true, filename: current.filename, items: current.items() }
    } catch (err) {
      return errorHandler(err, appLogger)
    }
  })
  registerInvoke('pwbook:current', () => {
    if (!current) {
      return createErrorResult(errorCodes.PasswordBookNotOpened)
    }
    return { success: true, filename: current.filename, items: current.items() }
  })
  registerInvoke('pwbook:close', async () => {
    if (!current) {
      return createErrorResult(errorCodes.PasswordBookNotOpened)
    }

    await current.close()
    current = null
    return { success: true }
  })
  registerInvoke('pwbook:tryopen', (filename) => {
    if (!current) {
      return createErrorResult(errorCodes.PasswordBookNotOpened)
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
  unregisterInvoke('pwbook:tryopen')
}

export { register, unregister }

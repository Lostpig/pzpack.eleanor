import * as path from 'path'
import { PZLogger, LogLevel, ctxCtrl } from 'pzpack'
import { ROOT, isDebug } from './common'

const appLogPath = path.join(ROOT, 'data', 'log', 'app.log')
const pzpackLogPath = path.join(ROOT, 'data', 'log', 'pzpk.log')

const logLevel = (ENV_DEV || isDebug) ? LogLevel.DEBUG : LogLevel.WARNING

const appLogger = new PZLogger({ level: logLevel, logFile: ENV_DEV ? undefined : appLogPath })
const pzpkLogger = new PZLogger({ level: logLevel, logFile: ENV_DEV ? undefined : pzpackLogPath })
ctxCtrl.bindingLogger(pzpkLogger)

export { appLogger }

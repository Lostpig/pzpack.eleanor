import * as path from 'path'
import { PZLogger, LogLevel, PZDefaultLogger } from 'pzpack'
import { ROOT } from './common'

const appLogPath = path.join(ROOT, 'data', 'log', 'app.log')
const pzpackLogPath = path.join(ROOT, 'data', 'log', 'pzpk.log')

const logger = new PZLogger('Main')
logger.enableFileLog(appLogPath)

PZDefaultLogger.enableFileLog(pzpackLogPath)
export const AppLogger = logger
export { PZDefaultLogger, LogLevel }

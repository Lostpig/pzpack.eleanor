import { PZLogger, LogLevel } from 'pzpack'

const logLevel = ENV_DEV ? LogLevel.DEBUG : LogLevel.WARNING
const logger = new PZLogger({ id: 'app', level: logLevel, logFile: undefined })

export { logger }

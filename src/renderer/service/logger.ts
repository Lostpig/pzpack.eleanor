import { PZLogger, LogLevel, PZDefaultLogger } from 'pzpack'

export const RendererLogger = new PZLogger('Renderer')
RendererLogger.consoleLevel = LogLevel.DEBUG
RendererLogger.fileLevel = LogLevel.WARNING

export { LogLevel, PZDefaultLogger }

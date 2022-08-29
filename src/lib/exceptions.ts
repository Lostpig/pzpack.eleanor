import { type PZLogger, PZExceptions } from 'pzpack'
import type { PZPKFailedResult } from './declares'

export const errorCodes = {
  Unknown: 'ELEX_UnknownError',
  Other: 'ELEX_UnknownError',

  ApplicationNotInited: 'ELEX_ApplicationNotInited',
  PasswordBookNotOpened: 'ELEX_PasswordBookNotOpened',
  PasswordBookCheckInvalid: 'ELEX_PasswordBookCheckInvalid',
  PasswordBookKeyInvalid: 'ELEX_PasswordBookKeyInvalid',
  PasswordBookPasswordExists: 'ELEX_PasswordBookPasswordExists',
  PasswordBookFileSizeIncorrect: 'ELEX_PasswordBookFileSizeIncorrect',
  PZPKFileAlreadyOpened: 'ELEX_PZPKFileAlreadyOpened',
  PZPKHashCheckInvalid: 'ELEX_PZPKHashCheckInvalid',

  PZFileNotOpened: 'ELEX_PZFileNotOpened',
}

export const createErrorResult = (
  errorCode: string,
  param?: Record<string, string | number>,
  message?: string,
): PZPKFailedResult => {
  return {
    success: false,
    error: {
      errorCode,
      param,
      message: message ?? 'Unknown error',
    },
  }
}
export const errorHandler = (error: unknown, logger?: PZLogger) => {
  logger?.errorStack(error)

  if (error instanceof Error) {
    if (PZExceptions.isPZError(error)) {
      return createErrorResult(error.errorCode, error.params, error.message)
    } else {
      const message = error?.message ?? 'unknown error'
      return createErrorResult(errorCodes.Other, undefined, message)
    }
  } else {
    return createErrorResult(errorCodes.Unknown)
  }
}

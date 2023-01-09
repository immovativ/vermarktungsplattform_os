import axios from 'axios'

export interface BetterSuccess<TData = any> {
  status: number,
  data: TData
}

export interface BetterError<TError = any> {
  status?: number;
  data?: TError;
  message: string,
}

export const TechnicalError: BetterError<never> = {
  status: undefined,
  data: undefined,
  message: `Es ist ein Netzwerkfehler aufgetreten.`,
} as const

export type BetterResponse<TData = any, TError = any> = BetterSuccess<TData> | BetterError<TError>

function isSerializable(maybeError: any): maybeError is Error {
  return maybeError.message != undefined && maybeError.name != undefined
}

export function serializeBetterError<TError = any>(error: any): BetterError<TError> {
  if (axios.isAxiosError(error) && error.response) {
    const {status, data} = error.response

    return {
      message: `Es ist ein technischer Fehler aufgetreten (HTTP ${status}).`,
      status: status,
      data: data,
    }
  } else if (isSerializable(error)) {
    return {
      message: error.message,
      status: undefined,
      data: undefined,
    }
  } else {
    return TechnicalError
  }
}

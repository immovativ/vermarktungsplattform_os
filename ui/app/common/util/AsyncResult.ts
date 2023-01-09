
interface BaseAsyncResponse {
  isLoading: boolean
  isUpdating: boolean
  isIdle: boolean
  isError: boolean
  isSuccess: boolean
  data?: any
  error?: any
}

export interface AsyncSuccess<TData = any> extends BaseAsyncResponse {
  isLoading: false
  isIdle: false
  isError: false
  isSuccess: true
  data: TData
  error?: undefined
}

export interface AsyncError<TData = any, TError = any> extends BaseAsyncResponse {
  isLoading: false
  isIdle: false
  isError: true
  isSuccess: false
  data?: TData
  error: TError
}

export interface AsyncLoading extends BaseAsyncResponse {
  isLoading: true
  isIdle: false
  isError: false
  isSuccess: false
  data?: undefined
  error?: undefined
}

export interface AsyncUpdating<TData = any> extends BaseAsyncResponse {
  isLoading: false
  isIdle: false
  isError: false
  isSuccess: true
  isUpdating: true
  data: TData
  error?: undefined
}

export interface AsyncIdle extends BaseAsyncResponse {
  isLoading: false
  isIdle: true
  isError: false
  isSuccess: false
  data?: undefined
  error?: undefined
}

export type AsyncResult<TData = any, TError = any> = AsyncSuccess<TData> |
    AsyncError<TData, TError> |
    AsyncLoading |
    AsyncUpdating<TData> |
    AsyncIdle

type IAsyncResultBuilder= {
  idle: () => AsyncIdle
  loading: () => AsyncLoading
  updating: <TData = any>(data: TData) => AsyncUpdating<TData>
  error: <TError = any, TData = any>(error: TError, data?: TData) => AsyncError<TData, TError>
  success: <TData = any>(data: TData) => AsyncSuccess<TData>
}

export const AsyncResultBuilder: IAsyncResultBuilder = {
  idle: () => ({
    isError: false,
    isIdle: true,
    isLoading: false,
    isUpdating: false,
    isSuccess: false,
  }),
  loading: () => ({
    isError: false,
    isIdle: false,
    isLoading: true,
    isUpdating: false,
    isSuccess: false,
  }),
  updating: (data) => ({
    isError: false,
    isIdle: false,
    isLoading: false,
    isUpdating: true,
    isSuccess: true,
    data,
  }),
  error: (error, data) => ({
    isError: true,
    isIdle: false,
    isLoading: false,
    isSuccess: false,
    isUpdating: false,
    error,
    data,
  }),
  success: (data) => ({
    isError: false,
    isIdle: false,
    isLoading: false,
    isSuccess: true,
    isUpdating: false,
    data,
  }),
}

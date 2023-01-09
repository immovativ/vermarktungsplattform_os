import { BetterError, BetterSuccess, serializeBetterError } from '@common/util/BetterResponse'
import { AxiosError, AxiosResponse } from 'axios'
import { MutationFunction, useMutation, UseMutationOptions, UseMutationResult } from 'react-query'

export function useBetterMutation<TData = any, TError = any, TVariables = any>(
    mutationFn: MutationFunction<AxiosResponse<TData>, TVariables>,
    options?: Pick<UseMutationOptions<any, BetterError<TError>, TVariables, any>, 'onSuccess' | 'onError' | 'onMutate'>,
    errorMutationFn?: (args: BetterError<TError>) => BetterError<TError> | undefined,
): UseMutationResult<BetterSuccess<TData>, BetterError<TError>, TVariables> {
  const mutation = useMutation<BetterSuccess<TData>, BetterError<TError>, TVariables>({
    ...(options ? options : {}),
    mutationFn: async (vars) => {
      const response = await mutationFn(vars).catch((error: AxiosError) => {
        const errorResponse = serializeBetterError<TError>(error)

        if (errorMutationFn) {
          return Promise.reject(errorMutationFn(errorResponse) || errorResponse)
        } else {
          return Promise.reject(errorResponse)
        }
      })
      const result: BetterSuccess<TData> = {
        status: response.status,
        data: response.data,
      }

      return result
    },
  })

  return mutation
}

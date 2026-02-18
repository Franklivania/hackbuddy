import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import {
  getData,
  postData,
  putData,
  patchData,
  deleteData,
  postMultipart,
  putMultipart,
  patchMultipart,
} from './api-actions'

type CrudOptions<TBody = unknown> = {
  headers?: Record<string, string>
  queryParams?: Record<string, string | number | boolean | undefined>
  skipAuth?: boolean
}

// —— Variables types for each mutation (endpoint can be fixed or passed per call) ——

export type PostMutationVariables<TBody = unknown> = CrudOptions<TBody> & {
  endpoint?: string
  body?: TBody
}

export type PutMutationVariables<TBody = unknown> = CrudOptions<TBody> & {
  endpoint?: string
  body?: TBody
}

export type PatchMutationVariables<TBody = unknown> = CrudOptions<TBody> & {
  endpoint?: string
  body?: TBody
}

export type DeleteMutationVariables<TBody = unknown> = CrudOptions<TBody> & {
  endpoint?: string
  body?: TBody
}

export type PostMultipartMutationVariables = CrudOptions<FormData> & {
  endpoint?: string
  formData: FormData
}

export type PutMultipartMutationVariables = CrudOptions<FormData> & {
  endpoint?: string
  formData: FormData
}

export type PatchMultipartMutationVariables = CrudOptions<FormData> & {
  endpoint?: string
  formData: FormData
}

export type GetMutationVariables = CrudOptions<never> & {
  endpoint?: string
}

// —— API returns { data, status, headers }; we expose that as mutation result ——

export type ApiMutationResult<T> = {
  data: T
  status: number
  headers: Headers
}

// —— Shared options type for hooks that take an optional endpoint ——

type MutationHookOptions<TResponse, TError = Error, TVariables = unknown> = Omit<
  UseMutationOptions<ApiMutationResult<TResponse>, TError, TVariables>,
  'mutationFn'
>

// —— GET / fetch (triggered as mutation, e.g. refetch on demand) ——

export type UseGetMutationOptions<TResponse = unknown> =
  MutationHookOptions<TResponse, Error, GetMutationVariables> & {
    endpoint?: string
  }

export function useGetMutation<TResponse = unknown>(
  endpointOrOptions?: string | UseGetMutationOptions<TResponse>,
  options?: UseGetMutationOptions<TResponse>,
): UseMutationResult<
  ApiMutationResult<TResponse>,
  Error,
  GetMutationVariables
> {
  const endpoint =
    typeof endpointOrOptions === 'string' ? endpointOrOptions : undefined
  const opts =
    (typeof endpointOrOptions === 'string' ? options : endpointOrOptions) ??
    (typeof endpointOrOptions === 'object' ? endpointOrOptions : {})

  return useMutation({
    mutationFn: async (variables: GetMutationVariables) => {
      const url = variables.endpoint ?? endpoint ?? (opts as { endpoint?: string }).endpoint
      if (!url) throw new Error('GET mutation: endpoint is required')
      return getData<TResponse>(url, {
        headers: variables.headers,
        queryParams: variables.queryParams,
        skipAuth: variables.skipAuth,
      })
    },
    ...opts,
  })
}

// —— POST (JSON) ——

export type UsePostMutationOptions<TResponse = unknown, TBody = unknown> =
  MutationHookOptions<TResponse, Error, PostMutationVariables<TBody>> & {
    endpoint?: string
  }

export function usePostMutation<TResponse = unknown, TBody = unknown>(
  endpointOrOptions?: string | UsePostMutationOptions<TResponse, TBody>,
  options?: UsePostMutationOptions<TResponse, TBody>,
): UseMutationResult<
  ApiMutationResult<TResponse>,
  Error,
  PostMutationVariables<TBody>
> {
  const endpoint =
    typeof endpointOrOptions === 'string' ? endpointOrOptions : undefined
  const opts =
    (typeof endpointOrOptions === 'string' ? options : endpointOrOptions) ??
    (typeof endpointOrOptions === 'object' ? endpointOrOptions : {})

  return useMutation({
    mutationFn: async (variables: PostMutationVariables<TBody>) => {
      const url = variables.endpoint ?? endpoint ?? (opts as { endpoint?: string }).endpoint
      if (!url) throw new Error('POST mutation: endpoint is required')
      const result = await postData<TResponse, TBody>(url, variables.body, {
        headers: variables.headers,
        queryParams: variables.queryParams,
        skipAuth: variables.skipAuth,
      })
      return result
    },
    ...opts,
  })
}

// —— PUT (JSON) ——

export type UsePutMutationOptions<TResponse = unknown, TBody = unknown> =
  MutationHookOptions<TResponse, Error, PutMutationVariables<TBody>> & {
    endpoint?: string
  }

export function usePutMutation<TResponse = unknown, TBody = unknown>(
  endpointOrOptions?: string | UsePutMutationOptions<TResponse, TBody>,
  options?: UsePutMutationOptions<TResponse, TBody>,
): UseMutationResult<
  ApiMutationResult<TResponse>,
  Error,
  PutMutationVariables<TBody>
> {
  const endpoint =
    typeof endpointOrOptions === 'string' ? endpointOrOptions : undefined
  const opts =
    (typeof endpointOrOptions === 'string' ? options : endpointOrOptions) ??
    (typeof endpointOrOptions === 'object' ? endpointOrOptions : {})

  return useMutation({
    mutationFn: async (variables: PutMutationVariables<TBody>) => {
      const url = variables.endpoint ?? endpoint ?? (opts as { endpoint?: string }).endpoint
      if (!url) throw new Error('PUT mutation: endpoint is required')
      return putData<TResponse, TBody>(url, variables.body, {
        headers: variables.headers,
        queryParams: variables.queryParams,
        skipAuth: variables.skipAuth,
      })
    },
    ...opts,
  })
}

// —— PATCH (JSON) ——

export type UsePatchMutationOptions<TResponse = unknown, TBody = unknown> =
  MutationHookOptions<TResponse, Error, PatchMutationVariables<TBody>> & {
    endpoint?: string
  }

export function usePatchMutation<TResponse = unknown, TBody = unknown>(
  endpointOrOptions?: string | UsePatchMutationOptions<TResponse, TBody>,
  options?: UsePatchMutationOptions<TResponse, TBody>,
): UseMutationResult<
  ApiMutationResult<TResponse>,
  Error,
  PatchMutationVariables<TBody>
> {
  const endpoint =
    typeof endpointOrOptions === 'string' ? endpointOrOptions : undefined
  const opts =
    (typeof endpointOrOptions === 'string' ? options : endpointOrOptions) ??
    (typeof endpointOrOptions === 'object' ? endpointOrOptions : {})

  return useMutation({
    mutationFn: async (variables: PatchMutationVariables<TBody>) => {
      const url = variables.endpoint ?? endpoint ?? (opts as { endpoint?: string }).endpoint
      if (!url) throw new Error('PATCH mutation: endpoint is required')
      return patchData<TResponse, TBody>(url, variables.body, {
        headers: variables.headers,
        queryParams: variables.queryParams,
        skipAuth: variables.skipAuth,
      })
    },
    ...opts,
  })
}

// —— DELETE ——

export type UseDeleteMutationOptions<TResponse = unknown, TBody = unknown> =
  MutationHookOptions<TResponse, Error, DeleteMutationVariables<TBody>> & {
    endpoint?: string
  }

export function useDeleteMutation<TResponse = void, TBody = unknown>(
  endpointOrOptions?: string | UseDeleteMutationOptions<TResponse, TBody>,
  options?: UseDeleteMutationOptions<TResponse, TBody>,
): UseMutationResult<
  ApiMutationResult<TResponse>,
  Error,
  DeleteMutationVariables<TBody>
> {
  const endpoint =
    typeof endpointOrOptions === 'string' ? endpointOrOptions : undefined
  const opts =
    (typeof endpointOrOptions === 'string' ? options : endpointOrOptions) ??
    (typeof endpointOrOptions === 'object' ? endpointOrOptions : {})

  return useMutation({
    mutationFn: async (variables: DeleteMutationVariables<TBody>) => {
      const url = variables.endpoint ?? endpoint ?? (opts as { endpoint?: string }).endpoint
      if (!url) throw new Error('DELETE mutation: endpoint is required')
      return deleteData<TResponse, TBody>(url, variables.body, {
        headers: variables.headers,
        queryParams: variables.queryParams,
        skipAuth: variables.skipAuth,
      })
    },
    ...opts,
  })
}

// —— POST multipart ——

export type UsePostMultipartMutationOptions<TResponse = unknown> =
  MutationHookOptions<TResponse, Error, PostMultipartMutationVariables> & {
    endpoint?: string
  }

export function usePostMultipartMutation<TResponse = unknown>(
  endpointOrOptions?: string | UsePostMultipartMutationOptions<TResponse>,
  options?: UsePostMultipartMutationOptions<TResponse>,
): UseMutationResult<
  ApiMutationResult<TResponse>,
  Error,
  PostMultipartMutationVariables
> {
  const endpoint =
    typeof endpointOrOptions === 'string' ? endpointOrOptions : undefined
  const opts =
    (typeof endpointOrOptions === 'string' ? options : endpointOrOptions) ??
    (typeof endpointOrOptions === 'object' ? endpointOrOptions : {})

  return useMutation({
    mutationFn: async (variables: PostMultipartMutationVariables) => {
      const url = variables.endpoint ?? endpoint ?? (opts as { endpoint?: string }).endpoint
      if (!url) throw new Error('POST multipart mutation: endpoint is required')
      return postMultipart<TResponse>(url, variables.formData, {
        headers: variables.headers,
        queryParams: variables.queryParams,
        skipAuth: variables.skipAuth,
      })
    },
    ...opts,
  })
}

// —— PUT multipart ——

export type UsePutMultipartMutationOptions<TResponse = unknown> =
  MutationHookOptions<TResponse, Error, PutMultipartMutationVariables> & {
    endpoint?: string
  }

export function usePutMultipartMutation<TResponse = unknown>(
  endpointOrOptions?: string | UsePutMultipartMutationOptions<TResponse>,
  options?: UsePutMultipartMutationOptions<TResponse>,
): UseMutationResult<
  ApiMutationResult<TResponse>,
  Error,
  PutMultipartMutationVariables
> {
  const endpoint =
    typeof endpointOrOptions === 'string' ? endpointOrOptions : undefined
  const opts =
    (typeof endpointOrOptions === 'string' ? options : endpointOrOptions) ??
    (typeof endpointOrOptions === 'object' ? endpointOrOptions : {})

  return useMutation({
    mutationFn: async (variables: PutMultipartMutationVariables) => {
      const url = variables.endpoint ?? endpoint ?? (opts as { endpoint?: string }).endpoint
      if (!url) throw new Error('PUT multipart mutation: endpoint is required')
      return putMultipart<TResponse>(url, variables.formData, {
        headers: variables.headers,
        queryParams: variables.queryParams,
        skipAuth: variables.skipAuth,
      })
    },
    ...opts,
  })
}

// —— PATCH multipart ——

export type UsePatchMultipartMutationOptions<TResponse = unknown> =
  MutationHookOptions<TResponse, Error, PatchMultipartMutationVariables> & {
    endpoint?: string
  }

export function usePatchMultipartMutation<TResponse = unknown>(
  endpointOrOptions?: string | UsePatchMultipartMutationOptions<TResponse>,
  options?: UsePatchMultipartMutationOptions<TResponse>,
): UseMutationResult<
  ApiMutationResult<TResponse>,
  Error,
  PatchMultipartMutationVariables
> {
  const endpoint =
    typeof endpointOrOptions === 'string' ? endpointOrOptions : undefined
  const opts =
    (typeof endpointOrOptions === 'string' ? options : endpointOrOptions) ??
    (typeof endpointOrOptions === 'object' ? endpointOrOptions : {})

  return useMutation({
    mutationFn: async (variables: PatchMultipartMutationVariables) => {
      const url = variables.endpoint ?? endpoint ?? (opts as { endpoint?: string }).endpoint
      if (!url) throw new Error('PATCH multipart mutation: endpoint is required')
      return patchMultipart<TResponse>(url, variables.formData, {
        headers: variables.headers,
        queryParams: variables.queryParams,
        skipAuth: variables.skipAuth,
      })
    },
    ...opts,
  })
}

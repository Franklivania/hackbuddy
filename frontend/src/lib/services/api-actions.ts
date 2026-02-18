import apiFetch from './api-setup'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface CrudOptions<TBody = unknown> extends Omit<
  RequestInit,
  'body' | 'method'
> {
  body?: TBody
  headers?: Record<string, string>
  queryParams?: Record<string, string | number | boolean | undefined>
  skipAuth?: boolean
  isMultipart?: boolean
}

/**
 * Low-level request helper that wraps the core `apiFetch` and exposes
 * all HTTP verbs with shared options and typings.
 */
export async function request<TResponse, TBody = unknown>(
  method: HttpMethod,
  endpoint: string,
  options: CrudOptions<TBody> = {},
) {
  return apiFetch<TResponse, TBody>(endpoint, method, options)
}

/**
 * Convenience helpers for common JSON-based requests
 */
export function getData<TResponse>(
  endpoint: string,
  options: Omit<CrudOptions<never>, 'body' | 'isMultipart'> = {},
) {
  return request<TResponse, never>('GET', endpoint, options)
}

export function postData<TResponse, TBody = unknown>(
  endpoint: string,
  body?: TBody,
  options: Omit<CrudOptions<TBody>, 'body' | 'isMultipart'> = {},
) {
  return request<TResponse, TBody>('POST', endpoint, {
    ...options,
    body,
    isMultipart: false,
  })
}

export function putData<TResponse, TBody = unknown>(
  endpoint: string,
  body?: TBody,
  options: Omit<CrudOptions<TBody>, 'body' | 'isMultipart'> = {},
) {
  return request<TResponse, TBody>('PUT', endpoint, {
    ...options,
    body,
    isMultipart: false,
  })
}

export function patchData<TResponse, TBody = unknown>(
  endpoint: string,
  body?: TBody,
  options: Omit<CrudOptions<TBody>, 'body' | 'isMultipart'> = {},
) {
  return request<TResponse, TBody>('PATCH', endpoint, {
    ...options,
    body,
    isMultipart: false,
  })
}

export function deleteData<TResponse = void, TBody = unknown>(
  endpoint: string,
  body?: TBody,
  options: Omit<CrudOptions<TBody>, 'body' | 'isMultipart'> = {},
) {
  return request<TResponse, TBody>('DELETE', endpoint, {
    ...options,
    body,
    isMultipart: false,
  })
}

/**
 * Multipart helpers for file uploads and mixed-form data.
 * These expect a `FormData` body and will rely on the browser to set
 * the correct `Content-Type` with boundary.
 */
export function postMultipart<TResponse>(
  endpoint: string,
  formData: FormData,
  options: Omit<CrudOptions<FormData>, 'body' | 'isMultipart'> = {},
) {
  return request<TResponse, FormData>('POST', endpoint, {
    ...options,
    body: formData,
    isMultipart: true,
  })
}

export function putMultipart<TResponse>(
  endpoint: string,
  formData: FormData,
  options: Omit<CrudOptions<FormData>, 'body' | 'isMultipart'> = {},
) {
  return request<TResponse, FormData>('PUT', endpoint, {
    ...options,
    body: formData,
    isMultipart: true,
  })
}

export function patchMultipart<TResponse>(
  endpoint: string,
  formData: FormData,
  options: Omit<CrudOptions<FormData>, 'body' | 'isMultipart'> = {},
) {
  return request<TResponse, FormData>('PATCH', endpoint, {
    ...options,
    body: formData,
    isMultipart: true,
  })
}

/**
 * High-level, resource-oriented CRUD helpers.
 * These assume REST-style endpoints like `/items` and `/items/:id`.
 */
export function listResource<TResponse>(
  baseEndpoint: string,
  options?: Omit<CrudOptions<never>, 'body' | 'isMultipart'>,
) {
  return getData<TResponse>(baseEndpoint, options)
}

export function getResource<TResponse>(
  baseEndpoint: string,
  id: string | number,
  options?: Omit<CrudOptions<never>, 'body' | 'isMultipart'>,
) {
  const endpoint = `${baseEndpoint}/${id}`
  return getData<TResponse>(endpoint, options)
}

export function createResource<TResponse, TBody = unknown>(
  baseEndpoint: string,
  body: TBody,
  options?: Omit<CrudOptions<TBody>, 'body' | 'isMultipart'>,
) {
  return postData<TResponse, TBody>(baseEndpoint, body, options ?? {})
}

export function updateResource<TResponse, TBody = unknown>(
  baseEndpoint: string,
  id: string | number,
  body: TBody,
  options?: Omit<CrudOptions<TBody>, 'body' | 'isMultipart'>,
) {
  const endpoint = `${baseEndpoint}/${id}`
  return putData<TResponse, TBody>(endpoint, body, options ?? {})
}

export function patchResource<TResponse, TBody = unknown>(
  baseEndpoint: string,
  id: string | number,
  body: TBody,
  options?: Omit<CrudOptions<TBody>, 'body' | 'isMultipart'>,
) {
  const endpoint = `${baseEndpoint}/${id}`
  return patchData<TResponse, TBody>(endpoint, body, options ?? {})
}

export function deleteResource<TResponse = void>(
  baseEndpoint: string,
  id: string | number,
  options?: Omit<CrudOptions<never>, 'body' | 'isMultipart'>,
) {
  const endpoint = `${baseEndpoint}/${id}`
  return deleteData<TResponse, never>(endpoint, undefined, options ?? {})
}

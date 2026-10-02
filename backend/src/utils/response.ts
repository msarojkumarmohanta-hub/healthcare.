export type ApiResponse<T> = {
  success: true
  data: T
  message?: string
}

export type ApiErrorResponse = {
  success: false
  error: {
    code: string
    message: string
  }
}

export const successResponse = <T>(data: T, message = 'Request successful'): ApiResponse<T> => ({
  success: true,
  data,
  message,
})

export const errorResponse = (code: string, message: string): ApiErrorResponse => ({
  success: false,
  error: { code, message },
})

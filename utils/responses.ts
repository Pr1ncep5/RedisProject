export type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: string;
};

export function createSuccessResponse<T>(
  data: T,
  message: string = "Success"
): SuccessResponse<T> {
  return { success: true, message, data };
}

export function createErrorResponse(error: string): ErrorResponse {
  return { success: false, error };
}

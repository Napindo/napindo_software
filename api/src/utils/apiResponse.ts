// api/src/utils/apiResponse.ts

export interface ApiSuccess<T = any> {
  ok: true;
  data: T;
  message: string;
}

export interface ApiError<T = any> {
  ok: false;
  message: string;
  data?: T;
}

export function ok<T = any>(data: T, message = "OK"): ApiSuccess<T> {
  return { ok: true, data, message };
}

export function fail<T = any>(message: string, data?: T): ApiError<T> {
  return { ok: false, message, data };
}

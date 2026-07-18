/**
 * Public surface of the generated API contract.
 *
 * Everything here derives from server/openapi/openapi.yaml. Do not hand-write a
 * request or response type — add it to the spec and run `pnpm gen`. CI fails if
 * regenerating produces a diff, so drift cannot be merged.
 */
import createClient from 'openapi-fetch';
import type { components, paths } from './generated/api.js';

export type { paths, components };

/** Convenience aliases so app code never reaches into `components['schemas']`. */
export type Schemas = components['schemas'];

export type ApiError = Schemas['Error'];
export type ErrorDetail = Schemas['ErrorDetail'];
export type PageMeta = Schemas['PageMeta'];
export type Health = Schemas['Health'];

export type Service = Schemas['Service'];
export type ServiceList = Schemas['ServiceList'];
export type WorkCategory = Schemas['WorkCategory'];
export type WorkCategoryList = Schemas['WorkCategoryList'];

export type CreateInquiry = Schemas['CreateInquiry'];
export type InquiryReceipt = Schemas['InquiryReceipt'];

export type Role = Schemas['Role'];
export type LoginRequest = Schemas['LoginRequest'];
export type CurrentUser = Schemas['CurrentUser'];

/**
 * Typed API client.
 *
 * `credentials: 'include'` is not optional — auth is HttpOnly cookies, so every
 * request must carry them. There is no token in JavaScript to fall back on.
 */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({
    baseUrl,
    credentials: 'include',
  });
}

export type ApiClient = ReturnType<typeof createApiClient>;

/**
 * Public surface of the generated API contract.
 *
 * Everything here derives from backend/openapi/openapi.yaml. Do not hand-write a
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
export type Industry = Schemas['Industry'];
export type IndustryList = Schemas['IndustryList'];
export type Testimonial = Schemas['Testimonial'];
export type TestimonialList = Schemas['TestimonialList'];
export type Work = Schemas['Work'];
export type WorkList = Schemas['WorkList'];
export type BlogPost = Schemas['BlogPost'];
export type BlogPostList = Schemas['BlogPostList'];

export type CreateInquiry = Schemas['CreateInquiry'];
export type InquiryReceipt = Schemas['InquiryReceipt'];

export type Role = Schemas['Role'];
export type LoginRequest = Schemas['LoginRequest'];
export type CurrentUser = Schemas['CurrentUser'];

/* ---- Admin content management ---- */
export type AdminService = Schemas['AdminService'];
export type AdminServiceList = Schemas['AdminServiceList'];
export type CreateService = Schemas['CreateService'];
export type UpdateService = Schemas['UpdateService'];

export type AdminIndustry = Schemas['AdminIndustry'];
export type AdminIndustryList = Schemas['AdminIndustryList'];
export type CreateIndustry = Schemas['CreateIndustry'];
export type UpdateIndustry = Schemas['UpdateIndustry'];

export type AdminWorkCategory = Schemas['AdminWorkCategory'];
export type AdminWorkCategoryList = Schemas['AdminWorkCategoryList'];
export type CreateWorkCategory = Schemas['CreateWorkCategory'];
export type UpdateWorkCategory = Schemas['UpdateWorkCategory'];

export type AdminTestimonial = Schemas['AdminTestimonial'];
export type AdminTestimonialList = Schemas['AdminTestimonialList'];
export type CreateTestimonial = Schemas['CreateTestimonial'];
export type UpdateTestimonial = Schemas['UpdateTestimonial'];

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

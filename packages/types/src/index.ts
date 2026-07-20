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

export type AdminWork = Schemas['AdminWork'];
export type AdminWorkList = Schemas['AdminWorkList'];
export type CreateWork = Schemas['CreateWork'];
export type UpdateWork = Schemas['UpdateWork'];

export type AdminBlog = Schemas['AdminBlog'];
export type AdminBlogList = Schemas['AdminBlogList'];
export type CreateBlog = Schemas['CreateBlog'];
export type UpdateBlog = Schemas['UpdateBlog'];

export type InquiryStatus = Schemas['InquiryStatus'];
export type AdminInquiry = Schemas['AdminInquiry'];
export type AdminInquiryList = Schemas['AdminInquiryList'];
export type UpdateInquiry = Schemas['UpdateInquiry'];

export type AdminUser = Schemas['AdminUser'];
export type AdminUserList = Schemas['AdminUserList'];
export type UpdateUserRole = Schemas['UpdateUserRole'];

export type AdminClient = Schemas['AdminClient'];
export type AdminClientList = Schemas['AdminClientList'];
export type CreateClient = Schemas['CreateClient'];
export type UpdateClient = Schemas['UpdateClient'];

export type DashboardStats = Schemas['DashboardStats'];
export type RecordPageView = Schemas['RecordPageView'];
export type UploadResponse = Schemas['UploadResponse'];

export type ChatUser = Schemas['ChatUser'];
export type ChatMessage = Schemas['ChatMessage'];
export type ChatMessagePage = Schemas['ChatMessagePage'];
export type ChatConversation = Schemas['ChatConversation'];
export type ChatConversationList = Schemas['ChatConversationList'];
export type ChatContactList = Schemas['ChatContactList'];
export type ChatRead = Schemas['ChatRead'];
export type ChatAttachment = Schemas['ChatAttachment'];
export type OpenConversation = Schemas['OpenConversation'];
export type PostMessage = Schemas['PostMessage'];
export type AnalyticsSummary = Schemas['AnalyticsSummary'];
export type DailyViews = Schemas['DailyViews'];
export type PathViews = Schemas['PathViews'];
export type AdminActivity = Schemas['AdminActivity'];
export type AdminActivityList = Schemas['AdminActivityList'];
export type SearchResult = Schemas['SearchResult'];
export type SearchResults = Schemas['SearchResults'];
export type Notification = Schemas['Notification'];
export type NotificationPage = Schemas['NotificationPage'];
export type UnreadCount = Schemas['UnreadCount'];
export type TaskPriority = Schemas['TaskPriority'];
export type AdminProjectListItem = Schemas['AdminProjectListItem'];
export type AdminProjectList = Schemas['AdminProjectList'];
export type AdminProjectDetail = Schemas['AdminProjectDetail'];
export type BoardColumn = Schemas['BoardColumn'];
export type BoardTask = Schemas['BoardTask'];
export type CreateProject = Schemas['CreateProject'];
export type UpdateProject = Schemas['UpdateProject'];
export type CreateColumn = Schemas['CreateColumn'];
export type UpdateColumn = Schemas['UpdateColumn'];
export type CreateTask = Schemas['CreateTask'];
export type UpdateTask = Schemas['UpdateTask'];

export type AnnouncementAudience = Schemas['AnnouncementAudience'];
export type AdminAnnouncement = Schemas['AdminAnnouncement'];
export type AdminAnnouncementList = Schemas['AdminAnnouncementList'];
export type CreateAnnouncement = Schemas['CreateAnnouncement'];
export type UpdateAnnouncement = Schemas['UpdateAnnouncement'];

export type AdminProfile = Schemas['AdminProfile'];
export type UpdateProfile = Schemas['UpdateProfile'];
export type ChangePassword = Schemas['ChangePassword'];
export type NotificationPrefs = Schemas['NotificationPrefs'];

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

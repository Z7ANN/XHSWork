export const API_BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('token') || ''
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: authHeaders(),
    ...options,
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    throw new Error('未登录')
  }
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message || '请求失败')
  return json.data
}

function authFetch(url: string, options?: RequestInit) {
  return fetch(`${API_BASE}${url}`, {
    headers: authHeaders(),
    ...options,
  })
}

interface AuthUser {
  id: number
  email: string
  nickname: string
  avatar: string
  role: string
}

interface AuthResult {
  token: string
  user: AuthUser
}

export const authApi = {
  sendCode: (email: string) =>
    request('/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) }),
  login: (email: string, password: string) =>
    request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  loginByCode: (email: string, code: string) =>
    request<AuthResult>('/auth/login-code', { method: 'POST', body: JSON.stringify({ email, code }) }),
  register: (email: string, password: string, code: string, inviteCode?: string) =>
    request<AuthResult>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, code, inviteCode }) }),
  resetPassword: (email: string, password: string, code: string) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, password, code }) }),
}

export interface AiModelOption {
  id: number
  name: string
  icon: string
  type: 'text' | 'image'
  tier: string
  pointsCost: number
  supportThinking: number
  thinkingPointsCost: number
}

export const modelApi = {
  list: () => request<{ text: AiModelOption[]; image: AiModelOption[] }>('/editor/models'),
}

export const oneclickApi = {
  analyzeStyle: (referenceImages: string[], textModelId: number, enableThinking?: boolean) =>
    request<{ styleAnalysis: string }>('/editor/analyze-style', {
      method: 'POST',
      body: JSON.stringify({ referenceImages, textModelId, enableThinking }),
    }),

  generateOutlineSSE: (body: { topic: string; pageCount: number; category: string; textModelId: number; referenceImages?: string[]; styleAnalysis?: string; enableThinking?: boolean }) =>
    authFetch('/editor/outline', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  generateImagesSSE: (body: { pages: unknown[]; topic: string; category: string; imageModelId: number; styleAnalysis?: string; referenceImages?: string[] }) =>
    authFetch('/editor/generate-images', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  retryImage: (body: { taskId: string; page: unknown; topic: string; category: string; imageModelId: number; pages: unknown[]; styleAnalysis?: string; referenceImages?: string[] }) =>
    request<{ imageUrl: string }>('/editor/retry-image', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  generateContentSSE: (topic: string, outline: string, category: string, textModelId: number, enableThinking?: boolean) =>
    authFetch('/editor/content', {
      method: 'POST',
      body: JSON.stringify({ topic, outline, category, textModelId, enableThinking }),
    }),
}

export const coverApi = {
  generate: (body: { prompt: string; style: string; size: string; imageModelId: number; referenceImage?: string }) =>
    request<{ taskId: string; imageUrl: string }>('/cover/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export const viralApi = {
  fetch: (url: string) =>
    request<{ title: string; content: string; tags: string[]; images: string[] }>('/viral/fetch', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  rewrite: (body: { title: string; content: string; tags: string[]; requirement: string; textModelId: number; url?: string; enableThinking?: boolean }) =>
    request<{ title: string; content: string; tags: string[] }>('/viral/rewrite', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  replicateImages: (body: { images: string[]; requirement: string; imageModelId: number }) =>
    request<{ taskId: string; images: string[] }>('/viral/replicate-images', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}

export const editorApi = {
  aiAssist: (body: { selectedText: string; prompt: string; textModelId: number; enableThinking?: boolean }) =>
    authFetch('/editor/ai-assist', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  generateSSE: (body: { topic: string; tone: string; textModelId: number; role?: string; enableThinking?: boolean }) =>
    authFetch('/editor/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  publish: (body: { title: string; content: string; images?: string[] }) =>
    request<{ qrcode: string }>('/editor/publish', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/editor/upload-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error?.message || '上传失败')
    return json.data as { url: string }
  },
  checkSensitive: (text: string) =>
    request<{ id: number; word: string; category: string; replacements: string[]; index: number; length: number }[]>('/editor/check-sensitive', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  save: (body: { type: string; title: string; content: string; images?: string[]; tags?: string[]; topic?: string; category?: string; pointsCost?: number; model?: string }) =>
    request<{ id: number }>('/editor/save', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: number, body: { title?: string; content?: string; images?: string[]; tags?: string[]; topic?: string; category?: string }) =>
    request<{ id: number }>(`/editor/save/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  history: (page = 1, type?: string) =>
    request<{ list: GenerationRecord[]; pagination: { page: number; pageSize: number; total: number } }>(
      `/editor/history?page=${page}${type ? `&type=${type}` : ''}`
    ),
  historyDetail: (id: number) =>
    request<GenerationRecord>(`/editor/history/${id}`),
  historyDelete: (id: number) =>
    request(`/editor/history/${id}`, { method: 'DELETE' }),
}

export interface GenerationRecord {
  id: number
  userId: number
  type: string
  title: string
  content: string
  images: string[]
  tags: string[]
  topic: string
  category: string
  pointsCost: number
  createdAt: string
}

export interface UserProfile {
  id: number
  email: string
  nickname: string
  avatar: string
  role: string
  status: number
  points: number
  consumedPoints: number
  vipExpireAt: string | null
  isVip: boolean
  subscription: { name: string; type: string } | null
  hasPassword: boolean
  inviteCode: string
  invitedBy: number | null
  lastLoginAt: string | null
  createdAt: string
  stats: { oneclick: number; editor: number; cover: number }
}

export interface PackageInfo {
  id: number
  name: string
  type: 'trial' | 'monthly' | 'yearly' | 'topup'
  price: number
  originalPrice: number
  points: number
  vipDays: number
  imageConcurrency: number
  features: string[] | null
  badge: string
  sortOrder: number
  status: number
}

export const userApi = {
  info: () => request<UserProfile>('/user/info'),
  update: (data: { nickname?: string }) =>
    request<UserProfile>('/user/info', { method: 'PUT', body: JSON.stringify(data) }),
  uploadAvatar: async (file: File): Promise<UserProfile> => {
    const form = new FormData()
    form.append('avatar', file)
    const token = getToken()
    const res = await fetch(`${API_BASE}/user/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error?.message || '上传失败')
    return json.data as UserProfile
  },
  pointLogs: (page = 1) =>
    request<{ list: PointLog[]; pagination: { page: number; pageSize: number; total: number } }>(`/user/points?page=${page}`),
  inviteList: (page = 1) =>
    request<{ list: InviteRecord[]; pagination: { page: number; pageSize: number; total: number } }>(`/user/invites?page=${page}`),
  inviteStats: () =>
    request<InviteStats>('/user/invite-stats'),
  bindInvite: (inviteCode: string) =>
    request('/user/bind-invite', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  changePassword: (oldPassword: string, newPassword: string) =>
    request('/user/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),
  changeEmail: (email: string, code: string) =>
    request<UserProfile>('/user/change-email', { method: 'POST', body: JSON.stringify({ email, code }) }),
}

export interface PointLog {
  id: number
  userId: number
  amount: number
  type: string
  remark: string
  createdAt: string
}

export interface InviteRecord {
  id: number
  email: string
  nickname: string
  avatar: string
  createdAt: string
}

export interface InviteStats {
  inviteCount: number
  paidCount: number
  totalEarned: number
  config: {
    inviterReward: number
    inviteeReward: number
    rewardMode: string
    rechargeBonusRate: number
    rechargeBonusMode: string
  }
}

export const packageListApi = {
  list: () => request<PackageInfo[]>('/packages'),
  pointsRules: () => request<{ text: number; image: number }>('/packages/points-rules'),
  payMethods: () => request<{ wechat: boolean; alipay: boolean }>('/pay/methods'),
}

export interface OrderInfo {
  id: number
  orderNo: string
  userId: number
  packageId: number
  packageName: string
  amount: number
  pointsGranted: number
  vipDaysGranted: number
  payMethod: string
  qrCodeUrl: string
  status: number
  paidAt: string | null
  expireAt: string
  createdAt: string
}

export const orderApi = {
  create: (packageId: number, payMethod: string) =>
    request<OrderInfo>('/orders', { method: 'POST', body: JSON.stringify({ packageId, payMethod }) }),
  status: (orderNo: string) =>
    request<OrderInfo>(`/orders/${orderNo}`),
  list: (page = 1) =>
    request<{ list: OrderInfo[]; pagination: { page: number; pageSize: number; total: number } }>(`/orders?page=${page}`),
  cancel: (orderNo: string) =>
    request(`/orders/${orderNo}/cancel`, { method: 'POST' }),
}

export const redeemApi = {
  use: (code: string) =>
    request<{ points: number; vipDays: number }>('/redeem/use', { method: 'POST', body: JSON.stringify({ code }) }),
}
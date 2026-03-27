const API_BASE = import.meta.env.DEV ? 'http://localhost:3200/api' : '/api'

function getToken() {
  return localStorage.getItem('admin_token') || ''
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}/admin${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  if (res.status === 401) {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    window.location.href = '/login'
    throw new Error('未登录')
  }
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message || '请求失败')
  return json.data
}

interface PaginatedResponse<T> {
  list: T[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export interface DashboardStats {
  users: { total: number; today: number }
  generations: {
    total: number
    byType: Record<string, number>
    todayByType: Record<string, number>
  }
  orders: {
    totalRevenue: number
    totalOrders: number
    todayRevenue: number
    todayOrders: number
  }
  redeems: { total: number; used: number }
  points: { totalAdded: number; totalConsumed: number }
}

export interface User {
  id: number
  email: string
  nickname: string
  avatar: string
  role: string
  status: number
  points: number
  vipExpireAt: string | null
  inviteCode: string
  invitedBy: number | null
  lastLoginAt: string | null
  registerIp: string
  createdAt: string
  inviteCount: number
}

export interface UserDetail extends User {
  isVip: boolean
  stats: Record<string, number>
  inviteStats: {
    inviteCount: number
    paidCount: number
    totalEarned: number
  }
}

export interface Package {
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
  createdAt: string
}

export interface SystemConfig {
  id: number
  configKey: string
  configValue: string
  description: string
}

export interface AuthUser {
  id: number
  email: string
  nickname: string
  avatar: string
  role: string
}

export const authApi = {
  login: (email: string, password: string) =>
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(async (res) => {
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message || '登录失败')
      return json.data as { token: string; user: AuthUser }
    }),
}

export const dashboardApi = {
  stats: () => request<DashboardStats>('/dashboard'),
}

export const userApi = {
  list: (params: { page?: number; pageSize?: number; keyword?: string; status?: number; vip?: number }) => {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params.keyword) qs.set('keyword', params.keyword)
    if (params.status !== undefined) qs.set('status', String(params.status))
    if (params.vip !== undefined) qs.set('vip', String(params.vip))
    return request<PaginatedResponse<User>>(`/users?${qs}`)
  },
  detail: (id: number) => request<UserDetail>(`/users/${id}`),
  updateStatus: (id: number, status: number) =>
    request(`/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  adjustPoints: (id: number, amount: number, remark?: string) =>
    request(`/users/${id}/adjust-points`, { method: 'POST', body: JSON.stringify({ amount, remark }) }),
  setVipExpireAt: (id: number, vipExpireAt: string) =>
    request(`/users/${id}/set-vip`, { method: 'POST', body: JSON.stringify({ vipExpireAt }) }),
  resetPassword: (id: number) =>
    request(`/users/${id}/reset-password`, { method: 'POST' }),
}

export const packageApi = {
  list: (params?: { status?: number }) => {
    const qs = new URLSearchParams()
    if (params?.status !== undefined) qs.set('status', String(params.status))
    const query = qs.toString()
    return request<Package[]>(`/packages${query ? `?${query}` : ''}`)
  },
  detail: (id: number) => request<Package>(`/packages/${id}`),
  create: (data: Partial<Package>) =>
    request<{ id: number }>('/packages', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Package>) =>
    request(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => request(`/packages/${id}`, { method: 'DELETE' }),
  toggleStatus: (id: number) => request<{ status: number }>(`/packages/${id}/toggle-status`, { method: 'POST' }),
}

export const configApi = {
  list: () => request<SystemConfig[]>('/configs'),
  update: (configs: { configKey: string; configValue: string }[]) =>
    request('/configs', { method: 'PUT', body: JSON.stringify({ configs }) }),
}

export interface Order {
  id: number
  orderNo: string
  userId: number
  email: string
  nickname: string
  packageId: number
  packageName: string
  amount: number
  pointsGranted: number
  vipDaysGranted: number
  payMethod: string
  payTradeNo: string
  status: number
  paidAt: string | null
  expireAt: string
  createdAt: string
}

export const orderApi = {
  list: (params: { page?: number; pageSize?: number; status?: number; keyword?: string; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params.status !== undefined) qs.set('status', String(params.status))
    if (params.keyword) qs.set('keyword', params.keyword)
    if (params.startDate) qs.set('startDate', params.startDate)
    if (params.endDate) qs.set('endDate', params.endDate)
    return request<PaginatedResponse<Order> & { totalAmount: number }>(`/orders?${qs}`)
  },
  cancel: (orderNo: string) => request(`/orders/${orderNo}/cancel`, { method: 'POST' }),
  complete: (orderNo: string) => request(`/orders/${orderNo}/complete`, { method: 'POST' }),
}

export interface Generation {
  id: number
  userId: number
  email: string
  nickname: string
  type: string
  title: string
  content: string
  images: string[]
  tags: string[]
  topic: string
  category: string
  pointsCost: number
  model: string
  createdAt: string
}

export interface GenerationStats {
  total: number
  today: number
  byType: { type: string; count: number }[]
  categories: string[]
}

export const generationApi = {
  list: (params: { page?: number; pageSize?: number; type?: string; keyword?: string; category?: string; startDate?: string; endDate?: string }) => {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params.type) qs.set('type', params.type)
    if (params.keyword) qs.set('keyword', params.keyword)
    if (params.category) qs.set('category', params.category)
    if (params.startDate) qs.set('startDate', params.startDate)
    if (params.endDate) qs.set('endDate', params.endDate)
    return request<PaginatedResponse<Generation>>(`/generations?${qs}`)
  },
  stats: () => request<GenerationStats>('/generations/stats'),
  detail: (id: number) => request<Generation>(`/generations/${id}`),
  remove: (id: number) => request(`/generations/${id}`, { method: 'DELETE' }),
  batchRemove: (ids: number[]) => request('/generations/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
}

export interface RedeemCode {
  id: number
  code: string
  packageId: number | null
  packageName: string | null
  points: number
  vipDays: number
  remark: string
  usedBy: number | null
  usedByEmail: string | null
  usedAt: string | null
  expireAt: string | null
  createdAt: string
}

export const redeemApi = {
  list: (params: { page?: number; pageSize?: number; status?: string; keyword?: string }) => {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params.status) qs.set('status', params.status)
    if (params.keyword) qs.set('keyword', params.keyword)
    return request<PaginatedResponse<RedeemCode>>(`/redeems?${qs}`)
  },
  create: (data: { packageId?: number; points?: number; vipDays?: number; remark?: string; expireAt?: string; count?: number }) =>
    request<{ id: number; code: string }[]>('/redeems', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: number) => request(`/redeems/${id}`, { method: 'DELETE' }),
}

export interface AiModel {
  id: number
  name: string
  icon: string
  type: 'text' | 'image'
  tier: 'all' | 'trial' | 'monthly' | 'yearly'
  baseUrl: string
  apiKey: string
  model: string
  pointsCost: number
  supportThinking: number
  thinkingPointsCost: number
  status: number
  createdAt: string
  updatedAt: string
}

export const aiModelApi = {
  list: () => request<AiModel[]>('/ai-models'),
  create: (data: Partial<AiModel>) =>
    request<{ id: number }>('/ai-models', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<AiModel>) =>
    request(`/ai-models/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => request(`/ai-models/${id}`, { method: 'DELETE' }),
}

export interface SensitiveWord {
  id: number
  word: string
  category: string
  replacements: string[]
  status: number
  createdAt: string
}

export const sensitiveWordApi = {
  list: (params?: { category?: string; keyword?: string; status?: number }) => {
    const qs = new URLSearchParams()
    if (params?.category) qs.set('category', params.category)
    if (params?.keyword) qs.set('keyword', params.keyword)
    if (params?.status !== undefined) qs.set('status', String(params.status))
    const query = qs.toString()
    return request<SensitiveWord[]>(`/sensitive-words${query ? `?${query}` : ''}`)
  },
  create: (data: Partial<SensitiveWord>) =>
    request<{ id: number }>('/sensitive-words', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<SensitiveWord>) =>
    request(`/sensitive-words/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) => request(`/sensitive-words/${id}`, { method: 'DELETE' }),
  batchCreate: (words: Partial<SensitiveWord>[]) =>
    request('/sensitive-words/batch', { method: 'POST', body: JSON.stringify({ words }) }),
}

export interface PointLog {
  id: number
  userId: number
  email: string
  nickname: string
  amount: number
  type: string
  remark: string
  createdAt: string
}

export const pointLogApi = {
  list: (params: { page?: number; pageSize?: number; userId?: number; type?: string; keyword?: string }) => {
    const qs = new URLSearchParams()
    if (params.page) qs.set('page', String(params.page))
    if (params.pageSize) qs.set('pageSize', String(params.pageSize))
    if (params.userId) qs.set('userId', String(params.userId))
    if (params.type) qs.set('type', params.type)
    if (params.keyword) qs.set('keyword', params.keyword)
    return request<PaginatedResponse<PointLog>>(`/point-logs?${qs}`)
  },
}

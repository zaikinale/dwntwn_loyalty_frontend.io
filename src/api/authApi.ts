/**
 * Централизованный API сервис для работы с бэкендом
 * Поддерживает два типа авторизации:
 * 1. Telegram WebApp initData (автоматически, если доступно)
 * 2. JWT Bearer token (для логина/пароля)
 */

// ==================== ТИПЫ ====================

export type UserRole = 'admin' | 'staff' | 'client'

export interface User {
  user_id: string | number
  role: UserRole
  telegram_id?: string | number
  name?: string
  first_name?: string
  last_name?: string
}

export interface LoginCredentials {
  phone_or_card: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

interface ApiRequestOptions extends RequestInit {
  body?: any
  skipAuth?: boolean // Пропустить авторизацию (для login)
}

// ==================== КОНСТАНТЫ ====================

const ACCESS_TOKEN_KEY = 'access_token'
const USER_ROLE_KEY = 'user_role'
const USER_DATA_KEY = 'user_data'

// ==================== УТИЛИТЫ ====================

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Проверяет, запущено ли приложение внутри Telegram WebApp
 */
export function isTelegramWebApp(): boolean {
  if (!isBrowser()) return false
  const tg = (window as any).Telegram?.WebApp
  return Boolean(tg && tg.initData)
}

/**
 * Получает initData из Telegram WebApp
 */
function getTelegramInitData(): string | null {
  if (!isTelegramWebApp()) return null
  return (window as any).Telegram.WebApp.initData || null
}

/**
 * Получает JWT токен из localStorage
 */
function getJwtToken(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

/**
 * Сохраняет данные авторизации в localStorage
 */
function saveAuth(auth: AuthResponse): void {
  if (!isBrowser()) return
  localStorage.setItem(ACCESS_TOKEN_KEY, auth.access_token)
  localStorage.setItem(USER_ROLE_KEY, auth.user.role)
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(auth.user))
}

/**
 * Очищает данные авторизации из localStorage
 */
export function clearAuth(): void {
  if (!isBrowser()) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_ROLE_KEY)
  localStorage.removeItem(USER_DATA_KEY)
}

/**
 * Получает сохраненную роль пользователя
 */
export function getStoredRole(): UserRole | null {
  if (!isBrowser()) return null
  return (localStorage.getItem(USER_ROLE_KEY) as UserRole) || null
}

/**
 * Получает сохраненные данные пользователя
 */
export function getStoredUser(): User | null {
  if (!isBrowser()) return null
  const userData = localStorage.getItem(USER_DATA_KEY)
  if (!userData) return null
  try {
    return JSON.parse(userData) as User
  } catch {
    return null
  }
}

/**
 * Получает базовый URL API из window.API_BASE или использует значение по умолчанию
 */
function getApiBase(): string {
  if (!isBrowser()) return ''
  return (window as any).API_BASE || ''
}

// ==================== ОСНОВНОЙ API КЛИЕНТ ====================

/**
 * Выполняет запрос к API с автоматической авторизацией
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, skipAuth = false, headers = {}, ...fetchOptions } = options

  // Формируем заголовки
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  // Добавляем авторизацию (если не пропущена)
  if (!skipAuth) {
    const tgInitData = getTelegramInitData()
    if (tgInitData) {
      // Вариант 1: initData в заголовке Authorization
      // requestHeaders['Authorization'] = `Telegram ${tgInitData}`
      
      // Вариант 2: initData в теле запроса (как в текущем проекте)
      // Если бэкенд ожидает initData в теле, добавляем его туда
    } else {
      const token = getJwtToken()
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`
      }
    }
  }

  // Формируем тело запроса
  let requestBody: string | undefined
  if (body !== undefined) {
    if (typeof body === 'string') {
      requestBody = body
    } else {
      // Если это объект и есть Telegram initData, добавляем его в тело
      if (!skipAuth && typeof body === 'object' && body !== null) {
        const tgInitData = getTelegramInitData()
        if (tgInitData && !('initData' in body)) {
          requestBody = JSON.stringify({ ...body, initData: tgInitData })
        } else {
          requestBody = JSON.stringify(body)
        }
      } else {
        requestBody = JSON.stringify(body)
      }
    }
  } else if (!skipAuth) {
    // Если тело не передано, но нужна авторизация через Telegram, добавляем initData
    const tgInitData = getTelegramInitData()
    if (tgInitData) {
      requestBody = JSON.stringify({ initData: tgInitData })
    }
  }

  // Выполняем запрос
  const url = `${getApiBase()}${endpoint}`
  const response = await fetch(url, {
    ...fetchOptions,
    method: fetchOptions.method || 'POST',
    headers: requestHeaders,
    body: requestBody,
  })

  // Обработка ошибок авторизации
  if (response.status === 401 || response.status === 403) {
    clearAuth()

    // Редирект на страницу входа (только если не Telegram версия)
    if (!isTelegramWebApp() && isBrowser()) {
      // Можно использовать роутер или window.location
      const currentPath = window.location.pathname
      if (!currentPath.includes('/login')) {
        window.location.href = '/login'
      }
    }

    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Authorization failed: ${response.status}`)
  }

  // Проверка на другие ошибки
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Request failed: ${response.status}`)
  }

  // Возвращаем данные
  return response.json()
}

// ==================== ПУБЛИЧНЫЕ МЕТОДЫ ====================

/**
 * Авторизация по номеру телефона/карты и паролю
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: credentials,
    skipAuth: true, // Пропускаем авторизацию для самого логина
  })

  saveAuth(response)
  return response.user
}

/**
 * Выход из системы
 */
export function logout(): void {
  clearAuth()
  if (!isTelegramWebApp() && isBrowser()) {
    window.location.href = '/login'
  }
}

// ==================== ХЕЛПЕРЫ ДЛЯ ADMIN/STAFF ====================

/**
 * Выполняет POST запрос к admin эндпоинту
 */
export async function adminPost<TReq = any, TRes = any>(
  path: string,
  body: TReq
): Promise<TRes> {
  return apiRequest<TRes>(`/api/admin/${path}`, {
    method: 'POST',
    body,
  })
}

/**
 * Выполняет POST запрос к staff эндпоинту
 */
export async function staffPost<TReq = any, TRes = any>(
  path: string,
  body: TReq
): Promise<TRes> {
  return apiRequest<TRes>(`/api/staff/${path}`, {
    method: 'POST',
    body,
  })
}

/**
 * Выполняет POST запрос к client эндпоинту
 */
export async function clientPost<TReq = any, TRes = any>(
  path: string,
  body: TReq
): Promise<TRes> {
  return apiRequest<TRes>(`/api/client/${path}`, {
    method: 'POST',
    body,
  })
}

/**
 * Универсальный метод для выполнения запросов
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(endpoint, options)
}

// ==================== ЭКСПОРТ ОСНОВНОГО ОБЪЕКТА ====================

export const authApi = {
  // Методы авторизации
  login,
  logout,
  clearAuth,
  
  // Проверки
  isTelegramWebApp,
  getStoredRole,
  getStoredUser,
  
  // API методы
  adminPost,
  staffPost,
  clientPost,
  apiCall,
}

export default authApi

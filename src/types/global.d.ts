/**
 * Глобальные типы для window и других глобальных объектов
 */

interface TelegramWebApp {
  initData?: string
  ready(): void
  expand(): void
  disableVerticalSwipes(): void
  setBackgroundColor(color: string): void
  scanQrCode?(): Promise<string>
}

interface Telegram {
  WebApp?: TelegramWebApp
}

declare global {
  interface Window {
    Telegram?: Telegram
    API_BASE?: string
  }
}

export {}

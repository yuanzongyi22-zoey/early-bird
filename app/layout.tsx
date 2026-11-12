import type { Metadata, Viewport } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: '早早鸟 · 把早餐变成美好的日常',
  description: '校园早餐与健康生活交互演示：早餐预约、组队打卡、健康记录。所有操作仅在浏览器本地模拟。',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>
}

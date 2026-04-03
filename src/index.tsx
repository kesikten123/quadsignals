import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { authRoutes } from './routes/auth'
import { adminRoutes } from './routes/admin'
import { signalRoutes } from './routes/signals'
import { newsRoutes } from './routes/news'
import { stockRoutes } from './routes/stocks'

type Bindings = {
  DB: D1Database
  NAVER_CLIENT_ID: string
  NAVER_CLIENT_SECRET: string
  KIWOOM_APP_KEY: string
  KIWOOM_SECRET_KEY: string
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/admin', adminRoutes)
app.route('/api/signals', signalRoutes)
app.route('/api/news', newsRoutes)
app.route('/api/stocks', stockRoutes)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// SPA fallback - /api/* 는 절대 fallback 타지 않도록 먼저 404 처리
app.all('/api/*', (c) => c.json({ success: false, message: 'API endpoint not found' }, 404))

// SPA fallback - serve index.html for all non-API routes
app.get('*', async (c) => {
  return c.html(getIndexHTML())
})

function getIndexHTML(): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QUAD Decisive Signals - 주식 시그널 플랫폼</title>
    <link rel="icon" href="/static/logo.png" type="image/png">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
    <link rel="stylesheet" href="/static/styles.css">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              'brand-dark': '#0d1117',
              'brand-darker': '#080d14',
              'brand-card': '#161b22',
              'brand-border': '#21262d',
              'brand-orange': '#f97316',
              'brand-gold': '#f59e0b',
              'brand-red': '#ef4444',
              'brand-green': '#22c55e',
              'brand-blue': '#3b82f6',
            },
            fontFamily: {
              'sans': ['Pretendard', 'Noto Sans KR', 'sans-serif'],
            },
            backgroundImage: {
              'gradient-brand': 'linear-gradient(135deg, #e83a00 0%, #f97316 50%, #f59e0b 100%)',
              'gradient-dark': 'linear-gradient(135deg, #0d1117 0%, #080d14 100%)',
            },
            boxShadow: {
              'brand': '0 0 30px rgba(249,115,22,0.2)',
              'brand-lg': '0 0 60px rgba(249,115,22,0.3)',
              'glow-green': '0 0 20px rgba(34,197,94,0.4)',
              'glow-red': '0 0 20px rgba(239,68,68,0.4)',
            }
          }
        }
      }
    </script>
</head>
<body class="bg-brand-dark text-white min-h-screen" style="font-family: 'Noto Sans KR', sans-serif;">
    <div id="app"></div>
    <script src="/static/app.js"></script>
</body>
</html>`
}

export default app

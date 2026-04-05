import { Hono } from 'hono'
import { verifyToken } from '../lib/utils'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  NAVER_CLIENT_ID: string
  NAVER_CLIENT_SECRET: string
}

export const newsRoutes = new Hono<{ Bindings: Bindings }>()

const userAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, message: '인증이 필요합니다.' }, 401)
  }
  const token = authHeader.substring(7)
  const payload = await verifyToken(token, c.env.JWT_SECRET || 'default-secret-key')
  if (!payload) {
    return c.json({ success: false, message: '유효하지 않은 토큰입니다.' }, 401)
  }
  c.set('user', payload)
  await next()
}

newsRoutes.use('/*', userAuth)

// 주식 관련 키워드 매핑
const STOCK_KEYWORDS: Record<string, { code: string; name: string; market: string }[]> = {
  '삼성전자': [{ code: '005930', name: '삼성전자', market: 'KOSPI' }],
  'SK하이닉스': [{ code: '000660', name: 'SK하이닉스', market: 'KOSPI' }],
  '하이닉스': [{ code: '000660', name: 'SK하이닉스', market: 'KOSPI' }],
  'LG에너지솔루션': [{ code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' }],
  '현대차': [{ code: '005380', name: '현대차', market: 'KOSPI' }],
  '현대자동차': [{ code: '005380', name: '현대차', market: 'KOSPI' }],
  '기아': [{ code: '000270', name: '기아', market: 'KOSPI' }],
  'POSCO': [{ code: '005490', name: 'POSCO홀딩스', market: 'KOSPI' }],
  '포스코': [{ code: '005490', name: 'POSCO홀딩스', market: 'KOSPI' }],
  '삼성바이오로직스': [{ code: '207940', name: '삼성바이오로직스', market: 'KOSPI' }],
  'LG화학': [{ code: '051910', name: 'LG화학', market: 'KOSPI' }],
  'NAVER': [{ code: '035420', name: 'NAVER', market: 'KOSPI' }],
  '네이버': [{ code: '035420', name: 'NAVER', market: 'KOSPI' }],
  '카카오': [{ code: '035720', name: '카카오', market: 'KOSPI' }],
  '셀트리온': [{ code: '068270', name: '셀트리온', market: 'KOSPI' }],
  '삼성SDI': [{ code: '006400', name: '삼성SDI', market: 'KOSPI' }],
  'KB금융': [{ code: '105560', name: 'KB금융', market: 'KOSPI' }],
  '신한지주': [{ code: '055550', name: '신한지주', market: 'KOSPI' }],
  '하나금융지주': [{ code: '086790', name: '하나금융지주', market: 'KOSPI' }],
  '크래프톤': [{ code: '259960', name: '크래프톤', market: 'KOSPI' }],
  '카카오뱅크': [{ code: '323410', name: '카카오뱅크', market: 'KOSPI' }],
  '에코프로비엠': [{ code: '247540', name: '에코프로비엠', market: 'KOSDAQ' }],
  '에코프로': [{ code: '086520', name: '에코프로', market: 'KOSDAQ' }],
  'HLB': [{ code: '028300', name: 'HLB', market: 'KOSDAQ' }],
  '알테오젠': [{ code: '196170', name: '알테오젠', market: 'KOSDAQ' }],
  '포스코DX': [{ code: '022100', name: '포스코DX', market: 'KOSDAQ' }],
  '셀트리온헬스케어': [{ code: '091990', name: '셀트리온헬스케어', market: 'KOSDAQ' }],
  '루닛': [{ code: '328130', name: '루닛', market: 'KOSDAQ' }],
  '레인보우로보틱스': [{ code: '277810', name: '레인보우로보틱스', market: 'KOSDAQ' }],
  '이오테크닉스': [{ code: '039030', name: '이오테크닉스', market: 'KOSDAQ' }],
  '리가켐바이오': [{ code: '141080', name: '리가켐바이오', market: 'KOSDAQ' }],
  '코스피': [],
  '코스닥': [],
  'AI반도체': [{ code: '000660', name: 'SK하이닉스', market: 'KOSPI' }],
  '2차전지': [{ code: '247540', name: '에코프로비엠', market: 'KOSDAQ' }, { code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' }],
  '배터리': [{ code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' }],
  '반도체': [{ code: '005930', name: '삼성전자', market: 'KOSPI' }, { code: '000660', name: 'SK하이닉스', market: 'KOSPI' }],
  '바이오': [{ code: '068270', name: '셀트리온', market: 'KOSPI' }, { code: '028300', name: 'HLB', market: 'KOSDAQ' }],
  '로봇': [{ code: '277810', name: '레인보우로보틱스', market: 'KOSDAQ' }],
  '전기차': [{ code: '005380', name: '현대차', market: 'KOSPI' }, { code: '000270', name: '기아', market: 'KOSPI' }],
}

function findRelatedStocks(text: string): { code: string; name: string; market: string }[] {
  const found: { code: string; name: string; market: string }[] = []
  const seen = new Set<string>()

  for (const [keyword, stocks] of Object.entries(STOCK_KEYWORDS)) {
    if (text.includes(keyword)) {
      for (const stock of stocks) {
        if (!seen.has(stock.code)) {
          seen.add(stock.code)
          found.push(stock)
        }
      }
    }
  }

  return found
}

// Google News RSS XML 파서
function parseRSS(xmlText: string): any[] {
  const items: any[] = []
  
  try {
    // <item> 태그 추출
    const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g) || []
    
    for (const itemXml of itemMatches) {
      const getTag = (tag: string): string => {
        const match = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
        if (!match) return ''
        return (match[1] || match[2] || '').trim()
      }
      
      // 제목에서 HTML 태그 제거
      const rawTitle = getTag('title')
      const title = rawTitle.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      
      // description 처리 - Google News RSS는 엔티티 인코딩된 HTML
      const rawDesc = getTag('description')
      // 1단계: 엔티티 디코딩
      let descDecoded = rawDesc
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
      // 2단계: HTML 태그 제거 (디코딩 후)
      let descText = descDecoded
        .replace(/<a[^>]*>([^<]*)<\/a>/gi, '$1')
        .replace(/<font[^>]*>[^<]*<\/font>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ').trim()
      
      // description이 title과 동일하거나 너무 짧으면 빈 문자열로
      if (descText === title || descText.length < 5) descText = ''
      
      // 출처 추출
      const sourceMatch = itemXml.match(/<source[^>]*>([^<]*)<\/source>/)
      const source = sourceMatch ? sourceMatch[1].trim() : ''
      
      // 링크 추출 - Google News RSS의 <link> 태그는 특수 형태
      // <link>URL</link> 또는 CDATA 형태
      let link = getTag('link') || ''
      // link가 비어있으면 guid에서 추출
      if (!link) {
        const guidMatch = itemXml.match(/<guid[^>]*>([^<]+)<\/guid>/)
        link = guidMatch ? guidMatch[1].trim() : ''
      }
      // Google News 링크가 news.google.com/rss/articles로 시작하면 그대로 사용
      if (!link.startsWith('http')) {
        const linkMatch = itemXml.match(/<link[^/]>([^<]+)<\/link>/)
        link = linkMatch ? linkMatch[1].trim() : ''
      }
      
      // pubDate
      const pubDate = getTag('pubDate')
      
      if (title) {
        items.push({
          title,
          description: descText || title,
          link,
          pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          source
        })
      }
    }
  } catch (e) {
    console.error('RSS parse error:', e)
  }
  
  return items
}

// 쿼리를 Google News RSS 쿼리로 변환
function buildGoogleNewsQuery(query: string): string {
  // 주식/금융 관련 키워드 추가
  const stockTerms = ['주식', '코스피', '코스닥', 'KOSPI', 'KOSDAQ', '주가', '증시', '투자']
  const hasStockTerm = stockTerms.some(t => query.includes(t))
  
  if (!hasStockTerm && query.length > 0) {
    return `${query} 주가`
  }
  return query
}

// Google News RSS로 뉴스 가져오기
async function fetchGoogleNews(query: string, display: number = 20): Promise<any[]> {
  try {
    const q = buildGoogleNewsQuery(query)
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    })
    
    if (!response.ok) {
      console.error('Google News RSS error:', response.status)
      return []
    }
    
    const xmlText = await response.text()
    const items = parseRSS(xmlText)
    
    return items.slice(0, display)
  } catch (e) {
    console.error('Google News fetch error:', e)
    return []
  }
}

// 네이버 뉴스 API 시도
async function fetchNaverNews(clientId: string, clientSecret: string, query: string, display: number = 20): Promise<{ items: any[]; success: boolean }> {
  try {
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&start=1&sort=date`
    
    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      }
    })
    
    if (!response.ok) {
      return { items: [], success: false }
    }
    
    const data = await response.json() as any
    if (data.errorCode) {
      return { items: [], success: false }
    }
    
    return { items: data.items || [], success: true }
  } catch (e) {
    return { items: [], success: false }
  }
}

// 메인 뉴스 API 엔드포인트
newsRoutes.get('/', async (c) => {
  try {
    const query = c.req.query('query') || '주식 코스피 코스닥'
    const display = parseInt(c.req.query('display') || '20')
    const start = parseInt(c.req.query('start') || '1')

    let newsItems: any[] = []
    let isMock = false
    let source = 'google' // 기본: Google News RSS

    // 1. 네이버 API 우선 시도 (API 키가 있고 유효한 경우)
    if (c.env.NAVER_CLIENT_ID && c.env.NAVER_CLIENT_SECRET) {
      const naverResult = await fetchNaverNews(
        c.env.NAVER_CLIENT_ID,
        c.env.NAVER_CLIENT_SECRET,
        query,
        display
      )
      
      if (naverResult.success && naverResult.items.length > 0) {
        // 네이버 API 성공
        const newsWithStocks = naverResult.items.map((item: any) => {
          const text = item.title + ' ' + item.description
          const cleanText = text.replace(/<[^>]*>/g, '')
          const relatedStocks = findRelatedStocks(cleanText)
          
          return {
            id: btoa(item.link).substring(0, 20),
            title: item.title.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'"),
            description: item.description.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),
            link: item.link,
            pubDate: item.pubDate,
            relatedStocks,
            source: 'NAVER뉴스'
          }
        })
        
        return c.json({ success: true, news: newsWithStocks, isMock: false, source: 'naver' })
      }
    }

    // 2. Google News RSS 사용 (네이버 실패 또는 키 없음)
    const googleItems = await fetchGoogleNews(query, display)
    
    if (googleItems.length > 0) {
      const newsWithStocks = googleItems.map((item: any, idx: number) => {
        const text = item.title + ' ' + (item.description || '')
        const relatedStocks = findRelatedStocks(text)
        
        return {
          id: `g_${Date.now()}_${idx}`,
          title: item.title,
          description: item.description || item.title,
          link: item.link,
          pubDate: item.pubDate,
          relatedStocks,
          source: item.source || 'Google뉴스'
        }
      })
      
      return c.json({ success: true, news: newsWithStocks, isMock: false, source: 'google' })
    }

    // 3. 모든 소스 실패 시 Mock 데이터
    return c.json({ success: true, news: getMockNews(), isMock: true, source: 'mock' })
    
  } catch (error) {
    console.error('News error:', error)
    return c.json({ success: true, news: getMockNews(), isMock: true, source: 'mock' })
  }
})

// 뉴스 소스 상태 확인 엔드포인트
newsRoutes.get('/status', async (c) => {
  const hasNaver = !!(c.env.NAVER_CLIENT_ID && c.env.NAVER_CLIENT_SECRET)
  
  let naverWorking = false
  if (hasNaver) {
    const result = await fetchNaverNews(c.env.NAVER_CLIENT_ID, c.env.NAVER_CLIENT_SECRET, '삼성전자', 1)
    naverWorking = result.success
  }
  
  return c.json({
    success: true,
    status: {
      naver: { configured: hasNaver, working: naverWorking },
      google: { configured: true, working: true },
      activeSource: naverWorking ? 'naver' : 'google'
    }
  })
})

function getMockNews() {
  const mockItems = [
    {
      id: 'mock1',
      title: '삼성전자, 1분기 영업이익 54조원 전망... 반도체 업황 급회복 신호',
      description: '삼성전자의 1분기 실적이 반도체 업황 회복으로 크게 개선될 전망이다. 증권가에서는 영업이익 54조원을 넘을 것으로 예측하고 있어 투자자들의 관심이 집중되고 있다.',
      link: 'https://finance.naver.com',
      pubDate: new Date().toISOString(),
      relatedStocks: [{ code: '005930', name: '삼성전자', market: 'KOSPI' }],
      source: 'Sample'
    },
    {
      id: 'mock2',
      title: 'SK하이닉스, HBM 수요 급증으로 목표주가 상향 조정',
      description: 'AI 반도체 수요 증가로 SK하이닉스의 HBM(고대역폭메모리) 주문이 급증하고 있다. 주요 증권사들은 목표주가를 일제히 상향 조정했다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 3600000).toISOString(),
      relatedStocks: [{ code: '000660', name: 'SK하이닉스', market: 'KOSPI' }],
      source: 'Sample'
    },
    {
      id: 'mock3',
      title: '코스피 2.7% 상승 5,370대 회복... 코스닥도 동반 강세',
      description: '미국발 관세 완화 기대감에 코스피가 큰 폭으로 상승했다. 반도체·2차전지·바이오 업종이 동반 강세를 보였다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 7200000).toISOString(),
      relatedStocks: [],
      source: 'Sample'
    },
    {
      id: 'mock4',
      title: '에코프로비엠, 2차전지 소재 수요 회복으로 매수 신호',
      description: '전기차 배터리 소재 기업 에코프로비엠이 글로벌 2차전지 수요 회복에 힘입어 주가 반등 가능성이 높아지고 있다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 10800000).toISOString(),
      relatedStocks: [{ code: '247540', name: '에코프로비엠', market: 'KOSDAQ' }],
      source: 'Sample'
    },
    {
      id: 'mock5',
      title: '알테오젠, 피하주사 기술 수출 계약 체결로 실적 급상승 예고',
      description: '알테오젠이 글로벌 제약사와 피하주사(SC) 기술 이전 계약을 체결했다. 계약 규모는 1조원을 상회하며 바이오 섹터 긍정 영향 기대.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 14400000).toISOString(),
      relatedStocks: [{ code: '196170', name: '알테오젠', market: 'KOSDAQ' }],
      source: 'Sample'
    },
  ]
  return mockItems
}

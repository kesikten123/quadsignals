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
  'LG에너지솔루션': [{ code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' }],
  '현대차': [{ code: '005380', name: '현대차', market: 'KOSPI' }],
  '현대자동차': [{ code: '005380', name: '현대자동차', market: 'KOSPI' }],
  '기아': [{ code: '000270', name: '기아', market: 'KOSPI' }],
  'POSCO': [{ code: '005490', name: 'POSCO홀딩스', market: 'KOSPI' }],
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

// 네이버 뉴스 API 연동
newsRoutes.get('/', async (c) => {
  try {
    const query = c.req.query('query') || '주식 코스피 코스닥'
    const display = parseInt(c.req.query('display') || '20')
    const start = parseInt(c.req.query('start') || '1')

    // API 키가 없으면 Mock 데이터 반환
    if (!c.env.NAVER_CLIENT_ID || !c.env.NAVER_CLIENT_SECRET) {
      return c.json({ success: true, news: getMockNews(), isMock: true })
    }

    const naverUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&start=${start}&sort=date`
    
    const response = await fetch(naverUrl, {
      headers: {
        'X-Naver-Client-Id': c.env.NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': c.env.NAVER_CLIENT_SECRET,
      }
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Naver API error:', response.status, errText)
      return c.json({ success: true, news: getMockNews(), isMock: true })
    }

    const data = await response.json() as any
    
    const newsWithStocks = data.items.map((item: any) => {
      const text = item.title + ' ' + item.description
      const cleanText = text.replace(/<[^>]*>/g, '')
      const relatedStocks = findRelatedStocks(cleanText)
      
      return {
        id: btoa(item.link).substring(0, 20),
        title: item.title.replace(/<[^>]*>/g, ''),
        description: item.description.replace(/<[^>]*>/g, ''),
        link: item.link,
        pubDate: item.pubDate,
        relatedStocks
      }
    })

    return c.json({ success: true, news: newsWithStocks, isMock: false })
  } catch (error) {
    console.error('News error:', error)
    return c.json({ success: true, news: getMockNews(), isMock: true })
  }
})

function getMockNews() {
  const mockItems = [
    {
      id: 'mock1',
      title: '삼성전자, 3분기 영업이익 9조원 돌파 예상... 반도체 업황 회복 신호',
      description: '삼성전자의 3분기 실적이 반도체 업황 회복으로 크게 개선될 전망이다. 증권가에서는 영업이익 9조원을 넘을 것으로 예측하고 있어 투자자들의 관심이 집중되고 있다.',
      link: 'https://finance.naver.com',
      pubDate: new Date().toISOString(),
      relatedStocks: [{ code: '005930', name: '삼성전자', market: 'KOSPI' }]
    },
    {
      id: 'mock2',
      title: 'SK하이닉스, HBM 수요 급증으로 목표주가 상향 조정',
      description: 'AI 반도체 수요 증가로 SK하이닉스의 HBM(고대역폭메모리) 주문이 급증하고 있다. 주요 증권사들은 목표주가를 일제히 상향 조정했다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 3600000).toISOString(),
      relatedStocks: [{ code: '000660', name: 'SK하이닉스', market: 'KOSPI' }]
    },
    {
      id: 'mock3',
      title: 'NAVER, 생성형 AI 서비스 확대로 광고 매출 성장 기대',
      description: '네이버가 생성형 AI를 활용한 검색 광고 서비스를 강화하면서 광고 매출 성장에 대한 기대감이 높아지고 있다. 카카오와의 경쟁 구도에서도 우위를 점할 전망이다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 7200000).toISOString(),
      relatedStocks: [
        { code: '035420', name: 'NAVER', market: 'KOSPI' },
        { code: '035720', name: '카카오', market: 'KOSPI' }
      ]
    },
    {
      id: 'mock4',
      title: '에코프로비엠, 2차전지 소재 수요 회복으로 매수 신호',
      description: '전기차 배터리 소재 기업 에코프로비엠이 글로벌 2차전지 수요 회복에 힘입어 주가 반등 가능성이 높아지고 있다. 에코프로 그룹 전반적인 실적 개선도 기대된다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 10800000).toISOString(),
      relatedStocks: [
        { code: '247540', name: '에코프로비엠', market: 'KOSDAQ' },
        { code: '086520', name: '에코프로', market: 'KOSDAQ' }
      ]
    },
    {
      id: 'mock5',
      title: '현대차·기아, 글로벌 전기차 판매 호조로 실적 개선 전망',
      description: '현대자동차와 기아가 글로벌 전기차 시장에서 시장 점유율을 확대하고 있다. 아이오닉과 EV 시리즈의 판매 호조로 2분기 실적 개선이 기대된다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 14400000).toISOString(),
      relatedStocks: [
        { code: '005380', name: '현대자동차', market: 'KOSPI' },
        { code: '000270', name: '기아', market: 'KOSPI' }
      ]
    },
    {
      id: 'mock6',
      title: '셀트리온, 바이오시밀러 유럽 시장 점유율 확대... 매수 추천',
      description: '셀트리온의 바이오시밀러 제품이 유럽 시장에서 점유율을 빠르게 늘리고 있다. HLB와 함께 바이오 섹터 강세를 이끌 것으로 전망된다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 18000000).toISOString(),
      relatedStocks: [
        { code: '068270', name: '셀트리온', market: 'KOSPI' },
        { code: '028300', name: 'HLB', market: 'KOSDAQ' }
      ]
    },
    {
      id: 'mock7',
      title: '레인보우로보틱스, AI 로봇 수요 급증으로 주가 급등 가능성',
      description: '국내 AI 로봇 선두주자 레인보우로보틱스가 삼성전자와의 협업 확대 소식에 시장의 주목을 받고 있다. 전문가들은 로봇 산업의 성장세와 함께 주가 상승 가능성이 높다고 분석했다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 21600000).toISOString(),
      relatedStocks: [
        { code: '277810', name: '레인보우로보틱스', market: 'KOSDAQ' },
        { code: '005930', name: '삼성전자', market: 'KOSPI' }
      ]
    },
    {
      id: 'mock8',
      title: 'LG에너지솔루션, 북미 배터리 공장 증설로 장기 성장 기대',
      description: 'LG에너지솔루션이 북미 배터리 공장 증설 계획을 발표하면서 중장기 성장 전망이 밝아지고 있다. LG화학과 함께 그룹 전체 밸류업 기대감도 높아지는 상황이다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 25200000).toISOString(),
      relatedStocks: [
        { code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' },
        { code: '051910', name: 'LG화학', market: 'KOSPI' }
      ]
    },
    {
      id: 'mock9',
      title: '알테오젠, 피하주사 기술 수출 계약 체결로 실적 급상승 예고',
      description: '알테오젠이 글로벌 제약사와 피하주사(SC) 기술 이전 계약을 체결했다. 계약 규모는 1조원을 상회하며, 코스닥 바이오 섹터 전반에 긍정적인 영향을 미칠 것으로 기대된다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 28800000).toISOString(),
      relatedStocks: [
        { code: '196170', name: '알테오젠', market: 'KOSDAQ' }
      ]
    },
    {
      id: 'mock10',
      title: 'KB금융·신한지주, 금리 인하 사이클 진입으로 수익성 전망 엇갈려',
      description: '한국은행의 기준금리 인하 기조가 강화되면서 KB금융과 신한지주 등 대형 금융지주사들의 순이자마진(NIM)에 대한 우려가 커지고 있다. 그러나 대출 성장률 확대로 이를 일부 상쇄할 것으로 보인다.',
      link: 'https://finance.naver.com',
      pubDate: new Date(Date.now() - 32400000).toISOString(),
      relatedStocks: [
        { code: '105560', name: 'KB금융', market: 'KOSPI' },
        { code: '055550', name: '신한지주', market: 'KOSPI' },
        { code: '086790', name: '하나금융지주', market: 'KOSPI' }
      ]
    }
  ]
  return mockItems
}

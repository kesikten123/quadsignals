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

// 주식 관련 키워드 매핑 (확장판)
const STOCK_KEYWORDS: Record<string, { code: string; name: string; market: string }[]> = {
  // ── KOSPI 개별 종목 ──
  '삼성전자': [{ code: '005930', name: '삼성전자', market: 'KOSPI' }],
  'SK하이닉스': [{ code: '000660', name: 'SK하이닉스', market: 'KOSPI' }],
  '하이닉스': [{ code: '000660', name: 'SK하이닉스', market: 'KOSPI' }],
  'LG에너지솔루션': [{ code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' }],
  'LG엔솔': [{ code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' }],
  '현대차': [{ code: '005380', name: '현대차', market: 'KOSPI' }],
  '현대자동차': [{ code: '005380', name: '현대차', market: 'KOSPI' }],
  '기아': [{ code: '000270', name: '기아', market: 'KOSPI' }],
  '기아차': [{ code: '000270', name: '기아', market: 'KOSPI' }],
  'POSCO': [{ code: '005490', name: 'POSCO홀딩스', market: 'KOSPI' }],
  '포스코': [{ code: '005490', name: 'POSCO홀딩스', market: 'KOSPI' }],
  '삼성바이오로직스': [{ code: '207940', name: '삼성바이오로직스', market: 'KOSPI' }],
  '삼성바이오': [{ code: '207940', name: '삼성바이오로직스', market: 'KOSPI' }],
  'LG화학': [{ code: '051910', name: 'LG화학', market: 'KOSPI' }],
  'NAVER': [{ code: '035420', name: 'NAVER', market: 'KOSPI' }],
  '네이버': [{ code: '035420', name: 'NAVER', market: 'KOSPI' }],
  '카카오': [{ code: '035720', name: '카카오', market: 'KOSPI' }],
  '셀트리온': [{ code: '068270', name: '셀트리온', market: 'KOSPI' }],
  '삼성SDI': [{ code: '006400', name: '삼성SDI', market: 'KOSPI' }],
  'KB금융': [{ code: '105560', name: 'KB금융', market: 'KOSPI' }],
  '신한지주': [{ code: '055550', name: '신한지주', market: 'KOSPI' }],
  '신한': [{ code: '055550', name: '신한지주', market: 'KOSPI' }],
  '하나금융지주': [{ code: '086790', name: '하나금융지주', market: 'KOSPI' }],
  '하나금융': [{ code: '086790', name: '하나금융지주', market: 'KOSPI' }],
  '크래프톤': [{ code: '259960', name: '크래프톤', market: 'KOSPI' }],
  '카카오뱅크': [{ code: '323410', name: '카카오뱅크', market: 'KOSPI' }],
  '한미반도체': [{ code: '042700', name: '한미반도체', market: 'KOSPI' }],
  '삼성전기': [{ code: '009150', name: '삼성전기', market: 'KOSPI' }],
  '한미약품': [{ code: '128940', name: '한미약품', market: 'KOSPI' }],
  '유한양행': [{ code: '000100', name: '유한양행', market: 'KOSPI' }],
  '현대모비스': [{ code: '012330', name: '현대모비스', market: 'KOSPI' }],
  '우리금융': [{ code: '316140', name: '우리금융지주', market: 'KOSPI' }],
  '삼성생명': [{ code: '032830', name: '삼성생명', market: 'KOSPI' }],
  '삼성화재': [{ code: '000810', name: '삼성화재', market: 'KOSPI' }],
  'SK이노베이션': [{ code: '096770', name: 'SK이노베이션', market: 'KOSPI' }],
  '한화에어로스페이스': [{ code: '012450', name: '한화에어로스페이스', market: 'KOSPI' }],
  '한화에어로': [{ code: '012450', name: '한화에어로스페이스', market: 'KOSPI' }],
  '한국항공우주': [{ code: '047810', name: '한국항공우주', market: 'KOSPI' }],
  'KAI': [{ code: '047810', name: '한국항공우주', market: 'KOSPI' }],
  '두산에너빌리티': [{ code: '034020', name: '두산에너빌리티', market: 'KOSPI' }],
  '두산': [{ code: '034020', name: '두산에너빌리티', market: 'KOSPI' }],
  '삼성중공업': [{ code: '010140', name: '삼성중공업', market: 'KOSPI' }],
  '한화오션': [{ code: '042660', name: '한화오션', market: 'KOSPI' }],
  'HD한국조선해양': [{ code: '009540', name: 'HD한국조선해양', market: 'KOSPI' }],
  'HD현대': [{ code: '267250', name: 'HD현대', market: 'KOSPI' }],
  'SK텔레콤': [{ code: '017670', name: 'SK텔레콤', market: 'KOSPI' }],
  'KT': [{ code: '030200', name: 'KT', market: 'KOSPI' }],
  'LG유플러스': [{ code: '032640', name: 'LG유플러스', market: 'KOSPI' }],
  'HMM': [{ code: '011200', name: 'HMM', market: 'KOSPI' }],
  '대한항공': [{ code: '003490', name: '대한항공', market: 'KOSPI' }],
  '롯데케미칼': [{ code: '011170', name: '롯데케미칼', market: 'KOSPI' }],
  '현대건설': [{ code: '000720', name: '현대건설', market: 'KOSPI' }],
  '삼성엔지니어링': [{ code: '028050', name: '삼성엔지니어링', market: 'KOSPI' }],
  '한화솔루션': [{ code: '009830', name: '한화솔루션', market: 'KOSPI' }],
  // ── KOSDAQ 개별 종목 ──
  '에코프로비엠': [{ code: '247540', name: '에코프로비엠', market: 'KOSDAQ' }],
  '에코프로': [{ code: '086520', name: '에코프로', market: 'KOSDAQ' }],
  'HLB': [{ code: '028300', name: 'HLB', market: 'KOSDAQ' }],
  '알테오젠': [{ code: '196170', name: '알테오젠', market: 'KOSDAQ' }],
  '포스코DX': [{ code: '022100', name: '포스코DX', market: 'KOSDAQ' }],
  '셀트리온헬스케어': [{ code: '091990', name: '셀트리온헬스케어', market: 'KOSDAQ' }],
  '루닛': [{ code: '328130', name: '루닛', market: 'KOSDAQ' }],
  '레인보우로보틱스': [{ code: '277810', name: '레인보우로보틱스', market: 'KOSDAQ' }],
  '레인보우': [{ code: '277810', name: '레인보우로보틱스', market: 'KOSDAQ' }],
  '이오테크닉스': [{ code: '039030', name: '이오테크닉스', market: 'KOSDAQ' }],
  '리가켐바이오': [{ code: '141080', name: '리가켐바이오', market: 'KOSDAQ' }],
  '리가켐': [{ code: '141080', name: '리가켐바이오', market: 'KOSDAQ' }],
  '엔젤로보틱스': [{ code: '348370', name: '엔젤로보틱스', market: 'KOSDAQ' }],
  '엔젤로보': [{ code: '348370', name: '엔젤로보틱스', market: 'KOSDAQ' }],
  '엘앤에프': [{ code: '066970', name: '엘앤에프', market: 'KOSDAQ' }],
  '솔브레인': [{ code: '357780', name: '솔브레인', market: 'KOSDAQ' }],
  '원익IPS': [{ code: '240810', name: '원익IPS', market: 'KOSDAQ' }],
  '테크윙': [{ code: '131970', name: '테크윙', market: 'KOSDAQ' }],
  '주성엔지니어링': [{ code: '036930', name: '주성엔지니어링', market: 'KOSDAQ' }],
  '파마리서치': [{ code: '214450', name: '파마리서치', market: 'KOSDAQ' }],
  '메디톡스': [{ code: '086900', name: '메디톡스', market: 'KOSDAQ' }],
  '클래시스': [{ code: '214150', name: '클래시스', market: 'KOSDAQ' }],
  '씨에스윈드': [{ code: '112610', name: '씨에스윈드', market: 'KOSDAQ' }],
  'JYP': [{ code: '035900', name: 'JYP Ent.', market: 'KOSDAQ' }],
  'SM엔터': [{ code: '041510', name: 'SM엔터테인먼트', market: 'KOSDAQ' }],
  'SM엔터테인먼트': [{ code: '041510', name: 'SM엔터테인먼트', market: 'KOSDAQ' }],
  'YG엔터': [{ code: '122870', name: 'YG엔터테인먼트', market: 'KOSDAQ' }],
  '하이브': [{ code: '352820', name: '하이브', market: 'KOSDAQ' }],
  '비올': [{ code: '335890', name: '비올', market: 'KOSDAQ' }],
  '덴티움': [{ code: '145720', name: '덴티움', market: 'KOSDAQ' }],
  '올릭스': [{ code: '226950', name: '올릭스', market: 'KOSDAQ' }],
  '펄어비스': [{ code: '263750', name: '펄어비스', market: 'KOSDAQ' }],
  '위메이드': [{ code: '112040', name: '위메이드', market: 'KOSDAQ' }],
  '카카오게임즈': [{ code: '293490', name: '카카오게임즈', market: 'KOSDAQ' }],
  '안랩': [{ code: '053800', name: '안랩', market: 'KOSDAQ' }],
  // ── 테마/섹터 키워드 ──
  '코스피': [],
  '코스닥': [],
  'AI반도체': [{ code: '000660', name: 'SK하이닉스', market: 'KOSPI' }, { code: '042700', name: '한미반도체', market: 'KOSPI' }],
  'HBM': [{ code: '000660', name: 'SK하이닉스', market: 'KOSPI' }, { code: '005930', name: '삼성전자', market: 'KOSPI' }],
  '2차전지': [{ code: '247540', name: '에코프로비엠', market: 'KOSDAQ' }, { code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' }, { code: '066970', name: '엘앤에프', market: 'KOSDAQ' }],
  '배터리': [{ code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' }, { code: '006400', name: '삼성SDI', market: 'KOSPI' }],
  '이차전지': [{ code: '247540', name: '에코프로비엠', market: 'KOSDAQ' }, { code: '373220', name: 'LG에너지솔루션', market: 'KOSPI' }],
  '반도체': [{ code: '005930', name: '삼성전자', market: 'KOSPI' }, { code: '000660', name: 'SK하이닉스', market: 'KOSPI' }],
  '파운드리': [{ code: '005930', name: '삼성전자', market: 'KOSPI' }],
  '바이오': [{ code: '068270', name: '셀트리온', market: 'KOSPI' }, { code: '028300', name: 'HLB', market: 'KOSDAQ' }, { code: '196170', name: '알테오젠', market: 'KOSDAQ' }],
  '제약': [{ code: '128940', name: '한미약품', market: 'KOSPI' }, { code: '000100', name: '유한양행', market: 'KOSPI' }],
  '신약': [{ code: '128940', name: '한미약품', market: 'KOSPI' }, { code: '141080', name: '리가켐바이오', market: 'KOSDAQ' }],
  '임상': [{ code: '028300', name: 'HLB', market: 'KOSDAQ' }, { code: '196170', name: '알테오젠', market: 'KOSDAQ' }],
  '항암': [{ code: '028300', name: 'HLB', market: 'KOSDAQ' }, { code: '141080', name: '리가켐바이오', market: 'KOSDAQ' }],
  'ADC': [{ code: '141080', name: '리가켐바이오', market: 'KOSDAQ' }],
  '피하주사': [{ code: '196170', name: '알테오젠', market: 'KOSDAQ' }],
  'AI의료': [{ code: '328130', name: '루닛', market: 'KOSDAQ' }],
  '의료AI': [{ code: '328130', name: '루닛', market: 'KOSDAQ' }],
  '로봇': [{ code: '277810', name: '레인보우로보틱스', market: 'KOSDAQ' }, { code: '348370', name: '엔젤로보틱스', market: 'KOSDAQ' }],
  '산업용로봇': [{ code: '277810', name: '레인보우로보틱스', market: 'KOSDAQ' }],
  '협동로봇': [{ code: '277810', name: '레인보우로보틱스', market: 'KOSDAQ' }],
  '전기차': [{ code: '005380', name: '현대차', market: 'KOSPI' }, { code: '000270', name: '기아', market: 'KOSPI' }],
  'EV': [{ code: '005380', name: '현대차', market: 'KOSPI' }, { code: '000270', name: '기아', market: 'KOSPI' }],
  '자동차': [{ code: '005380', name: '현대차', market: 'KOSPI' }, { code: '000270', name: '기아', market: 'KOSPI' }],
  '방산': [{ code: '012450', name: '한화에어로스페이스', market: 'KOSPI' }, { code: '047810', name: '한국항공우주', market: 'KOSPI' }],
  '방위산업': [{ code: '012450', name: '한화에어로스페이스', market: 'KOSPI' }, { code: '047810', name: '한국항공우주', market: 'KOSPI' }],
  '무기': [{ code: '012450', name: '한화에어로스페이스', market: 'KOSPI' }],
  '조선': [{ code: '009540', name: 'HD한국조선해양', market: 'KOSPI' }, { code: '010140', name: '삼성중공업', market: 'KOSPI' }, { code: '042660', name: '한화오션', market: 'KOSPI' }],
  'LNG': [{ code: '009540', name: 'HD한국조선해양', market: 'KOSPI' }, { code: '010140', name: '삼성중공업', market: 'KOSPI' }],
  '원자력': [{ code: '034020', name: '두산에너빌리티', market: 'KOSPI' }],
  '원전': [{ code: '034020', name: '두산에너빌리티', market: 'KOSPI' }],
  '태양광': [{ code: '009830', name: '한화솔루션', market: 'KOSPI' }],
  '신재생에너지': [{ code: '009830', name: '한화솔루션', market: 'KOSPI' }, { code: '112610', name: '씨에스윈드', market: 'KOSDAQ' }],
  '풍력': [{ code: '112610', name: '씨에스윈드', market: 'KOSDAQ' }],
  '금융': [{ code: '105560', name: 'KB금융', market: 'KOSPI' }, { code: '055550', name: '신한지주', market: 'KOSPI' }],
  '은행': [{ code: '105560', name: 'KB금융', market: 'KOSPI' }, { code: '055550', name: '신한지주', market: 'KOSPI' }],
  '증시': [{ code: '005930', name: '삼성전자', market: 'KOSPI' }],
  '주가': [],
  'K팝': [{ code: '352820', name: '하이브', market: 'KOSDAQ' }, { code: '041510', name: 'SM엔터테인먼트', market: 'KOSDAQ' }],
  '엔터': [{ code: '352820', name: '하이브', market: 'KOSDAQ' }, { code: '041510', name: 'SM엔터테인먼트', market: 'KOSDAQ' }],
  '엔터테인먼트': [{ code: '352820', name: '하이브', market: 'KOSDAQ' }],
  '게임': [{ code: '259960', name: '크래프톤', market: 'KOSPI' }, { code: '263750', name: '펄어비스', market: 'KOSDAQ' }],
  '해운': [{ code: '011200', name: 'HMM', market: 'KOSPI' }],
  '항공': [{ code: '003490', name: '대한항공', market: 'KOSPI' }],
  '철강': [{ code: '005490', name: 'POSCO홀딩스', market: 'KOSPI' }],
  '통신': [{ code: '017670', name: 'SK텔레콤', market: 'KOSPI' }, { code: '030200', name: 'KT', market: 'KOSPI' }],
  '뷰티': [{ code: '336260', name: '씨앤씨인터내셔널', market: 'KOSDAQ' }],
  '화장품': [{ code: '336260', name: '씨앤씨인터내셔널', market: 'KOSDAQ' }],
  '보안': [{ code: '053800', name: '안랩', market: 'KOSDAQ' }],
  '사이버보안': [{ code: '053800', name: '안랩', market: 'KOSDAQ' }],
}

// 카테고리별 분류 키워드 (탭 분류에 활용)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  kospi:  ['코스피', 'KOSPI', '삼성전자', 'SK하이닉스', '현대차', '현대자동차', '기아', 'KB금융', '신한지주', '하나금융', 'LG화학', 'NAVER', '네이버', '카카오', 'POSCO', '포스코', 'LG에너지솔루션', '한화에어로스페이스', '한국항공우주', '두산에너빌리티', '삼성중공업', '한화오션', 'HD한국조선해양', 'HMM', '대한항공', '삼성SDI', '삼성전기', '크래프톤', '한미약품', '유한양행'],
  kosdaq: ['코스닥', 'KOSDAQ', '에코프로', '알테오젠', 'HLB', '루닛', '레인보우로보틱스', '리가켐바이오', '포스코DX', '셀트리온헬스케어', '이오테크닉스', '엘앤에프', '솔브레인', '원익IPS', '엔젤로보틱스', '하이브', 'JYP', 'SM엔터', 'YG엔터', '펄어비스', '위메이드', '씨에스윈드', '파마리서치', '비올', '클래시스', '안랩'],
  bio:    ['바이오', '제약', '신약', '임상', '항암', '의료', '치료제', 'ADC', '피하주사', 'mRNA', '백신', '임상시험', '식약처', 'FDA', '허가', '셀트리온', '삼성바이오', 'HLB', '알테오젠', '한미약품', '유한양행', '루닛', '리가켐바이오', '메디톡스', '파마리서치', '비올', '클래시스', '올릭스', '바이오텍', '항체', '줄기세포'],
  semi:   ['반도체', '반도체주', 'AI반도체', 'HBM', '파운드리', '메모리', 'D램', '낸드', 'DRAM', 'NAND', '삼성전자', 'SK하이닉스', '한미반도체', '이오테크닉스', '원익IPS', '주성엔지니어링', '테크윙', '솔브레인', '포스코DX', 'AI', '인공지능', '엔비디아', 'GPU', 'HBM3', 'CoWoS', '웨이퍼', '노광'],
  bat:    ['2차전지', '이차전지', '배터리', '전기차', 'EV', 'LFP', 'NCM', '양극재', '음극재', '분리막', '전해질', '에코프로비엠', '에코프로', 'LG에너지솔루션', '삼성SDI', 'LG화학', 'SK이노베이션', '포스코', '엘앤에프', '현대차', '기아', '테슬라', '배터리셀', '충전', '충전소', 'ESS'],
  robot:  ['로봇', '협동로봇', '산업로봇', '서비스로봇', 'AI로봇', '자율주행', '드론', '레인보우로보틱스', '엔젤로보틱스', '로보틱스', '자동화', '스마트팩토리', 'AMR', 'AGV', '인간형로봇', '휴머노이드', '보스턴다이내믹스'],
}

function findRelatedStocks(text: string): { code: string; name: string; market: string }[] {
  const found: { code: string; name: string; market: string }[] = []
  const seen = new Set<string>()

  // 길이 긴 키워드를 먼저 매칭 (더 구체적인 키워드 우선)
  const sortedKeywords = Object.entries(STOCK_KEYWORDS).sort((a, b) => b[0].length - a[0].length)

  for (const [keyword, stocks] of sortedKeywords) {
    if (keyword.length === 0) continue
    if (text.includes(keyword)) {
      for (const stock of stocks) {
        if (!seen.has(stock.code)) {
          seen.add(stock.code)
          found.push(stock)
        }
      }
    }
  }

  return found.slice(0, 5) // 최대 5개 관련 종목
}

// 뉴스 카테고리 분류
function classifyNewsCategory(text: string): string[] {
  const categories: string[] = []
  const upperText = text.toUpperCase()
  const combinedText = text + ' ' + upperText

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => combinedText.includes(kw) || combinedText.includes(kw.toUpperCase()))) {
      categories.push(cat)
    }
  }

  return categories
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

// Google News RSS로 뉴스 가져오기 (단일 쿼리)
async function fetchGoogleNewsSingle(query: string, display: number = 20): Promise<any[]> {
  try {
    const q = buildGoogleNewsQuery(query)
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ko&gl=KR&ceid=KR:ko`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      }
    })
    
    if (!response.ok) {
      console.error('Google News RSS error:', response.status, 'query:', q)
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

// Google News RSS로 뉴스 가져오기 (카테고리별 다중 쿼리 병렬)
async function fetchGoogleNews(query: string, display: number = 20): Promise<any[]> {
  try {
    // 단일 쿼리로 먼저 시도
    const items = await fetchGoogleNewsSingle(query, display)
    if (items.length >= 10) return items

    // 결과가 부족하면 서브 쿼리 병렬 보완
    const subQueries = [
      '코스피 코스닥 증시 주식',
      '삼성전자 SK하이닉스 반도체',
      '바이오 2차전지 로봇 주가',
    ]
    const results = await Promise.allSettled(
      subQueries.map(q => fetchGoogleNewsSingle(q, 10))
    )

    const extra: any[] = []
    for (const r of results) {
      if (r.status === 'fulfilled') extra.push(...r.value)
    }

    // 중복 제거 (title 기준)
    const seen = new Set(items.map((i: any) => i.title))
    for (const item of extra) {
      if (!seen.has(item.title)) {
        seen.add(item.title)
        items.push(item)
      }
    }

    return items.slice(0, display)
  } catch (e) {
    console.error('fetchGoogleNews error:', e)
    return []
  }
}

// 네이버 뉴스 API 시도
async function fetchNaverNews(clientId: string, clientSecret: string, query: string, display: number = 20): Promise<{ items: any[]; success: boolean; errorMsg?: string }> {
  try {
    // 네이버 API는 한 번에 최대 100개까지 가능
    const safeDisplay = Math.min(display, 100)
    const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${safeDisplay}&start=1&sort=date`
    
    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
        'Accept': 'application/json',
      }
    })
    
    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error(`[Naver] HTTP ${response.status}: ${errText}`)
      return { items: [], success: false, errorMsg: `HTTP ${response.status}: ${errText}` }
    }
    
    const data = await response.json() as any
    if (data.errorCode) {
      console.error(`[Naver] API errorCode ${data.errorCode}: ${data.errorMessage}`)
      return { items: [], success: false, errorMsg: `${data.errorCode}: ${data.errorMessage}` }
    }
    
    return { items: data.items || [], success: true }
  } catch (e: any) {
    console.error('[Naver] fetch exception:', e?.message)
    return { items: [], success: false, errorMsg: e?.message }
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

    // 카테고리 필터 파라미터
    const category = c.req.query('category') || 'all'

    // 1. 네이버 API 우선 시도 (API 키가 있고 유효한 경우)
    if (c.env.NAVER_CLIENT_ID && c.env.NAVER_CLIENT_SECRET) {
      const naverResult = await fetchNaverNews(
        c.env.NAVER_CLIENT_ID,
        c.env.NAVER_CLIENT_SECRET,
        query,
        display
      )
      
      if (!naverResult.success) {
        console.warn('[News] Naver API failed, falling back to Google RSS. Error:', naverResult.errorMsg)
      }

      if (naverResult.success && naverResult.items.length > 0) {
        // 네이버 API 성공
        let newsWithStocks = naverResult.items.map((item: any) => {
          const rawText = item.title + ' ' + item.description
          const cleanText = rawText.replace(/<[^>]*>/g, '')
          const relatedStocks = findRelatedStocks(cleanText)
          const categories = classifyNewsCategory(cleanText)
          
          return {
            id: btoa(item.link).substring(0, 20),
            title: item.title.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#039;/g,"'"),
            description: item.description.replace(/<[^>]*>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'),
            link: item.link,
            pubDate: item.pubDate,
            relatedStocks,
            categories,
            source: 'NAVER뉴스'
          }
        })
        
        // 카테고리 필터 적용
        if (category !== 'all') {
          newsWithStocks = newsWithStocks.filter((n: any) => n.categories.includes(category))
        }
        
        return c.json({ success: true, news: newsWithStocks, isMock: false, source: 'naver', total: newsWithStocks.length })
      }
    }

    // 2. Google News RSS 사용 (네이버 실패 또는 키 없음)
    const googleItems = await fetchGoogleNews(query, display)
    
    if (googleItems.length > 0) {
      let newsWithStocks = googleItems.map((item: any, idx: number) => {
        const text = item.title + ' ' + (item.description || '')
        const relatedStocks = findRelatedStocks(text)
        const categories = classifyNewsCategory(text)
        
        return {
          id: `g_${Date.now()}_${idx}`,
          title: item.title,
          description: item.description || item.title,
          link: item.link,
          pubDate: item.pubDate,
          relatedStocks,
          categories,
          source: item.source || 'Google뉴스'
        }
      })
      
      // 카테고리 필터 적용
      if (category !== 'all') {
        newsWithStocks = newsWithStocks.filter((n: any) => n.categories.includes(category))
      }
      
      return c.json({ success: true, news: newsWithStocks, isMock: false, source: 'google', total: newsWithStocks.length })
    }

    // 3. 모든 소스 실패 시 Mock 데이터
    return c.json({ success: true, news: getMockNews(), isMock: true, source: 'mock', total: getMockNews().length })
    
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

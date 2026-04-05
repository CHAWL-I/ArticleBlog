import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)

    // undefined를 null로 변환 (정적 빌드 시 필수)
    const safeProps = JSON.parse(
      JSON.stringify(props, (key, value) => 
        value === undefined ? null : value
      )
    )
    
    return { 
      props: safeProps
      // ✅ revalidate 옵션 절대 넣지 마세요 (정적 내보내기 모드 전용)
    }
  } catch (err) {
    console.error('page error', domain, err)
    
    // 빌드 중단(Crash)을 막기 위해 최소한의 빈 props 반환
    return {
      props: {
        site: null,
        recordMap: null,
        pageId: null
      }
    }
  }
}

export default function NotionDomainPage(props) {
  // props가 비어있을 경우에 대한 방어 로직 (선택사항)
  if (!props.recordMap) return <div>Loading or Error...</div>
  return <NotionPage {...props} />
}
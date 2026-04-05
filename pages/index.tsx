import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)

    // undefined 값을 null로 변환하여 JSON 직렬화 에러 방지
    const safeProps = JSON.parse(
      JSON.stringify(props, (key, value) => 
        value === undefined ? null : value
      )
    )
    
    return { 
      props: safeProps,
      // ✅ 추가: 정적 빌드 후 1시간 동안은 캐시된 데이터를 우선 사용합니다.
      revalidate: 3600 
    }
  } catch (err) {
    console.error('page error', domain, err)

    // ✅ 수정: 에러 발생 시 빌드를 중단하지 않고 404 처리 후 1분 뒤 재시도하게 합니다.
    return {
      notFound: true,
      revalidate: 60 
    }
  }
}

export default function NotionDomainPage(props) {
  return <NotionPage {...props} />
}
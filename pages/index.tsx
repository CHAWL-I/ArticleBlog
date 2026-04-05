import { NotionPage } from '@/components/NotionPage'
import { domain } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)

    // [수정 포인트] 모든 undefined 값을 JSON이 이해할 수 있는 null로 변환합니다.
    const safeProps = JSON.parse(
      JSON.stringify(props, (key, value) => 
        value === undefined ? null : value
      )
    )
    
    return { props: safeProps }
  } catch (err) {
    console.error('page error', domain, err)

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export default function NotionDomainPage(props) {
  return <NotionPage {...props} />
}

import client from '../client'

/** 일회성 이벤트 API. 마이그레이션 끝나면 이 파일과 소속카드 행의 이벤트 버튼을 삭제하면 된다. */
export const migrateTagRedirect = (tagId) =>
  client.post(`/management/event/tags/${encodeURIComponent(tagId)}/migrate-redirects`)

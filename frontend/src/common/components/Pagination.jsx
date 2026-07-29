import { ChevronLeft, ChevronRight } from 'lucide-react'

function Pagination({ data, onChange }) {
  if (!data) return null
  return (
    <div className="pagination">
      <span>총 {data.totalCount ?? 0}개</span>
      <div>
        <button type="button" disabled={!data.prev} onClick={() => onChange(data.prevPage)}>
          <ChevronLeft size={16} />
        </button>
        {data.pageNumList?.map((page) => (
          <button
            type="button"
            key={page}
            className={data.current === page ? 'current' : ''}
            onClick={() => onChange(page)}
          >
            {page}
          </button>
        ))}
        <button type="button" disabled={!data.next} onClick={() => onChange(data.nextPage)}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default Pagination

import './SkeletonLoader.css'

export function SkeletonCard() {
  return (
    <div className="skeleton-card card">
      <div className="skeleton-row">
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '40%', height: 12 }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: '80%', height: 28, margin: '16px 0 8px' }} />
      <div className="skeleton" style={{ width: '50%', height: 14 }} />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 6 }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <div className="skeleton" style={{ width: 60, height: 12 }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j}>
                  <div
                    className="skeleton"
                    style={{ width: j === 1 ? 120 : 80, height: 14 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function SkeletonSummaryCards() {
  return (
    <div className="grid-4">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export default function SkeletonLoader({ type = 'table', rows = 5 }) {
  if (type === 'cards') return <SkeletonSummaryCards />
  if (type === 'table') return <SkeletonTable rows={rows} />
  return <SkeletonCard />
}

/**
 * Animated shimmer skeleton placeholder.
 * Props:
 *   variant — 'text' | 'card' | 'avatar' | 'chart' | 'table-row'
 *   width   — CSS width (default: '100%')
 *   height  — CSS height (auto from variant if omitted)
 *   count   — repeat N skeletons (useful for table rows)
 */
export default function SkeletonLoader({
  variant = 'text',
  width,
  height,
  count = 1,
  style = {},
}) {
  const presets = {
    text: { width: width || '100%', height: height || '16px', borderRadius: 'var(--radius-sm)' },
    card: { width: width || '100%', height: height || '140px', borderRadius: 'var(--radius-xl)' },
    avatar: { width: width || '40px', height: height || '40px', borderRadius: 'var(--radius-full)' },
    chart: { width: width || '100%', height: height || '220px', borderRadius: 'var(--radius-lg)' },
    'table-row': { width: width || '100%', height: height || '48px', borderRadius: 'var(--radius-sm)' },
  }

  const base = presets[variant] || presets.text

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer"
          style={{ ...base, ...style, marginBottom: count > 1 ? '8px' : 0 }}
          aria-hidden="true"
        />
      ))}
    </>
  )
}

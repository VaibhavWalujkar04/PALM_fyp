import { InlineMath, BlockMath } from 'react-katex'
import { parseLatex } from '@/lib/katexUtils'

/**
 * MathRenderer — renders text with embedded LaTeX math expressions.
 *
 * Supports:
 *   - Block math:  $$...$$
 *   - Inline math: \(...\)
 *   - Falls back to plain text on parse errors
 */
export default function MathRenderer({ content, className = '' }) {
  if (!content) return null

  const segments = parseLatex(content)

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'block') {
          return (
            <span key={i} className="block my-2">
              <SafeBlockMath math={seg.content} />
            </span>
          )
        }
        if (seg.type === 'inline') {
          return <SafeInlineMath key={i} math={seg.content} />
        }
        // Plain text — preserve whitespace and newlines
        return <span key={i}>{seg.content}</span>
      })}
    </span>
  )
}

function SafeBlockMath({ math }) {
  try {
    return <BlockMath math={math} />
  } catch {
    return <code className="block p-2 rounded bg-gray-100 text-sm">{math}</code>
  }
}

function SafeInlineMath({ math }) {
  try {
    return <InlineMath math={math} />
  } catch {
    return <code className="px-1 rounded bg-gray-100 text-sm">{math}</code>
  }
}

/**
 * KaTeX Utilities — parse text for LaTeX delimiters and split into segments.
 *
 * Supports:
 *   - Block math:  $$...$$ 
 *   - Inline math: \(...\)
 */

/**
 * Parse a string into segments of plain text and LaTeX math.
 *
 * @param {string} text — raw text potentially containing LaTeX
 * @returns {Array<{type: 'text'|'block'|'inline', content: string}>}
 */
export function parseLatex(text) {
  if (!text) return [{ type: 'text', content: '' }]

  const segments = []
  // Combined regex: block math $$...$$ or inline math \(...\)
  const regex = /\$\$([\s\S]*?)\$\$|\\\(([\s\S]*?)\\\)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Push preceding plain text
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    if (match[1] !== undefined) {
      // Block math: $$...$$
      segments.push({ type: 'block', content: match[1].trim() })
    } else if (match[2] !== undefined) {
      // Inline math: \(...\)
      segments.push({ type: 'inline', content: match[2].trim() })
    }

    lastIndex = match.index + match[0].length
  }

  // Push remaining plain text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments.length > 0 ? segments : [{ type: 'text', content: text }]
}

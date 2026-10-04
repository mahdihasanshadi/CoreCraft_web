import {describe, expect, it} from 'vitest'

import {normaliseSearchTerm} from './catalogue'

describe('normaliseSearchTerm', () => {
  it('trims, collapses whitespace and keeps letters, digits, apostrophes and hyphens', () => {
    expect(normaliseSearchTerm('  argentina   home  ')).toBe('argentina home')
    expect(normaliseSearchTerm("men's drop-shoulder")).toBe("men's drop-shoulder")
  })

  it('strips characters that could change query meaning', () => {
    expect(normaliseSearchTerm('jersey* && _type == "x"')).toBe('jersey type x')
  })

  it('rejects terms that are too short or empty', () => {
    expect(normaliseSearchTerm('a')).toBeNull()
    expect(normaliseSearchTerm('   ')).toBeNull()
    expect(normaliseSearchTerm(null)).toBeNull()
  })

  it('caps very long input', () => {
    expect(normaliseSearchTerm('x'.repeat(200))?.length).toBe(60)
  })

  it('keeps Bangla text', () => {
    expect(normaliseSearchTerm('জার্সি')).toBe('জার্সি')
  })
})

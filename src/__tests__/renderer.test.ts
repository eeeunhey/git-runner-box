/**
 * renderer.test.ts — Gist 텍스트 생성 단위 테스트
 *
 * 검증 항목:
 * - 출력 줄 수 (정확히 5줄)
 * - 헤더에 연도 포함
 * - today marker (● / ○)
 * - stats 포맷 (🔥, 🏆, 🌱)
 * - 코스 라인 포함
 */

import { describe, it, expect } from 'vitest'
import { renderGist } from '../renderer.js'
import type { Stats } from '../streak.js'

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    todayActive: true,
    todayCount: 3,
    currentStreak: 8,
    longestStreak: 27,
    activeDays: 103,
    journeyDay: 142,
    ...overrides,
  }
}

const SAMPLE_SKY = '       ☀                 ☁'
const SAMPLE_TRACK = '[🌱 ▓▓▓▓▓▓▓▓▓▓▓🏃💨░░░░░░ 🚩] 63%'

describe('renderGist', () => {
  it('정확히 5줄을 출력한다', () => {
    const result = renderGist(makeStats(), SAMPLE_SKY, SAMPLE_TRACK, 365)
    const lines = result.split('\n')
    expect(lines).toHaveLength(5)
  })

  it('첫 줄에 Day 및 총 일수가 포함된다', () => {
    const result = renderGist(makeStats({ journeyDay: 230 }), SAMPLE_SKY, SAMPLE_TRACK, 365)
    const firstLine = result.split('\n')[0]!
    expect(firstLine).toContain('Day 230 / 365')
    expect(firstLine).toContain('git-runner')
  })

  it('두 번째 줄은 하늘 라인이다', () => {
    const result = renderGist(makeStats(), SAMPLE_SKY, SAMPLE_TRACK, 365)
    const secondLine = result.split('\n')[1]!
    expect(secondLine).toBe(SAMPLE_SKY)
  })

  it('세 번째 줄은 트랙 라인이다', () => {
    const result = renderGist(makeStats(), SAMPLE_SKY, SAMPLE_TRACK, 365)
    const thirdLine = result.split('\n')[2]!
    expect(thirdLine).toBe(SAMPLE_TRACK)
  })

  it('네 번째 줄은 빈 줄이다', () => {
    const result = renderGist(makeStats(), SAMPLE_SKY, SAMPLE_TRACK, 365)
    const lines = result.split('\n')
    expect(lines[3]).toBe('')
  })

  it('active day → ● marker & count', () => {
    const result = renderGist(
      makeStats({ todayActive: true, todayCount: 5 }),
      SAMPLE_SKY,
      SAMPLE_TRACK,
      365,
    )
    const lastLine = result.split('\n')[4]!
    expect(lastLine).toContain('● Today (5)')
    expect(lastLine).not.toContain('○')
  })

  it('inactive day → ○ marker & count 0', () => {
    const result = renderGist(
      makeStats({ todayActive: false, todayCount: 0 }),
      SAMPLE_SKY,
      SAMPLE_TRACK,
      365,
    )
    const lastLine = result.split('\n')[4]!
    expect(lastLine).toContain('○ Today (0)')
    expect(lastLine).not.toContain('●')
  })

  it('스탯 라인에 🔥 streak, 🏆 best, 🌱 active/journey 포함', () => {
    const stats = makeStats({
      currentStreak: 12,
      longestStreak: 31,
      activeDays: 184,
      journeyDay: 229,
    })
    const result = renderGist(stats, SAMPLE_SKY, SAMPLE_TRACK, 365)
    const lastLine = result.split('\n')[4]!

    expect(lastLine).toContain('🔥 12 days')
    expect(lastLine).toContain('🏆 31')
    expect(lastLine).toContain('🌱 184/229')
  })

  it('streak 1일 → "1 day" (단수)', () => {
    const stats = makeStats({ currentStreak: 1 })
    const result = renderGist(stats, SAMPLE_SKY, SAMPLE_TRACK, 365)
    const lastLine = result.split('\n')[4]!

    expect(lastLine).toContain('🔥 1 day')
    expect(lastLine).not.toContain('1 days')
  })

  it('streak 0일 → "0 days"', () => {
    const stats = makeStats({ currentStreak: 0 })
    const result = renderGist(stats, SAMPLE_SKY, SAMPLE_TRACK, 365)
    const lastLine = result.split('\n')[4]!

    expect(lastLine).toContain('🔥 0 days')
  })
})

/**
 * streak.test.ts — streak 계산 로직 단위 테스트
 *
 * calculateStats 함수의 핵심 로직을 검증한다:
 * - 빈 입력 처리
 * - todayActive 판단
 * - currentStreak: 오늘 active vs 어제부터 역순
 * - longestStreak: 전체 중 최대 연속
 * - activeDays: 총 활동일
 * - journeyDay: 1/1부터 오늘까지 날 수
 */

import { describe, it, expect } from 'vitest'
import { calculateStats } from '../streak.js'
import type { ContributionDay } from '../github.js'

/**
 * 테스트용 헬퍼: 지정 범위의 ContributionDay[]를 생성한다.
 *
 * @param startDate - 시작 날짜 (YYYY-MM-DD)
 * @param days - 생성할 날 수
 * @param activePattern - 각 날짜의 활동 여부 (true=active, false=inactive)
 *                        배열 길이가 days보다 짧으면 순환 적용
 */
function makeContributions(
  startDate: string,
  days: number,
  activePattern: boolean[],
): ContributionDay[] {
  const result: ContributionDay[] = []
  const [year, month, day] = startDate.split('-').map(Number)
  const start = new Date(Date.UTC(year!, month! - 1, day!))

  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 86_400_000)
    const y = date.getUTCFullYear()
    const m = String(date.getUTCMonth() + 1).padStart(2, '0')
    const d = String(date.getUTCDate()).padStart(2, '0')
    const isActive = activePattern[i % activePattern.length]!

    result.push({
      date: `${y}-${m}-${d}`,
      count: isActive ? Math.floor(Math.random() * 10) + 1 : 0,
    })
  }

  return result
}

describe('calculateStats', () => {
  it('빈 contributions → 모든 값 0, journeyDay만 계산', () => {
    const today = new Date(Date.UTC(2026, 7, 17)) // 2026-08-17
    const stats = calculateStats([], today)

    expect(stats.todayActive).toBe(false)
    expect(stats.currentStreak).toBe(0)
    expect(stats.longestStreak).toBe(0)
    expect(stats.activeDays).toBe(0)
    expect(stats.journeyDay).toBe(229) // 1/1 ~ 8/17 = 229일
  })

  it('1월 1일 → journeyDay = 1', () => {
    const today = new Date(Date.UTC(2026, 0, 1)) // 2026-01-01
    const stats = calculateStats([], today)
    expect(stats.journeyDay).toBe(1)
  })

  it('12월 31일 (평년) → journeyDay = 365', () => {
    const today = new Date(Date.UTC(2026, 11, 31)) // 2026-12-31
    const stats = calculateStats([], today)
    expect(stats.journeyDay).toBe(365)
  })

  it('12월 31일 (윤년) → journeyDay = 366', () => {
    const today = new Date(Date.UTC(2024, 11, 31)) // 2024-12-31 (윤년)
    const stats = calculateStats([], today)
    expect(stats.journeyDay).toBe(366)
  })

  it('매일 활동 → streak == 활동일 수', () => {
    const contributions = makeContributions('2026-01-01', 10, [true])
    const today = new Date(Date.UTC(2026, 0, 10)) // 2026-01-10

    const stats = calculateStats(contributions, today)

    expect(stats.todayActive).toBe(true)
    expect(stats.currentStreak).toBe(10)
    expect(stats.longestStreak).toBe(10)
    expect(stats.activeDays).toBe(10)
  })

  it('오늘 활동 → todayActive = true, todayCount = 3', () => {
    const contributions: ContributionDay[] = [
      { date: '2026-08-17', count: 3 },
    ]
    const today = new Date(Date.UTC(2026, 7, 17))

    const stats = calculateStats(contributions, today)
    expect(stats.todayActive).toBe(true)
    expect(stats.todayCount).toBe(3)
  })

  it('오늘 미활동 → todayActive = false, todayCount = 0', () => {
    const contributions: ContributionDay[] = [
      { date: '2026-08-17', count: 0 },
    ]
    const today = new Date(Date.UTC(2026, 7, 17))

    const stats = calculateStats(contributions, today)
    expect(stats.todayActive).toBe(false)
    expect(stats.todayCount).toBe(0)
  })

  it('오늘 미활동이지만 어제까지 연속 → streak은 어제 기준으로 유지', () => {
    const contributions: ContributionDay[] = [
      { date: '2026-08-14', count: 2 },
      { date: '2026-08-15', count: 1 },
      { date: '2026-08-16', count: 4 },
      { date: '2026-08-17', count: 0 }, // 오늘 아직 미활동
    ]
    const today = new Date(Date.UTC(2026, 7, 17))

    const stats = calculateStats(contributions, today)

    expect(stats.todayActive).toBe(false)
    expect(stats.currentStreak).toBe(3) // 8/14, 8/15, 8/16
  })

  it('중간 하루 빠짐 → streak 리셋', () => {
    const contributions: ContributionDay[] = [
      { date: '2026-08-13', count: 1 },
      { date: '2026-08-14', count: 1 },
      { date: '2026-08-15', count: 0 }, // 빠짐
      { date: '2026-08-16', count: 1 },
      { date: '2026-08-17', count: 1 },
    ]
    const today = new Date(Date.UTC(2026, 7, 17))

    const stats = calculateStats(contributions, today)

    expect(stats.currentStreak).toBe(2) // 8/16, 8/17
    expect(stats.longestStreak).toBe(2) // 8/13~14 = 2, 8/16~17 = 2
  })

  it('과거 longest streak > current streak', () => {
    const contributions: ContributionDay[] = [
      { date: '2026-08-10', count: 1 },
      { date: '2026-08-11', count: 1 },
      { date: '2026-08-12', count: 1 },
      { date: '2026-08-13', count: 1 },
      { date: '2026-08-14', count: 1 }, // 5일 연속
      { date: '2026-08-15', count: 0 }, // 끊김
      { date: '2026-08-16', count: 1 },
      { date: '2026-08-17', count: 1 }, // 2일 연속
    ]
    const today = new Date(Date.UTC(2026, 7, 17))

    const stats = calculateStats(contributions, today)

    expect(stats.currentStreak).toBe(2)
    expect(stats.longestStreak).toBe(5)
  })

  it('activeDays = count > 0인 날의 총 수', () => {
    const contributions: ContributionDay[] = [
      { date: '2026-08-10', count: 1 },
      { date: '2026-08-11', count: 0 },
      { date: '2026-08-12', count: 3 },
      { date: '2026-08-13', count: 0 },
      { date: '2026-08-14', count: 7 },
    ]
    const today = new Date(Date.UTC(2026, 7, 14))

    const stats = calculateStats(contributions, today)
    expect(stats.activeDays).toBe(3)
  })

  it('한 번도 활동하지 않은 경우', () => {
    const contributions = makeContributions('2026-01-01', 30, [false])
    const today = new Date(Date.UTC(2026, 0, 30))

    const stats = calculateStats(contributions, today)

    expect(stats.todayActive).toBe(false)
    expect(stats.currentStreak).toBe(0)
    expect(stats.longestStreak).toBe(0)
    expect(stats.activeDays).toBe(0)
    expect(stats.journeyDay).toBe(30)
  })
})

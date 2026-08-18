/**
 * streak.ts — Contribution 데이터에서 streak/active 통계 계산
 *
 * Purpose: Contribution Calendar에서 streak, active days, journey day를 계산한다.
 * Input:   ContributionDay[], 오늘 날짜
 * Output:  Stats
 *
 * 설계 원칙:
 * - 하루 빠졌다고 벌주지 않는다 (오늘 아직 미활동이면 어제 기준 streak 유지)
 * - Journey는 활동과 무관하게 1/1부터 계속 증가한다
 * - current_streak: 연속 활동일 (오늘 기준 또는 어제 기준)
 * - longest_streak: 올해 최대 연속 활동일
 */

import type { ContributionDay } from './github.js'

/** streak/active 통계 */
export interface Stats {
  /** 오늘 contribution이 있었는지 */
  todayActive: boolean
  /** 현재 연속 활동일 (오늘 또는 어제 기준) */
  currentStreak: number
  /** 올해 최대 연속 활동일 */
  longestStreak: number
  /** 올해 총 활동일 수 */
  activeDays: number
  /** 1월 1일부터 오늘까지 며칠째인지 (1-indexed) */
  journeyDay: number
}

/**
 * ISO date 문자열("2026-08-17")에서 Date 객체를 생성한다.
 * timezone 영향을 받지 않도록 UTC 기준으로 파싱한다.
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

/**
 * Date를 ISO date 문자열("2026-08-17")로 변환한다.
 */
function formatDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 두 날짜 사이의 일 수 차이를 구한다.
 */
function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000
  return Math.floor((b.getTime() - a.getTime()) / msPerDay)
}

/**
 * Contribution Calendar 데이터에서 통계를 계산한다.
 *
 * @param contributions - 날짜별 contribution 데이터 (순서 무관, 내부에서 정렬)
 * @param today - 기준 날짜 (timezone 적용된 "오늘")
 * @returns 계산된 통계
 *
 * @example
 * const stats = calculateStats(contributions, new Date('2026-08-17'))
 * // { todayActive: true, currentStreak: 8, longestStreak: 27, activeDays: 103, journeyDay: 229 }
 */
export function calculateStats(
  contributions: ContributionDay[],
  today: Date,
): Stats {
  const todayStr = formatDate(today)
  const yearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1))
  const journeyDay = daysBetween(yearStart, today) + 1 // 1-indexed

  if (contributions.length === 0) {
    return {
      todayActive: false,
      currentStreak: 0,
      longestStreak: 0,
      activeDays: 0,
      journeyDay,
    }
  }

  // 날짜별 active 여부를 Map으로 구성 (빠른 조회)
  const activeMap = new Map<string, boolean>()
  for (const day of contributions) {
    activeMap.set(day.date, day.count > 0)
  }

  // 오늘 활동 여부
  const todayActive = activeMap.get(todayStr) === true

  // 총 활동일
  let activeDays = 0
  for (const [, isActive] of activeMap) {
    if (isActive) activeDays++
  }

  // 현재 streak 계산
  // 오늘 active → 오늘부터 역순 카운트
  // 오늘 !active → 어제부터 역순 카운트 (오늘은 아직 기회가 남았으므로)
  let currentStreak = 0
  const startDate = todayActive ? today : new Date(today.getTime() - 86_400_000)

  for (let d = new Date(startDate); d >= yearStart; d = new Date(d.getTime() - 86_400_000)) {
    const dateStr = formatDate(d)
    if (activeMap.get(dateStr) === true) {
      currentStreak++
    } else {
      break
    }
  }

  // 최대 streak 계산 (올해 전체)
  // 날짜 정렬 후 순차 순회
  const sortedDates = Array.from(activeMap.keys()).sort()
  let longestStreak = 0
  let tempStreak = 0

  for (const dateStr of sortedDates) {
    if (activeMap.get(dateStr) === true) {
      tempStreak++
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak
      }
    } else {
      tempStreak = 0
    }
  }

  return {
    todayActive,
    currentStreak,
    longestStreak,
    activeDays,
    journeyDay,
  }
}

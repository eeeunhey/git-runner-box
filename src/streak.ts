/**
 * streak.ts — GitHub Streak & Contribution Statistics Calculator / 잔디 스트릭 및 활동 통계 계산
 *
 * Purpose (목적):
 *   - EN: Derives current streak, longest streak, active days, journey day, and today's commit count from contribution data.
 *   - KR: GitHub 기여 데이터로부터 현재 스트릭, 최장 스트릭, 총 활동일, 연간 여정 일수, 당일 커밋 수를 계산한다.
 *
 * Design Principles (설계 원칙):
 *   - EN: Non-punitive design: If no contributions yet today, yesterday's streak is preserved.
 *   - KR: 비처벌적 설계: 오늘 아직 커밋하지 않았더라도 어제까지의 스트릭을 보존한다.
 */

import type { ContributionDay } from './github.js'

/** Streak & Contribution Statistics / 스트릭 및 활동 통계 */
export interface Stats {
  /** Whether there was contribution activity today / 오늘 기여/커밋 활동이 있었는지 */
  todayActive: boolean
  /** Exact contribution/commit count today / 오늘 총 기여/커밋 수 */
  todayCount: number
  /** Current continuous streak in days / 현재 연속 활동일수 (오늘 또는 어제 기준) */
  currentStreak: number
  /** Longest continuous streak this year / 올해 최대 연속 활동일수 */
  longestStreak: number
  /** Total active days this year (1 day = 1 km) / 올해 총 활동일수 (누적 주행 거리) */
  activeDays: number
  /** Day of the year from Jan 1 (1-indexed) / 1월 1일부터 오늘까지의 일차 (1~366) */
  journeyDay: number
}

/**
 * Parses an ISO date string ("2026-08-17") to a UTC Date object.
 * ISO date 문자열에서 UTC 기준 Date 객체를 생성한다.
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!))
}

/**
 * Formats a Date object to an ISO date string ("2026-08-17").
 * Date 객체를 YYYY-MM-DD 포맷의 ISO 문자열로 변환한다.
 */
function formatDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Computes the number of days between two dates.
 * 두 날짜 사이의 일 수 차이를 계산한다.
 */
function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86_400_000
  return Math.floor((b.getTime() - a.getTime()) / msPerDay)
}

/**
 * Computes comprehensive streak and activity statistics from daily contribution records.
 * Contribution Calendar 데이터에서 streak, active days, journey day 통계를 계산한다.
 *
 * @param contributions - Array of daily contribution records / 날짜별 기여 데이터
 * @param today - Target date in the user's timezone / timezone 기준 오늘 날짜
 * @returns Computed statistics / 계산된 통계 객체
 *
 * @example
 * const stats = calculateStats(contributions, new Date('2026-08-17'))
 * // { todayActive: true, todayCount: 5, currentStreak: 12, longestStreak: 85, activeDays: 156, journeyDay: 230 }
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
      todayCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      activeDays: 0,
      journeyDay,
    }
  }

  // EN: Build a fast-lookup map for active status per date / KR: 날짜별 count 및 active 여부 맵
  const activeMap = new Map<string, boolean>()
  let todayCount = 0
  for (const day of contributions) {
    activeMap.set(day.date, day.count > 0)
    if (day.date === todayStr) {
      todayCount = day.count
    }
  }

  // EN: Check if there was activity today / KR: 오늘 활동 여부
  const todayActive = todayCount > 0

  // EN: Compute total active days / KR: 올해 총 활동일수
  let activeDays = 0
  for (const [, isActive] of activeMap) {
    if (isActive) activeDays++
  }

  // EN: Compute current continuous streak (count backwards from today if active, else from yesterday)
  // KR: 현재 streak 계산 (오늘 활동 시 오늘부터, 미활동 시 어제부터 역순 계산)
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

  // EN: Compute longest continuous streak this year / KR: 올해 최대 연속 활동일 계산
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
    todayCount,
    currentStreak,
    longestStreak,
    activeDays,
    journeyDay,
  }
}

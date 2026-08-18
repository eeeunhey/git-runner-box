/**
 * renderer.ts — 최종 Gist 텍스트 생성
 *
 * Purpose: Stats + 코스 라인을 받아 Pinned Gist에 표시될 4~5줄 텍스트를 생성한다.
 * Input:   Stats, 코스 라인, 연도
 * Output:  Gist에 쓸 문자열
 *
 * 출력 포맷:
 *   🏃 git-runner · 2026
 *
 *   🌿━━━━━━🏃━━━━━━━━━━🌳
 *
 *   ● Today   🔥 8 days   🏆 27   🌱 103/142
 *
 * 설계 원칙:
 * - 최대 5줄 (헤더, 빈 줄, 코스, 빈 줄, 스탯)
 * - Pinned Gist 카드 크기에 최적화 (~50자 폭)
 * - 숫자보다 "계속 달리고 있다는 느낌"이 중요
 */

import type { Stats } from './streak.js'

/**
 * Stats와 코스 라인으로 최종 Gist 텍스트를 생성한다.
 *
 * @param stats - streak/active 통계
 * @param courseLine - 풍경 + runner가 포함된 코스 라인
 * @param year - 표시할 연도
 * @returns Gist에 쓸 문자열 (줄바꿈 포함)
 *
 * @example
 * renderGist(stats, "🌿━━━━━━🏃━━━━━━━━━━🌳", 2026)
 * // "🏃 git-runner · 2026\n\n🌿━━━━━━🏃━━━━━━━━━━🌳\n\n● Today   🔥 8 days   🏆 27   🌱 103/142"
 */
export function renderGist(
  stats: Stats,
  courseLine: string,
  year: number,
): string {
  const todayMarker = stats.todayActive ? '●' : '○'
  const todayText = `${todayMarker} Today (${stats.todayCount})`
  const streakText = stats.currentStreak === 1 ? '1 day' : `${stats.currentStreak} days`

  const lines = [
    `🏃 git-runner · ${year}`,
    '',
    courseLine,
    '',
    `${todayText}   🔥 ${streakText}   🏆 ${stats.longestStreak}   🌱 ${stats.activeDays}/${stats.journeyDay}`,
  ]

  return lines.join('\n')
}

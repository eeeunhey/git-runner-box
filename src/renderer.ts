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
 * Stats, 하늘 레이어, 트랙 라인으로 최종 Gist 텍스트를 생성한다.
 *
 * @param stats - streak/active 통계
 * @param skyLine - 시간대별 하늘 레이어 (낮 ☀, 노을 🌅, 밤 🌙)
 * @param trackLine - 러너 게이지 트랙 라인 ([🌱 ▓▓▓🏃💨░░░ 🚩] 63%)
 * @param totalDays - 해당 연도 총 일수 (365 또는 366)
 * @returns Gist에 쓸 문자열 (정확히 5줄)
 *
 * @example
 * renderGist(stats, "       ☀                 ☁", "[🌱 ▓▓▓▓▓▓▓▓▓▓▓🏃💨░░░░░░ 🚩] 63%", 365)
 */
export function renderGist(
  stats: Stats,
  skyLine: string,
  trackLine: string,
  totalDays: number = 365,
): string {
  const todayMarker = stats.todayActive ? '●' : '○'
  const todayText = `${todayMarker} Today (${stats.todayCount})`
  const streakText = stats.currentStreak === 1 ? '1 day' : `${stats.currentStreak} days`

  const lines = [
    `🏃 git-runner · Day ${stats.journeyDay} / ${totalDays}`,
    skyLine,
    trackLine,
    '',
    `${todayText}   🔥 ${streakText}   🏆 ${stats.longestStreak}   🌱 ${stats.activeDays}/${stats.journeyDay}`,
  ]

  return lines.join('\n')
}

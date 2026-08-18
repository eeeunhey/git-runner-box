/**
 * renderer.ts — Gist Text Content Formatter / 최종 Gist 텍스트 생성
 *
 * Purpose (목적):
 *   - EN: Combines stats, dynamic time-of-day sky, and the 365-day progress bar track into a polished 5-line Gist card.
 *   - KR: 통계, 시간대별 하늘, 365일 러너 게이지 트랙을 조합하여 5줄 Pinned Gist 카드를 생성한다.
 *
 * Output Layout (출력 포맷):
 *   Line 1: 🏃 git-runner · Day 230 / 365
 *   Line 2:        ☀                 ☁
 *   Line 3: [🌱 ▓▓▓▓▓▓▓▓▓▓▓🏃💨░░░░░░ 🚩] 63%
 *   Line 4:
 *   Line 5: ● Today (5)   🔥 12 days   🏆 85   🌱 156/230
 *
 * Design Principles (설계 원칙):
 *   - Exactly 5 lines to perfectly fit GitHub's pinned gist container.
 *   - Pinned Gist 카드 규격(가로 ~45자, 세로 5줄)에 완벽히 맞춤.
 */

import type { Stats } from './streak.js'

/**
 * Generates the complete 5-line string to be written into the Pinned Gist.
 * Stats, 하늘 레이어, 트랙 라인으로 최종 Gist 텍스트를 생성한다.
 *
 * @param stats - Streak and active contribution statistics / 통계 데이터
 * @param skyLine - Dynamic sky layer based on time of day / 시간대별 하늘 레이어 (☀, 🌅, 🌙)
 * @param trackLine - 365-day runner progress bar track / 러너 게이지 트랙 ([🌱 ▓▓▓🏃💨░░░ 🚩] 63%)
 * @param totalDays - Total days in the current year (365 or 366) / 해당 연도 총 일수
 * @returns Formatted 5-line string with newlines / 정확히 5줄로 완성된 문자열
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

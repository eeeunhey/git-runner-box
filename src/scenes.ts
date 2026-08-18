/**
 * scenes.ts — 월/일에 따른 풍경 선택, runner 상태 결정
 *
 * Purpose: 계절별 Scene 데이터에서 오늘의 풍경을 결정론적으로 선택하고,
 *          활동 상태에 따라 runner 이모지를 결정한다.
 * Input:   월, 일, 활동 상태
 * Output:  완성된 코스 라인 문자열
 *
 * 결정론적 설계:
 *   같은 날에는 항상 같은 풍경이 나온다 (day % scenes.length).
 *   별도의 랜덤 시드나 상태 저장이 불필요하다.
 */

import scenesData from './scenes.json' with { type: 'json' }

type Season = 'spring' | 'summer' | 'autumn' | 'winter'

/** 월 → 계절 매핑 */
const SEASON_MAP: Record<number, Season> = {
  1: 'winter',
  2: 'winter',
  3: 'spring',
  4: 'spring',
  5: 'spring',
  6: 'summer',
  7: 'summer',
  8: 'summer',
  9: 'autumn',
  10: 'autumn',
  11: 'autumn',
  12: 'winter',
}

/** Runner 상태 이모지 */
const RUNNER_EMOJI = {
  running: '🏃',
  walking: '🚶',
  resting: '🧘',
} as const

/**
 * 월 번호로 계절을 반환한다.
 *
 * @param month - 1~12
 * @returns Season
 */
export function getSeason(month: number): Season {
  const season = SEASON_MAP[month]
  if (!season) {
    throw new Error(`잘못된 월: ${month} (1~12 사이여야 합니다)`)
  }
  return season
}

/**
 * 오늘의 풍경 template을 선택한다.
 * day % scenes.length로 결정론적 선택 — 같은 날에는 항상 같은 풍경.
 *
 * @param month - 1~12
 * @param day - 1~31
 * @returns {runner} placeholder가 포함된 scene template 문자열
 *
 * @example
 * selectScene(4, 15) // → "🌸━━━━{runner}━━━━━━━━🌸━━━━━━→"
 */
export function selectScene(month: number, day: number): string {
  const season = getSeason(month)
  const scenes = scenesData[season]
  const index = day % scenes.length
  return scenes[index]!
}

/**
 * 활동 상태에 따라 runner 이모지를 반환한다.
 *
 * - 오늘 활동함 → 🏃 (Running)
 * - 오늘 아직 미활동이지만 streak 있음 → 🚶 (Walking, 아직 기회 남음)
 * - streak 없음 → 🧘 (Resting, 벌주지 않는 표현)
 *
 * @param todayActive - 오늘 contribution이 있었는지
 * @param currentStreak - 현재 연속 활동일
 * @returns runner 이모지
 */
export function getRunnerEmoji(
  todayActive: boolean,
  currentStreak: number,
): string {
  if (todayActive) return RUNNER_EMOJI.running
  if (currentStreak > 0) return RUNNER_EMOJI.walking
  return RUNNER_EMOJI.resting
}

/**
 * Scene template의 {runner} placeholder를 실제 runner 이모지로 치환한다.
 *
 * @param template - {runner}가 포함된 scene template
 * @param runner - runner 이모지 (🏃/🚶/🧘)
 * @returns 완성된 코스 라인
 *
 * @example
 * buildCourseLine("🌿━━━━━━{runner}━━━━🌳━━━━→", "🏃")
 * // → "🌿━━━━━━🏃━━━━🌳━━━━→"
 */
export function buildCourseLine(template: string, runner: string): string {
  return template.replace('{runner}', runner)
}

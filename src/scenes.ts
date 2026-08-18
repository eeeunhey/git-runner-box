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
  sprinting: '🏃💨',
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
 * - 오늘 5개 이상 커밋 → 🏃💨 (Sprinting, 폭풍 질주)
 * - 오늘 1~4개 커밋 → 🏃 (Running, 달리기)
 * - 오늘 아직 미활동이지만 streak 있음 → 🚶 (Walking, 아직 기회 남음)
 * - streak 없음 → 🧘 (Resting, 벌주지 않는 표현)
 *
 * @param todayActive - 오늘 contribution이 있었는지
 * @param currentStreak - 현재 연속 활동일
 * @param todayCount - 오늘 contribution/커밋 수 (기본값 0)
 * @returns runner 이모지
 */
export function getRunnerEmoji(
  todayActive: boolean,
  currentStreak: number,
  todayCount: number = 0,
): string {
  if (todayCount >= 5) return RUNNER_EMOJI.sprinting
  if (todayActive) return RUNNER_EMOJI.running
  if (currentStreak > 0) return RUNNER_EMOJI.walking
  return RUNNER_EMOJI.resting
}

/**
 * 시간대(0~23시)에 따른 하늘 레이어를 생성한다.
 *
 * - 낮 (06:00 ~ 17:59): ☀ 태양 + ☁ 구름
 * - 노을 (18:00 ~ 20:59): 🌅 석양 + ☁ 구름 + ✨ 별
 * - 밤 (21:00 ~ 05:59): 🌙 달 + ✨ 별 + ☁ 구름
 *
 * @param hour - 해당 Timezone 기준 시간 (0~23)
 * @returns 렌더링된 하늘 문자열
 */
export function getSkyLine(hour: number): string {
  if (hour >= 6 && hour < 18) {
    return '       ☀                 ☁'
  }
  if (hour >= 18 && hour < 21) {
    return '       🌅        ☁       ✨'
  }
  return '       🌙        ✨       ☁'
}

/**
 * 365일 연간 진행률에 따라 실시간으로 러너가 전진하는 게이지 트랙을 생성한다.
 *
 * 포맷 예시:
 * [🌱 ▓▓▓▓▓▓▓▓▓▓▓🏃💨░░░░░░ 🚩] 63%
 *
 * @param journeyDay - 1월 1일부터 오늘까지의 일차 (1~366)
 * @param totalDays - 해당 연도의 총 일수 (365 또는 366)
 * @param runner - 러너 이모지 (🏃💨, 🏃, 🚶, 🧘)
 * @returns 완성된 프로그래스 게이지 트랙 문자열
 */
export function buildProgressBarTrack(
  journeyDay: number,
  totalDays: number,
  runner: string,
): string {
  const totalSlots = 18
  const clampedDay = Math.max(1, Math.min(journeyDay, totalDays))
  const progressRatio = clampedDay / totalDays
  const percentage = Math.round(progressRatio * 100)

  // 러너의 슬롯 위치 (0 ~ totalSlots - 1)
  const runnerSlot = Math.min(
    Math.floor(progressRatio * totalSlots),
    totalSlots - 1,
  )

  const filledCount = runnerSlot
  const emptyCount = Math.max(0, totalSlots - 1 - runnerSlot)

  const filled = '▓'.repeat(filledCount)
  const empty = '░'.repeat(emptyCount)

  return `[🌱 ${filled}${runner}${empty} 🚩] ${percentage}%`
}

/**
 * 누적 활동일(activeDays = 누적 주행 거리 km)에 따라 마라토너 등급 카드 제목을 반환한다.
 *
 * - 0 ~ 20km:   👟 5K City Jogger (Nkm)
 * - 21 ~ 50km:  🏃 10K Road Racer (Nkm)
 * - 51 ~ 100km: 🏅 Half-Marathon Runner (Nkm)
 * - 101 ~ 150km:🏆 Full-Marathon Finisher (Nkm)
 * - 151 ~ 250km:🚀 Ultra-Marathoner (Nkm)
 * - 251km+:     👑 Trans-Continental Marathoner (Nkm)
 *
 * @param activeDays - 올해 총 활동일 수 (1일 = 1km 주행)
 * @returns Gist 카드 제목 (Filename)
 */
export function getMarathonTitle(activeDays: number): string {
  const km = activeDays
  if (km <= 20) return `👟 5K City Jogger (${km}km)`
  if (km <= 50) return `🏃 10K Road Racer (${km}km)`
  if (km <= 100) return `🏅 Half-Marathon Runner (${km}km)`
  if (km <= 150) return `🏆 Full-Marathon Finisher (${km}km)`
  if (km <= 250) return `🚀 Ultra-Marathoner (${km}km)`
  return `👑 Trans-Continental Marathoner (${km}km)`
}

/**
 * Scene template의 {runner} placeholder를 실제 runner 이모지로 치환한다.
 * (하위 호환성 유지)
 */
export function buildCourseLine(template: string, runner: string): string {
  return template.replace('{runner}', runner)
}

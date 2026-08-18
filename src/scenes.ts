/**
 * scenes.ts — Seasonal Scenes, Runner Progression & Track Builder / 계절 풍경, 러너 상태 및 트랙 생성
 *
 * Purpose (목적):
 *   - EN: Deterministically selects scenery by date, computes runner state by activity, renders dynamic skies by hour, builds progress bar tracks, and derives marathon title tiers.
 *   - KR: 월/일에 따른 계절 풍경 선택, 활동량에 따른 러너 상태 결정, 시간대별 하늘 렌더링, 365일 게이지 트랙 및 마라톤 승급 타이틀을 생성한다.
 */

import scenesData from './scenes.json' with { type: 'json' }

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

/** Month → Season mapping / 월별 계절 매핑 */
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

/** Runner State Emojis / 러너 활동 상태 이모지 */
export const RUNNER_EMOJI = {
  sprinting: '🏃💨', // ≥ 5 commits today / 오늘 5개 이상 커밋 (폭풍 질주)
  running: '🏃',     // 1~4 commits today / 오늘 1~4개 커밋 (일반 달리기)
  walking: '🚶',     // 0 commits today, streak > 0 / 오늘 미활동이나 스트릭 유지 (워밍업 걷기)
  resting: '🧘',     // 0 commits today, streak = 0 / 스트릭 없음 (재충전 휴식)
} as const

/**
 * Returns the season corresponding to the given month (1~12).
 * 주어진 월(1~12)에 해당하는 계절을 반환한다.
 *
 * @param month - Month number (1~12) / 월 번호
 * @returns Season ('spring' | 'summer' | 'autumn' | 'winter')
 */
export function getSeason(month: number): Season {
  const season = SEASON_MAP[month]
  if (!season) {
    throw new Error(`Invalid month: ${month} (must be 1-12) / 잘못된 월: ${month}`)
  }
  return season
}

/**
 * Deterministically selects a scene template based on month and day.
 * 오늘의 풍경 template을 선택한다 (같은 날에는 항상 같은 풍경 출력).
 *
 * @param month - Month (1~12)
 * @param day - Day of month (1~31)
 * @returns Scene template string containing `{runner}` placeholder / 풍경 템플릿 문자열
 */
export function selectScene(month: number, day: number): string {
  const season = getSeason(month)
  const scenes = scenesData[season]
  const index = day % scenes.length
  return scenes[index]!
}

/**
 * Determines the runner emoji based on today's contribution count and streak.
 * 오늘의 기여(커밋) 수와 연속 스트릭에 따라 러너 이모지를 결정한다.
 *
 * - ≥ 5 commits today  ➔ 🏃💨 (Sprinting / 폭풍 질주)
 * - 1~4 commits today  ➔ 🏃 (Running / 달리기)
 * - 0 commits + streak ➔ 🚶 (Walking / 워밍업 걷기)
 * - 0 commits + 0 streak ➔ 🧘 (Resting / 휴식)
 *
 * @param todayActive - Whether there was activity today / 오늘 활동 여부
 * @param currentStreak - Current continuous streak in days / 현재 연속 활동일
 * @param todayCount - Total contribution count today / 오늘 기여(커밋) 수
 * @returns Runner emoji string / 러너 이모지 문자열
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
 * Generates the dynamic sky layer based on the current hour of the day (0~23).
 * 시간대(0~23시)에 따른 하늘 레이어를 생성한다.
 *
 * - Day (06:00 ~ 17:59) / 낮: ☀ Sun + ☁ Cloud
 * - Sunset (18:00 ~ 20:59) / 노을: 🌅 Sunset + ☁ Cloud + ✨ Star
 * - Night (21:00 ~ 05:59) / 밤: 🌙 Moon + ✨ Star + ☁ Cloud
 *
 * @param hour - Current hour in the user's timezone (0~23) / 해당 Timezone 기준 시간
 * @returns Formatted sky string / 렌더링된 하늘 문자열
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
 * Builds the 365-day annual progress bar gauge track with the real-time runner position.
 * 365일 연간 진행률에 따라 실시간으로 러너가 전진하는 게이지 트랙을 생성한다.
 *
 * Output Example (예시):
 * `[🌱 ▓▓▓▓▓▓▓▓▓▓▓🏃💨░░░░░░ 🚩] 63%`
 *
 * @param journeyDay - Day of the year from Jan 1 (1~366) / 1월 1일부터 오늘까지의 일차
 * @param totalDays - Total days in the year (365 or 366) / 해당 연도의 총 일수
 * @param runner - Runner emoji / 러너 이모지 (🏃💨, 🏃, 🚶, 🧘)
 * @returns Formatted progress gauge track string / 완성된 게이지 트랙 문자열
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

  // EN: Runner slot index (0 ~ totalSlots - 1) / KR: 러너의 슬롯 위치
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
 * Generates the Marathon Division Card Title based on cumulative active days (1 active day = 1 km).
 * 누적 활동일(activeDays = 누적 주행 거리 km)에 따라 마라토너 등급 카드 제목을 반환한다.
 *
 * Mileage Tiers (마라톤 승급 등급):
 *   - 0 ~ 20km:   👟 5K City Jogger (Nkm)
 *   - 21 ~ 50km:  🏃 10K Road Racer (Nkm)
 *   - 51 ~ 100km: 🏅 Half-Marathon Runner (Nkm)
 *   - 101 ~ 150km:🏆 Full-Marathon Finisher (Nkm)
 *   - 151 ~ 250km:🚀 Ultra-Marathoner (Nkm)
 *   - 251km+:     👑 Trans-Continental Marathoner (Nkm)
 *
 * @param activeDays - Total active contribution days this year (1 day = 1 km) / 올해 총 활동일 수
 * @returns Gist Card Title string / Gist 카드 제목 (파일명)
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
 * Replaces `{runner}` placeholder with the active runner emoji (Backwards compatibility).
 * Scene template의 {runner} placeholder를 실제 runner 이모지로 치환한다 (하위 호환성).
 */
export function buildCourseLine(template: string, runner: string): string {
  return template.replace('{runner}', runner)
}

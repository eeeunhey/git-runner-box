/**
 * main.ts — git-runner GitHub Action Entry Point / 액션 엔트리 포인트
 *
 * Purpose (목적):
 *   - EN: Orchestrates input parsing, timezone calculation, GraphQL data fetching, statistics computation, dynamic visual rendering, and Gist synchronization.
 *   - KR: 환경 변수 및 입력을 로드하고, 통계 계산, 시간대 하늘 및 게이지 트랙 렌더링, 마라톤 타이틀 업데이트를 총괄 실행한다.
 *
 * Execution Pipeline (실행 파이프라인):
 *   1. Load inputs (GH_TOKEN, gist_id, timezone, username) / 입력 및 토큰 로드
 *   2. Compute current date/time in timezone / 지정된 Timezone 기준 날짜 및 시간 계산
 *   3. Fetch Contribution Calendar via GraphQL / 잔디 기여 데이터 조회
 *   4. Compute Streak and Active statistics / 스트릭 및 활동 통계 계산
 *   5. Build Dynamic Sky & 365-Day Progress Bar Track / 하늘 및 러너 게이지 트랙 생성
 *   6. Generate 5-line Gist text card / 최종 5줄 카드 본문 생성
 *   7. Update Gist with Marathon Division title / 마라톤 승급 타이틀과 함께 Gist 업데이트
 */

import * as core from '@actions/core'
import { fetchContributionCalendar } from './github.js'
import { calculateStats } from './streak.js'
import {
  getRunnerEmoji,
  getSkyLine,
  buildProgressBarTrack,
  getMarathonTitle,
} from './scenes.js'
import { renderGist } from './renderer.js'
import { updateGist } from './gist.js'

/**
 * Returns the current date in the specified timezone as a UTC Date object.
 * Timezone이 적용된 현재 날짜를 UTC Date 객체로 반환한다.
 */
function getTodayInTimezone(timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  const dateStr = formatter.format(new Date())
  const [year, month, day] = dateStr.split('-').map(Number)

  return new Date(Date.UTC(year!, month! - 1, day!))
}

/**
 * Returns the current hour (0~23) in the specified timezone.
 * 지정된 Timezone의 현재 시간(0~23)을 반환한다.
 */
function getCurrentHourInTimezone(timezone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  })
  return parseInt(formatter.format(new Date()), 10)
}

/**
 * Returns the total days in the given year (366 for leap years, 365 for regular years).
 * 해당 연도의 총 일 수(윤년 366, 평년 365)를 반환한다.
 */
function getTotalDaysInYear(year: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  return isLeap ? 366 : 365
}

/**
 * Main action execution function.
 * 메인 액션 실행 함수.
 */
async function run(): Promise<void> {
  try {
    // 1. EN: Load environment variables and action inputs / KR: 환경 변수 + inputs 로드
    const token = process.env.GH_TOKEN
    if (!token) {
      throw new Error(
        'GH_TOKEN environment variable is not set. Please add GH_TOKEN in Repository Settings → Secrets. / GH_TOKEN 환경 변수가 설정되지 않았습니다.',
      )
    }

    const gistId = core.getInput('gist_id', { required: true })
    const timezone = core.getInput('timezone') || 'Asia/Seoul'
    const username = core.getInput('username') || undefined

    core.info(`⏰ Timezone: ${timezone}`)
    core.info(`👤 Username: ${username || '(auto-detect from token)'}`)

    // 2. EN: Compute local date and hour in timezone / KR: Timezone 적용된 오늘 날짜 및 시간
    const today = getTodayInTimezone(timezone)
    const year = today.getUTCFullYear()
    const month = today.getUTCMonth() + 1
    const day = today.getUTCDate()
    const currentHour = getCurrentHourInTimezone(timezone)
    const totalDays = getTotalDaysInYear(year)

    core.info(`📅 Today: ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} (${currentHour}:00 ${timezone})`)

    // 3. EN: Fetch Contribution Calendar from GitHub / KR: Contribution Calendar 조회
    core.info('📊 Fetching contribution calendar...')
    const contributions = await fetchContributionCalendar(token, username, today)
    core.info(`   → ${contributions.length} days loaded`)

    // 4. EN: Compute streak and activity statistics / KR: Stats 계산
    const stats = calculateStats(contributions, today)
    core.info(`📈 Stats: streak=${stats.currentStreak}, best=${stats.longestStreak}, active=${stats.activeDays}/${stats.journeyDay}`)

    // 5. EN: Build dynamic sky and 365-day progress bar track / KR: 시간대별 하늘 + 실시간 러너 게이지 트랙 생성
    const skyLine = getSkyLine(currentHour)
    const runner = getRunnerEmoji(
      stats.todayActive,
      stats.currentStreak,
      stats.todayCount,
    )
    const trackLine = buildProgressBarTrack(stats.journeyDay, totalDays, runner)
    core.info(`🎨 Sky:   ${skyLine}`)
    core.info(`🏃 Track: ${trackLine}`)

    // 6. EN: Generate 5-line Gist card text / KR: Gist 텍스트 생성
    const content = renderGist(stats, skyLine, trackLine, totalDays)
    core.info('📝 Generated gist content:')
    for (const line of content.split('\n')) {
      core.info(`   ${line}`)
    }

    // 7. EN: Update Gist with dynamic Marathon Division title / KR: 마라톤 주행 거리 및 승급 등급에 따라 파일명/카드제목 동적 변경
    const gistFilename = getMarathonTitle(stats.activeDays)
    core.info(`🔄 Updating gist (Filename: "${gistFilename}")...`)
    await updateGist(token, gistId, content, gistFilename)

    core.info(`✅ Done! Day ${stats.journeyDay}/${totalDays}, Streak ${stats.currentStreak}`)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('Unknown error occurred. / 알 수 없는 에러가 발생했습니다.')
    }
  }
}

run()

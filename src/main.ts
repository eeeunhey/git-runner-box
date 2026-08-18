/**
 * main.ts — git-runner GitHub Action 엔트리 포인트
 *
 * Purpose: Action inputs를 읽고, 모듈들을 조합하여 Gist를 업데이트한다.
 *
 * 실행 흐름:
 *   1. 환경 변수 + Action inputs 로드
 *   2. Timezone 적용된 현재 시간 계산
 *   3. GitHub GraphQL API → Contribution Calendar 조회
 *   4. Streak/Active 통계 계산
 *   5. 오늘의 풍경 + runner 상태 결정
 *   6. Gist 텍스트 생성
 *   7. Gist 업데이트
 */

import * as core from '@actions/core'
import { fetchContributionCalendar } from './github.js'
import { calculateStats } from './streak.js'
import {
  getRunnerEmoji,
  getSkyLine,
  buildProgressBarTrack,
} from './scenes.js'
import { renderGist } from './renderer.js'
import { updateGist } from './gist.js'

/**
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
 * 해당 연도의 총 일 수(윤년 366, 평년 365)를 반환한다.
 */
function getTotalDaysInYear(year: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  return isLeap ? 366 : 365
}

async function run(): Promise<void> {
  try {
    // 1. 환경 변수 + inputs 로드
    const token = process.env.GH_TOKEN
    if (!token) {
      throw new Error(
        'GH_TOKEN 환경 변수가 설정되지 않았습니다. ' +
          'Repository Settings → Secrets → GH_TOKEN을 추가해주세요.',
      )
    }

    const gistId = core.getInput('gist_id', { required: true })
    const timezone = core.getInput('timezone') || 'Asia/Seoul'
    const username = core.getInput('username') || undefined

    core.info(`⏰ Timezone: ${timezone}`)
    core.info(`👤 Username: ${username || '(auto-detect from token)'}`)

    // 2. Timezone 적용된 오늘 날짜 및 시간
    const today = getTodayInTimezone(timezone)
    const year = today.getUTCFullYear()
    const month = today.getUTCMonth() + 1
    const day = today.getUTCDate()
    const currentHour = getCurrentHourInTimezone(timezone)
    const totalDays = getTotalDaysInYear(year)

    core.info(`📅 Today: ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} (${currentHour}:00 KST)`)

    // 3. Contribution Calendar 조회
    core.info('📊 Fetching contribution calendar...')
    const contributions = await fetchContributionCalendar(token, username)
    core.info(`   → ${contributions.length} days loaded`)

    // 4. Stats 계산
    const stats = calculateStats(contributions, today)
    core.info(`📈 Stats: streak=${stats.currentStreak}, best=${stats.longestStreak}, active=${stats.activeDays}/${stats.journeyDay}`)

    // 5. 시간대별 하늘 + 실시간 러너 게이지 트랙 생성
    const skyLine = getSkyLine(currentHour)
    const runner = getRunnerEmoji(
      stats.todayActive,
      stats.currentStreak,
      stats.todayCount,
    )
    const trackLine = buildProgressBarTrack(stats.journeyDay, totalDays, runner)
    core.info(`🎨 Sky:   ${skyLine}`)
    core.info(`🏃 Track: ${trackLine}`)

    // 6. Gist 텍스트 생성
    const content = renderGist(stats, skyLine, trackLine, totalDays)
    core.info('📝 Generated gist content:')
    for (const line of content.split('\n')) {
      core.info(`   ${line}`)
    }

    // 7. Gist 업데이트
    core.info('🔄 Updating gist...')
    await updateGist(token, gistId, content)

    core.info(`✅ Done! Day ${stats.journeyDay}/${totalDays}, Streak ${stats.currentStreak}`)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('알 수 없는 에러가 발생했습니다.')
    }
  }
}

run()

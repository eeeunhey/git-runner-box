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
import { selectScene, getRunnerEmoji, buildCourseLine } from './scenes.js'
import { renderGist } from './renderer.js'
import { updateGist } from './gist.js'

/**
 * Timezone이 적용된 현재 날짜를 UTC Date 객체로 반환한다.
 *
 * Intl.DateTimeFormat을 사용하여 지정된 timezone의 연/월/일을 추출한 뒤,
 * UTC Date 객체로 변환한다. 이렇게 하면 streak 계산 등에서 timezone의
 * 날짜 경계를 올바르게 반영할 수 있다.
 *
 * @param timezone - IANA timezone (e.g. "Asia/Seoul")
 * @returns timezone 기준 오늘 날짜를 나타내는 UTC Date
 */
function getTodayInTimezone(timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

  // en-CA locale은 YYYY-MM-DD 포맷을 반환한다
  const dateStr = formatter.format(new Date())
  const [year, month, day] = dateStr.split('-').map(Number)

  return new Date(Date.UTC(year!, month! - 1, day!))
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

    // 2. Timezone 적용된 오늘 날짜
    const today = getTodayInTimezone(timezone)
    const year = today.getUTCFullYear()
    const month = today.getUTCMonth() + 1
    const day = today.getUTCDate()
    core.info(`📅 Today: ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)

    // 3. Contribution Calendar 조회
    core.info('📊 Fetching contribution calendar...')
    const contributions = await fetchContributionCalendar(token, username)
    core.info(`   → ${contributions.length} days loaded`)

    // 4. Stats 계산
    const stats = calculateStats(contributions, today)
    core.info(`📈 Stats: streak=${stats.currentStreak}, best=${stats.longestStreak}, active=${stats.activeDays}/${stats.journeyDay}`)

    // 5. 풍경 선택 + runner 상태
    const scene = selectScene(month, day)
    const runner = getRunnerEmoji(stats.todayActive, stats.currentStreak)
    const courseLine = buildCourseLine(scene, runner)
    core.info(`🎨 Scene: ${courseLine}`)

    // 6. Gist 텍스트 생성
    const content = renderGist(stats, courseLine, year)
    core.info('📝 Generated gist content:')
    for (const line of content.split('\n')) {
      core.info(`   ${line}`)
    }

    // 7. Gist 업데이트
    core.info('🔄 Updating gist...')
    await updateGist(token, gistId, content)

    core.info(`✅ Done! Day ${stats.journeyDay}, Streak ${stats.currentStreak}`)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('알 수 없는 에러가 발생했습니다.')
    }
  }
}

run()

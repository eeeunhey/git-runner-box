/**
 * github.ts — GitHub GraphQL API를 통한 Contribution Calendar 조회
 *
 * Purpose: 올해 1월 1일부터 오늘까지의 Contribution Calendar 데이터를 가져온다.
 * Input:   GH_TOKEN, optional username
 * Output:  ContributionDay[] (날짜별 contribution count)
 *
 * GitHub GraphQL API의 contributionsCollection은 최대 1년 범위를 지원하므로,
 * 올해 전체를 한 번의 쿼리로 조회할 수 있다.
 */

/** 날짜별 contribution 데이터 */
export interface ContributionDay {
  /** ISO date string (e.g. "2026-01-15") */
  date: string
  /** 해당 날짜의 총 contribution 수 */
  count: number
}

/**
 * viewer 쿼리: 토큰 소유자 자신의 username을 가져온다.
 * username이 지정되지 않았을 때 사용한다.
 */
const VIEWER_LOGIN_QUERY = `
  query {
    viewer {
      login
    }
  }
`

/**
 * Contribution Calendar 쿼리.
 * contributionsCollection(from, to)로 올해 범위를 지정한다.
 */
const CONTRIBUTION_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

interface ViewerLoginData {
  viewer: { login: string }
}

interface ContributionCalendarData {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: Array<{
          contributionDays: Array<{
            contributionCount: number
            date: string
          }>
        }>
      }
    }
  }
}

/**
 * GitHub GraphQL API에 쿼리를 보낸다.
 *
 * @throws Error - 네트워크 오류, 인증 실패, GraphQL 에러
 */
async function graphqlRequest<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'git-runner-gist',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'GitHub API 인증 실패: GH_TOKEN이 설정되지 않았거나 만료되었습니다.',
      )
    }
    throw new Error(
      `GitHub API 요청 실패: HTTP ${response.status} ${response.statusText}`,
    )
  }

  const result = (await response.json()) as GraphQLResponse<T>

  if (result.errors && result.errors.length > 0) {
    const messages = result.errors.map((e) => e.message).join(', ')
    throw new Error(`GitHub GraphQL 에러: ${messages}`)
  }

  if (!result.data) {
    throw new Error('GitHub API에서 빈 응답을 받았습니다.')
  }

  return result.data
}

/**
 * 토큰 소유자의 GitHub username을 조회한다.
 */
async function fetchViewerLogin(token: string): Promise<string> {
  const data = await graphqlRequest<ViewerLoginData>(
    token,
    VIEWER_LOGIN_QUERY,
  )
  return data.viewer.login
}

/**
 * 올해 1월 1일부터 오늘까지의 Contribution Calendar를 조회한다.
 *
 * @param token - GitHub Personal Access Token (read:user scope 필요)
 * @param username - GitHub username. 없으면 토큰 소유자를 자동 조회.
 * @returns 날짜별 contribution 데이터 (날짜 오름차순)
 *
 * @example
 * const days = await fetchContributionCalendar('ghp_...', 'octocat')
 * // [{ date: '2026-01-01', count: 0 }, { date: '2026-01-02', count: 5 }, ...]
 */
export async function fetchContributionCalendar(
  token: string,
  username?: string,
): Promise<ContributionDay[]> {
  const resolvedUsername = username || (await fetchViewerLogin(token))

  const now = new Date()
  const yearStart = new Date(Date.UTC(now.getFullYear(), 0, 1))
  const yearEnd = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
  )

  const data = await graphqlRequest<ContributionCalendarData>(
    token,
    CONTRIBUTION_QUERY,
    {
      username: resolvedUsername,
      from: yearStart.toISOString(),
      to: yearEnd.toISOString(),
    },
  )

  const weeks =
    data.user.contributionsCollection.contributionCalendar.weeks

  const days: ContributionDay[] = []
  for (const week of weeks) {
    for (const day of week.contributionDays) {
      days.push({
        date: day.date,
        count: day.contributionCount,
      })
    }
  }

  return days
}

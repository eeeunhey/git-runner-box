/**
 * github.ts — GitHub GraphQL API Contribution Calendar Client / GitHub GraphQL API를 통한 잔디 데이터 조회
 *
 * Purpose (목적):
 *   - EN: Fetches the user's Contribution Calendar from Jan 1 of the current year to today.
 *   - KR: 올해 1월 1일부터 오늘까지의 GitHub 기여(Contribution) 캘린더 데이터를 조회한다.
 *
 * Input (입력):
 *   - `GH_TOKEN`: GitHub Personal Access Token (PAT)
 *   - `username`: (Optional) Target GitHub username / 대상 사용자명
 *
 * Output (출력):
 *   - `ContributionDay[]`: Daily contribution counts in chronological order / 날짜별 기여 횟수 배열
 */

/** Daily contribution record / 날짜별 기여 데이터 */
export interface ContributionDay {
  /** ISO date string (e.g. "2026-01-15") / ISO 날짜 문자열 */
  date: string
  /** Total contribution count on that date / 해당 날짜의 총 기여/커밋 수 */
  count: number
}

/**
 * GraphQL Query: Fetch viewer login / 로그인한 토큰 소유자의 username 조회
 */
const VIEWER_LOGIN_QUERY = `
  query {
    viewer {
      login
    }
  }
`

/**
 * GraphQL Query: Fetch contribution calendar for the year / 연간 기여 캘린더 조회
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
 * Sends an authenticated POST request to GitHub's GraphQL API.
 * GitHub GraphQL API에 인증된 쿼리 요청을 전송한다.
 *
 * @throws Error - Network failure, authentication failure, or GraphQL errors / 네트워크, 인증, GraphQL 오류
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
        'GitHub API Authentication Failed: GH_TOKEN is invalid or expired. / GitHub API 인증 실패: GH_TOKEN이 설정되지 않았거나 만료되었습니다.',
      )
    }
    throw new Error(
      `GitHub API Request Failed: HTTP ${response.status} ${response.statusText} / GitHub API 요청 실패`,
    )
  }

  const result = (await response.json()) as GraphQLResponse<T>

  if (result.errors && result.errors.length > 0) {
    const messages = result.errors.map((e) => e.message).join(', ')
    throw new Error(`GitHub GraphQL Error: ${messages} / GitHub GraphQL 에러`)
  }

  if (!result.data) {
    throw new Error('Received empty response from GitHub API. / GitHub API에서 빈 응답을 받았습니다.')
  }

  return result.data
}

/**
 * Fetches the authenticated user's login username.
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
 * Fetches the Contribution Calendar from Jan 1 of the current year to today.
 * 올해 1월 1일부터 오늘까지의 Contribution Calendar 데이터를 조회한다.
 *
 * @param token - GitHub Personal Access Token (requires `read:user` or `repo` scope) / GitHub PAT
 * @param username - Target username (auto-detected if omitted) / 대상 사용자명 (생략 시 자동 조회)
 * @returns Array of daily contribution objects / 날짜별 기여 데이터 배열
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

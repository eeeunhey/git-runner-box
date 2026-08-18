/**
 * gist.ts — GitHub REST API로 Gist 내용 업데이트
 *
 * Purpose: 생성된 텍스트를 Pinned Gist에 반영한다.
 * Input:   GH_TOKEN, GIST_ID, 텍스트 내용
 * Output:  없음 (side effect: Gist 업데이트)
 *
 * Octokit REST SDK를 사용하여 PATCH /gists/{gist_id} 호출.
 * ncc로 번들링되므로 추가 런타임 설치 불필요.
 */

import { Octokit } from '@octokit/rest'

/**
 * GitHub Gist의 내용을 업데이트한다.
 *
 * @param token - GitHub Personal Access Token (gist scope 필요)
 * @param gistId - 업데이트할 Gist의 ID
 * @param content - Gist에 쓸 텍스트 내용
 * @param filename - Gist에 표시될 파일명 (카드 제목)
 *
 * @throws Error - Gist ID 잘못됨 (404), 토큰 권한 부족 (401/403)
 */
export async function updateGist(
  token: string,
  gistId: string,
  content: string,
  filename: string = '🏃 git-runner',
): Promise<void> {
  const octokit = new Octokit({ auth: token })

  try {
    // 기존 파일명을 조회하여 rename 처리 (새 파일이 누적 생성되는 것 방지)
    const { data: gist } = await octokit.gists.get({ gist_id: gistId })
    const oldFilename = Object.keys(gist.files || {})[0] || filename

    await octokit.gists.update({
      gist_id: gistId,
      files: {
        [oldFilename]: {
          filename,
          content,
        },
      },
    })
  } catch (error: unknown) {
    if (error instanceof Error && 'status' in error) {
      const status = (error as { status: number }).status
      if (status === 404) {
        throw new Error(
          `Gist를 찾을 수 없습니다 (ID: ${gistId}). GIST_ID를 확인해주세요.`,
        )
      }
      if (status === 401 || status === 403) {
        throw new Error(
          'Gist 업데이트 권한이 없습니다. GH_TOKEN에 gist scope가 필요합니다.',
        )
      }
    }
    throw error
  }
}

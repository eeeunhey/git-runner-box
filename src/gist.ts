/**
 * gist.ts — GitHub REST API Gist Updater / GitHub REST API로 Gist 내용 업데이트
 *
 * Purpose (목적):
 *   - EN: Updates the Pinned Gist content and renames the file title via Octokit.
 *   - KR: 생성된 텍스트와 마라톤 타이틀을 Pinned Gist에 반영한다.
 *
 * Execution Details (실행 세부사항):
 *   - Calls `PATCH /gists/{gist_id}` using `@octokit/rest`.
 *   - Handles in-place filename renaming to prevent duplicate file accumulation.
 *   - Octokit REST SDK를 사용하여 PATCH /gists/{gist_id} 호출 및 파일명 동적 리네임.
 */

import { Octokit } from '@octokit/rest'

/**
 * Updates the content and title (filename) of a GitHub Gist.
 * GitHub Gist의 내용 및 카드 제목(파일명)을 업데이트한다.
 *
 * @param token - GitHub Personal Access Token (requires `gist` scope) / GitHub PAT (gist 권한 필요)
 * @param gistId - Target Gist ID / 업데이트할 Gist의 고유 ID
 * @param content - Text content to write into the Gist / Gist에 기록할 본문 텍스트
 * @param filename - Card title / Gist에 표시될 파일명 (기본값: '🏃 git-runner')
 *
 * @throws Error - 404 (Invalid Gist ID) or 401/403 (Unauthorized token scope)
 */
export async function updateGist(
  token: string,
  gistId: string,
  content: string,
  filename: string = '🏃 git-runner',
): Promise<void> {
  const octokit = new Octokit({ auth: token })

  try {
    // EN: Query existing filename to perform an in-place rename (prevents duplicate file accumulation).
    // KR: 기존 파일명을 조회하여 rename 처리 (새 파일이 누적 생성되는 것 방지).
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
          `Gist not found (ID: ${gistId}). Please verify your GIST_ID. / Gist를 찾을 수 없습니다 (ID: ${gistId}). GIST_ID를 확인해주세요.`,
        )
      }
      if (status === 401 || status === 403) {
        throw new Error(
          'Unauthorized to update Gist. Please ensure GH_TOKEN has "gist" scope. / Gist 업데이트 권한이 없습니다. GH_TOKEN에 gist scope가 필요합니다.',
        )
      }
    }
    throw error
  }
}

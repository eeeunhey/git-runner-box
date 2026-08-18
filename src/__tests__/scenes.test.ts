/**
 * scenes.test.ts — 풍경 선택 + runner 상태 단위 테스트
 *
 * 검증 항목:
 * - 월별 계절 매핑
 * - 결정론적 scene 선택 (같은 날 = 같은 결과)
 * - runner 이모지 상태 분기
 * - {runner} template 치환
 */

import { describe, it, expect } from 'vitest'
import {
  getSeason,
  selectScene,
  getRunnerEmoji,
  buildCourseLine,
  getSkyLine,
  buildProgressBarTrack,
  getMarathonTitle,
} from '../scenes.js'

describe('getSeason', () => {
  it('1, 2, 12월 → winter', () => {
    expect(getSeason(1)).toBe('winter')
    expect(getSeason(2)).toBe('winter')
    expect(getSeason(12)).toBe('winter')
  })

  it('3, 4, 5월 → spring', () => {
    expect(getSeason(3)).toBe('spring')
    expect(getSeason(4)).toBe('spring')
    expect(getSeason(5)).toBe('spring')
  })

  it('6, 7, 8월 → summer', () => {
    expect(getSeason(6)).toBe('summer')
    expect(getSeason(7)).toBe('summer')
    expect(getSeason(8)).toBe('summer')
  })

  it('9, 10, 11월 → autumn', () => {
    expect(getSeason(9)).toBe('autumn')
    expect(getSeason(10)).toBe('autumn')
    expect(getSeason(11)).toBe('autumn')
  })

  it('잘못된 월 → 에러', () => {
    expect(() => getSeason(0)).toThrow()
    expect(() => getSeason(13)).toThrow()
  })
})

describe('selectScene', () => {
  it('같은 (month, day) → 항상 같은 결과', () => {
    const scene1 = selectScene(8, 17)
    const scene2 = selectScene(8, 17)
    const scene3 = selectScene(8, 17)

    expect(scene1).toBe(scene2)
    expect(scene2).toBe(scene3)
  })

  it('다른 day → 다른 결과 (대부분의 경우)', () => {
    // 5개 scene이므로 연속 5일 중 최소 일부는 달라야 함
    const scenes = new Set<string>()
    for (let day = 1; day <= 5; day++) {
      scenes.add(selectScene(4, day))
    }
    // 5개 scene이 모두 다르거나, 최소 2개 이상 다른 scene이 있어야 함
    expect(scenes.size).toBeGreaterThanOrEqual(2)
  })

  it('반환된 scene에 {runner} placeholder가 포함되어 있다', () => {
    const scene = selectScene(6, 15)
    expect(scene).toContain('{runner}')
  })

  it('모든 월(1~12)에 대해 유효한 scene 반환', () => {
    for (let month = 1; month <= 12; month++) {
      const scene = selectScene(month, 1)
      expect(scene).toBeTruthy()
      expect(scene).toContain('{runner}')
    }
  })
})

describe('getRunnerEmoji', () => {
  it('오늘 5개 이상 커밋 → 🏃💨 (Sprinting)', () => {
    expect(getRunnerEmoji(true, 5, 5)).toBe('🏃💨')
    expect(getRunnerEmoji(true, 1, 10)).toBe('🏃💨')
  })

  it('오늘 1~4개 커밋 → 🏃 (Running)', () => {
    expect(getRunnerEmoji(true, 5, 3)).toBe('🏃')
    expect(getRunnerEmoji(true, 1, 1)).toBe('🏃')
  })

  it('오늘 활동함, streak 0이어도 → 🏃', () => {
    expect(getRunnerEmoji(true, 0, 1)).toBe('🏃')
  })

  it('오늘 미활동, streak > 0 → 🚶 (Walking)', () => {
    expect(getRunnerEmoji(false, 3, 0)).toBe('🚶')
  })

  it('오늘 미활동, streak = 0 → 🧘 (Resting)', () => {
    expect(getRunnerEmoji(false, 0, 0)).toBe('🧘')
  })
})

describe('buildCourseLine', () => {
  it('{runner}를 실제 이모지로 치환한다', () => {
    const result = buildCourseLine('━━{runner}━━━━→', '🏃')
    expect(result).toBe('━━🏃━━━━→')
    expect(result).not.toContain('{runner}')
  })

  it('다양한 runner 이모지로 치환 가능', () => {
    const template = '🌿━━━━━━{runner}━━━━🌳━━━━→'
    expect(buildCourseLine(template, '🏃')).toContain('🏃')
    expect(buildCourseLine(template, '🚶')).toContain('🚶')
    expect(buildCourseLine(template, '🧘')).toContain('🧘')
  })
})

describe('getSkyLine', () => {
  it('낮 시간 (06~17시) → ☀ 태양과 구름', () => {
    expect(getSkyLine(6)).toContain('☀')
    expect(getSkyLine(12)).toContain('☀')
    expect(getSkyLine(17)).toContain('☀')
  })

  it('노을 시간 (18~20시) → 🌅 석양과 별', () => {
    expect(getSkyLine(18)).toContain('🌅')
    expect(getSkyLine(20)).toContain('🌅')
  })

  it('밤 시간 (21~05시) → 🌙 달과 별', () => {
    expect(getSkyLine(21)).toContain('🌙')
    expect(getSkyLine(0)).toContain('🌙')
    expect(getSkyLine(5)).toContain('🌙')
  })
})

describe('buildProgressBarTrack', () => {
  it('Day 1 → 러너가 맨 앞에 위치 (0%)', () => {
    const track = buildProgressBarTrack(1, 365, '🏃')
    expect(track).toContain('[🌱 🏃')
    expect(track).toContain('🚩] 0%')
  })

  it('Day 230/365 → 약 63% 지점에 러너 위치', () => {
    const track = buildProgressBarTrack(230, 365, '🏃💨')
    expect(track).toContain('63%')
    expect(track).toContain('▓')
    expect(track).toContain('░')
    expect(track).toContain('🏃💨')
  })

  it('Day 365/365 → 러너가 맨 끝에 위치 (100%)', () => {
    const track = buildProgressBarTrack(365, 365, '🏃')
    expect(track).toContain('100%')
    expect(track).toContain('🚩]')
  })
})

describe('getMarathonTitle', () => {
  it('0 ~ 20km → 5K City Jogger', () => {
    expect(getMarathonTitle(0)).toBe('👟 5K City Jogger (0km)')
    expect(getMarathonTitle(15)).toBe('👟 5K City Jogger (15km)')
    expect(getMarathonTitle(20)).toBe('👟 5K City Jogger (20km)')
  })

  it('21 ~ 50km → 10K Road Racer', () => {
    expect(getMarathonTitle(21)).toBe('🏃 10K Road Racer (21km)')
    expect(getMarathonTitle(42)).toBe('🏃 10K Road Racer (42km)')
    expect(getMarathonTitle(50)).toBe('🏃 10K Road Racer (50km)')
  })

  it('51 ~ 100km → Half-Marathon Runner', () => {
    expect(getMarathonTitle(51)).toBe('🏅 Half-Marathon Runner (51km)')
    expect(getMarathonTitle(80)).toBe('🏅 Half-Marathon Runner (80km)')
    expect(getMarathonTitle(100)).toBe('🏅 Half-Marathon Runner (100km)')
  })

  it('101 ~ 150km → Full-Marathon Finisher', () => {
    expect(getMarathonTitle(101)).toBe('🏆 Full-Marathon Finisher (101km)')
    expect(getMarathonTitle(130)).toBe('🏆 Full-Marathon Finisher (130km)')
    expect(getMarathonTitle(150)).toBe('🏆 Full-Marathon Finisher (150km)')
  })

  it('151 ~ 250km → Ultra-Marathoner', () => {
    expect(getMarathonTitle(151)).toBe('🚀 Ultra-Marathoner (151km)')
    expect(getMarathonTitle(156)).toBe('🚀 Ultra-Marathoner (156km)')
    expect(getMarathonTitle(250)).toBe('🚀 Ultra-Marathoner (250km)')
  })

  it('251km+ → Trans-Continental Marathoner', () => {
    expect(getMarathonTitle(251)).toBe('👑 Trans-Continental Marathoner (251km)')
    expect(getMarathonTitle(300)).toBe('👑 Trans-Continental Marathoner (300km)')
  })
})

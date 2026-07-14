/**
 * 주간 애널리스트 리포트 렌더러 (순수 함수 — 서버 전용 아님, 미리보기 스크립트에서도 사용)
 *
 * 에이전트가 내는 구조화 리포트(ReportStructure)를 두 형태로 렌더링한다:
 * - renderReportEmailHtml: 이메일용 HTML (테이블 레이아웃 + 인라인 스타일 — Gmail 호환)
 * - renderSummaryMd: 대시보드(/channels)용 마크다운
 */

export interface Direction {
  area: string;
  text: string;
}

export interface ActionItem {
  approval: boolean;
  text: string;
}

export interface ReportStructure {
  verdict: string;
  /** 이번 주 전체 상황 서술 (수치 없이) */
  situation: string;
  /** 이번 주 집중할 단 하나의 방향 */
  focus: string;
  directions: Direction[];
  actions: ActionItem[];
}

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const VERDICT_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  'on-track': { label: 'ON TRACK', bg: '#e6f4ec', color: '#1e7d4e' },
  watch: { label: 'WATCH', bg: '#fdf3e0', color: '#9a6b15' },
  'off-track': { label: 'OFF TRACK', bg: '#fdeaea', color: '#b03a37' },
};

/** 섹션 제목 공통 스타일 */
function sectionTitle(title: string): string {
  return `<p style="margin:0 0 10px;font-size:11px;letter-spacing:2.5px;color:#8a6a48;text-transform:uppercase;font-weight:700">${title}</p>`;
}

export function renderReportEmailHtml(params: {
  weekStart: string;
  report: ReportStructure;
  degradedSources: string[];
}): string {
  const { weekStart, report, degradedSources } = params;
  const v = VERDICT_STYLE[report.verdict] ?? { label: report.verdict, bg: '#eee', color: '#444' };

  // 데이터 신뢰 저하 배너
  const qualityBanner =
    degradedSources.length > 0
      ? `<tr><td style="padding:0 30px 18px">
          <div style="background:#fdf3e0;border:1px solid #f0dcb2;border-radius:10px;padding:12px 16px;font-size:13px;color:#9a6b15;line-height:1.6">
            ⚠️ <strong>데이터 신뢰 저하:</strong> ${esc(degradedSources.join(', '))} — 해당 채널 수치는 참고만 하세요.
          </div>
        </td></tr>`
      : '';

  // 이번 주 방향 — 영역 라벨 + 서술
  const directionsHtml = report.directions
    .map(
      (d) => `<tr>
        <td valign="top" style="padding:9px 14px 9px 0;border-top:1px solid #f0ebe2;white-space:nowrap">
          <span style="display:inline-block;background:#f4ead9;color:#8a6a48;font-size:11px;font-weight:700;padding:3px 10px;border-radius:99px">${esc(d.area)}</span>
        </td>
        <td valign="top" style="padding:10px 0 9px;border-top:1px solid #f0ebe2;font-size:14px;color:#2a3040;line-height:1.65">${esc(d.text)}</td>
      </tr>`
    )
    .join('');

  // 이번 주 착수할 작업
  const actionsHtml = report.actions
    .map((a) => {
      const chip = a.approval
        ? '<span style="display:inline-block;background:#f4ead9;color:#8a6a48;font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;white-space:nowrap">승인 필요</span>'
        : '<span style="display:inline-block;background:#eceff3;color:#55607a;font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;white-space:nowrap">자동</span>';
      return `<tr>
        <td valign="top" style="padding:8px 12px 8px 0;border-top:1px solid #f0ebe2">${chip}</td>
        <td valign="top" style="padding:9px 0 8px;border-top:1px solid #f0ebe2;font-size:14px;color:#2a3040;line-height:1.65">${esc(a.text)}</td>
      </tr>`;
    })
    .join('');

  return `
<div style="background:#f6f3ee;padding:32px 12px;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#2a3040">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e8e1d6">
    <!-- 헤더 -->
    <tr><td style="background:#0d1525;padding:26px 30px">
      <p style="margin:0;font-size:11px;letter-spacing:3px;color:#b7916e;text-transform:uppercase">Muse de Marée · Marketing Intelligence</p>
      <p style="margin:8px 0 0;font-size:21px;color:#f4efe8;font-weight:600">주간 방향 브리핑</p>
      <p style="margin:6px 0 0;font-size:13px;color:#8b93a5">${esc(weekStart)} 주 시작 · 이번 주 무엇을 준비할지</p>
    </td></tr>
    <!-- 판정 + 상황 -->
    <tr><td style="padding:24px 30px 6px">
      <span style="display:inline-block;background:${v.bg};color:${v.color};font-size:12px;font-weight:700;letter-spacing:1px;padding:6px 14px;border-radius:999px;white-space:nowrap">${esc(v.label)}</span>
      <p style="margin:14px 0 0;font-size:15px;color:#2a3040;line-height:1.75">${esc(report.situation)}</p>
    </td></tr>
    ${qualityBanner}
    <!-- 이번 주 초점 -->
    <tr><td style="padding:14px 30px 8px">
      <div style="background:#0d1525;border-radius:12px;padding:18px 20px">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2.5px;color:#b7916e;text-transform:uppercase;font-weight:700">이번 주 초점</p>
        <p style="margin:0;font-size:16px;color:#f4efe8;line-height:1.6;font-weight:600">${esc(report.focus)}</p>
      </div>
    </td></tr>
    <!-- 준비 방향 -->
    <tr><td style="padding:20px 30px 8px">
      ${sectionTitle('준비 방향')}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${directionsHtml}</table>
    </td></tr>
    <!-- 이번 주 착수 -->
    <tr><td style="padding:20px 30px 10px">
      ${sectionTitle('이번 주 착수')}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${actionsHtml}</table>
    </td></tr>
    <!-- 푸터 -->
    <tr><td style="padding:20px 30px 26px">
      <div style="padding-top:16px;border-top:1px solid #ece5da">
        <a href="https://plan.musedemaree.com/channels" style="color:#8a6a48;font-size:13px;text-decoration:none;font-weight:600">→ 대시보드에서 전체 지표 보기</a>
        <span style="font-size:12px;color:#b8bec9;margin-left:8px">plan.musedemaree.com/channels</span>
      </div>
    </td></tr>
  </table>
</div>`;
}

/** 대시보드(/channels)용 마크다운 — 같은 구조에서 생성해 이메일과 내용 동기 보장.
 *  수치 나열 대신 "이번 주 무엇을 준비할지"만. */
export function renderSummaryMd(report: ReportStructure, degradedSources: string[]): string {
  const lines: string[] = [];
  if (degradedSources.length > 0) {
    lines.push(`> ⚠️ **데이터 신뢰 저하**: ${degradedSources.join(', ')} — 해당 채널은 참고만.`, '');
  }
  lines.push(report.situation, '');
  lines.push(`## 이번 주 초점`);
  lines.push(report.focus, '');
  lines.push('## 준비 방향');
  for (const d of report.directions) {
    lines.push(`- **${d.area}** — ${d.text}`);
  }
  lines.push('', '## 이번 주 착수');
  for (const a of report.actions) {
    lines.push(`- ${a.approval ? '[승인 필요]' : '[자동]'} ${a.text}`);
  }
  return lines.join('\n');
}

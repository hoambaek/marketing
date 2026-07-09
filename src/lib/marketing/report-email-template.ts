/**
 * 주간 애널리스트 리포트 렌더러 (순수 함수 — 서버 전용 아님, 미리보기 스크립트에서도 사용)
 *
 * 에이전트가 내는 구조화 리포트(ReportStructure)를 두 형태로 렌더링한다:
 * - renderReportEmailHtml: 이메일용 HTML (테이블 레이아웃 + 인라인 스타일 — Gmail 호환)
 * - renderSummaryMd: 대시보드(/channels)용 마크다운
 */

export interface FunnelStep {
  label: string;
  sub: string;
  current: number;
  previous: number;
}

export interface ChannelDiagnosis {
  name: string;
  status: 'good' | 'watch' | 'bad' | 'no-data';
  comment: string;
}

export interface Anomaly {
  title: string;
  detail: string;
}

export interface ActionItem {
  approval: boolean;
  text: string;
}

export interface ReportStructure {
  verdict: string;
  headline: string;
  funnel: FunnelStep[];
  channels: ChannelDiagnosis[];
  anomalies: Anomaly[];
  actions: ActionItem[];
}

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const VERDICT_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  'on-track': { label: 'ON TRACK', bg: '#e6f4ec', color: '#1e7d4e' },
  watch: { label: 'WATCH', bg: '#fdf3e0', color: '#9a6b15' },
  'off-track': { label: 'OFF TRACK', bg: '#fdeaea', color: '#b03a37' },
};

const STATUS_META: Record<ChannelDiagnosis['status'], { dot: string; label: string }> = {
  good: { dot: '#2e9e63', label: '정상' },
  watch: { dot: '#d99a26', label: '주의' },
  bad: { dot: '#c24b47', label: '이상' },
  'no-data': { dot: '#9aa1ad', label: '수집 전' },
};

function deltaHtml(current: number, previous: number): string {
  if (current === 0 && previous === 0) {
    return '<span style="font-size:12px;color:#9aa1ad">데이터 수집 전</span>';
  }
  const diff = current - previous;
  if (diff === 0) return '<span style="font-size:12px;color:#9aa1ad">전주와 동일</span>';
  const color = diff > 0 ? '#1e7d4e' : '#b03a37';
  const arrow = diff > 0 ? '▲' : '▼';
  return `<span style="font-size:12px;color:${color};font-weight:600">${arrow} ${Math.abs(diff).toLocaleString()}</span> <span style="font-size:11px;color:#9aa1ad">전주 ${previous.toLocaleString()}</span>`;
}

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

  // 퍼널 2×2 카드
  const funnelCells = report.funnel.map((f, i) => {
    return `<td width="50%" valign="top" style="padding:8px">
      <div style="background:#f9f7f3;border:1px solid #ece5da;border-radius:12px;padding:16px 18px">
        <p style="margin:0;font-size:11px;color:#8a6a48;font-weight:700;letter-spacing:1px">${i + 1} · ${esc(f.label)}</p>
        <p style="margin:2px 0 10px;font-size:11px;color:#9aa1ad">${esc(f.sub)}</p>
        <p style="margin:0 0 4px;font-size:28px;color:#1c2536;font-weight:600;font-family:Georgia,'Times New Roman',serif">${Number(f.current).toLocaleString()}</p>
        ${deltaHtml(Number(f.current), Number(f.previous))}
      </div>
    </td>`;
  });
  const funnelRows: string[] = [];
  for (let i = 0; i < funnelCells.length; i += 2) {
    funnelRows.push(`<tr>${funnelCells[i]}${funnelCells[i + 1] ?? '<td width="50%"></td>'}</tr>`);
  }

  // 채널별 진단 테이블
  const channelRows = report.channels
    .map((c) => {
      const s = STATUS_META[c.status] ?? STATUS_META['no-data'];
      return `<tr>
        <td valign="top" style="padding:10px 0;border-top:1px solid #f0ebe2;white-space:nowrap">
          <span style="display:inline-block;width:8px;height:8px;border-radius:99px;background:${s.dot};margin-right:8px"></span>
          <span style="font-size:13px;font-weight:700;color:#1c2536">${esc(c.name)}</span>
          <span style="font-size:11px;color:#9aa1ad;margin-left:6px">${s.label}</span>
        </td>
        <td valign="top" style="padding:10px 0 10px 16px;border-top:1px solid #f0ebe2;font-size:13px;color:#4a5266;line-height:1.6">${esc(c.comment)}</td>
      </tr>`;
    })
    .join('');

  // 이상 신호
  const anomaliesHtml =
    report.anomalies.length === 0
      ? `<p style="margin:0;font-size:13px;color:#1e7d4e">✓ 이번 주 이상 신호 없음</p>`
      : report.anomalies
          .map(
            (a) => `<div style="background:#fdf3e0;border:1px solid #f0dcb2;border-radius:10px;padding:12px 16px;margin-bottom:8px">
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#9a6b15">${esc(a.title)}</p>
              <p style="margin:0;font-size:13px;color:#6b5a2e;line-height:1.6">${esc(a.detail)}</p>
            </div>`
          )
          .join('');

  // 다음 주 액션
  const actionsHtml = report.actions
    .map((a) => {
      const chip = a.approval
        ? '<span style="display:inline-block;background:#f4ead9;color:#8a6a48;font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;white-space:nowrap">승인 필요</span>'
        : '<span style="display:inline-block;background:#eceff3;color:#55607a;font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;white-space:nowrap">자동</span>';
      return `<tr>
        <td valign="top" style="padding:8px 12px 8px 0;border-top:1px solid #f0ebe2">${chip}</td>
        <td valign="top" style="padding:9px 0 8px;border-top:1px solid #f0ebe2;font-size:13px;color:#2a3040;line-height:1.6">${esc(a.text)}</td>
      </tr>`;
    })
    .join('');

  return `
<div style="background:#f6f3ee;padding:32px 12px;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#2a3040">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e8e1d6">
    <!-- 헤더 -->
    <tr><td style="background:#0d1525;padding:26px 30px">
      <p style="margin:0;font-size:11px;letter-spacing:3px;color:#b7916e;text-transform:uppercase">Muse de Marée · Marketing Intelligence</p>
      <p style="margin:8px 0 0;font-size:21px;color:#f4efe8;font-weight:600">주간 애널리스트 리포트</p>
      <p style="margin:6px 0 0;font-size:13px;color:#8b93a5">${esc(weekStart)} 주 시작 · 매주 월요일 08:00 자동 생성</p>
    </td></tr>
    <!-- 판정 -->
    <tr><td style="padding:24px 30px 18px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td valign="middle" style="padding-right:12px"><span style="display:inline-block;background:${v.bg};color:${v.color};font-size:12px;font-weight:700;letter-spacing:1px;padding:6px 14px;border-radius:999px;white-space:nowrap">${esc(v.label)}</span></td>
        <td valign="middle" style="font-size:14px;color:#2a3040;line-height:1.6;font-weight:600">${esc(report.headline)}</td>
      </tr></table>
    </td></tr>
    ${qualityBanner}
    <!-- 퍼널 -->
    <tr><td style="padding:6px 22px 10px">
      <div style="padding:0 8px">${sectionTitle('Funnel · 최근 7일')}</div>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${funnelRows.join('')}</table>
    </td></tr>
    <!-- 채널별 진단 -->
    <tr><td style="padding:16px 30px 8px">
      ${sectionTitle('채널별 진단')}
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">${channelRows}</table>
    </td></tr>
    <!-- 이상 신호 -->
    <tr><td style="padding:20px 30px 8px">
      ${sectionTitle('이상 신호')}
      ${anomaliesHtml}
    </td></tr>
    <!-- 다음 주 액션 -->
    <tr><td style="padding:20px 30px 10px">
      ${sectionTitle('다음 주 액션')}
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

/** 대시보드(/channels)용 마크다운 — 같은 구조에서 생성해 이메일과 내용 동기 보장 */
export function renderSummaryMd(report: ReportStructure, degradedSources: string[]): string {
  const lines: string[] = [];
  if (degradedSources.length > 0) {
    lines.push(`> ⚠️ **데이터 신뢰 저하**: ${degradedSources.join(', ')} — 해당 채널 수치는 참고만.`, '');
  }
  lines.push(`**판정** — ${report.headline}`, '');
  lines.push('## 퍼널 (최근 7일, 전주 대비)');
  for (const [i, f] of report.funnel.entries()) {
    const diff = Number(f.current) - Number(f.previous);
    const deltaStr =
      f.current === 0 && f.previous === 0
        ? '데이터 수집 전'
        : `${diff >= 0 ? '+' : ''}${diff.toLocaleString()} (전주 ${Number(f.previous).toLocaleString()})`;
    lines.push(`${i + 1}. **${f.label}** (${f.sub}): ${Number(f.current).toLocaleString()} — ${deltaStr}`);
  }
  lines.push('', '## 채널별 진단');
  const statusEmoji: Record<string, string> = { good: '✅', watch: '⚠️', bad: '⛔', 'no-data': '⏳' };
  for (const c of report.channels) {
    lines.push(`- ${statusEmoji[c.status] ?? '⏳'} **${c.name}**: ${c.comment}`);
  }
  lines.push('', '## 이상 신호');
  if (report.anomalies.length === 0) lines.push('- 없음');
  else for (const a of report.anomalies) lines.push(`- **${a.title}** — ${a.detail}`);
  lines.push('', '## 다음 주 액션');
  for (const a of report.actions) {
    lines.push(`- ${a.approval ? '[승인 필요]' : '[자동]'} ${a.text}`);
  }
  return lines.join('\n');
}

import 'server-only';

/**
 * 주간 애널리스트 리포트 이메일 발송 (Resend)
 *
 * 리포트는 대시보드(/channels)에 저장되는 것과 별개로 운영자 메일로도 발송한다.
 * - 발신: 검증된 musedemaree.com 도메인 (landing·blog와 동일 규칙)
 * - 수신: REPORT_EMAIL_TO (기본 info@musedemaree.com)
 * - 발송 실패는 크론 전체를 실패시키지 않는다 (리포트 저장이 본체, 메일은 전달 수단)
 */

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL?.trim() || 'Muse de Marée 관제 <info@musedemaree.com>';
const TO_EMAIL = process.env.REPORT_EMAIL_TO?.trim() || 'info@musedemaree.com';

/** 리포트 마크다운을 이메일용 HTML로 변환 (제한된 문법만: 제목·굵게·리스트·문단) */
function mdToHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#8a6a48">$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:#f2ede6;padding:1px 5px;border-radius:4px;font-size:13px">$1</code>');

  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const li = line.match(/^[-*]\s+(.*)$/);
    const num = line.match(/^(\d+)\.\s+(.*)$/);
    if (h) {
      closeList();
      const size = { 1: 22, 2: 18, 3: 16, 4: 15 }[h[1].length as 1 | 2 | 3 | 4];
      out.push(`<h${h[1].length} style="margin:22px 0 8px;font-size:${size}px;color:#1c2536">${inline(h[2])}</h${h[1].length}>`);
    } else if (li) {
      if (!inList) {
        out.push('<ul style="margin:6px 0 12px;padding-left:20px">');
        inList = true;
      }
      out.push(`<li style="margin:4px 0;line-height:1.6">${inline(li[1])}</li>`);
    } else if (num) {
      closeList();
      out.push(`<p style="margin:8px 0;line-height:1.7"><strong style="color:#8a6a48">${num[1]}.</strong> ${inline(num[2])}</p>`);
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      out.push(`<p style="margin:8px 0;line-height:1.7">${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

const VERDICT_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  'on-track': { label: 'ON TRACK', bg: '#e6f4ec', color: '#1e7d4e' },
  watch: { label: 'WATCH', bg: '#fdf3e0', color: '#9a6b15' },
  'off-track': { label: 'OFF TRACK', bg: '#fdeaea', color: '#b03a37' },
};

export async function sendReportEmail(params: {
  weekStart: string;
  verdict: string;
  summaryMd: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.replace(/\s+/g, '');
  if (!apiKey) return false;

  const v = VERDICT_STYLE[params.verdict] ?? { label: params.verdict, bg: '#eee', color: '#444' };
  const html = `
<div style="background:#f6f3ee;padding:32px 16px;font-family:-apple-system,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#2a3040">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e8e1d6">
    <div style="background:#0d1525;padding:26px 30px">
      <p style="margin:0;font-size:11px;letter-spacing:3px;color:#b7916e;text-transform:uppercase">Muse de Marée · Marketing Intelligence</p>
      <p style="margin:8px 0 0;font-size:21px;color:#f4efe8;font-weight:600">주간 애널리스트 리포트</p>
      <p style="margin:6px 0 0;font-size:13px;color:#8b93a5">${params.weekStart} 주 시작 · 매주 월요일 08:00 자동 생성</p>
    </div>
    <div style="padding:26px 30px">
      <span style="display:inline-block;background:${v.bg};color:${v.color};font-size:12px;font-weight:700;letter-spacing:1px;padding:5px 12px;border-radius:999px">${v.label}</span>
      <div style="margin-top:14px;font-size:14px">
        ${mdToHtml(params.summaryMd)}
      </div>
      <div style="margin-top:26px;padding-top:16px;border-top:1px solid #ece5da">
        <a href="https://plan.musedemaree.com/channels" style="color:#8a6a48;font-size:13px;text-decoration:none">→ 대시보드에서 전체 지표 보기 (plan.musedemaree.com/channels)</a>
      </div>
    </div>
  </div>
</div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: `[MDM 관제] 주간 리포트 ${params.weekStart} — ${v.label}`,
        html,
        text: params.summaryMd,
      }),
    });
    if (!res.ok) {
      console.error('[report-email] Resend 발송 실패:', res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('[report-email] Resend 발송 오류:', e);
    return false;
  }
}

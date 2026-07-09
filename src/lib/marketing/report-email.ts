import 'server-only';
import { renderReportEmailHtml, renderSummaryMd, type ReportStructure } from './report-email-template';

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

const VERDICT_LABEL: Record<string, string> = {
  'on-track': 'ON TRACK',
  watch: 'WATCH',
  'off-track': 'OFF TRACK',
};

export async function sendReportEmail(params: {
  weekStart: string;
  report: ReportStructure;
  degradedSources: string[];
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.replace(/\s+/g, '');
  if (!apiKey) return false;

  const html = renderReportEmailHtml(params);
  const label = VERDICT_LABEL[params.report.verdict] ?? params.report.verdict;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: `[MDM 관제] 주간 리포트 ${params.weekStart} — ${label}`,
        html,
        text: renderSummaryMd(params.report, params.degradedSources),
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

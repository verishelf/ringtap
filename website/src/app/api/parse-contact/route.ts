/**
 * Parse raw OCR text into structured contact fields.
 * Uses OpenAI when OPENAI_API_KEY is set; otherwise uses rule-based extraction.
 */

import { NextRequest, NextResponse } from 'next/server';

type FieldWithConfidence = { value: string; confidence: number };

type ParsedContactResponse = {
  name: FieldWithConfidence;
  job_title: FieldWithConfidence;
  company: FieldWithConfidence;
  email: FieldWithConfidence;
  phone: FieldWithConfidence;
  website: FieldWithConfidence;
  linkedin: FieldWithConfidence;
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}|(?:\+\d{1,3}[-.\s]?)?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d+)?/g;
const LINKEDIN_REGEX = /(?:linkedin\.com\/in\/[a-zA-Z0-9_-]+|linkedin\.com\/company\/[a-zA-Z0-9_-]+)/gi;
const WEBSITE_REGEX = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.?[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

function ruleBasedParse(rawText: string): ParsedContactResponse {
  const lines = rawText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  const fullText = rawText;

  const emails = fullText.match(EMAIL_REGEX) ?? [];
  const email = emails[0] ?? '';
  const emailConf = email ? 0.99 : 0;

  const phones = fullText.match(PHONE_REGEX) ?? [];
  const phoneRaw = phones.find((p) => p.replace(/\D/g, '').length >= 10) ?? phones[0] ?? '';
  const phoneConf = phoneRaw ? 0.96 : 0;

  const linkedinMatch = fullText.match(LINKEDIN_REGEX);
  const linkedin = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '';
  const linkedinConf = linkedin ? 0.95 : 0;

  const websiteMatches = fullText.match(WEBSITE_REGEX) ?? [];
  const websiteRaw = websiteMatches.find((w) => !w.includes('@') && !w.toLowerCase().includes('linkedin')) ?? '';
  const website = websiteRaw ? websiteRaw.replace(/^https?:\/\//i, '').replace(/\/$/, '') : '';
  const websiteConf = website ? 0.9 : 0;

  const companyKeywords = ['inc', 'llc', 'ltd', 'corp', 'co.', 'company', 'agency', 'studio', 'group', 'solutions'];
  let company = '';
  let companyConf = 0;
  for (const line of lines) {
    const l = line.toLowerCase();
    if (line.length > 2 && line.length < 60 && !line.includes('@') && !PHONE_REGEX.test(line) && !EMAIL_REGEX.test(line) && !l.includes('linkedin') && companyKeywords.some((k) => l.includes(k))) {
      company = line;
      companyConf = 0.88;
      break;
    }
  }
  if (!company && lines.length > 2) {
    const candidate = lines.find((l) => l.length > 5 && l.length < 50 && !l.includes('@') && !PHONE_REGEX.test(l) && !EMAIL_REGEX.test(l) && !l.toLowerCase().includes('linkedin') && /^[A-Za-z\s&.,'-]+$/.test(l));
    if (candidate) {
      company = candidate;
      companyConf = 0.75;
    }
  }

  const titleKeywords = ['ceo', 'cto', 'cfo', 'president', 'director', 'manager', 'lead', 'engineer', 'designer', 'founder', 'vp', 'head of'];
  let title = '';
  let titleConf = 0;
  for (const line of lines) {
    const l = line.toLowerCase();
    if (line.length >= 2 && line.length <= 40 && !line.includes('@') && !PHONE_REGEX.test(line) && (titleKeywords.some((k) => l.includes(k)) || (line.length < 25 && /^[A-Za-z\s&.,'-]+$/.test(line)))) {
      if (line !== company) {
        title = line;
        titleConf = 0.85;
        break;
      }
    }
  }

  const used = new Set([email, phoneRaw, company, title, website, linkedin].filter(Boolean));
  let name = '';
  let nameConf = 0;
  for (const line of lines) {
    if (used.has(line)) continue;
    if (line.length >= 2 && line.length <= 50 && !line.includes('@') && !PHONE_REGEX.test(line) && !EMAIL_REGEX.test(line) && !line.toLowerCase().includes('linkedin') && /^[A-Za-z\s.'-]+$/.test(line) && line.split(/\s+/).length >= 1 && line.split(/\s+/).length <= 4) {
      name = line;
      nameConf = 0.9;
      break;
    }
  }

  return {
    name: { value: name, confidence: nameConf },
    job_title: { value: title, confidence: titleConf },
    company: { value: company, confidence: companyConf },
    email: { value: email, confidence: emailConf },
    phone: { value: phoneRaw.trim(), confidence: phoneConf },
    website: { value: website, confidence: websiteConf },
    linkedin: { value: linkedin, confidence: linkedinConf },
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawText = (body.raw_text ?? body.rawText ?? '').toString().trim();
    if (!rawText) {
      return NextResponse.json({ error: 'raw_text required' }, { status: 400 });
    }

    const openaiKey = (process.env.OPENAI_API_KEY ?? '').replace(/^["'\s]+|["'\s]+$/g, '');
    if (openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You extract contact information from raw OCR text of a business card. Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{"name":{"value":"","confidence":0.9},"job_title":{"value":"","confidence":0.9},"company":{"value":"","confidence":0.9},"email":{"value":"","confidence":0.99},"phone":{"value":"","confidence":0.96},"website":{"value":"","confidence":0.9},"linkedin":{"value":"","confidence":0.95}}

Rules: Detect email, phone (including international), name (most prominent person name), company, job title, website, linkedin. Use confidence 0.5-1.0. Return empty string and 0 confidence for missing fields. Do not hallucinate.`,
              },
              {
                role: 'user',
                content: rawText,
              },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content) as ParsedContactResponse;
            if (parsed?.name !== undefined) return NextResponse.json(parsed);
          }
        }
      } catch {
        // Fall through to rule-based
      }
    }

    const result = ruleBasedParse(rawText);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[parse-contact]', e);
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 });
  }
}

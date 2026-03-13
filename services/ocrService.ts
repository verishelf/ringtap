/**
 * OCR + AI contact extraction for business card scanning.
 * Step 1: ML Kit OCR → raw text
 * Step 2: Image preprocessing (resize, rotate) for better recognition
 * Step 3: AI/rule-based parsing → structured contact with confidence
 * Step 4-5: Normalization and cleaning
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

// --- Types ---

export type ParsedContact = {
  name: string;
  email: string;
  phone: string;
  company: string;
  title?: string;
  website?: string;
  linkedin?: string;
};

export type ParsedContactWithConfidence = {
  name: { value: string; confidence: number };
  job_title: { value: string; confidence: number };
  company: { value: string; confidence: number };
  email: { value: string; confidence: number };
  phone: { value: string; confidence: number };
  website: { value: string; confidence: number };
  linkedin: { value: string; confidence: number };
};

const API_BASE = 'https://www.ringtap.me';

// --- Step 2: Image preprocessing ---

/**
 * Preprocess image for better OCR: resize to larger size, ensure correct orientation.
 * expo-image-manipulator supports: resize, rotate, crop, flip.
 */
async function preprocessImageForOcr(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [
      // Resize to at least 1200px width for better text recognition (ML Kit benefits from higher res)
      { resize: { width: 1200 } },
    ], { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG });
    return result.uri;
  } catch {
    return uri;
  }
}

// --- Step 1: OCR ---

async function getFilePathForOcr(uri: string): Promise<string> {
  if (uri.startsWith('content://')) {
    const filename = `ocr_${Date.now()}.jpg`;
    const dest = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest.replace(/^file:\/\//, '');
  }
  return uri.replace(/^file:\/\//, '');
}

/**
 * Extract raw text from image using ML Kit Text Recognition.
 * Returns text in reading order.
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return '';
  }
  let recognizeText: (path: string) => Promise<{ text: string }>;
  try {
    const mlkit = require('@infinitered/react-native-mlkit-text-recognition');
    recognizeText = mlkit.recognizeText;
  } catch {
    return '';
  }
  try {
    const preprocessed = await preprocessImageForOcr(imageUri);
    const path = await getFilePathForOcr(preprocessed);
    const { text } = await recognizeText(path);
    return text?.trim() ?? '';
  } catch {
    try {
      const pathAlt = imageUri.replace(/^file:\/\//, '');
      const { text } = await recognizeText(pathAlt);
      return text?.trim() ?? '';
    } catch {
      return '';
    }
  }
}

// --- Step 3: AI parsing (API or rule-based fallback) ---

/**
 * Call server-side AI parser if available; otherwise use rule-based parsing.
 */
async function parseContactWithAI(rawText: string): Promise<ParsedContactWithConfidence> {
  try {
    const res = await fetch(`${API_BASE}/api/parse-contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText }),
    });
    if (res.ok) {
      const json = (await res.json()) as ParsedContactWithConfidence;
      if (json?.name?.value !== undefined) return json;
    }
  } catch {
    // Fall through to rule-based
  }
  return parseContactRuleBased(rawText);
}

// --- Rule-based parsing (high-accuracy fallback) ---

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}|(?:\+\d{1,3}[-.\s]?)?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d+)?/g;
const LINKEDIN_REGEX = /(?:linkedin\.com\/in\/[a-zA-Z0-9_-]+|linkedin\.com\/company\/[a-zA-Z0-9_-]+)/gi;
const WEBSITE_REGEX = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.?[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

function parseContactRuleBased(rawText: string): ParsedContactWithConfidence {
  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const fullText = rawText;
  const lower = fullText.toLowerCase();

  // Email - high confidence
  const emails = fullText.match(EMAIL_REGEX) ?? [];
  const email = emails[0] ?? '';
  const emailConf = email ? 0.99 : 0;

  // Phone - robust patterns
  const phones = fullText.match(PHONE_REGEX) ?? [];
  const phoneRaw = phones.find((p) => p.replace(/\D/g, '').length >= 10) ?? phones[0] ?? '';
  const phoneConf = phoneRaw ? 0.96 : 0;

  // LinkedIn
  const linkedinMatch = fullText.match(LINKEDIN_REGEX);
  const linkedin = linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '';
  const linkedinConf = linkedin ? 0.95 : 0;

  // Website - exclude email, linkedin
  const websiteMatches = fullText.match(WEBSITE_REGEX) ?? [];
  const websiteRaw = websiteMatches.find(
    (w) => !w.includes('@') && !w.toLowerCase().includes('linkedin')
  ) ?? '';
  const website = websiteRaw ? websiteRaw.replace(/^https?:\/\//i, '').replace(/\/$/, '') : '';
  const websiteConf = website ? 0.9 : 0;

  // Company - lines with Inc, LLC, Ltd, Corp, Co., etc.
  const companyKeywords = ['inc', 'llc', 'ltd', 'corp', 'co.', 'company', 'agency', 'studio', 'group', 'solutions'];
  let company = '';
  let companyConf = 0;
  for (const line of lines) {
    const l = line.toLowerCase();
    if (
      line.length > 2 &&
      line.length < 60 &&
      !line.includes('@') &&
      !PHONE_REGEX.test(line) &&
      !EMAIL_REGEX.test(line) &&
      !l.includes('linkedin') &&
      companyKeywords.some((k) => l.includes(k))
    ) {
      company = line;
      companyConf = 0.88;
      break;
    }
  }
  if (!company && lines.length > 2) {
    const candidate = lines.find(
      (l) =>
        l.length > 5 &&
        l.length < 50 &&
        !l.includes('@') &&
        !PHONE_REGEX.test(l) &&
        !EMAIL_REGEX.test(l) &&
        !l.toLowerCase().includes('linkedin') &&
        /^[A-Za-z\s&.,'-]+$/.test(l)
    );
    if (candidate) {
      company = candidate;
      companyConf = 0.75;
    }
  }

  // Job title - typically short, before company
  const titleKeywords = ['ceo', 'cto', 'cfo', 'president', 'director', 'manager', 'lead', 'engineer', 'designer', 'founder', 'vp', 'head of'];
  let title = '';
  let titleConf = 0;
  for (const line of lines) {
    const l = line.toLowerCase();
    if (
      line.length >= 2 &&
      line.length <= 40 &&
      !line.includes('@') &&
      !PHONE_REGEX.test(line) &&
      (titleKeywords.some((k) => l.includes(k)) || (line.length < 25 && /^[A-Za-z\s&.,'-]+$/.test(line)))
    ) {
      if (line !== company) {
        title = line;
        titleConf = 0.85;
        break;
      }
    }
  }

  // Name - first non-contact line, typically 2-4 words
  const used = new Set([email, phoneRaw, company, title, website, linkedin].filter(Boolean));
  let name = '';
  let nameConf = 0;
  for (const line of lines) {
    if (used.has(line)) continue;
    if (
      line.length >= 2 &&
      line.length <= 50 &&
      !line.includes('@') &&
      !PHONE_REGEX.test(line) &&
      !EMAIL_REGEX.test(line) &&
      !line.toLowerCase().includes('linkedin') &&
      /^[A-Za-z\s.'-]+$/.test(line) &&
      line.split(/\s+/).length >= 1 &&
      line.split(/\s+/).length <= 4
    ) {
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

// --- Step 4-5: Normalization ---

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    if (digits.length === 10) return `+1${digits}`;
    if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
    return `+${digits}`;
  }
  return phone;
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function normalizeWebsite(website: string): string {
  return website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '').trim();
}

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/**
 * Convert confidence-weighted result to final ParsedContact with normalization.
 */
export function normalizeParsedContact(parsed: ParsedContactWithConfidence): ParsedContact {
  const { name, job_title, company, email, phone, website, linkedin } = parsed;
  const minConf = 0.5;
  return {
    name: name.confidence >= minConf ? name.value.trim() : '',
    title: job_title.confidence >= minConf ? job_title.value.trim() : undefined,
    company: company.confidence >= minConf ? company.value.trim() : '',
    email: email.confidence >= minConf ? normalizeEmail(email.value) : '',
    phone: phone.confidence >= minConf ? normalizePhone(phone.value) : '',
    website: website.confidence >= minConf ? normalizeWebsite(website.value) : undefined,
    linkedin: linkedin.confidence >= minConf ? linkedin.value.trim() : undefined,
  };
}

/**
 * Full pipeline: preprocess → OCR → parse → normalize.
 */
export async function extractAndParseContact(imageUri: string): Promise<ParsedContact> {
  const rawText = await extractTextFromImage(imageUri);
  const parsed = await parseContactWithAI(rawText);
  return normalizeParsedContact(parsed);
}

/**
 * Legacy: parse raw text only (for manual entry or when OCR returns empty).
 */
export function parseBusinessCardText(rawText: string): ParsedContact {
  const parsed = parseContactRuleBased(rawText);
  return normalizeParsedContact(parsed);
}

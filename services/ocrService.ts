/**
 * OCR service for business card scanning.
 * Uses ML Kit Text Recognition to extract text, then parses into contact fields.
 * ML Kit requires a dev build; in Expo Go, OCR returns empty (manual entry still works).
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as FileSystem from 'expo-file-system';

export type ParsedContact = {
  name: string;
  email: string;
  phone: string;
  company: string;
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?[\d\s\-().]{10,})/;
const PHONE_CLEAN = /[\s\-().]/g;

/**
 * Parse raw OCR text into structured contact fields.
 */
export function parseBusinessCardText(rawText: string): ParsedContact {
  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  let name = '';
  let email = '';
  let phone = '';
  let company = '';

  const fullText = rawText;

  const emailMatch = fullText.match(EMAIL_REGEX);
  if (emailMatch) email = emailMatch[0];

  const phoneMatch = fullText.match(PHONE_REGEX);
  if (phoneMatch) {
    phone = phoneMatch[1].replace(PHONE_CLEAN, '').replace(/^\+?1?/, '').trim();
    if (phone.length >= 10) phone = phoneMatch[1].trim();
    else phone = '';
  }

  const companyKeywords = ['inc', 'llc', 'ltd', 'corp', 'co.', 'company', 'agency', 'studio'];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (
      line.length > 2 &&
      line.length < 60 &&
      !line.includes('@') &&
      !PHONE_REGEX.test(line) &&
      (companyKeywords.some((k) => lower.includes(k)) || line.length > 10)
    ) {
      company = line;
      break;
    }
  }

  const nonContactLines = lines.filter(
    (l) => !EMAIL_REGEX.test(l) && !PHONE_REGEX.test(l) && l !== company
  );
  if (nonContactLines.length > 0) {
    const firstLine = nonContactLines[0];
    if (firstLine.length >= 2 && firstLine.length <= 50 && !companyKeywords.some((k) => firstLine.toLowerCase().includes(k))) {
      name = firstLine;
    }
  }

  return { name, email, phone, company };
}

/**
 * Get a file path suitable for ML Kit. Handles content:// (Android) and file:// URIs.
 */
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
 * Extract text from image using ML Kit Text Recognition.
 * imageUri: file or content URI from camera/ImagePicker
 * Returns empty string in Expo Go (ML Kit requires a dev build).
 */
export async function extractTextFromImage(imageUri: string): Promise<string> {
  // ML Kit native module is not available in Expo Go
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
    const path = await getFilePathForOcr(imageUri);
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

import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

export type WriteResult = { success: true } | { success: false; error: string };

/**
 * Write a URL to an NFC tag (ring/card) as an NDEF URI record.
 * Caller must have profile URL (e.g. https://www.ringtap.me/username).
 * On iOS this shows the system "Hold your iPhone near the tag" sheet.
 */
export async function writeProfileUrlToNfcTag(url: string): Promise<WriteResult> {
  const trimmed = url.trim();
  if (!trimmed || !trimmed.startsWith('http')) {
    return { success: false, error: 'Invalid URL' };
  }

  try {
    const isSupported = await NfcManager.isSupported();
    if (!isSupported) {
      return { success: false, error: 'NFC is not supported on this device' };
    }

    await NfcManager.start();

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('cancel') || msg.includes('Cancel') || msg.includes('session')) {
        return { success: false, error: 'Cancelled' };
      }
      return { success: false, error: msg || 'Could not connect to tag' };
    }

    try {
      const record = Ndef.uriRecord(trimmed);
      const bytes = Ndef.encodeMessage([record]);
      if (!bytes || bytes.length === 0) {
        return { success: false, error: 'Failed to encode URL' };
      }
      await NfcManager.writeNdefMessage(bytes);
      return { success: true };
    } finally {
      await NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg || 'Write failed' };
  }
}

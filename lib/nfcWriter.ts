import Constants from 'expo-constants';

export type WriteResult = { success: true } | { success: false; error: string };

const EXPO_GO_MESSAGE =
  'NFC writing is not available in Expo Go. Use a development build (e.g. EAS Build) to write to NFC tags.';

/**
 * Write a URL to an NFC tag (ring/card) as an NDEF URI record.
 * Caller must have profile URL (e.g. https://www.ringtap.me/username).
 * On iOS this shows the system "Hold your iPhone near the tag" sheet.
 * In Expo Go this returns a friendly error; use a dev build for real NFC.
 */
export async function writeProfileUrlToNfcTag(url: string): Promise<WriteResult> {
  const trimmed = url.trim();
  if (!trimmed || !trimmed.startsWith('http')) {
    return { success: false, error: 'Invalid URL' };
  }

  // Avoid loading react-native-nfc-manager in Expo Go (no native module)
  if (Constants.appOwnership === 'expo') {
    return { success: false, error: EXPO_GO_MESSAGE };
  }

  let NfcManager: typeof import('react-native-nfc-manager').default;
  let NfcTech: typeof import('react-native-nfc-manager').NfcTech;
  let Ndef: typeof import('react-native-nfc-manager').Ndef;

  try {
    const R = require('react-native-nfc-manager');
    NfcManager = R.default;
    NfcTech = R.NfcTech;
    Ndef = R.Ndef;
  } catch {
    return { success: false, error: EXPO_GO_MESSAGE };
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
    if (msg.includes('native module') || msg.includes('does not exist')) {
      return { success: false, error: EXPO_GO_MESSAGE };
    }
    return { success: false, error: msg || 'Write failed' };
  }
}

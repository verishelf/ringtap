/**
 * Smart Business Card Scanner
 * Live camera scan, OCR + AI extraction, editable parsed results, save to contacts with card image.
 */

import { Layout } from '@/constants/theme';
import {
  barcodeGuideOverlapRatio,
  cropImageUriToGuideFrame,
  guideFrameRectInView,
  SCAN_FRAME_HEIGHT_PX as FRAME_HEIGHT,
  SCAN_FRAME_HORIZONTAL_PX as FRAME_HORIZONTAL,
  SCAN_FRAME_TOP_PCT as FRAME_TOP_PCT,
} from '@/lib/scanFrameCrop';
import { useThemeColors } from '@/hooks/useThemeColors';
import { saveScannedContact, sendInviteToRingTap } from '@/services/contactService';
import { extractAndParseContact, previewCardTextDetected, type ParsedContact } from '@/services/ocrService';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type CardScannerProps = {
  userId: string;
  onSaved?: () => void;
  focused?: boolean;
};

const CARD_GUIDE_GREEN = '#22C55E';
const SCAN_LINE_ACTIVE = '#EF4444';
const BARCODE_OVERLAP_THRESHOLD = 0.35;
const OCR_POLL_MS = 1100;
const OCR_STREAK_TO_LOCK = 2;

const BARCODE_TYPES = [
  'qr',
  'code128',
  'code39',
  'pdf417',
  'datamatrix',
  'aztec',
  'ean13',
  'ean8',
  'code93',
  'itf14',
  'codabar',
  'upc_a',
  'upc_e',
] as const;

export function CardScanner({ userId, onSaved, focused = true }: CardScannerProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const frameTop = screenHeight * FRAME_TOP_PCT;
  const frameBottom = frameTop + FRAME_HEIGHT;
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [, setParsed] = useState<ParsedContact | null>(null);
  const [editing, setEditing] = useState<ParsedContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [barcodeInGuide, setBarcodeInGuide] = useState(false);
  const [ocrInGuide, setOcrInGuide] = useState(false);
  const cardInFrame = barcodeInGuide || ocrInGuide;
  const captureBusyRef = useRef(false);
  const pollInFlightRef = useRef(false);
  const ocrStreakRef = useRef(0);
  const prevCardLockedRef = useRef(false);

  useEffect(() => {
    if (!focused) setCameraReady(false);
  }, [focused]);

  useEffect(() => {
    if (!focused || capturedUri) {
      setBarcodeInGuide(false);
      setOcrInGuide(false);
      ocrStreakRef.current = 0;
    }
  }, [focused, capturedUri]);

  useEffect(() => {
    if (cardInFrame && !prevCardLockedRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    prevCardLockedRef.current = cardInFrame;
  }, [cardInFrame]);

  useEffect(() => {
    if (!focused || capturedUri) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [focused, capturedUri, scanLineAnim]);

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (capturedUri || !focused) return;
      const w = result.bounds?.size?.width ?? 0;
      const h = result.bounds?.size?.height ?? 0;
      if (w <= 0 || h <= 0) {
        setBarcodeInGuide(false);
        return;
      }
      const guide = guideFrameRectInView(screenWidth, screenHeight);
      const ratio = barcodeGuideOverlapRatio(
        {
          origin: result.bounds.origin,
          size: result.bounds.size,
        },
        guide
      );
      setBarcodeInGuide(ratio >= BARCODE_OVERLAP_THRESHOLD);
    },
    [capturedUri, focused, screenWidth, screenHeight]
  );

  useEffect(() => {
    if (!focused || capturedUri || !cameraReady || !permission?.granted) return;

    const tick = async () => {
      if (captureBusyRef.current || pollInFlightRef.current || !cameraRef.current) return;
      pollInFlightRef.current = true;
      const { width: vw, height: vh } = Dimensions.get('window');
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.18,
          skipProcessing: true,
          shutterSound: false,
        });
        const uri = photo?.uri;
        const pw = photo?.width ?? 0;
        const ph = photo?.height ?? 0;
        if (!uri || pw <= 0 || ph <= 0) return;

        let croppedUri = uri;
        try {
          croppedUri = await cropImageUriToGuideFrame(uri, pw, ph, vw, vh);
        } catch {
          croppedUri = uri;
        }

        const detected = await previewCardTextDetected(croppedUri);
        if (detected) {
          ocrStreakRef.current += 1;
          if (ocrStreakRef.current >= OCR_STREAK_TO_LOCK) setOcrInGuide(true);
        } else {
          ocrStreakRef.current = 0;
          setOcrInGuide(false);
        }

        void FileSystem.deleteAsync(croppedUri, { idempotent: true }).catch(() => {});
        if (croppedUri !== uri) {
          void FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
        }
      } catch {
        // Camera busy or poll skipped
      } finally {
        pollInFlightRef.current = false;
      }
    };

    const id = setInterval(tick, OCR_POLL_MS);
    return () => clearInterval(id);
  }, [focused, capturedUri, cameraReady, permission?.granted]);

  const processImage = useCallback(async (uri: string) => {
    setCapturedUri(uri);
    setParsed(null);
    setEditing(null);
    setLoading(true);
    try {
      const p = await extractAndParseContact(uri);
      setParsed(p);
      setEditing({ ...p });
    } catch {
      setParsed({ name: '', email: '', phone: '', company: '' });
      setEditing({ name: '', email: '', phone: '', company: '' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCapture = useCallback(async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Camera access', 'Camera permission is required to scan cards.');
        return;
      }
    }
    captureBusyRef.current = true;
    const { width: vw, height: vh } = Dimensions.get('window');

    if (!cameraRef.current) {
      captureBusyRef.current = false;
      Alert.alert('Camera', 'Camera is not available. Try leaving Scan and opening it again.');
      return;
    }
    if (!cameraReady) {
      captureBusyRef.current = false;
      Alert.alert('Camera starting', 'Wait a moment for the preview to load, then tap again.');
      return;
    }

    let uri: string | null = null;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: true,
      });
      let nextUri = photo?.uri ?? null;
      const pw = photo?.width ?? 0;
      const ph = photo?.height ?? 0;
      if (nextUri && pw > 0 && ph > 0) {
        try {
          nextUri = await cropImageUriToGuideFrame(nextUri, pw, ph, vw, vh);
          void FileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(() => {});
        } catch {
          // keep full frame if crop fails
        }
      }
      uri = nextUri;
    } catch {
      uri = null;
    }

    if (!uri) {
      captureBusyRef.current = false;
      Alert.alert('Could not capture', 'Try again in a moment. Stay on this screen — the in-app camera must finish taking the photo.');
      return;
    }
    try {
      await processImage(uri);
    } finally {
      captureBusyRef.current = false;
    }
  }, [permission?.granted, requestPermission, cameraReady, processImage]);

  const handleSave = useCallback(async () => {
    if (!editing || !userId) return;
    setSaving(true);
    try {
      const result = await saveScannedContact(userId, editing, capturedUri ?? undefined);
      if (result.success) {
        setSaved(true);
        onSaved?.();
      } else {
        Alert.alert('Save failed', result.error ?? 'Try again.');
      }
    } catch {
      Alert.alert('Error', 'Could not save contact.');
    } finally {
      setSaving(false);
    }
  }, [editing, userId, onSaved, capturedUri]);

  const handleInvite = useCallback(async () => {
    const email = editing?.email?.trim();
    if (!email) {
      Alert.alert('No email', 'Add an email to send an invite.');
      return;
    }
    setInviting(true);
    try {
      const result = await sendInviteToRingTap(email);
      if (result.success) {
        Alert.alert('Invite sent', `We sent a RingTap invite to ${email}`);
      } else {
        Alert.alert('Invite failed', result.error ?? 'Try again.');
      }
    } catch {
      Alert.alert('Error', 'Could not send invite.');
    } finally {
      setInviting(false);
    }
  }, [editing?.email]);

  const handleReset = useCallback(() => {
    setCapturedUri(null);
    setParsed(null);
    setEditing(null);
    setSaved(false);
  }, []);

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>Requesting camera access…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.statusText, { color: colors.text }]}>Camera access needed</Text>
        <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
          Allow camera to scan business cards
        </Text>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: colors.accent }]}
          onPress={requestPermission}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onAccent }]}>Allow camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {!capturedUri ? (
        <View style={styles.cameraWrap}>
          {focused ? (
            <>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                onCameraReady={() => setCameraReady(true)}
                barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
                onBarcodeScanned={onBarcodeScanned}
              />
              {/* Blur overlays around the frame */}
              <View style={[StyleSheet.absoluteFill, { height: screenHeight }]} pointerEvents="none">
                {Platform.OS === 'ios' ? (
                  <>
                    <BlurView intensity={60} tint="dark" style={[styles.blurPanel, { top: 0, left: 0, right: 0, height: frameTop }]} />
                    <BlurView intensity={60} tint="dark" style={[styles.blurPanel, { top: frameBottom, left: 0, right: 0, height: Math.max(screenHeight - frameBottom, 0) }]} />
                    <BlurView intensity={60} tint="dark" style={[styles.blurPanel, { top: frameTop, left: 0, width: FRAME_HORIZONTAL, height: FRAME_HEIGHT }]} />
                    <BlurView intensity={60} tint="dark" style={[styles.blurPanel, { top: frameTop, right: 0, width: FRAME_HORIZONTAL, height: FRAME_HEIGHT }]} />
                  </>
                ) : (
                  <>
                    <View style={[styles.blurPanel, styles.blurPanelDark, { top: 0, left: 0, right: 0, height: frameTop }]} />
                    <View style={[styles.blurPanel, styles.blurPanelDark, { top: frameBottom, left: 0, right: 0, height: Math.max(screenHeight - frameBottom, 0) }]} />
                    <View style={[styles.blurPanel, styles.blurPanelDark, { top: frameTop, left: 0, width: FRAME_HORIZONTAL, height: FRAME_HEIGHT }]} />
                    <View style={[styles.blurPanel, styles.blurPanelDark, { top: frameTop, right: 0, width: FRAME_HORIZONTAL, height: FRAME_HEIGHT }]} />
                  </>
                )}
              </View>
              <View
                style={[
                  styles.overlay,
                  { borderColor: cardInFrame ? CARD_GUIDE_GREEN : colors.accent },
                ]}
              >
                <Animated.View
                  style={[
                    styles.scanLine,
                    cardInFrame ? styles.scanLineLocked : styles.scanLineSearch,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, FRAME_HEIGHT - 4],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Text style={[styles.overlayHint, { color: colors.textSecondary }]}>
                  Position card in frame, then tap to scan
                </Text>
              </View>
              <View
                style={[
                  styles.aiBadge,
                  {
                    top: frameBottom + 16,
                    left: FRAME_HORIZONTAL,
                    right: FRAME_HORIZONTAL,
                  },
                ]}
                pointerEvents="none"
              >
                <Text style={[styles.aiBadgeText, { color: colors.textSecondary }]}>
                  Integrated with AI
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.captureButton,
                  {
                    bottom: insets.bottom + Layout.tabBarHeight + 20,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
                onPress={handleCapture}
                disabled={false}
              >
                <View style={[styles.captureButtonGlass, { borderColor: 'rgba(255,255,255,0.35)' }]}>
                  {Platform.OS === 'ios' ? (
                    <BlurView intensity={70} tint="dark" style={styles.captureButtonBlur}>
                      <View style={[styles.captureButtonAccent, { backgroundColor: colors.accent }]}>
                        <Ionicons name="camera" size={38} color={colors.onAccent} />
                      </View>
                    </BlurView>
                  ) : (
                    <View style={[styles.captureButtonBlur, { backgroundColor: 'rgba(30,30,35,0.85)' }]}>
                      <View style={[styles.captureButtonAccent, { backgroundColor: colors.accent }]}>
                        <Ionicons name="camera" size={38} color={colors.onAccent} />
                      </View>
                    </View>
                  )}
                </View>
              </Pressable>
            </>
          ) : (
            <View style={[styles.cameraPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.cameraPlaceholderText, { color: colors.textSecondary }]}>
                Return to Scan to use camera
              </Text>
            </View>
          )}
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.scroll} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <ScrollView
            style={styles.scrollInner}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: insets.top + Layout.screenPadding,
                paddingBottom: insets.bottom + Layout.tabBarHeight + Layout.sectionGap,
                flexGrow: loading ? 1 : undefined,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <View style={styles.loadingWrap}>
                <Image
                  source={require('@/assets/images/loading.gif')}
                  style={{ width: 64, height: 64 }}
                />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Extracting text…</Text>
              </View>
            ) : editing ? (
              <>
                <Text style={[styles.parsedHeader, { color: colors.text }]}>New contact</Text>
                {capturedUri ? (
                  <View style={[styles.capturedPhotoWrap, { borderColor: colors.borderLight }]}>
                    <Image source={{ uri: capturedUri }} style={styles.capturedPhoto} contentFit="contain" />
                  </View>
                ) : null}
                <View style={[styles.cardPreview, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Parsed contact</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                    placeholder="Name"
                    placeholderTextColor={colors.textSecondary}
                    value={editing.name}
                    onChangeText={(t) => setEditing((p) => (p ? { ...p, name: t } : null))}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                    placeholder="Title"
                    placeholderTextColor={colors.textSecondary}
                    value={editing.title ?? ''}
                    onChangeText={(t) => setEditing((p) => (p ? { ...p, title: t } : null))}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                    placeholder="Company"
                    placeholderTextColor={colors.textSecondary}
                    value={editing.company}
                    onChangeText={(t) => setEditing((p) => (p ? { ...p, company: t } : null))}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                    placeholder="Email"
                    placeholderTextColor={colors.textSecondary}
                    value={editing.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onChangeText={(t) => setEditing((p) => (p ? { ...p, email: t } : null))}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                    placeholder="Phone"
                    placeholderTextColor={colors.textSecondary}
                    value={editing.phone}
                    keyboardType="phone-pad"
                    onChangeText={(t) => setEditing((p) => (p ? { ...p, phone: t } : null))}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                    placeholder="Website"
                    placeholderTextColor={colors.textSecondary}
                    value={editing.website ?? ''}
                    keyboardType="url"
                    autoCapitalize="none"
                    onChangeText={(t) => setEditing((p) => (p ? { ...p, website: t } : null))}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                    placeholder="LinkedIn"
                    placeholderTextColor={colors.textSecondary}
                    value={editing.linkedin ?? ''}
                    keyboardType="url"
                    autoCapitalize="none"
                    onChangeText={(t) => setEditing((p) => (p ? { ...p, linkedin: t } : null))}
                  />
                </View>
                {!saved ? (
                  <Pressable
                    style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Image source={require('@/assets/images/loading.gif')} style={{ width: 24, height: 24 }} />
                    ) : (
                      <Text style={[styles.primaryButtonText, { color: colors.onAccent }]}>Save contact</Text>
                    )}
                  </Pressable>
                ) : (
                  <>
                    <View style={[styles.savedBadge, { backgroundColor: colors.accent + '33' }]}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                      <Text style={[styles.savedText, { color: colors.accent }]}>Contact saved</Text>
                    </View>
                    {editing.email?.trim() && (
                      <Pressable
                        style={[styles.secondaryButton, { borderColor: colors.borderLight }]}
                        onPress={handleInvite}
                        disabled={inviting}
                      >
                        {inviting ? (
                          <Image source={require('@/assets/images/loading.gif')} style={{ width: 24, height: 24 }} />
                        ) : (
                          <>
                            <Ionicons name="mail-outline" size={20} color={colors.accent} />
                            <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                              Invite to RingTap
                            </Text>
                          </>
                        )}
                      </Pressable>
                    )}
                  </>
                )}
                <Pressable style={styles.resetButton} onPress={handleReset}>
                  <Text style={[styles.resetText, { color: colors.textSecondary }]}>Scan another</Text>
                </Pressable>
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Layout.screenPadding },
  statusText: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  statusSubtext: { fontSize: 14, marginTop: 4 },
  cameraWrap: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: { fontSize: 15, marginTop: 12 },
  blurPanel: {
    position: 'absolute',
  },
  blurPanelDark: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlay: {
    position: 'absolute',
    left: FRAME_HORIZONTAL,
    right: FRAME_HORIZONTAL,
    top: `${FRAME_TOP_PCT * 100}%`,
    height: FRAME_HEIGHT,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  scanLineSearch: {
    backgroundColor: SCAN_LINE_ACTIVE,
    shadowColor: SCAN_LINE_ACTIVE,
  },
  scanLineLocked: {
    backgroundColor: CARD_GUIDE_GREEN,
    shadowColor: CARD_GUIDE_GREEN,
  },
  overlayHint: { fontSize: 14 },
  aiBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadgeText: { fontSize: 13, fontWeight: '500', opacity: 0.9 },
  captureButton: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  captureButtonGlass: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonBlur: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonAccent: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Layout.screenPadding },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  loadingText: { marginTop: 12, fontSize: 15 },
  parsedHeader: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  capturedPhotoWrap: {
    width: '100%',
    maxHeight: 200,
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  capturedPhoto: {
    width: '100%',
    height: 200,
  },
  cardPreview: {
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    padding: Layout.cardPadding,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: Layout.radiusMd,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    marginBottom: 12,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: Layout.radiusMd,
    marginBottom: 12,
  },
  savedText: { fontSize: 15, fontWeight: '600' },
  resetButton: { alignSelf: 'center', paddingVertical: 12 },
  resetText: { fontSize: 14 },
});

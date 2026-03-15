/**
 * Smart Business Card Scanner
 * Live camera scan, OCR + AI extraction, editable parsed results, save to contacts with card image.
 */

import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { saveScannedContact, sendInviteToRingTap } from '@/services/contactService';
import { extractAndParseContact, type ParsedContact } from '@/services/ocrService';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
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

const FRAME_TOP_PCT = 0.25;
const FRAME_HEIGHT = 220;
const FRAME_HORIZONTAL = 24;

export function CardScanner({ userId, onSaved, focused = true }: CardScannerProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const frameTop = screenHeight * FRAME_TOP_PCT;
  const frameBottom = frameTop + FRAME_HEIGHT;
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedContact | null>(null);
  const [editing, setEditing] = useState<ParsedContact | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!focused) setCameraReady(false);
  }, [focused]);

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
    let uri: string | null = null;
    // Use in-app camera first (no system camera popup)
    if (cameraRef.current && cameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          skipProcessing: true,
        });
        uri = photo?.uri ?? null;
      } catch {
        uri = null;
      }
    }
    // Fallback to system camera only if in-app capture fails
    if (!uri) {
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 2],
          quality: 0.9,
        });
        if (result.canceled) return;
        uri = result.assets[0]?.uri ?? null;
      } catch {
        uri = null;
      }
    }
    if (!uri) {
      Alert.alert('Error', 'Could not capture photo.');
      return;
    }
    await processImage(uri);
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
          <Text style={[styles.primaryButtonText, { color: '#0A0A0B' }]}>Allow camera</Text>
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
              <View style={[styles.overlay, { borderColor: colors.accent }]}>
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 218],
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
                        <Ionicons name="camera" size={38} color="#0A0A0B" />
                      </View>
                    </BlurView>
                  ) : (
                    <View style={[styles.captureButtonBlur, { backgroundColor: 'rgba(30,30,35,0.85)' }]}>
                      <View style={[styles.captureButtonAccent, { backgroundColor: colors.accent }]}>
                        <Ionicons name="camera" size={38} color="#0A0A0B" />
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
                      <Text style={[styles.primaryButtonText, { color: '#0A0A0B' }]}>Save contact</Text>
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
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
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

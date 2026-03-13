/**
 * Smart Business Card Scanner
 * Live camera scan, OCR extraction, editable parsed results, save to contacts.
 */

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { parseBusinessCardText, extractTextFromImage, type ParsedContact } from '@/services/ocrService';
import { saveScannedContact, sendInviteToRingTap } from '@/services/contactService';

export type CardScannerProps = {
  userId: string;
  onSaved?: () => void;
  focused?: boolean;
};

export function CardScanner({ userId, onSaved, focused = true }: CardScannerProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
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

  useEffect(() => {
    if (!focused) setCameraReady(false);
  }, [focused]);

  const processImage = useCallback(
    async (uri: string) => {
      setCapturedUri(uri);
      setParsed(null);
      setEditing(null);
      setLoading(true);
      try {
        const rawText = await extractTextFromImage(uri);
        const p = parseBusinessCardText(rawText);
        setParsed(p);
        setEditing({ ...p });
      } catch {
        setParsed({ name: '', email: '', phone: '', company: '' });
        setEditing({ name: '', email: '', phone: '', company: '' });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleCapture = useCallback(async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Camera access', 'Camera permission is required to scan cards.');
        return;
      }
    }
    let uri: string | null = null;
    try {
      if (cameraRef.current && cameraReady) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        uri = photo?.uri ?? null;
      }
    } catch {
      uri = null;
    }
    if (!uri) {
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [3, 2],
          quality: 0.8,
        });
        if (result.canceled) return;
        uri = result.assets[0]?.uri ?? null;
      } catch {
        Alert.alert('Error', 'Could not open camera.');
        return;
      }
    }
    if (uri) await processImage(uri);
  }, [permission?.granted, requestPermission, cameraReady, processImage]);

  const handleSave = useCallback(async () => {
    if (!editing || !userId) return;
    setSaving(true);
    try {
      const result = await saveScannedContact(userId, editing);
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
  }, [editing, userId, onSaved]);

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
              <View style={[styles.overlay, { borderColor: colors.accent }]}>
                <Text style={[styles.overlayHint, { color: colors.textSecondary }]}>
                  Position card in frame, then tap to scan
                </Text>
              </View>
              <Pressable
                style={[
                  styles.captureButton,
                  {
                    backgroundColor: colors.accent,
                    bottom: insets.bottom + Layout.tabBarHeight + 20,
                    opacity: 1,
                  },
                ]}
                onPress={handleCapture}
                disabled={false}
              >
                <Ionicons name="camera" size={28} color="#0A0A0B" />
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
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Extracting text…</Text>
            </View>
          ) : editing ? (
            <>
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
                  placeholder="Company"
                  placeholderTextColor={colors.textSecondary}
                  value={editing.company}
                  onChangeText={(t) => setEditing((p) => (p ? { ...p, company: t } : null))}
                />
              </View>
              {!saved ? (
                <Pressable
                  style={[styles.primaryButton, { backgroundColor: colors.accent }]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#0A0A0B" />
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
                        <ActivityIndicator size="small" color={colors.accent} />
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
  overlay: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '25%',
    height: 160,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayHint: { fontSize: 14 },
  captureButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Layout.screenPadding },
  loadingWrap: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 15 },
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

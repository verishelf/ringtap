/**
 * Modal sheet for capturing relationship intelligence when saving a contact.
 * Captures: how we met, where, when, notes.
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
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
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { RelationshipIntelligence } from '@/lib/api';

const HOW_MET_OPTIONS = [
  { value: '', label: 'Select how you met' },
  { value: 'conference', label: 'Conference' },
  { value: 'networking_event', label: 'Networking event' },
  { value: 'mutual_friend', label: 'Mutual friend' },
  { value: 'work', label: 'Work' },
  { value: 'social', label: 'Social gathering' },
  { value: 'online', label: 'Online' },
  { value: 'introduction', label: 'Introduction' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

const WINDOW_H = Dimensions.get('window').height;
/** Ensures the form scroll area has real height (flex:1 inside maxHeight-only sheet was collapsing). */
const FORM_SCROLL_MAX = Math.min(520, Math.round(WINDOW_H * 0.58));
const FORM_SCROLL_MIN = 280;

export type SaveContactSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (relationship: RelationshipIntelligence) => void | Promise<void>;
};

export function SaveContactSheet({ visible, onClose, onSave }: SaveContactSheetProps) {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [howMet, setHowMet] = useState('');
  const [howMetCustom, setHowMetCustom] = useState('');
  const [metAtLocation, setMetAtLocation] = useState('');
  const [metAt, setMetAt] = useState(() => new Date());
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setHowMet('');
    setHowMetCustom('');
    setMetAtLocation('');
    setMetAt(new Date());
    setNotes('');
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  const handleUseLocation = useCallback(async () => {
    setLoadingLocation(true);
    try {
      const loc = await getMetAtLocation();
      if (loc) setMetAtLocation(loc);
    } finally {
      setLoadingLocation(false);
    }
  }, []);

  const saveWithFields = useCallback(
    async (fields: RelationshipIntelligence) => {
      setSaving(true);
      try {
        await onSave(fields);
        onClose();
      } catch {
        // Parent shows error; keep sheet open
      } finally {
        setSaving(false);
      }
    },
    [onSave, onClose]
  );

  const handleSave = useCallback(async () => {
    const resolvedHowMet =
      !howMet || howMet === ''
        ? null
        : howMet === 'other'
          ? howMetCustom.trim() || null
          : HOW_MET_OPTIONS.find((o) => o.value === howMet && o.value !== '')?.label ?? null;
    await saveWithFields({
      metAtLocation: metAtLocation.trim() || null,
      metAt: metAt.toISOString(),
      howMet: resolvedHowMet,
      notes: notes.trim() || null,
    });
  }, [howMet, howMetCustom, metAtLocation, metAt, notes, saveWithFields]);

  const handleSkip = useCallback(async () => {
    await saveWithFields({
      metAtLocation: null,
      metAt: null,
      howMet: null,
      notes: null,
    });
  }, [saveWithFields]);

  const handleDateChange = useCallback((_ev: unknown, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setMetAt(date);
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPress} onPress={onClose}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
          <Text style={[styles.title, { color: colors.text }]}>Optional details</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Add how you met, place, or notes—or save now without this info.
          </Text>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.formWrap}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            <ScrollView
              style={{ maxHeight: FORM_SCROLL_MAX, minHeight: FORM_SCROLL_MIN }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {/* How we met */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>How you met</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipRow}
                contentContainerStyle={styles.chipRowContent}
              >
                {HOW_MET_OPTIONS.slice(1).map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setHowMet(opt.value)}
                    style={[
                      styles.chip,
                      { borderColor: colors.borderLight, backgroundColor: howMet === opt.value ? colors.accent + '33' : 'transparent' },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: howMet === opt.value ? colors.text : colors.textSecondary }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {howMet === 'other' && (
                <TextInput
                  placeholder="Describe how you met"
                  placeholderTextColor={colors.textSecondary}
                  value={howMetCustom}
                  onChangeText={setHowMetCustom}
                  style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                />
              )}

              {/* Where */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: Layout.rowGap }]}>Where</Text>
              <View style={styles.locationRow}>
                <TextInput
                  placeholder="Location (e.g. conference name, venue)"
                  placeholderTextColor={colors.textSecondary}
                  value={metAtLocation}
                  onChangeText={setMetAtLocation}
                  style={[styles.input, styles.inputFlex, { color: colors.text, borderColor: colors.borderLight }]}
                />
                <Pressable
                  onPress={handleUseLocation}
                  disabled={loadingLocation}
                  style={[styles.locationBtn, { backgroundColor: colors.accent + '22', borderColor: colors.borderLight }]}
                >
                  {loadingLocation ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Ionicons name="locate-outline" size={20} color={colors.accent} />
                  )}
                </Pressable>
              </View>

              {/* When */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: Layout.rowGap }]}>When</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={[styles.dateBtn, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {metAt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </Text>
              </Pressable>
              {showDatePicker && (
                <View
                  style={[
                    styles.datePickerChrome,
                    { backgroundColor: colorScheme === 'dark' ? '#ffffff' : colors.surface },
                  ]}
                >
                  <DateTimePicker
                    value={metAt}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    onTouchCancel={() => setShowDatePicker(false)}
                    themeVariant={colorScheme === 'dark' ? 'light' : 'dark'}
                  />
                </View>
              )}

              {/* Notes */}
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: Layout.rowGap }]}>Notes</Text>
              <TextInput
                placeholder="Any other details to remember"
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.notesInput, { color: colors.text, borderColor: colors.borderLight }]}
              />

              <View style={styles.actions}>
                <Pressable
                  onPress={handleSkip}
                  disabled={saving}
                  style={[styles.btn, styles.btnSecondary, { borderColor: colors.borderLight }]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.textSecondary} />
                  ) : (
                    <Text style={[styles.btnText, { color: colors.textSecondary }]}>Save without details</Text>
                  )}
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.accent }]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.onAccent} />
                  ) : (
                    <Text style={[styles.btnText, { color: colors.onAccent }]}>Save with details</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  backdropPress: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: Layout.screenPadding,
  },
  sheet: {
    borderRadius: Layout.radiusXl,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 20,
    maxHeight: '88%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: Layout.sectionGap },
  formWrap: { flexShrink: 1 },
  scrollContent: { paddingBottom: 8, width: '100%' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: Layout.tightGap },
  chipRow: { marginBottom: Layout.tightGap, minHeight: 44 },
  chipRowContent: { alignItems: 'center', paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Layout.radiusPill,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 8,
  },
  chipText: { fontSize: 14 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Layout.radiusMd,
    paddingHorizontal: Layout.cardPadding,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputFlex: { flex: 1 },
  locationRow: { flexDirection: 'row', gap: Layout.tightGap, alignItems: 'center' },
  locationBtn: {
    width: 48,
    height: 48,
    borderRadius: Layout.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.tightGap,
    paddingHorizontal: Layout.cardPadding,
    paddingVertical: 12,
    borderRadius: Layout.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dateText: { fontSize: 16 },
  datePickerChrome: {
    borderRadius: Layout.radiusMd,
    overflow: 'hidden',
    marginBottom: Layout.tightGap,
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  actions: {
    flexDirection: 'row',
    gap: Layout.rowGap,
    marginTop: Layout.sectionGap,
    width: '100%',
    alignSelf: 'center',
  },
  btn: {
    flex: 1,
    minWidth: 0,
    minHeight: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  btnSecondary: { borderWidth: StyleSheet.hairlineWidth },
  btnPrimary: {},
  /** Ensures long labels (e.g. "Save without details") center in split buttons */
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
});

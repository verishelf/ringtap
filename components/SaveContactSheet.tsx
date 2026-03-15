/**
 * Modal sheet for capturing relationship intelligence when saving a contact.
 * Captures: how we met, where, when, notes.
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { getMetAtLocation } from '@/lib/getMetAtLocation';
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

export type SaveContactSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (relationship: RelationshipIntelligence) => void | Promise<void>;
};

export function SaveContactSheet({ visible, onClose, onSave }: SaveContactSheetProps) {
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

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const resolvedHowMet = howMet === 'other' ? howMetCustom.trim() : HOW_MET_OPTIONS.find((o) => o.value === howMet)?.label ?? howMet.trim();
      await onSave({
        metAtLocation: metAtLocation.trim() || null,
        metAt: metAt.toISOString(),
        howMet: resolvedHowMet || null,
        notes: notes.trim() || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [howMet, howMetCustom, metAtLocation, metAt, notes, onSave, onClose]);

  const handleDateChange = useCallback((_ev: unknown, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setMetAt(date);
  }, []);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />
          <Text style={[styles.title, { color: colors.text }]}>Add context</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Optional: remember how and where you met
          </Text>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.form}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* How we met */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>How you met</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
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
                <DateTimePicker
                  value={metAt}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  onTouchCancel={() => setShowDatePicker(false)}
                />
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
                  onPress={onClose}
                  style={[styles.btn, styles.btnSecondary, { borderColor: colors.borderLight }]}
                >
                  <Text style={[styles.btnText, { color: colors.textSecondary }]}>Skip</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.accent }]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={[styles.btnText, { color: colors.background }]}>Save contact</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Layout.radiusXl,
    borderTopRightRadius: Layout.radiusXl,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: Layout.sectionGap },
  form: { flex: 1, minHeight: 0 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: Layout.tightGap },
  chipRow: { marginBottom: Layout.tightGap },
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
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  actions: {
    flexDirection: 'row',
    gap: Layout.rowGap,
    marginTop: Layout.sectionGap,
  },
  btn: {
    flex: 1,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: { borderWidth: StyleSheet.hairlineWidth },
  btnPrimary: {},
  btnText: { fontSize: 16, fontWeight: '600' },
});

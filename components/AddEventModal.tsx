/**
 * Modal for Pro users to add a map event.
 */

import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { createMapEvent, updateMapEvent, type MapEvent } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export type AddEventModalProps = {
  visible: boolean;
  userId: string;
  currentLocation: { latitude: number; longitude: number } | null;
  editingEvent?: MapEvent | null;
  onClose: () => void;
  onCreated: () => void;
};

export function AddEventModal({
  visible,
  userId,
  currentLocation,
  editingEvent,
  onClose,
  onCreated,
}: AddEventModalProps) {
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventLocation, setEventLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (editingEvent) {
        setName(editingEvent.name);
        setDescription(editingEvent.description || '');
        setEventLocation({ latitude: editingEvent.latitude, longitude: editingEvent.longitude });
        setEventDate(new Date(editingEvent.eventDate));
      } else {
        setName('');
        setDescription('');
        setEventLocation(currentLocation);
        setEventDate(() => {
          const d = new Date();
          d.setHours(18, 0, 0, 0);
          return d;
        });
      }
    } else {
      setEventLocation(null);
    }
  }, [visible, currentLocation, editingEvent]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Enter event name');
      return;
    }
    const loc = eventLocation ?? currentLocation;
    if (!loc) {
      setError('Location required. Use your location or tap the map.');
      return;
    }
    setSubmitting(true);
    setError(null);
    if (editingEvent) {
      const result = await updateMapEvent(userId, editingEvent.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        latitude: loc.latitude,
        longitude: loc.longitude,
        eventDate: eventDate.toISOString(),
      });
      if (result.success) {
        onCreated();
        onClose();
      } else {
        setError(result.error ?? 'Failed to update event');
      }
    } else {
      const result = await createMapEvent(userId, {
        name: name.trim(),
        description: description.trim() || undefined,
        latitude: loc.latitude,
        longitude: loc.longitude,
        eventDate: eventDate.toISOString(),
      });
      if (result.success) {
        onCreated();
        onClose();
      } else {
        setError(result.error ?? 'Failed to create event');
      }
    }
    setSubmitting(false);
  };

  const onDateChange = (_: unknown, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setEventDate(date);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <Pressable style={[styles.modal, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.title, { color: colors.text }]}>{editingEvent ? 'Edit event' : 'Add event'}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: colors.textSecondary }]}>Event name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
              placeholder="e.g. Startup Mixer"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={(t) => { setName(t); setError(null); }}
              autoCapitalize="words"
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.borderLight, color: colors.text }]}
              placeholder="Brief description"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
            <View style={[styles.locationSection, { backgroundColor: colors.background, borderColor: colors.borderLight }]}>
              <View style={styles.locationMapWrap}>
                <MapView
                  style={styles.locationMap}
                  initialRegion={
                    (eventLocation ?? currentLocation)
                      ? {
                          latitude: (eventLocation ?? currentLocation)!.latitude,
                          longitude: (eventLocation ?? currentLocation)!.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }
                      : { latitude: 37.78, longitude: -122.42, latitudeDelta: 0.1, longitudeDelta: 0.1 }
                  }
                  onPress={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    setEventLocation({ latitude, longitude });
                    setError(null);
                  }}
                >
                  {(eventLocation ?? currentLocation) && (
                    <Marker
                      coordinate={eventLocation ?? currentLocation!}
                      draggable
                      onDragEnd={(e) => {
                        const { latitude, longitude } = e.nativeEvent.coordinate;
                        setEventLocation({ latitude, longitude });
                      }}
                    />
                  )}
                </MapView>
              </View>
              <View style={styles.locationActions}>
                <TouchableOpacity
                  style={[styles.useLocationBtn, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    if (currentLocation) {
                      setEventLocation(currentLocation);
                      setError(null);
                    }
                  }}
                  disabled={!currentLocation}
                >
                  <Ionicons name="locate" size={18} color="#0A0A0B" />
                  <Text style={[styles.useLocationBtnText, { color: '#0A0A0B' }]}>Use my location</Text>
                </TouchableOpacity>
                <Text style={[styles.locationHint, { color: colors.textSecondary }]}>
                  Tap map to place pin, or drag to adjust
                </Text>
              </View>
            </View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Date & time</Text>
            <Pressable
              style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.borderLight }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
              <Text style={[styles.dateText, { color: colors.text }]}>
                {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={eventDate}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
            <Pressable
              style={[styles.submit, { backgroundColor: colors.accent }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={[styles.submitText, { color: '#0A0A0B' }]}>
                {submitting ? (editingEvent ? 'Updating…' : 'Creating…') : editingEvent ? 'Save changes' : 'Add event'}
              </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: { flex: 1 },
  modal: {
    borderTopLeftRadius: Layout.radiusXl,
    borderTopRightRadius: Layout.radiusXl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '700' },
  body: { padding: Layout.screenPadding },
  label: { fontSize: 14, marginBottom: Layout.labelMarginBottom },
  input: {
    height: Layout.inputHeight,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: Layout.inputMarginBottom,
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: Layout.inputHeight,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: Layout.inputMarginBottom,
  },
  dateText: { fontSize: 16 },
  locationSection: {
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Layout.inputMarginBottom,
  },
  locationMapWrap: { height: 160 },
  locationMap: { flex: 1, width: '100%' },
  locationActions: { padding: 12 },
  useLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: Layout.radiusMd,
  },
  useLocationBtnText: { fontSize: 15, fontWeight: '600' },
  locationHint: { fontSize: 12, marginTop: 6, textAlign: 'center' },
  error: { fontSize: 14, marginBottom: 12 },
  submit: {
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontWeight: '600' },
});

/**
 * Scanned contact info page - view details of a scanned business card
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
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
import type { ScannedContact } from '@/lib/api';
import { deleteScannedContact, getScannedContact, getScannedContactDisplayName, updateScannedContact } from '@/lib/api';

function InfoRow({
  icon,
  label,
  value,
  onPress,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  if (!value?.trim()) return null;
  const content = (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text
          style={[styles.infoValue, { color: colors.text }]}
          numberOfLines={1}
          selectable
        >
          {value.trim()}
        </Text>
      </View>
      {onPress && (
        <Ionicons name="open-outline" size={18} color={colors.accent} />
      )}
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

export default function ScannedContactInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [contact, setContact] = useState<ScannedContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ name: string; title: string; company: string; email: string; phone: string; website: string; linkedin: string }>({
    name: '',
    title: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    linkedin: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) {
      router.back();
      return;
    }
    getScannedContact(id)
      .then((c) => {
        if (c) {
          setContact(c);
          setForm({
            name: c.name ?? '',
            title: c.title ?? '',
            company: c.company ?? '',
            email: c.email ?? '',
            phone: c.phone ?? '',
            website: c.website ?? '',
            linkedin: c.linkedin ?? '',
          });
        } else {
          setContact(null);
        }
      })
      .catch(() => setContact(null))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSave = useCallback(async () => {
    if (!contact || !id) return;
    setSaving(true);
    try {
      const ok = await updateScannedContact(id, {
        name: form.name.trim(),
        title: form.title.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        linkedin: form.linkedin.trim() || undefined,
      });
      if (ok) {
        setContact((prev) =>
          prev
            ? {
                ...prev,
                name: form.name.trim(),
                title: form.title.trim(),
                company: form.company.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                website: form.website.trim(),
                linkedin: form.linkedin.trim() || null,
              }
            : null
        );
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }, [contact, id, form]);

  const handleDelete = useCallback(() => {
    if (!contact) return;
    Alert.alert(
      'Remove scanned contact',
      `Remove ${getScannedContactDisplayName(contact)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteScannedContact(contact.id);
            if (ok) router.back();
          },
        },
      ]
    );
  }, [contact, router]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Contact not found</Text>
        <Pressable
          style={[styles.backButton, { borderColor: colors.borderLight }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: colors.text }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = getScannedContactDisplayName(contact);
  const email = contact.email?.trim();
  const phone = contact.phone?.trim();
  const website = contact.website?.trim();
  const normalizedWebsite = website?.startsWith('http') ? website : website ? `https://${website}` : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => {
            if (editing) {
              setEditing(false);
              if (contact) {
                setForm({
                  name: contact.name ?? '',
                  title: contact.title ?? '',
                  company: contact.company ?? '',
                  email: contact.email ?? '',
                  phone: contact.phone ?? '',
                  website: contact.website ?? '',
                  linkedin: contact.linkedin ?? '',
                });
              }
            } else {
              router.back();
            }
          }}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {editing ? 'Edit contact' : 'Business card'}
        </Text>
        {editing ? (
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [styles.saveBtn, { opacity: pressed && !saving ? 0.7 : 1 }]}
            hitSlop={12}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.accent }]}>Save</Text>
            )}
          </Pressable>
        ) : (
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setEditing(true)}
              style={({ pressed }) => [styles.editBtn, { opacity: pressed ? 0.7 : 1 }]}
              hitSlop={12}
            >
              <Ionicons name="pencil-outline" size={22} color={colors.accent} />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
              hitSlop={12}
            >
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </Pressable>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Layout.tabBarHeight + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {editing ? (
            <View style={[styles.editForm, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Contact details</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                placeholder="Name"
                placeholderTextColor={colors.textSecondary}
                value={form.name}
                onChangeText={(t) => setForm((p) => ({ ...p, name: t }))}
              />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                placeholder="Title"
                placeholderTextColor={colors.textSecondary}
                value={form.title}
                onChangeText={(t) => setForm((p) => ({ ...p, title: t }))}
              />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                placeholder="Company"
                placeholderTextColor={colors.textSecondary}
                value={form.company}
                onChangeText={(t) => setForm((p) => ({ ...p, company: t }))}
              />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={form.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(t) => setForm((p) => ({ ...p, email: t }))}
              />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                placeholder="Phone"
                placeholderTextColor={colors.textSecondary}
                value={form.phone}
                keyboardType="phone-pad"
                onChangeText={(t) => setForm((p) => ({ ...p, phone: t }))}
              />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                placeholder="Website"
                placeholderTextColor={colors.textSecondary}
                value={form.website}
                keyboardType="url"
                autoCapitalize="none"
                onChangeText={(t) => setForm((p) => ({ ...p, website: t }))}
              />
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
                placeholder="LinkedIn"
                placeholderTextColor={colors.textSecondary}
                value={form.linkedin}
                keyboardType="url"
                autoCapitalize="none"
                onChangeText={(t) => setForm((p) => ({ ...p, linkedin: t }))}
              />
            </View>
          ) : (
            <>
              <View style={[styles.cardPreview, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                {contact.avatarUrl?.trim() ? (
                  <Image
                    source={{ uri: contact.avatarUrl }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.avatarWrap, { backgroundColor: colors.accent + '33' }]}>
                    <Ionicons name="document-text-outline" size={36} color={colors.accent} />
                  </View>
                )}
                <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
                {contact.title?.trim() ? (
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{contact.title.trim()}</Text>
                ) : null}
                {contact.company?.trim() ? (
                  <Text style={[styles.company, { color: colors.textSecondary }]}>{contact.company.trim()}</Text>
                ) : null}
              </View>

              <View style={styles.infoSection}>
                <InfoRow
                  icon="mail-outline"
                  label="Email"
                  value={email ?? ''}
                  onPress={email ? () => Linking.openURL(`mailto:${email}`) : undefined}
                  colors={colors}
                />
                <InfoRow
                  icon="call-outline"
                  label="Phone"
                  value={phone ?? ''}
                  onPress={phone ? () => Linking.openURL(`tel:${phone}`) : undefined}
                  colors={colors}
                />
                <InfoRow
                  icon="globe-outline"
                  label="Website"
                  value={normalizedWebsite ?? website ?? ''}
                  onPress={normalizedWebsite ? () => Linking.openURL(normalizedWebsite) : undefined}
                  colors={colors}
                />
                {contact.linkedin?.trim() ? (
                  <InfoRow
                    icon="logo-linkedin"
                    label="LinkedIn"
                    value={contact.linkedin}
                    onPress={() => Linking.openURL(contact.linkedin!.trim())}
                    colors={colors}
                  />
                ) : null}
                {contact.profileUrl?.trim() ? (
                  <InfoRow
                    icon="person-outline"
                    label="RingTap profile"
                    value={contact.profileUrl}
                    onPress={() => Linking.openURL(contact.profileUrl!.trim())}
                    colors={colors}
                  />
                ) : null}
              </View>

              <View style={[styles.actions, { borderTopColor: colors.border }]}>
                {email && (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                    onPress={() => Linking.openURL(`mailto:${email}`)}
                  >
                    <Ionicons name="mail" size={20} color="#0A0A0B" />
                    <Text style={styles.actionBtnText}>Email</Text>
                  </Pressable>
                )}
                {phone && (
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                    onPress={() => Linking.openURL(`tel:${phone}`)}
                  >
                    <Ionicons name="call" size={20} color="#0A0A0B" />
                    <Text style={styles.actionBtnText}>Call</Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, marginBottom: 16 },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  backButtonText: { fontSize: 16, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  saveBtn: { padding: 4, minWidth: 56, alignItems: 'flex-end' },
  saveBtnText: { fontSize: 17, fontWeight: '600' },
  keyboardWrap: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Layout.screenPadding, paddingTop: 20 },
  cardPreview: {
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    padding: Layout.cardPadding,
    alignItems: 'center',
    marginBottom: 24,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 3 / 2,
    borderRadius: Layout.radiusMd,
    marginBottom: 12,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  company: { fontSize: 13, marginTop: 2, opacity: 0.9, textAlign: 'center' },
  editForm: {
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    padding: Layout.cardPadding,
    marginBottom: 24,
  },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 12 },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  infoSection: {
    borderRadius: Layout.radiusLg,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: { marginRight: 12 },
  infoContent: { flex: 1, minWidth: 0 },
  infoLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  infoValue: { fontSize: 16 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Layout.radiusMd,
  },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: '#0A0A0B' },
});

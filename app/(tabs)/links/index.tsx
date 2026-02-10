import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Image } from 'expo-image';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
    canAddLink,
    createLink,
    deleteLink,
    getLinks,
    updateLink,
} from '@/lib/api';
import type { UserLink } from '@/lib/supabase/types';
import { FREE_PLAN_MAX_LINKS } from '@/lib/supabase/types';

type LinkType = UserLink['type'];
const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'social', label: 'Social' },
  { value: 'website', label: 'Website' },
  { value: 'custom', label: 'Custom button' },
  { value: 'payment', label: 'Payment link' },
];

export default function LinksScreen() {
  const { user } = useSession();
  const { plan, isPro } = useSubscription();
  const colors = useThemeColors();
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<UserLink | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formType, setFormType] = useState<LinkType>('custom');
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const list = await getLinks(user.id);
    setLinks(list);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openAdd = useCallback(() => {
    if (!isPro && links.length >= FREE_PLAN_MAX_LINKS) {
      Alert.alert(
        'Limit reached',
        `Free plan allows up to ${FREE_PLAN_MAX_LINKS} links. Upgrade to Pro for unlimited links.`
      );
      return;
    }
    setEditing(null);
    setFormTitle('');
    setFormUrl('');
    setFormType('custom');
    setModalVisible(true);
  }, [isPro, links.length]);

  const openEdit = useCallback((link: UserLink) => {
    setEditing(link);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormType(link.type);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formTitle.trim() || !formUrl.trim()) {
      Alert.alert('Error', 'Title and URL are required.');
      return;
    }
    if (!user?.id) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await updateLink(editing.id, { title: formTitle.trim(), url: formUrl.trim(), type: formType });
        if (updated) {
          setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        }
      } else {
        if (!canAddLink(plan, links.length)) {
          Alert.alert('Limit reached', 'Upgrade to Pro for more links.');
          setSaving(false);
          return;
        }
        const created = await createLink(user.id, {
          type: formType,
          title: formTitle.trim(),
          url: formUrl.trim(),
          sortOrder: links.length,
        });
        if (created) setLinks((prev) => [...prev, created]);
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save link.');
    } finally {
      setSaving(false);
    }
  }, [user?.id, editing, formTitle, formUrl, formType, plan, links.length]);

  const handleDelete = useCallback(
    (link: UserLink) => {
      Alert.alert('Delete link', `Remove "${link.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteLink(link.id);
            if (ok) setLinks((prev) => prev.filter((l) => l.id !== link.id));
          },
        },
      ]);
    },
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: UserLink }) => (
      <View style={[styles.row, { backgroundColor: colors.surface }]}>
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.rowUrl, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.url}
          </Text>
        </View>
        <View style={styles.rowActions}>
          <Pressable onPress={() => openEdit(item)} style={styles.iconBtn}>
            <Ionicons name="pencil" size={22} color={colors.accent} />
          </Pressable>
          <Pressable onPress={() => handleDelete(item)} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={22} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    ),
    [openEdit, handleDelete, colors]
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.planText, { color: colors.text }]}>
          {links.length} / {isPro ? '∞' : FREE_PLAN_MAX_LINKS} links
          {!isPro && (
            <Text style={[styles.upgradeHint, { color: colors.textSecondary }]}> · Upgrade for unlimited</Text>
          )}
        </Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.surface, borderColor: colors.borderLight }, !canAddLink(plan, links.length) && styles.addButtonDisabled]}
          onPress={openAdd}
          disabled={!canAddLink(plan, links.length)}
        >
          <Ionicons name="add" size={24} color={colors.text} />
          <Text style={[styles.addButtonText, { color: colors.text }]}>Add link</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <Image
            source={require('@/assets/images/loading.gif')}
            style={{ width: 64, height: 64 }}
          />
        </View>
      ) : links.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="link-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No links yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Add social links, websites, or custom buttons.</Text>
          <Pressable style={[styles.addButton, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={openAdd}>
            <Text style={[styles.addButtonText, { color: colors.text }]}>Add your first link</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={links}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{editing ? 'Edit link' : 'Add link'}</Text>
            <Text style={[styles.label, { color: colors.text }]}>Type</Text>
            <View style={styles.typeRow}>
              {LINK_TYPES.map(({ value, label }) => (
                <Pressable
                  key={value}
                  style={[
                    styles.typeChip,
                    { borderColor: colors.borderLight },
                    formType === value && { borderColor: colors.accent, backgroundColor: colors.surface },
                  ]}
                  onPress={() => setFormType(value)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: formType === value ? colors.accent : colors.text },
                      formType === value && styles.typeChipTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Title</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.borderLight, color: colors.text }]}
              placeholder="e.g. My Instagram"
              placeholderTextColor={colors.textSecondary}
              value={formTitle}
              onChangeText={setFormTitle}
            />
            <Text style={[styles.label, { color: colors.text }]}>URL</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.borderLight, color: colors.text }]}
              placeholder="https://..."
              placeholderTextColor={colors.textSecondary}
              value={formUrl}
              onChangeText={setFormUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.cancelButton, { borderColor: colors.borderLight }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, { backgroundColor: colors.accent }, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.text} size="small" />
                ) : (
                  <Text style={[styles.saveButtonText, { color: colors.text }]}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: Layout.screenPadding, paddingBottom: Layout.rowGap },
  planText: { fontSize: Layout.bodySmall, marginBottom: Layout.rowGap },
  upgradeHint: { fontSize: Layout.caption },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.tightGap,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { fontSize: Layout.body, fontWeight: '600' },
  listContent: { padding: Layout.screenPadding, paddingTop: Layout.tightGap },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Layout.radiusMd,
    marginBottom: Layout.inputGap,
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: Layout.body, fontWeight: '600', marginTop: 0 },
  rowUrl: { fontSize: Layout.caption, marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: Layout.tightGap },
  iconBtn: { padding: 4 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.screenPaddingBottom,
  },
  emptyText: { fontSize: 20, fontWeight: '600', marginTop: 16 },
  emptySubtext: { fontSize: Layout.bodySmall, marginTop: Layout.tightGap, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: Layout.radiusXl,
    borderTopRightRadius: Layout.radiusXl,
    padding: Layout.cardPadding,
    paddingBottom: Layout.screenPaddingBottom,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: Layout.subtitleSectionMarginBottom },
  label: { fontSize: Layout.bodySmall, fontWeight: '500', marginBottom: Layout.labelMarginBottom },
  input: {
    height: Layout.inputHeight,
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    paddingHorizontal: 16,
    fontSize: Layout.body,
    marginBottom: Layout.sectionGap,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.tightGap, marginBottom: Layout.sectionGap },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: Layout.tightGap,
    borderRadius: Layout.radiusPill,
    borderWidth: 1,
  },
  typeChipText: { fontSize: Layout.bodySmall },
  modalActions: { flexDirection: 'row', gap: Layout.rowGap, marginTop: Layout.sectionGap },
  cancelButton: {
    flex: 1,
    height: Layout.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
  },
  cancelButtonText: { fontSize: Layout.body, fontWeight: '600' },
  saveButton: {
    flex: 1,
    height: Layout.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.radiusMd,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { fontSize: Layout.body, fontWeight: '600' },
});

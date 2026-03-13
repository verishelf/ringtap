/**
 * Create post modal for Opportunity Feed
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
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
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Post, PostType } from '@/services/postService';
import { createPost, updatePost } from '@/services/postService';

const POST_TYPES: { value: PostType; label: string }[] = [
  { value: 'hiring', label: 'Hiring' },
  { value: 'partnerships', label: 'Partnerships' },
  { value: 'investments', label: 'Investments' },
  { value: 'services', label: 'Services' },
  { value: 'general', label: 'General' },
];

export type CreatePostModalProps = {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onCreated: () => void;
  editingPost?: Post | null;
};

export function CreatePostModal({ visible, userId, onClose, onCreated, editingPost }: CreatePostModalProps) {
  const colors = useThemeColors();
  const [content, setContent] = useState(editingPost?.content ?? '');
  const [type, setType] = useState<PostType>(editingPost?.type ?? 'general');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setContent(editingPost?.content ?? '');
      setType(editingPost?.type ?? 'general');
      setError(null);
    }
  }, [visible, editingPost]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Enter some content');
      return;
    }
    setSubmitting(true);
    setError(null);
    if (editingPost) {
      const result = await updatePost(editingPost.id, userId, content, type);
      if (result.success) {
        onCreated();
        onClose();
      } else {
        setError(result.error ?? 'Failed to update');
      }
    } else {
      const result = await createPost(userId, content, type);
      if (result.success) {
        setContent('');
        setType('general');
        onCreated();
        onClose();
      } else {
        setError(result.error ?? 'Failed to post');
      }
    }
    setSubmitting(false);
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
            <Text style={[styles.title, { color: colors.text }]}>
              {editingPost ? 'Edit opportunity' : 'New opportunity'}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
            <View style={styles.typeRow}>
              {POST_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: type === t.value ? colors.accent : colors.surfaceElevated ?? colors.surface,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() => setType(t.value)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: type === t.value ? '#0A0A0B' : colors.text },
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.textSecondary }]}>What's the opportunity?</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.borderLight }]}
              placeholder="Describe the opportunity…"
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={(t) => { setContent(t); setError(null); }}
              multiline
              numberOfLines={4}
            />
            {error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <Pressable
              style={[styles.postButton, { backgroundColor: colors.accent }]}
              onPress={handleSubmit}
              disabled={submitting || !content.trim()}
            >
              <Text style={[styles.postButtonText, { color: '#0A0A0B' }]}>
                {submitting ? (editingPost ? 'Saving…' : 'Posting…') : editingPost ? 'Save' : 'Post'}
              </Text>
            </Pressable>
          </View>
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
  body: { padding: Layout.screenPadding, maxHeight: 400 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  typeChipText: { fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    padding: 14,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  error: { color: '#EF4444', fontSize: 14, marginTop: 8 },
  footer: {
    padding: Layout.screenPadding,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  postButton: {
    paddingVertical: 14,
    borderRadius: Layout.radiusMd,
    alignItems: 'center',
  },
  postButtonText: { fontSize: 16, fontWeight: '600' },
});

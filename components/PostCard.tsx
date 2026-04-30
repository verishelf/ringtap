/**
 * Post card for Opportunity Feed
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NameWithVerified, ProAvatar, PRO_RING_COLOR } from '@/components/ProBadge';
import { LinkableText } from '@/components/LinkableText';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Post, PostComment } from '@/services/postService';
import { addComment, deletePost, getComments, toggleLike } from '@/services/postService';

export type PostCardProps = {
  post: Post;
  currentUserId: string | null;
  onLikeToggled?: () => void;
  onEditRequested?: (post: Post) => void;
  onDeleted?: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  hiring: 'Hiring',
  partnerships: 'Partnerships',
  investments: 'Investments',
  services: 'Services',
  general: 'General',
};

export function PostCard({ post, currentUserId, onLikeToggled, onEditRequested, onDeleted }: PostCardProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(post.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  const INITIAL_COMMENTS_SHOWN = 3;
  const commentList = comments ?? [];
  const hasMoreComments = commentList.length > INITIAL_COMMENTS_SHOWN;
  const visibleComments = commentsExpanded || !hasMoreComments
    ? commentList
    : commentList.slice(0, INITIAL_COMMENTS_SHOWN);
  const hiddenCount = commentList.length - INITIAL_COMMENTS_SHOWN;

  const loadComments = async () => {
    if (comments === null) {
      const c = await getComments(post.id);
      setComments(c);
    }
    setShowComments(true);
  };

  const handleLike = async () => {
    if (!currentUserId) return;
    const newLiked = await toggleLike(post.id, currentUserId);
    setLiked(newLiked);
    setLikeCount((n) => (newLiked ? n + 1 : n - 1));
    onLikeToggled?.();
  };

  const handleAddComment = async () => {
    if (!currentUserId || !commentText.trim()) return;
    setSubmitting(true);
    const ok = await addComment(post.id, currentUserId, commentText);
    if (ok.success) {
      setCommentText('');
      const c = await getComments(post.id);
      setComments(c);
    }
    setSubmitting(false);
  };

  const isOwner = currentUserId === post.userId;

  const showOptions = () => {
    if (!isOwner) return;
    const canEdit = !!onEditRequested;
    const canDelete = !!onDeleted;
    if (!canEdit && !canDelete) return;
    const options = ['Cancel', ...(canEdit ? ['Edit' as const] : []), ...(canDelete ? ['Delete' as const] : [])];
    if (Platform.OS === 'ios' && ActionSheetIOS) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: canDelete ? options.length - 1 : undefined,
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (canEdit && idx === 1) onEditRequested!(post);
          if (canDelete && idx === (canEdit ? 2 : 1)) handleDelete();
        }
      );
    } else {
      Alert.alert(
        'Post options',
        undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          ...(canEdit ? [{ text: 'Edit' as const, onPress: () => onEditRequested!(post) }] : []),
          ...(canDelete ? [{ text: 'Delete' as const, style: 'destructive' as const, onPress: handleDelete }] : []),
        ]
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!currentUserId) return;
            const result = await deletePost(post.id, currentUserId);
            if (result.success) onDeleted?.();
            else Alert.alert('Error', result.error ?? 'Could not delete');
          },
        },
      ]
    );
  };

  const goToProfile = () => router.push(`/profile/${post.userId}` as const);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={styles.header}>
        <Pressable onPress={goToProfile} hitSlop={8}>
          <ProAvatar
            avatarUrl={post.userAvatar ?? null}
            isPro={post.userIsPro ?? false}
            size="medium"
            placeholderLetter={post.userName}
          />
        </Pressable>
        <Pressable onPress={goToProfile} style={styles.headerText} hitSlop={8}>
          <NameWithVerified name={post.userName ?? 'Unknown'} isPro={post.userIsPro ?? false} />
          <View style={[styles.typeBadge, { backgroundColor: colors.accent + '33' }]}>
            <Text style={[styles.typeText, { color: colors.accent }]}>
              {TYPE_LABELS[post.type] ?? post.type}
            </Text>
          </View>
        </Pressable>
        {isOwner && (onEditRequested || onDeleted) && (
          <Pressable onPress={showOptions} hitSlop={8} style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>
      <LinkableText content={post.content} textStyle={[styles.content, { color: colors.text }]} linkColor={colors.accent} />
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, liked && { opacity: 1 }]}
          onPress={handleLike}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? '#EF4444' : colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{likeCount}</Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={loadComments}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.commentCount ?? 0}
          </Text>
        </Pressable>
      </View>
      {showComments && (
        <View style={[styles.commentsSection, { borderTopColor: colors.borderLight }]}>
          {visibleComments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <Pressable
                onPress={() => router.push(`/profile/${c.userId}` as const)}
                style={[styles.commentAvatarWrap, c.userIsPro && [styles.commentAvatarProRing, { borderColor: PRO_RING_COLOR }]]}
              >
                {c.userAvatar ? (
                  <Image source={{ uri: c.userAvatar }} style={styles.commentAvatar} />
                ) : (
                  <View style={[styles.commentAvatarPlaceholder, { backgroundColor: colors.borderLight }]}>
                    <Text style={[styles.commentAvatarLetter, { color: colors.textSecondary }]}>
                      {(c.userName || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </Pressable>
              <View style={styles.commentBody}>
                <View style={styles.commentAuthorRow}>
                  <Text style={[styles.commentAuthor, { color: colors.text }]}>{c.userName}</Text>
                  {c.userIsPro ? (
                    <Image source={require('@/assets/images/verified.png')} style={styles.commentVerifiedBadge} />
                  ) : null}
                </View>
                <LinkableText
                  content={c.content}
                  textStyle={[styles.commentContent, { color: colors.textSecondary }]}
                  linkColor={colors.accent}
                />
              </View>
            </View>
          ))}
          {hasMoreComments && (
            <Pressable
              onPress={() => setCommentsExpanded((e) => !e)}
              style={styles.showMoreComments}
              hitSlop={8}
            >
              <Ionicons name={commentsExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.accent} />
              <Text style={[styles.showMoreText, { color: colors.accent }]}>
                {commentsExpanded ? 'Show less' : `Show ${hiddenCount} more`}
              </Text>
            </Pressable>
          )}
          {currentUserId && (
            <View style={styles.commentInputRow}>
              <TextInput
                style={[styles.commentInput, { color: colors.text, borderColor: colors.borderLight }]}
                placeholder="Add a comment…"
                placeholderTextColor={colors.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={handleAddComment}
                returnKeyType="send"
              />
              <Pressable
                style={[styles.sendButton, { backgroundColor: colors.accent }]}
                onPress={handleAddComment}
                disabled={!commentText.trim() || submitting}
              >
                <Text style={[styles.sendText, { color: colors.onAccent }]}>Send</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    padding: Layout.cardPadding,
    marginBottom: Layout.rowGap,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarPressable: {},
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 16, fontWeight: '700' },
  headerText: { marginLeft: 12, flex: 1, minWidth: 0 },
  moreButton: { padding: 4 },
  userName: { fontSize: 15, fontWeight: '600' },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  typeText: { fontSize: 11, fontWeight: '600' },
  content: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 14 },
  commentsSection: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  commentRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start' },
  commentAvatarWrap: { marginRight: 10 },
  commentAvatarProRing: { borderWidth: 2, borderRadius: 16, padding: 2 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14 },
  commentAvatarPlaceholder: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  commentAvatarLetter: { fontSize: 12, fontWeight: '700' },
  commentBody: { flex: 1, minWidth: 0 },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentAuthor: { fontSize: 14, fontWeight: '600' },
  commentVerifiedBadge: { width: 14, height: 14 },
  commentContent: { fontSize: 14, marginTop: 2 },
  showMoreComments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 6,
  },
  showMoreText: { fontSize: 13, fontWeight: '600' },
  commentInputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Layout.radiusMd, justifyContent: 'center' },
  sendText: { fontSize: 14, fontWeight: '600' },
});

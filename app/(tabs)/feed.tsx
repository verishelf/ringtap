/**
 * Opportunity Feed tab
 */

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useSegments } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image } from 'expo-image';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreatePostModal } from '@/components/CreatePostModal';
import { PostCard } from '@/components/PostCard';
import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Post } from '@/services/postService';
import { getPosts } from '@/services/postService';

export default function FeedTab() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const inProfileStack = Array.isArray(segments) && segments.includes('profile') && segments[segments.length - 1] !== 'index';
  const topPadding = inProfileStack ? Layout.screenPadding : insets.top + Layout.screenPadding;
  const colors = useThemeColors();
  const { user } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const loadPosts = useCallback(async () => {
    const timeout = setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
    }, 5000);
    setError(null);
    try {
      const list = await getPosts();
      setPosts(list);
    } catch (e) {
      setPosts([]);
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPosts();
    }, [loadPosts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, [loadPosts]);

  if (!user) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sign in to view the feed</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding, backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingHorizontal: Layout.screenPadding, marginBottom: 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Opportunities</Text>
        <Pressable
          style={[styles.createButton, { backgroundColor: colors.accent }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={22} color="#0A0A0B" />
          <Text style={[styles.createButtonText, { color: '#0A0A0B' }]}>Post</Text>
        </Pressable>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <Image source={require('@/assets/images/loading.gif')} style={{ width: 64, height: 64 }} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={user?.id ?? null}
              onLikeToggled={loadPosts}
              onEditRequested={(post) => {
                setEditingPost(post);
                setModalVisible(true);
              }}
              onDeleted={loadPosts}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + Layout.tabBarHeight + Layout.sectionGap },
          ]}
          ListEmptyComponent={
            error ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="alert-circle-outline" size={40} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
                <Pressable style={[styles.retryButton, { backgroundColor: colors.accent }]} onPress={loadPosts}>
                  <Text style={[styles.retryButtonText, { color: '#0A0A0B' }]}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No posts yet. Be the first to share an opportunity!
              </Text>
            )
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        />
      )}
      <CreatePostModal
        visible={modalVisible}
        userId={user.id}
        onClose={() => {
          setModalVisible(false);
          setEditingPost(null);
        }}
        onCreated={loadPosts}
        editingPost={editingPost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '700' },
  createButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Layout.radiusMd },
  createButtonText: { fontSize: 15, fontWeight: '600' },
  listContent: { paddingHorizontal: Layout.screenPadding, paddingBottom: 40, flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { textAlign: 'center', fontSize: 16, paddingVertical: 16 },
  retryButton: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: Layout.radiusMd },
  retryButtonText: { fontSize: 15, fontWeight: '600' },
});

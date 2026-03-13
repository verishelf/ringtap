/**
 * Opportunity Feed: posts, likes, comments
 */

import { supabase } from '@/lib/supabase/supabaseClient';

export type PostType = 'hiring' | 'partnerships' | 'investments' | 'services' | 'general';

export type Post = {
  id: string;
  userId: string;
  content: string;
  type: PostType;
  createdAt: string;
  userName?: string;
  userAvatar?: string | null;
  userIsPro?: boolean;
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
};

export type PostComment = {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  userName?: string;
  userAvatar?: string | null;
};

export async function getPosts(limit = 50): Promise<Post[]> {
  const { data: postsData, error } = await supabase
    .from('posts')
    .select('id, user_id, content, type, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const posts = (postsData ?? []) as Array<{
    id: string;
    user_id: string;
    content: string;
    type: string;
    created_at: string;
  }>;

  if (posts.length === 0) return [];

  const { data: { user } } = await supabase.auth.getUser();
  const userIds = [...new Set(posts.map((p) => p.user_id))];

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('user_id, name, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map(
    (profilesData ?? []).map((p: { user_id: string; name: string; avatar_url: string | null }) => [
      p.user_id,
      { name: p.name, avatarUrl: p.avatar_url },
    ])
  );

  const { data: subsData } = await supabase
    .from('subscriptions')
    .select('user_id, plan')
    .in('user_id', userIds);
  const isProMap = new Map(
    (subsData ?? []).map((s: { user_id: string; plan: string }) => [s.user_id, s.plan === 'pro'])
  );

  const postIds = posts.map((p) => p.id);
  const { data: likesData } = await supabase
    .from('post_likes')
    .select('post_id, user_id')
    .in('post_id', postIds);
  const likeCountMap = new Map<string, number>();
  const likedByMeSet = new Set<string>();
  for (const l of likesData ?? []) {
    const row = l as { post_id: string; user_id: string };
    likeCountMap.set(row.post_id, (likeCountMap.get(row.post_id) ?? 0) + 1);
    if (user && row.user_id === user.id) likedByMeSet.add(row.post_id);
  }

  const { data: commentsData } = await supabase
    .from('post_comments')
    .select('post_id')
    .in('post_id', postIds);
  const commentCountMap = new Map<string, number>();
  for (const c of commentsData ?? []) {
    const pid = (c as { post_id: string }).post_id;
    commentCountMap.set(pid, (commentCountMap.get(pid) ?? 0) + 1);
  }

  return posts.map((p) => {
    const prof = profileMap.get(p.user_id);
    return {
      id: p.id,
      userId: p.user_id,
      content: p.content,
      type: p.type as PostType,
      createdAt: p.created_at,
      userName: prof?.name ?? 'Unknown',
      userAvatar: prof?.avatarUrl ?? null,
      userIsPro: isProMap.get(p.user_id) ?? false,
      likeCount: likeCountMap.get(p.id) ?? 0,
      commentCount: commentCountMap.get(p.id) ?? 0,
      likedByMe: likedByMeSet.has(p.id),
    };
  });
}

export async function createPost(
  userId: string,
  content: string,
  type: PostType = 'general'
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { success: false, error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, content: content.trim(), type })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, id: data?.id };
}

export async function updatePost(
  postId: string,
  userId: string,
  content: string,
  type: PostType
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('posts')
    .update({ content: content.trim(), type })
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deletePost(postId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
    return false;
  }
  await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
  return true;
}

export async function getComments(postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from('post_comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) return [];

  const comments = (data ?? []) as Array<{ user_id: string; [k: string]: unknown }>;
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('user_id, name, avatar_url')
    .in('user_id', userIds);
  const profileMap = new Map(
    (profilesData ?? []).map((p: { user_id: string; name: string; avatar_url: string | null }) => [
      p.user_id,
      { name: p.name, avatarUrl: p.avatar_url },
    ])
  );

  const { data: subsData } = await supabase
    .from('subscriptions')
    .select('user_id, plan')
    .in('user_id', userIds);
  const isProMap = new Map(
    (subsData ?? []).map((s: { user_id: string; plan: string }) => [s.user_id, s.plan === 'pro'])
  );

  return comments.map((c) => {
    const prof = profileMap.get(c.user_id);
    return {
      id: c.id as string,
      postId: c.post_id as string,
      userId: c.user_id,
      content: c.content as string,
      createdAt: c.created_at as string,
      userName: prof?.name ?? 'Unknown',
      userAvatar: prof?.avatarUrl ?? null,
      userIsPro: isProMap.get(c.user_id) ?? false,
    };
  });
}

export async function addComment(
  postId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, content: content.trim() });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

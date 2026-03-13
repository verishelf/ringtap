/**
 * Map marker for nearby user (Networking Map)
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { MapPresenceUser } from '@/lib/api';

const MARKER_SIZE = 44;

export type UserMarkerProps = {
  user: MapPresenceUser;
  animValue: Animated.Value;
};

export function UserMarker({ user, animValue }: UserMarkerProps) {
  const colors = useThemeColors();

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderLight,
          opacity: animValue,
          transform: [{ scale: animValue }],
        },
      ]}
    >
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.borderLight }]}>
          <Text style={[styles.letter, { color: colors.textSecondary }]}>
            {(user.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={[styles.nameWrap, { backgroundColor: colors.surface }]}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {user.name || 'Unknown'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: MARKER_SIZE / 2 + 10,
    padding: 4,
  },
  avatar: { width: MARKER_SIZE, height: MARKER_SIZE, borderRadius: MARKER_SIZE / 2 },
  placeholder: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: { fontSize: 18, fontWeight: '700' },
  nameWrap: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    maxWidth: 120,
  },
  name: { fontSize: 11, fontWeight: '600' },
});

/**
 * Renders text with URLs as pressable links.
 */

import * as Linking from 'expo-linking';
import React from 'react';
import { Text, type TextStyle } from 'react-native';

// Match http(s) URLs and www. URLs
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+)/gi;

function normalizeUrl(url: string): string {
  const u = url.trim().replace(/[.,;:!?)]+$/, '');
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export type LinkableTextProps = {
  content: string;
  textStyle: TextStyle;
  linkColor: string;
  numberOfLines?: number;
};

export function LinkableText({ content, textStyle, linkColor, numberOfLines }: LinkableTextProps) {
  if (!content?.trim()) return <Text style={textStyle} numberOfLines={numberOfLines} />;
  const parts = content.split(URL_REGEX).filter(Boolean);
  return (
    <Text style={textStyle} selectable numberOfLines={numberOfLines}>
      {parts.map((part, i) => {
        const isUrl = /^(https?:\/\/|www\.)/i.test(part);
        return isUrl ? (
          <Text
            key={i}
            style={[textStyle, { color: linkColor, textDecorationLine: 'underline' }]}
            onPress={() => Linking.openURL(normalizeUrl(part))}
            suppressHighlighting={false}
          >
            {part}
          </Text>
        ) : (
          <Text key={i} style={textStyle}>{part}</Text>
        );
      })}
    </Text>
  );
}

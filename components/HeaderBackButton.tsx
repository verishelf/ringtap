/**
 * Consistent back button for all headers - arrow only, no text.
 */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

type Props = {
  tintColor?: string;
  canGoBack?: boolean;
};

export function HeaderBackButton({ tintColor, canGoBack = true }: Props) {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const color = tintColor ?? colors.text;

  if (!canGoBack) return null;

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      hitSlop={12}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
        opacity: pressed ? 0.7 : 1,
        backgroundColor: 'transparent',
      })}
    >
      <Ionicons name="arrow-back" size={24} color={color} />
    </Pressable>
  );
}

import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

type Props = React.ComponentProps<typeof BottomTabBar>;

export function GlassTabBar(props: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={styles.container}>
      {/* Glass background — BlurView on iOS, frosted overlay on Android */}
      {Platform.OS === "ios" ? (
        <BlurView
          tint={isDark ? "dark" : "light"}
          intensity={90}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "rgba(20,20,22,0.9)"
                : "rgba(250,250,250,0.92)",
            },
          ]}
        />
      )}
      {/* Top border for glass edge */}
      <View
        style={[
          styles.topBorder,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.08)",
          },
        ]}
      />
      <BottomTabBar {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  topBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: StyleSheet.hairlineWidth,
    zIndex: 1,
  },
});

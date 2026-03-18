// components/ThemedText.tsx
import { Text as RNText, useColorScheme, TextProps } from "react-native";

export default function ThemedText({ style, ...props }: TextProps) {
  const colorScheme = useColorScheme();
  const textColor = colorScheme === "dark" ? "#fff" : "#000";

  return <RNText {...props} style={[{ color: textColor }, style]} />;
}
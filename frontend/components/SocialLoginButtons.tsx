import React from "react";
import { StyleSheet, View, TouchableOpacity, Text, Platform, Alert } from "react-native";
import { useOAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, Rect } from "react-native-svg";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// --- SVG Components ---
const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </Svg>
);

const MicrosoftLogo = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Rect x="0" y="0" width="48" height="48" fill="#f25022" />
    <Rect x="52" y="0" width="48" height="48" fill="#7fbb00" />
    <Rect x="0" y="52" width="48" height="48" fill="#00a1f1" />
    <Rect x="52" y="52" width="48" height="48" fill="#ffbb00" />
  </Svg>
);

export default function SocialLoginButtons() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const isDark = colorScheme === "dark";

  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: "oauth_google" });
  const { startOAuthFlow: startMicrosoftFlow } = useOAuth({ strategy: "oauth_microsoft" });
  const { startOAuthFlow: startAppleFlow } = useOAuth({ strategy: "oauth_apple" });

  const handleOAuth = (flow: any, provider: string) => {
    const redirectUrl = Platform.OS === 'web' ? window.location.origin : Linking.createURL("/", { scheme: "frontend" });

    flow({ redirectUrl })
      .then(async (result: any) => {
        const { createdSessionId, setActive, signIn, signUp } = result;
        const sessionId = createdSessionId || signIn?.createdSessionId || signUp?.createdSessionId;

        if (sessionId && setActive) {
          await setActive({ session: sessionId });
          router.replace("/trips");
        }
      })
      .catch((err: any) => {
        console.error(`[SocialAuth] ${provider} error:`, err);
        if (Platform.OS === 'web' && err?.message?.includes('popup')) {
          Alert.alert("Popup Blocked", "Please enable popups for this site.");
        }
      });
  };

  const buttonStyle = [styles.button, { backgroundColor: isDark ? "#242526" : "white", borderColor: isDark ? "#3E4042" : "#E5E7EB" }];
  const buttonTextStyle = [styles.buttonText, { color: isDark ? "#FFFFFF" : "#1F2937" }];

  return (
    <View style={styles.container}>
      <View style={styles.dividerContainer}>
        <View style={[styles.divider, { backgroundColor: isDark ? "#3E4042" : "#E5E7EB" }]} />
        <Text style={[styles.dividerText, { color: isDark ? "#9BA1A6" : "#6B7280" }]}>or continue with</Text>
        <View style={[styles.divider, { backgroundColor: isDark ? "#3E4042" : "#E5E7EB" }]} />
      </View>

      <View style={styles.buttonGrid}>
        <TouchableOpacity style={buttonStyle} onPress={() => handleOAuth(startGoogleFlow, 'Google')}>
          <View style={styles.iconContainer}><GoogleLogo size={20} /></View>
          <Text style={buttonTextStyle}>Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={buttonStyle} onPress={() => handleOAuth(startMicrosoftFlow, 'Microsoft')}>
          <View style={styles.iconContainer}><MicrosoftLogo size={20} /></View>
          <Text style={buttonTextStyle}>Microsoft</Text>
        </TouchableOpacity>

        {Platform.OS !== "android" && (
          <TouchableOpacity style={buttonStyle} onPress={() => handleOAuth(startAppleFlow, 'Apple')}>
            <View style={styles.iconContainer}><Ionicons name="logo-apple" size={20} color={isDark ? "white" : "black"} /></View>
            <Text style={buttonTextStyle}>Apple</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    width: "100%", 
    marginTop: 24 
  },
  dividerContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 25,
  },
  divider: { 
    flex: 1, 
    height: 1 
  },
  dividerText: { 
    marginHorizontal: 12, 
    fontSize: 14, 
    fontWeight: '500' 
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginTop: 1,
    marginBottom: 7,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    height: 48,
    minWidth: 110,
    flex: 1,
  },
  buttonText: { 
    fontSize: 14, 
    fontWeight: "600" 
  },
  iconContainer: { 
    marginRight: 8, 
    width: 20, 
    alignItems: "center", 
    justifyContent: "center" 
  },
});

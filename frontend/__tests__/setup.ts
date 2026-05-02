import { TextEncoder, TextDecoder } from 'util';
import React from 'react';

// Polyfills for Node environment
Object.assign(global, {
  TextEncoder,
  TextDecoder,
});

// Mock React Native core components and functions
jest.mock('react-native', () => {
  const React = require('react');
  
  return {
    View: ({ children, ...props }: any) => React.createElement('div', props, children),
    Text: ({ children, ...props }: any) => React.createElement('p', props, children),
    ScrollView: ({ children, ...props }: any) => React.createElement('div', props, children),
    FlatList: ({ data, renderItem, ...props }: any) => 
      React.createElement('div', props, data?.map((item: any, i: number) => renderItem?.({ item, index: i }))),
    SectionList: ({ sections, renderItem, ...props }: any) =>
      React.createElement('div', props, sections?.map((section: any, i: number) => 
        React.createElement('div', { key: i }, section.data?.map((item: any, j: number) => renderItem?.({ item, index: j })))
      )),
    Animated: {
      View: ({ children, ...props }: any) => React.createElement('div', props, children),
      timing: jest.fn(),
    },
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (styles: any) => (Array.isArray(styles) ? Object.assign({}, ...styles) : styles),
    },
    Pressable: ({ children, ...props }: any) => React.createElement('button', props, children),
    TouchableOpacity: ({ children, ...props }: any) => React.createElement('button', props, children),
    Image: (props: any) => React.createElement('img', props),
    Platform: {
      OS: 'ios',
      select: jest.fn((obj: any) => obj.ios || obj.default),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
    },
    AppState: {
      addEventListener: jest.fn(() => jest.fn()),
    },
    useWindowDimensions: jest.fn(() => ({ width: 375, height: 812 })),
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock common Expo/React Native components
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => ({
  __esModule: true,
  default: ({ name, size, color }: any) => `Icon:${name}`,
}));

jest.mock('lucide-react-native', () => ({
  Plus: () => 'Plus Icon',
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('@clerk/expo', () => ({
  useAuth: jest.fn(() => ({
    getToken: jest.fn().mockResolvedValue('test-token'),
  })),
  useUser: jest.fn(() => ({
    user: { emailAddresses: [{ emailAddress: 'test@example.com' }] },
    isLoaded: true,
  })),
}));
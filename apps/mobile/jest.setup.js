jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Fonts resolve instantly in tests so the root layout renders synchronously.
jest.mock('expo-font', () => {
  const actual = jest.requireActual('expo-font');
  return {
    ...actual,
    useFonts: () => [true, null],
    isLoaded: () => true,
    loadAsync: jest.fn(async () => {}),
  };
});

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', textDirection: 'ltr' }],
}));

// expo-image is a native module; render a plain host element in tests.
jest.mock('expo-image', () => {
  const React = jest.requireActual('react');
  return { Image: (props) => React.createElement('ExpoImage', props) };
});

// expo-image-picker is native; tests override the launch mocks per scenario.
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));

// expo-camera is native; render a plain host element with granted permissions.
jest.mock('expo-camera', () => {
  const React = jest.requireActual('react');
  return {
    CameraView: React.forwardRef((props, ref) =>
      React.createElement('CameraView', { ...props, ref }),
    ),
    useCameraPermissions: () => [{ granted: true }, jest.fn(async () => ({ granted: true }))],
  };
});

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

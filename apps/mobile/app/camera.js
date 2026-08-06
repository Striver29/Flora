import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen.js';
import { Button } from '../src/components/Button.js';
import { colors, fonts, radii, spacing, typeScale } from '../src/theme.js';

/** Camera modal shell — live capture + recognition arrive in the diagnosis phase. */
export default function CameraModal() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const displayFont = i18n.language === 'ar' ? fonts.displayArabic : fonts.display;
  return (
    <Screen edges={['top', 'bottom']}>
      <Text testID="camera-modal-title" style={[styles.title, { fontFamily: displayFont }]}>
        {t('camera.title')}
      </Text>
      <View style={styles.viewfinder}>
        <Ionicons name="camera" size={48} color={colors.mutedText} />
        <Text style={styles.hint}>{t('camera.hint')}</Text>
      </View>
      <Button label={t('camera.close')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: typeScale.title,
    marginBottom: spacing.lg,
  },
  viewfinder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.greenTint,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  hint: {
    color: colors.mutedText,
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});

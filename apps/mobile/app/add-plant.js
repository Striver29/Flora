import { StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../src/components/Screen.js';
import { Card } from '../src/components/Card.js';
import { Button } from '../src/components/Button.js';
import { colors, fonts, spacing, typeScale } from '../src/theme.js';

/** Placeholder — the add-plant flow (photo identification) lands in a later phase. */
export default function AddPlantScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const displayFont = i18n.language === 'ar' ? fonts.displayArabic : fonts.display;
  return (
    <Screen edges={['top', 'bottom']}>
      <Text testID="add-plant-title" style={[styles.title, { fontFamily: displayFont }]}>
        {t('addPlant.title')}
      </Text>
      <Card style={styles.card}>
        <Text style={styles.hint}>{t('addPlant.hint')}</Text>
      </Card>
      <Button label={t('camera.close')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: typeScale.title,
    marginBottom: spacing.lg,
    marginTop: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  hint: {
    color: colors.mutedText,
    fontFamily: fonts.body,
    fontSize: typeScale.body,
  },
});

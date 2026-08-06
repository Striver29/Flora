import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/Screen.js';
import { Card } from '../../src/components/Card.js';
import { Chip } from '../../src/components/Chip.js';
import { colors, fonts, spacing, typeScale } from '../../src/theme.js';

/** Screen 1a: the garden home. Plant cards arrive with the garden feature phase. */
export default function GardenScreen() {
  const { t, i18n } = useTranslation();
  const displayFont = i18n.language === 'ar' ? fonts.displayArabic : fonts.display;
  return (
    <Screen>
      <Text style={[styles.title, { fontFamily: displayFont }]}>{t('garden.title')}</Text>
      <Text style={styles.subtitle}>{t('garden.subtitle')}</Text>
      <Card style={styles.card}>
        <Chip label={t('garden.filterAll')} selected />
        <Text style={styles.hint}>{t('garden.emptyHint')}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: typeScale.display,
  },
  subtitle: {
    color: colors.mutedText,
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    marginBottom: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  hint: {
    color: colors.mutedText,
    fontFamily: fonts.body,
    fontSize: typeScale.body,
  },
});

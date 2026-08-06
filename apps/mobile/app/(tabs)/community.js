import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/Screen.js';
import { Card } from '../../src/components/Card.js';
import { colors, fonts, spacing, typeScale } from '../../src/theme.js';

export default function CommunityScreen() {
  const { t, i18n } = useTranslation();
  const displayFont = i18n.language === 'ar' ? fonts.displayArabic : fonts.display;
  return (
    <Screen>
      <Text style={[styles.title, { fontFamily: displayFont }]}>{t('community.title')}</Text>
      <Card>
        <Text style={styles.hint}>{t('community.hint')}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: typeScale.display,
    marginBottom: spacing.lg,
  },
  hint: {
    color: colors.mutedText,
    fontFamily: fonts.body,
    fontSize: typeScale.body,
  },
});

import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/Screen.js';
import { Card } from '../../src/components/Card.js';
import { Chip } from '../../src/components/Chip.js';
import { Button } from '../../src/components/Button.js';
import { setLocale } from '../../src/i18n/index.js';
import { colors, fonts, spacing, typeScale } from '../../src/theme.js';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const active = i18n.language;
  return (
    <Screen>
      <Text
        style={[
          styles.title,
          { fontFamily: active === 'ar' ? fonts.displayArabic : fonts.display },
        ]}
      >
        {t('profile.title')}
      </Text>
      <Card>
        <Text style={styles.sectionLabel}>{t('profile.language')}</Text>
        <View style={styles.row}>
          <Chip
            testID="locale-en"
            label={t('profile.english')}
            selected={active === 'en'}
            onPress={() => setLocale('en')}
          />
          <Chip
            testID="locale-ar"
            label={t('profile.arabic')}
            selected={active === 'ar'}
            onPress={() => setLocale('ar')}
          />
        </View>
      </Card>
      <Button
        testID="profile-reminders"
        variant="ghost"
        label={t('profile.reminders')}
        onPress={() => router.push('/reminders')}
        style={styles.remindersButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: typeScale.display,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: typeScale.heading,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  remindersButton: {
    marginTop: spacing.lg,
  },
});

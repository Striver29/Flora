import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/Screen.js';
import { Card } from '../../src/components/Card.js';
import { Button } from '../../src/components/Button.js';
import { colors, fonts, spacing, typeScale } from '../../src/theme.js';

/** Placeholder — the full post thread screen lands in the community phase. */
export default function PostScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const displayFont = i18n.language === 'ar' ? fonts.displayArabic : fonts.display;
  return (
    <Screen edges={['top', 'bottom']}>
      <Text testID="post-title" style={[styles.title, { fontFamily: displayFont }]}>
        {t('post.title')}
      </Text>
      <Card style={styles.card}>
        <Text style={styles.hint}>{String(id)}</Text>
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

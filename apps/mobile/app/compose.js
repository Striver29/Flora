import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { client } from '../src/api/index.js';
import { imageForKey } from '../src/utils/images.js';
import { Screen } from '../src/components/Screen.js';
import { Card } from '../src/components/Card.js';
import { Button } from '../src/components/Button.js';
import { Field } from '../src/components/Field.js';
import { colors, fonts, radii, spacing, typeScale } from '../src/theme.js';

const MAX_IMAGES = 3;

/** Composer: text + up to three images → posts.create; shows the review banner. */
export default function ComposeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const displayFont = i18n.language === 'ar' ? fonts.displayArabic : fonts.display;
  const isMock = (process.env.EXPO_PUBLIC_API_MODE ?? 'mock') === 'mock';

  const [body, setBody] = useState('');
  const [images, setImages] = useState([]);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const addImage = async () => {
    if (images.length >= MAX_IMAGES) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setImages((current) => [...current, result.assets[0].uri].slice(0, MAX_IMAGES));
    }
  };

  const addFlaggedDemoImage = () => {
    setImages((current) => [...current, 'assets/demo/flagged.jpg'].slice(0, MAX_IMAGES));
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    const payload = {
      ...(body.trim() && { body: body.trim() }),
      ...(images.length > 0 && { images }),
    };
    const res = await client.posts.create(payload);
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['feed'] });
    if (res.data.status === 'PENDING_REVIEW') {
      setPending(true);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/community');
  };

  if (pending) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View testID="pending-banner" style={styles.pendingBanner}>
          <Ionicons name="eye-off-outline" size={28} color={colors.terracotta} />
          <Text style={[styles.pendingTitle, { fontFamily: displayFont }]}>
            {t('compose.pendingBanner')}
          </Text>
          <Text style={styles.pendingBody}>{t('compose.pendingBody')}</Text>
        </View>
        <Button
          label={t('diagnose.done')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/community'))}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { fontFamily: displayFont }]}>{t('compose.title')}</Text>
        <Field
          testID="compose-body"
          label={t('compose.title')}
          placeholder={t('compose.placeholder')}
          value={body}
          onChangeText={setBody}
          multiline
        />
        {images.length > 0 ? (
          <View style={styles.thumbRow}>
            {images.map((image) => (
              <Image
                key={image}
                source={imageForKey(image) ?? { uri: image }}
                style={styles.thumb}
                contentFit="cover"
              />
            ))}
          </View>
        ) : null}
        <Button
          testID="compose-add-image"
          variant="ghost"
          label={t('compose.addImage', { count: images.length, max: MAX_IMAGES })}
          onPress={addImage}
          disabled={images.length >= MAX_IMAGES}
          style={styles.rowButton}
        />
        {isMock ? (
          <Button
            testID="dev-flagged-image"
            variant="terracotta"
            label={t('compose.devFlagged')}
            onPress={addFlaggedDemoImage}
            disabled={images.length >= MAX_IMAGES}
            style={styles.rowButton}
          />
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Card style={styles.actions}>
          <Button
            testID="compose-submit"
            label={t('compose.submit')}
            onPress={submit}
            disabled={busy || (!body.trim() && images.length === 0)}
          />
          <Button
            variant="ghost"
            label={t('camera.close')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/community'))}
            style={styles.rowButton}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxl,
  },
  title: {
    color: colors.ink,
    fontSize: typeScale.title,
    marginBottom: spacing.lg,
    marginTop: spacing.xl,
  },
  thumbRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  thumb: {
    borderRadius: radii.md,
    height: 72,
    width: 72,
  },
  rowButton: {
    marginTop: spacing.sm,
  },
  error: {
    color: colors.terracotta,
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  pendingBanner: {
    alignItems: 'center',
    backgroundColor: colors.terracottaTint,
    borderRadius: radii.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.xxl,
    padding: spacing.xl,
  },
  pendingTitle: {
    color: colors.ink,
    fontSize: typeScale.heading,
    textAlign: 'center',
  },
  pendingBody: {
    color: colors.mutedText,
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    textAlign: 'center',
  },
});

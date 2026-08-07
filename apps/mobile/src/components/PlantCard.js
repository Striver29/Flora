import { Pressable, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { WaterChip } from './WaterChip.js';
import { imageForKey } from '../utils/images.js';
import { colors, fonts, radii, spacing, typeScale } from '../theme.js';

/** Generic leafy blurhash shown while a plant photo loads. */
const BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

/**
 * Grid card per design 1a: photo, nickname, species common name, watering pill.
 */
export function PlantCard({ plant, speciesName, onPress }) {
  return (
    <Pressable
      testID={`plant-card-${plant.id}`}
      accessibilityRole="button"
      accessibilityLabel={plant.nickname}
      onPress={onPress}
      style={styles.card}
    >
      <Image
        source={imageForKey(plant.photoKey)}
        placeholder={{ blurhash: BLURHASH }}
        style={styles.photo}
        contentFit="cover"
        transition={150}
      />
      <Text style={styles.nickname}>{plant.nickname}</Text>
      {speciesName ? <Text style={styles.species}>{speciesName}</Text> : null}
      <WaterChip nextDueAt={plant.nextDueAt} testID={`plant-chip-${plant.id}`} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderColor: colors.hairline,
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  photo: {
    borderRadius: radii.md,
    height: 108,
    width: '100%',
  },
  nickname: {
    color: colors.ink,
    fontFamily: fonts.displaySemi,
    fontSize: typeScale.body,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  species: {
    color: colors.mutedText,
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    paddingHorizontal: spacing.xs,
  },
  // chip gets a hair of breathing room inside the card
});

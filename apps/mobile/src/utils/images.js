import plant1 from '../../assets/demo/plant-1.jpg';
import plant2 from '../../assets/demo/plant-2.jpg';
import plant3 from '../../assets/demo/plant-3.jpg';
import plant4 from '../../assets/demo/plant-4.jpg';
import plant5 from '../../assets/demo/plant-5.jpg';
import plant6 from '../../assets/demo/plant-6.jpg';

/** Bundled demo photos keyed by the photoKey strings used in the mock data. */
export const demoImages = {
  'assets/demo/plant-1.jpg': plant1,
  'assets/demo/plant-2.jpg': plant2,
  'assets/demo/plant-3.jpg': plant3,
  'assets/demo/plant-4.jpg': plant4,
  'assets/demo/plant-5.jpg': plant5,
  'assets/demo/plant-6.jpg': plant6,
};

/**
 * Resolve a mock photoKey to a bundled asset (null when unknown).
 * @param {string|null} photoKey
 */
export function imageForKey(photoKey) {
  return (photoKey && demoImages[photoKey]) || null;
}

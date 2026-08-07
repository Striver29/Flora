/**
 * Canned RecognitionResult-shaped fixtures for the mock diagnosis flow.
 * Select the next one with mockClient.setNextDiagnosisFixture(name); default is random.
 * 'blurry' has confidence < 0.55 and therefore surfaces lowConfidence: true.
 */
export const diagnosisFixtures = {
  'healthy-basil': {
    species: [
      {
        speciesId: 'sp1',
        scientificName: 'Ocimum basilicum',
        commonNames: ['Basil', 'حبق'],
        probability: 0.93,
      },
      { scientificName: 'Ocimum tenuiflorum', commonNames: ['Holy basil'], probability: 0.05 },
    ],
    health: { isHealthy: true, issues: [], confidence: 0.91 },
  },
  'diseased-tomato': {
    species: [
      {
        speciesId: 'sp2',
        scientificName: 'Solanum lycopersicum',
        commonNames: ['Tomato', 'بندورة'],
        probability: 0.88,
      },
    ],
    health: {
      isHealthy: false,
      issues: [
        {
          name: 'Early blight',
          probability: 0.81,
          treatmentHints: [
            'Remove the affected lower leaves',
            'Apply a copper-based fungicide',
            'Water at the base — keep the foliage dry',
          ],
        },
        {
          name: 'Nitrogen deficiency',
          probability: 0.22,
          treatmentHints: ['Feed with a balanced fertilizer every two weeks'],
        },
      ],
      confidence: 0.84,
    },
  },
  blurry: {
    species: [{ scientificName: 'Unknown', commonNames: [], probability: 0.31 }],
    health: { isHealthy: true, issues: [], confidence: 0.34 },
  },
};

export const fixtureNames = Object.keys(diagnosisFixtures);

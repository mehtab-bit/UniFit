export interface UniFitFeature {
  id: string;
  title: string;
  description: string;
  iconName: 'activity' | 'pie-chart' | 'cpu' | 'trending-up' | 'volume-2' | 'bar-chart-2';
  badge: string;
}

export const UNIFIT_FEATURES: UniFitFeature[] = [
  {
    id: 'feature-1',
    title: 'Personalized Fitness Plans',
    description: 'Workouts tailored to your goals, fitness level, preferences, and abilities.',
    iconName: 'activity',
    badge: 'Tailored',
  },
  {
    id: 'feature-2',
    title: 'Dietary Personalization',
    description: 'Food recommendations based on Vegetarian, Vegan, Eggetarian, or Non-Vegetarian preferences.',
    iconName: 'pie-chart',
    badge: 'Nutrition',
  },
  {
    id: 'feature-3',
    title: 'Guided Exercise Coach',
    description: 'Get real-time guidance, rep tracking, and form feedback during supported exercises.',
    iconName: 'activity',
    badge: 'Real-Time Guidance',
  },
  {
    id: 'feature-4',
    title: 'Adaptive Progression',
    description: 'Weekly plans automatically adjust based on your performance, consistency, and form.',
    iconName: 'trending-up',
    badge: 'Dynamic',
  },
  {
    id: 'feature-5',
    title: 'Inclusive & Accessible Fitness',
    description: 'Audio guidance for visually impaired users and captions/visual feedback for deaf or hard-of-hearing users.',
    iconName: 'volume-2',
    badge: 'Accessible',
  },
  {
    id: 'feature-6',
    title: 'Multi-Activity Tracking',
    description: 'Track walking, running, cycling, swimming, and strength workouts with personalized progress insights.',
    iconName: 'bar-chart-2',
    badge: 'Analytics',
  },
];

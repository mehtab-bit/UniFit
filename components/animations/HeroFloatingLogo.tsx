import React, { useEffect } from 'react';
import { Image, ViewStyle, StyleProp, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useAnimationTheme } from '../../context/AnimationContext';

interface HeroFloatingLogoProps {
  source?: ImageSourcePropType;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const HeroFloatingLogo: React.FC<HeroFloatingLogoProps> = ({
  source = require('../../assets/images/unifit-logo.png'),
  size = 36,
  style,
  accessibilityLabel = 'UniFit logo',
}) => {
  const { config, performanceMode } = useAnimationTheme();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (config.enableFloatingAnimations && performanceMode === 'standard') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(translateY);
      translateY.value = 0;
    }

    return () => {
      cancelAnimation(translateY);
    };
  }, [config.enableFloatingAnimations, performanceMode, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
        accessible={true}
        accessibilityLabel={accessibilityLabel}
      />
    </Animated.View>
  );
};

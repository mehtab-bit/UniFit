import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';

import { Surface } from '../../context/SurfaceContext';
import { SurfaceType } from '../../constants/colors';

interface HeroSurfaceProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  surface?: SurfaceType;
}

export function HeroSurface({
  children,
  variant = 'primary',
  surface = 'dark',
  style,
  ...rest
}: HeroSurfaceProps) {
  return (
    <Surface type={surface}>
      <View 
        style={[
          styles.container, 
          variant === 'primary' ? styles.primary : styles.secondary,
          style
        ]} 
        {...rest}
      >
        {children}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.borderRadius.xl, // Make it very rounded for premium feel
    padding: Layout.spacing.xl,
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: Colors.navyDeep,
  },
  secondary: {
    backgroundColor: Colors.brandDeep,
  }
});

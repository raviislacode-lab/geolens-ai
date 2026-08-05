import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '@/theme';

type Props = {
  x: number;
  y: number;
  active: boolean;
};

const COUNT = 14;

/** Burst of sparks + shock ring at the slam point */
export function SlamParticles({ x, y, active }: Props) {
  const anims = useRef(
    Array.from({ length: COUNT }, () => ({
      tx: new Animated.Value(0),
      ty: new Animated.Value(0),
      op: new Animated.Value(0),
      sc: new Animated.Value(0.4),
    }))
  ).current;

  const meta = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = (i / COUNT) * Math.PI * 2 + (i % 2) * 0.18;
        const dist = 40 + (i % 4) * 16;
        return {
          angle,
          dist,
          size: 5 + (i % 3) * 2.5,
          color: i % 3 === 0 ? colors.accentIcon : i % 3 === 1 ? '#E8C96A' : '#FFFFFF',
        };
      }),
    []
  );

  useEffect(() => {
    if (!active) return;

    anims.forEach((a) => {
      a.tx.setValue(0);
      a.ty.setValue(0);
      a.op.setValue(1);
      a.sc.setValue(0.5);
    });

    Animated.parallel(
      anims.map((a, i) => {
        const { angle, dist } = meta[i];
        return Animated.parallel([
          Animated.timing(a.tx, {
            toValue: Math.cos(angle) * dist,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(a.ty, {
            toValue: Math.sin(angle) * dist,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(a.sc, {
            toValue: 1.15,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(a.op, {
            toValue: 0,
            duration: 420,
            delay: 40,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]);
      })
    ).start();
  }, [active, anims, meta]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <ShockRing x={x} y={y} />
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              left: x - meta[i].size / 2,
              top: y - meta[i].size / 2,
              width: meta[i].size,
              height: meta[i].size,
              borderRadius: meta[i].size / 2,
              backgroundColor: meta[i].color,
              opacity: a.op,
              transform: [
                { translateX: a.tx },
                { translateY: a.ty },
                { scale: a.sc },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function ShockRing({ x, y }: { x: number; y: number }) {
  const scale = useRef(new Animated.Value(0.2)).current;
  const opacity = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    scale.setValue(0.2);
    opacity.setValue(0.85);
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 2.4,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          left: x - 28,
          top: y - 28,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.accentIcon,
    backgroundColor: 'transparent',
  },
});

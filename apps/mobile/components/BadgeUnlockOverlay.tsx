import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
  Vibration,
} from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing, typography } from '@/theme';
import { useBadgeUnlockOptional } from '@/context/BadgeUnlockContext';
import { BadgeArt } from './BadgeSection';
import { SlamParticles } from './SlamParticles';
import type { BadgeStatus } from '@/lib/badges';
import { getBadgePalette } from '@/lib/badgeColors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SPAWN_SIZE = 104;
const HOLD_MS = 650;
const ZOOM_OUT_MS = 900;
const SLAM_MS = 280;

export function BadgeUnlockOverlay() {
  const ctx = useBadgeUnlockOptional();
  const badge = ctx?.activeBadge ?? null;

  const overlay = useRef(new Animated.Value(0)).current;
  const spawnScale = useRef(new Animated.Value(0.4)).current;
  const caption = useRef(new Animated.Value(0)).current;
  const posX = useRef(new Animated.Value(0)).current;
  const posY = useRef(new Animated.Value(0)).current;
  const flyScale = useRef(new Animated.Value(1)).current;
  const flyRotate = useRef(new Animated.Value(0)).current;
  const impact = useRef(new Animated.Value(1)).current;

  const [phase, setPhase] = useState<'idle' | 'spawn' | 'fly' | 'done'>('idle');
  const [particles, setParticles] = useState<{ x: number; y: number } | null>(null);
  const running = useRef(false);

  const badgeStatus: BadgeStatus | null = useMemo(() => {
    if (!badge) return null;
    return { ...badge, unlocked: true };
  }, [badge]);

  useEffect(() => {
    if (!ctx || !badge || !badgeStatus || running.current) return;

    let cancelled = false;
    running.current = true;
    setPhase('spawn');
    setParticles(null);
    ctx.clearFlightTarget();

    const startX = (SCREEN_W - SPAWN_SIZE) / 2;
    const startY = SCREEN_H * 0.34 - SPAWN_SIZE / 2;
    posX.setValue(startX);
    posY.setValue(startY);
    spawnScale.setValue(0.4);
    flyScale.setValue(1);
    flyRotate.setValue(0);
    impact.setValue(1);
    overlay.setValue(0);
    caption.setValue(0);

    const run = async () => {
      await new Promise<void>((resolve) => {
        Animated.parallel([
          Animated.timing(overlay, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(spawnScale, {
            toValue: 1,
            friction: 5,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.timing(caption, {
            toValue: 1,
            duration: 280,
            delay: 120,
            useNativeDriver: true,
          }),
        ]).start(() => resolve());
      });

      try {
        Vibration.vibrate(12);
      } catch {
        /* optional */
      }

      await delay(HOLD_MS);
      if (cancelled) return;
      setPhase('fly');

      // Navigate early so the badges grid can mount + measure the real slot
      try {
        router.navigate({ pathname: '/badges', params: { celebrate: badge.id } });
      } catch {
        /* already there */
      }

      const targetPromise = ctx.waitForFlightTarget(4500);

      // Slow zoom-out in place
      await new Promise<void>((resolve) => {
        Animated.parallel([
          Animated.timing(caption, {
            toValue: 0,
            duration: 320,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(flyScale, {
            toValue: 0.62,
            duration: ZOOM_OUT_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(posY, {
            toValue: startY - 28,
            duration: ZOOM_OUT_MS,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(overlay, {
            toValue: 0.35,
            duration: ZOOM_OUT_MS,
            useNativeDriver: true,
          }),
        ]).start(() => resolve());
      });

      if (cancelled) return;

      // Prefer the freshest measure right before slam
      let target;
      try {
        await targetPromise;
        target = ctx.getLatestFlightTarget() ?? (await ctx.waitForFlightTarget(800));
      } catch {
        running.current = false;
        ctx.finishCelebration();
        return;
      }
      // One more tick in case scroll just finished
      await delay(60);
      target = ctx.getLatestFlightTarget() ?? target;
      if (cancelled || !target) return;

      const endX = target.x + target.width / 2 - SPAWN_SIZE / 2;
      const endY = target.y + target.height / 2 - SPAWN_SIZE / 2;
      const endScale = Math.min(target.width, target.height) / SPAWN_SIZE;
      const impactX = target.x + target.width / 2;
      const impactY = target.y + target.height / 2;

      // Slam into the measured slot
      await new Promise<void>((resolve) => {
        Animated.parallel([
          Animated.timing(posX, {
            toValue: endX,
            duration: SLAM_MS,
            easing: Easing.in(Easing.poly(4)),
            useNativeDriver: true,
          }),
          Animated.timing(posY, {
            toValue: endY,
            duration: SLAM_MS,
            easing: Easing.in(Easing.poly(4)),
            useNativeDriver: true,
          }),
          Animated.timing(flyScale, {
            toValue: endScale,
            duration: SLAM_MS,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(flyRotate, {
            toValue: 1,
            duration: SLAM_MS * 0.65,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => resolve());
      });

      if (cancelled) return;

      flyRotate.setValue(0);
      setParticles({ x: impactX, y: impactY });

      try {
        Vibration.vibrate([0, 12, 40, 28]);
      } catch {
        /* optional */
      }

      await new Promise<void>((resolve) => {
        Animated.sequence([
          Animated.timing(impact, {
            toValue: 0.7,
            duration: 55,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(impact, {
            toValue: 1,
            friction: 3,
            tension: 280,
            useNativeDriver: true,
          }),
        ]).start(() => resolve());
      });

      if (cancelled) return;
      setPhase('done');

      await delay(280);

      await new Promise<void>((resolve) => {
        Animated.timing(overlay, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => resolve());
      });

      setParticles(null);
      running.current = false;
      ctx.finishCelebration();
    };

    run();

    return () => {
      cancelled = true;
      running.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badge?.id]);

  if (!ctx || !badgeStatus) return null;

  const palette = getBadgePalette(badgeStatus);
  const rotate = flyRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '14deg'],
  });

  // Absolute overlay (not Modal) so coords match measureInWindow on the badges grid
  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View
        pointerEvents="none"
        style={[
          styles.dim,
          {
            opacity: overlay.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.badgeWrap,
          {
            transform: [
              { translateX: posX },
              { translateY: posY },
              {
                scale: Animated.multiply(
                  Animated.multiply(spawnScale, flyScale),
                  impact
                ),
              },
              { rotate },
            ],
          },
        ]}
      >
        <View style={[styles.badgeGlow, { backgroundColor: palette.fill, shadowColor: palette.ink }]}>
          <BadgeArt badge={badgeStatus} size={88} />
        </View>
      </Animated.View>

      {particles ? (
        <SlamParticles x={particles.x} y={particles.y} active />
      ) : null}

      {phase === 'spawn' ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.captionWrap, { opacity: caption }]}
        >
          <Text style={styles.eyebrow}>New badge</Text>
          <Text style={styles.title}>{badgeStatus.title}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.textDark,
  },
  badgeWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SPAWN_SIZE,
    height: SPAWN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGlow: {
    width: SPAWN_SIZE,
    height: SPAWN_SIZE,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    shadowColor: '#2F6F5E',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  captionWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: SCREEN_H * 0.34 + SPAWN_SIZE / 2 + 18,
    alignItems: 'center',
  },
  eyebrow: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.accentIcon,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    ...typography.heading,
    fontSize: 24,
    textAlign: 'center',
    color: '#FFFFFF',
  },
});

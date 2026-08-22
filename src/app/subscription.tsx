import { useUser } from '@clerk/expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Animated, BackHandler, Easing, Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { calculateYearlyDiscount, getSubscriptionProduct, SUBSCRIPTION_PLANS, type BillingInterval, type PlanId } from '@/features/subscription/subscription-config';
import { dismissSubscriptionForSession } from '@/features/subscription/subscription-entry';
import { startSubscriptionCheckout, restoreSubscription } from '@/features/subscription/subscription-service';

const LIME = '#A8FF00';

function CloseIcon({ size }: { size: number }) { return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M6 6l12 12M18 6 6 18" fill="none" stroke="#FFF" strokeWidth={2.2} strokeLinecap="round" /></Svg>; }
function CheckIcon({ size }: { size: number }) { return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="m5 12 4 4L19 6" fill="none" stroke={LIME} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>; }
function Price({ value, fontSize, intervalSize }: { value: string; fontSize: number; intervalSize: number }) {
  const [amount, interval] = value.split(' /');
  return <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.price, { fontSize, lineHeight: Math.round(fontSize * 1.24) }]}>{amount}{interval ? <Text style={[styles.priceInterval, { fontSize: intervalSize }]}> /{interval}</Text> : null}</Text>;
}

function PanelBackground({ planId }: { planId: PlanId }) {
  const proOpacity = useState(() => new Animated.Value(planId === 'pro' ? 1 : 0))[0];
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    Animated.timing(proOpacity, {
      toValue: planId === 'pro' ? 1 : 0,
      duration: reduceMotion ? 0 : 320,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [planId, proOpacity, reduceMotion]);

  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: proOpacity.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="starterBase" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#272726" /><Stop offset="0.52" stopColor="#3D3A36" /><Stop offset="1" stopColor="#686056" /></LinearGradient>
          <RadialGradient id="starterGlow" cx="68%" cy="72%" rx="66%" ry="66%"><Stop offset="0" stopColor="#B2A391" stopOpacity="0.42" /><Stop offset="0.3" stopColor="#7E7366" stopOpacity="0.26" /><Stop offset="1" stopColor="#7E7366" stopOpacity="0" /></RadialGradient>
          <RadialGradient id="starterLight" cx="22%" cy="12%" rx="45%" ry="45%"><Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.08" /><Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" rx="24" ry="24" fill="url(#starterBase)" /><Rect width="100%" height="100%" rx="24" ry="24" fill="url(#starterGlow)" /><Rect width="100%" height="100%" rx="24" ry="24" fill="url(#starterLight)" />
      </Svg>
    </Animated.View>
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: proOpacity }]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="proBase" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#19351D" /><Stop offset="0.52" stopColor="#28562A" /><Stop offset="1" stopColor="#477C35" /></LinearGradient>
          <RadialGradient id="proGlow" cx="65%" cy="76%" rx="70%" ry="70%"><Stop offset="0" stopColor="#9BFF45" stopOpacity="0.38" /><Stop offset="0.34" stopColor="#58B72D" stopOpacity="0.28" /><Stop offset="1" stopColor="#4A9B23" stopOpacity="0" /></RadialGradient>
          <RadialGradient id="proLight" cx="18%" cy="10%" rx="45%" ry="45%"><Stop offset="0" stopColor="#C6FFAA" stopOpacity="0.09" /><Stop offset="1" stopColor="#C6FFAA" stopOpacity="0" /></RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" rx="24" ry="24" fill="url(#proBase)" /><Rect width="100%" height="100%" rx="24" ry="24" fill="url(#proGlow)" /><Rect width="100%" height="100%" rx="24" ry="24" fill="url(#proLight)" />
      </Svg>
    </Animated.View>
  </View>;
}

export default function SubscriptionScreen() {
  const { user } = useUser();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { width, height } = useWindowDimensions();
  const userId = user?.id;
  const [planId, setPlanId] = useState<PlanId>('starter');
  const [proInterval, setProInterval] = useState<BillingInterval>('yearly');
  const [pending, setPending] = useState<'checkout' | 'restore' | null>(null);
  const [message, setMessage] = useState('');
  const plan = SUBSCRIPTION_PLANS[planId];
  const interval = planId === 'starter' ? 'monthly' : proInterval;
  const product = getSubscriptionProduct(planId, interval);
  const proDiscount = calculateYearlyDiscount(SUBSCRIPTION_PLANS.pro.products.yearly!.minorUnits, SUBSCRIPTION_PLANS.pro.products.monthly!.minorUnits);
  const scale = Math.min(1, width / 432, height / 940);
  const size = (value: number, minimum = 0) => Math.max(minimum, Math.round(value * scale));

  const finishIntro = useCallback(() => {
    if (source === 'settings') {
      if (router.canGoBack()) router.back();
      else router.replace('/settings');
      return;
    }
    if (userId) dismissSubscriptionForSession(userId);
    router.replace('/onboarding');
  }, [source, userId]);

  useEffect(() => {
    const closeOnBack = () => {
      void finishIntro();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', closeOnBack);
    if (Platform.OS !== 'web') return () => subscription.remove();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') void finishIntro();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      subscription.remove();
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [finishIntro]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, []);

  const choosePlan = (nextPlan: PlanId) => {
    setPlanId(nextPlan);
    setMessage(`${nextPlan === 'starter' ? 'Starter' : 'Pro'} plan selected.`);
  };

  const chooseProInterval = (nextInterval: BillingInterval) => {
    setProInterval(nextInterval);
    setMessage(`Pro ${nextInterval} billing selected.`);
  };

  const checkout = async () => {
    if (pending) return;
    setPending('checkout');
    setMessage('Opening secure checkout.');
    try { await startSubscriptionCheckout(product); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Checkout is unavailable.'); }
    finally { setPending(null); }
  };

  const restore = async () => {
    if (pending) return;
    setPending('restore');
    setMessage('Looking for an existing subscription.');
    try { await restoreSubscription(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not restore a subscription.'); }
    finally { setPending(null); }
  };

  const showPriceCardsInRow = true;

  return <SafeAreaView accessibilityViewIsModal style={[styles.screen, { height }]} edges={['top', 'bottom']}>
      <View style={[styles.container, { maxWidth: size(432), paddingHorizontal: size(20, 12), paddingTop: size(32, 8), paddingBottom: size(25, 8) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close subscription screen" onPress={finishIntro} style={({ pressed }) => [styles.close, { width: size(46, 36), height: size(46, 36), borderRadius: size(23, 18) }, pressed && styles.pressed]}><CloseIcon size={size(24, 18)} /></Pressable>
        <Text accessibilityRole="header" style={[styles.title, { width: size(250), marginTop: size(12, 4), fontSize: size(40, 27), lineHeight: size(43, 29) }]}>Unlock your{`\n`}productivity</Text>
        <View accessibilityRole="tablist" style={[styles.tabs, { width: size(328), marginTop: size(31, 8), gap: size(10, 6) }]}>
          {(['starter', 'pro'] as const).map((id) => <Pressable key={id} accessibilityRole="tab" accessibilityState={{ selected: planId === id }} onPress={() => choosePlan(id)} style={[styles.tab, { minHeight: size(48, 32) }, planId === id && styles.tabSelected]}><Text style={[styles.tabText, { fontSize: size(18, 12) }, planId === id && styles.tabTextSelected]}>{id === 'starter' ? 'Starter' : 'Pro'}</Text></Pressable>)}
        </View>
        <Text style={[styles.supporting, { marginTop: size(38, 8), fontSize: size(15, 11), lineHeight: size(20, 14) }]}>Benefits are accessible across web and mobile app under the same account</Text>

        <View style={[styles.benefits, { marginTop: size(22, 6), paddingHorizontal: size(32, 4), gap: size(20, 5) }]}>
          {plan.benefits.map((benefit, index) => <View key={benefit}>{plan.supportingLabel && index === 1 ? <Text style={[styles.benefitLabel, { marginBottom: size(12, 4), fontSize: size(15, 10), lineHeight: size(21, 14) }]}>{plan.supportingLabel}</Text> : null}<View style={[styles.benefitRow, { minHeight: size(24, 16), gap: size(5, 3) }]}><CheckIcon size={size(22, 14)} /><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.benefitText, { fontSize: size(17, 11), lineHeight: size(23, 15) }]}>{benefit}</Text></View></View>)}
        </View>

        <View style={[styles.purchasePanel, { paddingHorizontal: size(18, 9), paddingTop: size(19, 8), paddingBottom: size(23, 8), borderRadius: size(24, 16) }, planId === 'pro' && styles.proPanel]}>
          <PanelBackground planId={planId} />
          {planId === 'pro' ? <View accessibilityRole="radiogroup" style={[styles.priceGrid, showPriceCardsInRow && styles.priceGridWide]}>{(['yearly', 'monthly'] as const).map((choice) => {
            const option = getSubscriptionProduct('pro', choice);
            const selected = proInterval === choice;
            return <Pressable key={choice} accessibilityRole="radio" accessibilityLabel={`Pro ${choice}, ${option.formattedPrice}, ${option.billingNote}`} accessibilityState={{ checked: selected }} onPress={() => chooseProInterval(choice)} style={[styles.priceCard, styles.proPriceCard, { minHeight: size(98, 48), paddingHorizontal: size(17, 7), paddingVertical: size(13, 5), borderRadius: size(12, 8) }, showPriceCardsInRow && styles.priceCardWide, selected && styles.priceSelected, selected && styles.proPriceSelected]}><View style={styles.priceHeader}><Text style={[styles.interval, { fontSize: size(16, 10) }]}>{choice === 'yearly' ? 'Yearly' : 'Monthly'}</Text>{choice === 'yearly' && proDiscount > 0 ? <Text style={[styles.discount, { fontSize: size(13, 9) }]}>-{proDiscount}%</Text> : null}</View><Price value={option.formattedPrice} fontSize={size(22, 12)} intervalSize={size(12, 8)} /><Text style={[styles.billing, { fontSize: size(15, 9) }]}>{option.billingNote}</Text></Pressable>;
          })}</View> : <View style={[styles.priceCard, { minHeight: size(98, 48), paddingHorizontal: size(17, 7), paddingVertical: size(13, 5), borderRadius: size(12, 8) }, styles.priceSelected]}><Price value={product.formattedPrice} fontSize={size(29, 17)} intervalSize={size(16, 10)} /><Text style={[styles.billing, { fontSize: size(15, 9) }]}>{product.billingNote}</Text></View>}

          <Pressable accessibilityRole="button" accessibilityState={{ busy: pending === 'checkout', disabled: pending !== null }} disabled={pending !== null} onPress={() => void checkout()} style={({ pressed }) => [styles.upgrade, { minHeight: size(66, 38), marginTop: size(20, 7) }, pressed && styles.upgradePressed, pending && styles.disabled]}>{pending === 'checkout' ? <ActivityIndicator color="#050505" /> : <Text style={[styles.upgradeText, { fontSize: size(20, 14) }]}>Upgrade</Text>}</Pressable>
          <Pressable accessibilityRole="button" disabled={pending !== null} onPress={() => void restore()} style={[styles.restore, { minHeight: size(48, 30) }]}><Text style={[styles.restoreText, { fontSize: size(16, 11) }]}>{pending === 'restore' ? 'Restoring…' : 'Restore subscription'}</Text></Pressable>
          <View accessibilityLiveRegion="polite" style={styles.live}><Text style={styles.liveText}>{message}</Text></View>
          <View style={[styles.legal, { minHeight: size(38, 24), gap: size(10, 5) }]}><Text accessibilityRole="link" onPress={() => void Linking.openURL('https://narrial.ai/privacy')} style={[styles.legalLink, { fontSize: size(14, 10) }]}>Privacy Policy</Text><Text style={styles.bullet}>•</Text><Text accessibilityRole="link" onPress={() => void Linking.openURL('https://narrial.ai/terms')} style={[styles.legalLink, { fontSize: size(14, 10) }]}>Terms of Service</Text></View>
        </View>
      </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', overflow: 'hidden', backgroundColor: '#0B0C0B' }, container: { flex: 1, width: '100%', alignSelf: 'center', overflow: 'hidden' },
  close: { width: 46, height: 46, alignSelf: 'flex-end', alignItems: 'center', justifyContent: 'center', borderRadius: 23, backgroundColor: '#252625' }, pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] }, closeCompact: { width: 46, height: 46, borderRadius: 23 },
  title: { width: 250, alignSelf: 'center', marginTop: 12, color: '#FFF', fontSize: 40, lineHeight: 43, fontWeight: '900', letterSpacing: -1.6 }, titleCompact: { marginTop: 4, fontSize: 38, lineHeight: 41, letterSpacing: -1.4 },
  tabs: { width: 328, alignSelf: 'center', marginTop: 31, flexDirection: 'row', gap: 10 }, tabsCompact: { marginTop: 31 }, tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#0A0B0A', borderWidth: 1, borderColor: '#292B29' }, tabSelected: { backgroundColor: '#292A29', borderColor: '#292A29' }, tabText: { color: '#F4F4F4', fontSize: 18, fontWeight: '600' }, tabTextSelected: { color: '#FFF' },
  supporting: { maxWidth: 380, alignSelf: 'center', marginTop: 38, color: '#8F918F', fontSize: 15, lineHeight: 20, textAlign: 'center' }, supportingCompact: { marginTop: 30, fontSize: 14, lineHeight: 19 },
  benefits: { marginTop: 22, paddingHorizontal: 32, gap: 20 }, benefitsCompact: { marginTop: 22, gap: 20 }, benefitRow: { minHeight: 24, flexDirection: 'row', alignItems: 'flex-start', gap: 5 }, benefitRowCompact: { minHeight: 24, gap: 5 }, benefitText: { flex: 1, color: '#F4F4F4', fontSize: 17, lineHeight: 23, fontWeight: '400' }, benefitTextCompact: { fontSize: 17, lineHeight: 23 }, benefitLabel: { marginBottom: 12, color: '#A7A8A7', fontSize: 15, lineHeight: 21, fontWeight: '700' }, benefitLabelCompact: { marginBottom: 12, fontSize: 15, lineHeight: 21 },
  purchasePanel: { marginTop: 'auto', overflow: 'visible', backgroundColor: '#272726', borderWidth: 1, borderColor: 'rgba(255,255,255,0.055)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 40, shadowOffset: { width: 0, height: 20 } }, proPanel: { backgroundColor: '#19351D', borderColor: 'rgba(168,255,42,0.2)', shadowColor: '#68D536', shadowOpacity: 0.48, shadowRadius: 52, shadowOffset: { width: 0, height: 14 } },
  priceGrid: { gap: 12 }, priceGridWide: { flexDirection: 'row' }, priceCard: { minHeight: 98, justifyContent: 'center', paddingHorizontal: 17, paddingVertical: 13, borderRadius: 12, backgroundColor: 'rgba(15,15,14,0.2)', borderWidth: 1, borderColor: '#62615F' }, proPriceCard: { backgroundColor: 'rgba(24,62,27,0.72)', borderColor: 'rgba(168,255,42,0.24)' }, proPriceSelected: { backgroundColor: 'rgba(43,83,38,0.78)', shadowColor: '#70DC28', shadowOpacity: 0.16, shadowRadius: 22 }, priceCardCompact: { minHeight: 96, paddingHorizontal: 17, paddingVertical: 12, borderRadius: 12 }, priceCardWide: { flex: 1 }, priceSelected: { borderColor: '#F5F5F5', borderWidth: 2 }, priceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, interval: { color: '#FFF', fontSize: 16, fontWeight: '800' }, discount: { color: LIME, fontSize: 13, fontWeight: '900' }, price: { color: '#FFF', fontSize: 29, lineHeight: 36, fontWeight: '400' }, priceCompact: { fontSize: 28, lineHeight: 35 }, priceInterval: { color: '#C2C0BE', fontSize: 16, fontWeight: '400' }, billing: { marginTop: 2, color: '#C2C0BE', fontSize: 15 }, billingCompact: { fontSize: 14 },
  upgrade: { minHeight: 66, marginTop: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#FFF' }, upgradePressed: { backgroundColor: '#DBDBDB', transform: [{ scale: 0.99 }] }, upgradeText: { color: '#050505', fontSize: 20, fontWeight: '500' }, disabled: { opacity: 0.65 }, restore: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, restoreText: { color: '#C9C7C5', fontSize: 16, fontWeight: '400' }, live: { position: 'absolute', width: 1, height: 1, overflow: 'hidden' }, liveText: { color: '#D0CECB', fontSize: 12, lineHeight: 16, textAlign: 'center' },
  legal: { minHeight: 38, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 }, legalLink: { color: '#C9C7C5', fontSize: 14 }, bullet: { color: '#D2D0CE' },
});

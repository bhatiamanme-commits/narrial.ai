import { useUser } from '@clerk/expo';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { getBackAction } from '@/features/navigation/navigation-utils';
import { ChooseAccountCard } from '@/features/social-accounts/choose-account-card';
import { getPublishableGeneratedVideo } from '@/features/publishing/publishing-workflow';
import { startSchedulingDraft } from '@/features/scheduling/scheduling-service';
import { getConnectedSocialAccounts, getSavedPublishingTargets, isSocialAccountValid, savePublishingTargets, type SocialAccount } from '@/features/social-accounts/social-accounts';

const LIME = '#A8FF00';
const NEXT_PUBLISHING_ROUTE = '/schedule-post' as const;

function Icon({ name }: { name: 'back' | 'more' | 'arrow' }) {
  if (name === 'more') return <Svg width={27} height={27} viewBox="0 0 24 24"><Circle cx="5" cy="12" r="1.8" fill="#FFF"/><Circle cx="12" cy="12" r="1.8" fill="#FFF"/><Circle cx="19" cy="12" r="1.8" fill="#FFF"/></Svg>;
  const path = name === 'back' ? 'm15 18-6-6 6-6M9 12h10' : 'm9 18 6-6-6-6M15 12H4';
  return <Svg width={27} height={27} viewBox="0 0 24 24"><Path d={path} fill="none" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

function AccountListSkeleton() {
  return <View accessibilityLabel="Loading connected accounts" accessibilityState={{ busy: true }} style={styles.list}>{[0, 1, 2, 3].map((item) => <View key={item} style={styles.skeletonCard}><View style={styles.skeletonAvatar}/><View style={styles.skeletonCopy}><View style={styles.skeletonName}/><View style={styles.skeletonHandle}/></View></View>)}</View>;
}

export default function ChooseAccountsPage() {
  const { isLoaded, user } = useUser();
  const publishingVideo = user?.id ? getPublishableGeneratedVideo(user.id) : null;
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('Checking connected accounts…');
  const loadGeneration = useRef(0);
  const goBack = () => {
    const action = getBackAction(router.canGoBack(), '/onboarding');
    if (action === 'back') router.back(); else router.replace(action);
  };

  const loadAccounts = useCallback(async () => {
    const generation = ++loadGeneration.current;
    if (!isLoaded) return;
    setLoading(true); setError(''); setMessage('Checking connected accounts…');
    if (!user?.id) { if (generation === loadGeneration.current) { router.replace('/'); setLoading(false); } return; }
    if (!getPublishableGeneratedVideo(user.id)) {
      router.replace('/generator');
      setLoading(false);
      return;
    }
    try {
      const nextAccounts = await getConnectedSocialAccounts(user.id);
      if (generation !== loadGeneration.current) return;
      const validAccounts = nextAccounts.filter(isSocialAccountValid);
      if (validAccounts.length === 0) {
        router.replace({ pathname: '/onboarding', params: { returnTo: '/choose-accounts' } });
        return;
      }
      const validIds = new Set(validAccounts.map((account) => account.id));
      const saved = getSavedPublishingTargets(user.id).filter((id) => validIds.has(id));
      setAccounts(nextAccounts);
      setSelectedIds(saved.length ? saved : [validAccounts[0].id]);
      setMessage(`${validAccounts.length} connected ${validAccounts.length === 1 ? 'account' : 'accounts'} available.`);    } catch {
      if (generation !== loadGeneration.current) return;
      setError('We couldn’t load your accounts. Check your internet connection and try again.');
      setMessage('Connected accounts could not be loaded.');
    } finally { if (generation === loadGeneration.current) setLoading(false); }
  }, [isLoaded, user?.id]);

  useFocusEffect(useCallback(() => {
    void loadAccounts();
    return () => { loadGeneration.current += 1; };
  }, [loadAccounts]));

  const toggleAccount = (account: SocialAccount) => {
    if (!isSocialAccountValid(account)) {
      router.push({ pathname: '/onboarding', params: { returnTo: '/choose-accounts' } });
      return;
    }
    setSelectedIds((current) => {
      const next = current.includes(account.id) ? current.filter((id) => id !== account.id) : [...current, account.id];
      setMessage(`${next.length} ${next.length === 1 ? 'account' : 'accounts'} selected.`);
      return next;
    });
  };

  const handleNext = async () => {
    if (!selectedIds.length || submitting || !user?.id) return;
    const generatedVideo = getPublishableGeneratedVideo(user.id);
    if (!generatedVideo) { router.replace('/generator'); return; }
    setSubmitting(true); setError(''); setMessage('Saving selected accounts.');
    try {
      await savePublishingTargets(user.id, selectedIds);
      startSchedulingDraft(user.id, generatedVideo.videoId);
      router.push(NEXT_PUBLISHING_ROUTE);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your account selection could not be saved. Please try again.');
      setMessage('Account selection was not saved.');
    } finally { setSubmitting(false); }
  };

  if (!isLoaded || !publishingVideo) {
    return <SafeAreaView style={styles.screen}><View style={styles.guardLoading}><ActivityIndicator accessibilityLabel="Loading" color={LIME}/></View></SafeAreaView>;
  }
  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}><View style={styles.page}>
    <View style={styles.topBar}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}><Icon name="back"/></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Account options" accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen(true)} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}><Icon name="more"/></Pressable></View>
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Choose Accounts</Text><Text style={styles.subtitle}>Select the accounts where Narrial will publish your generated videos.</Text></View>
      {loading ? <AccountListSkeleton/> : error ? <View style={styles.stateCard}><Text style={styles.stateTitle}>Accounts unavailable</Text><Text style={styles.stateCopy}>{error}</Text><Pressable accessibilityRole="button" onPress={loadAccounts} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable></View> : accounts.length === 0 ? <View style={styles.stateCard}><Text style={styles.stateTitle}>No connected accounts</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/onboarding')} style={styles.retryButton}><Text style={styles.retryText}>Connect an account</Text></Pressable></View> : <View style={styles.list}>{accounts.map((account) => <ChooseAccountCard key={account.id} account={account} selected={selectedIds.includes(account.id)} disabled={submitting} onToggle={toggleAccount}/>)}</View>}
    </ScrollView>
    <View accessibilityLiveRegion="polite" style={styles.liveRegion}><Text style={styles.liveText}>{message}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Next publishing step" accessibilityState={{ disabled: !selectedIds.length || loading || submitting, busy: submitting }} disabled={!selectedIds.length || loading || submitting} onPress={handleNext} style={({ pressed }) => [styles.nextButton, (!selectedIds.length || loading || submitting) && styles.nextDisabled, pressed && styles.pressed]}>{submitting ? <ActivityIndicator color="#050505"/> : <Text style={styles.nextText}>Next</Text>}<View style={styles.arrowCircle}><Icon name="arrow"/></View></Pressable>
  </View>
  <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}><Pressable accessibilityRole="button" accessibilityLabel="Close account options" style={styles.backdrop} onPress={() => setMenuOpen(false)}><View accessibilityRole="menu" style={styles.menu} onStartShouldSetResponder={() => true}><Pressable accessibilityRole="menuitem" onPress={() => { setMenuOpen(false); router.push({ pathname: '/onboarding', params: { returnTo: '/choose-accounts' } }); }} style={styles.menuItem}><Text style={styles.menuText}>Manage connected accounts</Text></Pressable><Pressable accessibilityRole="menuitem" onPress={() => { setMenuOpen(false); void loadAccounts(); }} style={styles.menuItem}><Text style={styles.menuText}>Refresh accounts</Text></Pressable><Pressable accessibilityRole="menuitem" onPress={() => { setMenuOpen(false); Alert.alert('Help', 'Choose every account where this video should be published.'); }} style={styles.menuItem}><Text style={styles.menuText}>Help</Text></Pressable></View></Pressable></Modal></SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020202' }, guardLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, page: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 10, paddingBottom: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, circleButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LIME, backgroundColor: '#050505' }, pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  scrollContent: { paddingTop: 22, paddingBottom: 18 }, heading: { marginBottom: 30 }, title: { color: '#F7F7F7', fontSize: 38, lineHeight: 44, fontWeight: '800', letterSpacing: -0.9 }, subtitle: { marginTop: 12, color: '#AAAAAA', fontSize: 18, lineHeight: 27 }, list: { gap: 12 },
  skeletonCard: { minHeight: 92, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: '#111211' }, skeletonAvatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#252625' }, skeletonCopy: { flex: 1, gap: 9, marginLeft: 18 }, skeletonName: { width: '58%', height: 16, borderRadius: 8, backgroundColor: '#292A29' }, skeletonHandle: { width: '42%', height: 13, borderRadius: 7, backgroundColor: '#222322' },
  stateCard: { alignItems: 'center', padding: 24, borderRadius: 18, borderWidth: 1, borderColor: '#292929', backgroundColor: '#111' }, stateTitle: { color: '#FFF', fontSize: 20, fontWeight: '700' }, stateCopy: { marginTop: 8, color: '#AAA', fontSize: 15, lineHeight: 22, textAlign: 'center' }, retryButton: { minHeight: 46, marginTop: 18, justifyContent: 'center', paddingHorizontal: 20, borderRadius: 23, borderWidth: 1, borderColor: LIME }, retryText: { color: LIME, fontSize: 15, fontWeight: '700' },
  liveRegion: { minHeight: 24, justifyContent: 'center' }, liveText: { color: '#AAA', fontSize: 13, textAlign: 'center' }, nextButton: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 35, backgroundColor: LIME }, nextDisabled: { opacity: 0.42 }, nextText: { color: '#050505', fontSize: 22, fontWeight: '800' }, arrowCircle: { position: 'absolute', right: 9, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' },
  backdrop: { flex: 1, alignItems: 'center', paddingHorizontal: 24, paddingTop: 82, backgroundColor: 'rgba(0,0,0,0.56)' }, menu: { width: '100%', maxWidth: 512, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#333', backgroundColor: '#171817' }, menuItem: { minHeight: 54, justifyContent: 'center', paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#333' }, menuText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

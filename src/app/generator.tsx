import { useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { BottomActionBar } from '@/components/bottom-action-bar';
import { ReferenceInput, VideoReference } from '@/components/reference-input';
import { beginVideoGeneration } from '@/features/publishing/publishing-workflow';

const LIME = '#9DFF00';
const BORDER = '#315400';
type IconName = 'back' | 'history' | 'chevron' | 'arrow';
const icons: Record<IconName, string> = {
  back: '<path d="m15 18-6-6 6-6"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  chevron: '<path d="m8 10 4 4 4-4"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
};

function Icon({ name, color = '#FFFFFF', size = 24 }: { name: IconName; color?: string; size?: number }) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

function ChoiceModal({ title, choices, visible, onClose, onChoose }: { title: string; choices: string[]; visible: boolean; onClose: () => void; onChoose: (choice: string) => void }) {
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}><Pressable accessibilityRole="button" accessibilityLabel="Close options" onPress={onClose} style={styles.modalShade}><View accessibilityViewIsModal style={styles.modalCard}><Text accessibilityRole="header" style={styles.modalTitle}>{title}</Text>{choices.map((choice) => <Pressable key={choice} accessibilityRole="button" onPress={() => onChoose(choice)} style={({ pressed }) => [styles.modalChoice, pressed && styles.pressed]}><Text style={styles.modalChoiceText}>{choice}</Text></Pressable>)}</View></Pressable></Modal>;
}

export default function GeneratorScreen() {
  const { user } = useUser();
  const { height, width } = useWindowDimensions();
  const [prompt, setPrompt] = useState('');
  const [videoCount, setVideoCount] = useState('3 videos');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [openPicker, setOpenPicker] = useState<'count' | 'ratio' | null>(null);
  const [reference, setReference] = useState<VideoReference | null>(null);
  const compact = height / width <= 1.85;
  const email = user?.primaryEmailAddress?.emailAddress ?? 'Signed-in profile';
  const initial = useMemo(() => email.charAt(0).toUpperCase(), [email]);

  const generate = () => {
    if (!prompt.trim()) return Alert.alert('Add a prompt', 'Describe the videos you want Narrial to create.');
    if (user?.id) beginVideoGeneration(user.id);
    router.push({
      pathname: '/video-assistant',
      params: {
        prompt: prompt.trim(),
        videoCount,
        aspectRatio,
        ...(reference ? {
          referenceName: reference.name,
          referenceSource: reference.source,
          referenceThumbnailSource: reference.thumbnailSource,
          referenceType: reference.type,
        } : {}),
      },
    });
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  const openSocialConnections = () => router.push('/onboarding');

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={[styles.content, compact && styles.contentCompact]}>
        <View style={[styles.topBar, compact && styles.topBarCompact]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={({ pressed }) => [styles.circleButton, compact && styles.circleButtonCompact, pressed && styles.pressed]}><Icon name="back" size={compact ? 21 : 24} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Profile: ${email}`} onPress={() => Alert.alert('Signed-in profile', email)} style={({ pressed }) => [styles.profile, compact && styles.profileCompact, pressed && styles.pressed]}><View style={[styles.avatar, compact && styles.avatarCompact]}><Text style={styles.avatarText}>{initial}</Text></View><Text numberOfLines={1} style={styles.profileEmail}>{email}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Generation history" onPress={() => Alert.alert('Generation history', 'Your generated videos will appear here.')} style={({ pressed }) => [styles.circleButton, compact && styles.circleButtonCompact, pressed && styles.pressed]}><Icon name="history" size={compact ? 22 : 25} /></Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, compact && styles.headerCompact]}><Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}><Text style={styles.titleLight}>Video</Text>{'\n'}Generator</Text></View>

          <View style={[styles.promptCard, compact && styles.promptCardCompact]}>
            <Text style={styles.label}>Prompt</Text>
            <TextInput accessibilityLabel="Video prompt" multiline maxLength={1200} value={prompt} onChangeText={setPrompt} placeholder="Describe what videos you want Narrial to create..." placeholderTextColor="#777777" style={[styles.promptInput, compact && styles.promptInputCompact]} textAlignVertical="top" />
            <Pressable accessibilityRole="button" accessibilityLabel={`How many videos: ${videoCount}`} onPress={() => setOpenPicker('count')} style={({ pressed }) => [styles.countButton, compact && styles.countButtonCompact, pressed && styles.pressed]}><Text style={styles.countText}>{videoCount}</Text><Icon name="chevron" color={LIME} size={23} /></Pressable>
          </View>

          <View style={[styles.optionsRow, compact && styles.optionsRowCompact]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Aspect ratio: ${aspectRatio}`} onPress={() => setOpenPicker('ratio')} style={({ pressed }) => [styles.optionCard, compact && styles.optionCardCompact, pressed && styles.pressed]}><Text style={styles.optionLabel}>Aspect Ratio</Text><View style={styles.optionBottom}><Text style={styles.optionValue}>{aspectRatio}</Text><Icon name="chevron" color={LIME} /></View></Pressable>
            <View style={[styles.optionCard, compact && styles.optionCardCompact]}><ReferenceInput value={reference} onChange={setReference} /></View>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Generate videos" onPress={generate} style={({ pressed }) => [styles.generateButton, compact && styles.generateButtonCompact, pressed && styles.pressed]}><Text style={styles.generateText}>Generate Videos</Text><Icon name="arrow" color="#000000" size={28} /></Pressable>
        </ScrollView>
        <BottomActionBar
          onOpenSocialConnections={openSocialConnections}
          onOpenPublishing={() => router.push('/publishing')}
          onOpenVideoLibrary={() => router.push('/video-library')}
        />
      </View>
      <ChoiceModal title="How many videos?" choices={['1 video', '3 videos', '5 videos', '10 videos']} visible={openPicker === 'count'} onClose={() => setOpenPicker(null)} onChoose={(choice) => { setVideoCount(choice); setOpenPicker(null); }} />
      <ChoiceModal title="Aspect ratio" choices={['9:16', '1:1', '16:9']} visible={openPicker === 'ratio'} onClose={() => setOpenPicker(null)} onChoose={(choice) => { setAspectRatio(choice); setOpenPicker(null); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' }, content: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 }, contentCompact: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 10 }, scrollContent: { flexGrow: 1 },
  topBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, topBarCompact: { minHeight: 42 }, circleButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#3A3A3A', alignItems: 'center', justifyContent: 'center' }, circleButtonCompact: { width: 42, height: 42, borderRadius: 21 },
  profile: { flex: 1, maxWidth: 280, height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, paddingRight: 13, borderRadius: 22, borderWidth: 1, borderColor: '#282828', backgroundColor: '#090909' }, profileCompact: { height: 38, borderRadius: 19 }, avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#161616', borderWidth: 1, borderColor: LIME }, avatarCompact: { width: 36, height: 36, borderRadius: 18 }, avatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' }, profileEmail: { flex: 1, color: '#B8B8B8', fontSize: 12, fontWeight: '600' },
  header: { marginTop: 28, marginBottom: 18 }, headerCompact: { marginTop: 12, marginBottom: 10 }, title: { color: '#FFFFFF', fontSize: 44, lineHeight: 45, fontWeight: '900', letterSpacing: -1.4 }, titleCompact: { fontSize: 32, lineHeight: 32, letterSpacing: -0.9 }, titleLight: { fontWeight: '300' }, subtitle: { maxWidth: 430, marginTop: 14, color: '#999999', fontSize: 18, lineHeight: 25 }, subtitleCompact: { marginTop: 7, fontSize: 14, lineHeight: 18 },
  promptCard: { flex: 1, minHeight: 0, padding: 20, borderRadius: 30, borderWidth: 1, borderColor: BORDER, backgroundColor: '#030303' }, promptCardCompact: { minHeight: 190, padding: 15, borderRadius: 23 }, label: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, fontWeight: '800' }, promptInput: { flex: 1, minHeight: 0, marginTop: 10, padding: 0, color: '#FFFFFF', fontSize: 18, lineHeight: 26 }, promptInputCompact: { marginTop: 6, fontSize: 14, lineHeight: 19 }, countButton: { height: 48, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, borderRadius: 24, borderWidth: 1, borderColor: '#4A4A4A' }, countButtonCompact: { height: 38, paddingHorizontal: 14 }, countText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  optionsRow: { height: 122, flexDirection: 'row', gap: 14, marginTop: 14 }, optionsRowCompact: { height: 88, gap: 9, marginTop: 9 }, optionCard: { flex: 1, padding: 18, borderRadius: 28, borderWidth: 1, borderColor: BORDER, justifyContent: 'space-between', backgroundColor: '#030303' }, optionCardCompact: { padding: 12, borderRadius: 21 }, optionLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, optionBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, optionValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '400' },
  generateButton: { height: 64, marginTop: 18, borderRadius: 32, backgroundColor: '#B6FF2E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 }, generateButtonCompact: { height: 50, marginTop: 10, borderRadius: 25 }, generateText: { color: '#000000', fontSize: 20, fontWeight: '900' }, pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  modalShade: { flex: 1, justifyContent: 'flex-end', padding: 20, backgroundColor: 'rgba(0,0,0,0.72)' }, modalCard: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 22, borderRadius: 28, borderWidth: 1, borderColor: '#343434', backgroundColor: '#111111' }, modalTitle: { marginBottom: 12, color: '#FFFFFF', fontSize: 20, fontWeight: '800' }, modalChoice: { minHeight: 52, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#343434' }, modalChoiceText: { color: '#FFFFFF', fontSize: 17 },
});

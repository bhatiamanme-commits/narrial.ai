import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

const LIME = '#A8FF1A';
const TEXT = '#F7F7F5';
const MUTED = '#929692';
const BORDER = 'rgba(255,255,255,0.18)';

type Question = { id: string; title: string; support: string; options: string[]; customOption?: string; defaultOption?: string };
const QUESTIONS: Question[] = [
  { id: 'format', title: 'What are you creating?', support: 'Choose one format for the videos you want to create.', options: ['Social reel', 'Video ad', 'Explainer', 'Something else'], customOption: 'Something else', defaultOption: 'Social reel' },
  { id: 'audience', title: 'Who is this video for?', support: 'Choose the primary audience.', options: ['Women', 'Men', 'Everyone', 'Custom audience'], customOption: 'Custom audience' },
  { id: 'age', title: 'What age group are you targeting?', support: "Select the audience's main age range.", options: ['9–15', '16–24', '25–39', '40+'] },
  { id: 'tone', title: 'What tone should the video have?', support: 'Choose how the final video should feel.', options: ['Funny', 'Informative', 'Inspiring', 'Product-focused'] },
];

type Answer = { option?: string; custom?: string; skipped?: boolean };
type VideoReference = { name: string; source: string; type: 'file' | 'url' };
type GenerationInput = { prompt: string; videoCount: string; aspectRatio: string; reference?: VideoReference };
type State = { index: number; answers: Record<string, Answer>; complete: boolean; generation: GenerationInput };
type Action = { type: 'select'; option: string } | { type: 'custom'; value: string } | { type: 'next' } | { type: 'skip' } | { type: 'close' };

function reducer(state: State, action: Action): State {
  const question = QUESTIONS[state.index];
  if (action.type === 'close') return { ...state, complete: true };
  if (action.type === 'select') return { ...state, answers: { ...state.answers, [question.id]: { option: action.option } } };
  if (action.type === 'custom') return { ...state, answers: { ...state.answers, [question.id]: { ...state.answers[question.id], custom: action.value } } };
  if (action.type === 'next' || action.type === 'skip') {
    const answers = action.type === 'skip' ? { ...state.answers, [question.id]: { skipped: true } } : state.answers;
    return state.index === QUESTIONS.length - 1 ? { ...state, answers, complete: true } : { ...state, answers, index: state.index + 1 };
  }
  return state;
}

const paths = {
  play: '<path d="m9 7 8 5-8 5z" fill="currentColor" stroke="none"/>',
  check: '<path d="m7 12 3 3 7-7"/>',
  close: '<path d="m7 7 10 10M17 7 7 17"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  send: '<path d="M19.82 4.18 4.62 9.37c-1.02.35-1.05 1.78-.05 2.17l5.14 2.01 2.01 5.14c.39 1 1.82.97 2.17-.05l5.19-15.2c.22-.65-.41-1.28-1.06-1.06Z" transform="rotate(-10 12 12)"/>',
};
function Icon({ name, color = TEXT, size = 24 }: { name: keyof typeof paths; color?: string; size?: number }) {
  return <SvgXml xml={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name].replace('currentColor', color)}</svg>`} width={size} height={size} />;
}

function RobotThumbnail() {
  return <View style={styles.robotScene}>
    <View style={styles.robotAntenna} />
    <View style={styles.robotHead}>
      <View style={styles.robotFace}><View style={styles.robotEye} /><View style={styles.robotEye} /></View>
    </View>
    <View style={styles.robotBody}><View style={styles.robotChest} /></View>
    <View style={styles.sceneGlow} />
  </View>;
}

function UploadedVideoCard({ reference }: { reference: VideoReference }) {
  return <View style={styles.uploadWrap}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Preview ${reference.name}`} onPress={() => AccessibilityInfo.announceForAccessibility('Video preview opened in demo mode.')} style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}>
      <Image source={{ uri: reference.source }} resizeMode="cover" style={styles.videoThumbnail} />
      <View style={styles.videoShade} />
      <View style={styles.playButton}><Icon name="play" size={25} /></View>
      <View style={styles.videoMeta}><Text numberOfLines={1} style={styles.videoName}>{reference.name}</Text><Text style={styles.videoDetails}>2:19 · 48 MB</Text></View>
    </Pressable>
    <View style={styles.delivered}><Icon name="check" color="#000" size={15} /></View>
  </View>;
}

function AnalysisStatus({ percentage }: { percentage: number }) {
  const done = percentage >= 100;
  return <View accessibilityLiveRegion="polite" style={styles.analysisPill}>
    {done ? <View style={styles.statusCheck}><Icon name="check" color="#000" size={15} /></View> : <View style={styles.dots}><View style={styles.dot} /><View style={[styles.dot, { opacity: .7 }]} /><View style={[styles.dot, { opacity: .4 }]} /></View>}
    <Text style={styles.analysisText}>{done ? 'Analysis complete' : `Analyzing video · ${percentage}%`}</Text>
  </View>;
}

function OptionRow({ index, label, selected, onPress }: { index: number; label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${label}, option ${index}`} onPress={onPress} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
    <View style={[styles.numberBadge, selected && styles.numberSelected]}><Text style={[styles.numberText, selected && styles.numberTextSelected]}>{index}</Text></View>
    <Text style={styles.optionLabel}>{label}</Text>
    <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <Icon name="check" color="#000" size={18} /> : null}</View>
  </Pressable>;
}

function QuestionSheet({ state, dispatch, composerRef }: { state: State; dispatch: React.Dispatch<Action>; composerRef: React.RefObject<TextInput | null> }) {
  const question = QUESTIONS[state.index];
  const answer = state.answers[question.id] ?? (question.defaultOption ? { option: question.defaultOption } : {});
  const isCustom = answer.option === question.customOption;
  const valid = Boolean(answer.option && (!isCustom || answer.custom?.trim()));
  return <View style={styles.sheet}>
    <View style={styles.handle} />
    <Pressable accessibilityRole="button" accessibilityLabel="Close questions" onPress={() => dispatch({ type: 'close' })} style={styles.closeButton}><Icon name="close" size={24} /></Pressable>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.questionScroll}>
      <Text style={styles.step}>QUESTION {state.index + 1} OF {QUESTIONS.length}</Text>
      <Text accessibilityRole="header" style={styles.question}>{question.title}</Text>
      <Text style={styles.support}>{question.support}</Text>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {question.options.map((option, index) => <OptionRow key={option} index={index + 1} label={option} selected={answer.option === option} onPress={() => { dispatch({ type: 'select', option }); if (option === question.customOption) setTimeout(() => composerRef.current?.focus(), 50); }} />)}
      </View>
    </ScrollView>
    <View style={styles.footer}>
      <Pressable accessibilityRole="button" onPress={() => dispatch({ type: 'skip' })} style={styles.skipButton}><Text style={styles.skipText}>Skip</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid }} disabled={!valid} onPress={() => dispatch({ type: 'next' })} style={({ pressed }) => [styles.nextButton, !valid && styles.disabled, pressed && styles.pressed]}><Text style={styles.nextText}>{state.index === QUESTIONS.length - 1 ? 'Finish' : 'Next'}</Text><Icon name="arrow" color="#000" size={23} /></Pressable>
    </View>
  </View>;
}

export default function VideoAssistantScreen() {
  const params = useLocalSearchParams<{ referenceName?: string; referenceSource?: string; referenceType?: 'file' | 'url'; prompt?: string; videoCount?: string; aspectRatio?: string }>();
  const { width, height } = useWindowDimensions();
  const compact = height < 760;
  const composerRef = useRef<TextInput>(null);
  const [percentage, setPercentage] = useState(8);
  const [details, setDetails] = useState('');
  const [sentDetails, setSentDetails] = useState<string[]>([]);
  const reference = params.referenceName && params.referenceSource && (params.referenceType === 'file' || params.referenceType === 'url')
    ? { name: params.referenceName, source: params.referenceSource, type: params.referenceType }
    : undefined;
  const [state, dispatch] = useReducer(reducer, {
    index: 0,
    answers: { format: { option: 'Social reel' } },
    complete: false,
    generation: {
      prompt: params.prompt ?? '',
      videoCount: params.videoCount ?? '3 videos',
      aspectRatio: params.aspectRatio ?? '9:16',
      reference,
    },
  });
  const fade = useMemo(() => new Animated.Value(1), []);
  const currentQuestion = QUESTIONS[state.index];
  const answer = state.answers[currentQuestion.id] ?? (currentQuestion.defaultOption ? { option: currentQuestion.defaultOption } : {});
  const customActive = answer.option === currentQuestion.customOption;

  useEffect(() => {
    const timer = setInterval(() => setPercentage(value => value >= 100 ? 100 : Math.min(100, value + 23)), 420);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (percentage === 100) AccessibilityInfo.announceForAccessibility('Analysis complete. Question 1 of 4. What are you creating?');
  }, [percentage]);
  useEffect(() => {
    Animated.sequence([Animated.timing(fade, { toValue: 0, duration: 90, useNativeDriver: true }), Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true })]).start();
    if (percentage === 100 && !state.complete) AccessibilityInfo.announceForAccessibility(`Question ${state.index + 1} of 4. ${currentQuestion.title}`);
  }, [state.index]);

  const onComposerChange = (value: string) => {
    setDetails(value);
    if (customActive) dispatch({ type: 'custom', value });
  };
  const send = () => {
    if (!details.trim()) return;
    setSentDetails(items => [...items, details.trim()]);
    setDetails('');
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.content, { maxWidth: Math.min(620, width) }, compact && styles.contentCompact]}>
          <View style={[styles.conversation, compact && styles.conversationCompact]}>
            {state.generation.reference ? <UploadedVideoCard reference={state.generation.reference} /> : null}
            <AnalysisStatus percentage={percentage} />
            {sentDetails.map((message, index) => <View key={`${message}-${index}`} style={styles.userBubble}><Text style={styles.userBubbleText}>{message}</Text></View>)}
          </View>

          <View style={styles.dock}>
            {percentage >= 100 && !state.complete ? <Animated.View style={{ opacity: fade }}><QuestionSheet state={state} dispatch={dispatch} composerRef={composerRef} /></Animated.View> : null}
            <View style={styles.composer}>
              <Pressable accessibilityRole="button" accessibilityLabel="Add attachment" onPress={() => AccessibilityInfo.announceForAccessibility('Upload file, add reference image, or add another video.')} style={styles.plusButton}><Icon name="plus" size={28} /></Pressable>
              <TextInput ref={composerRef} value={details} onChangeText={onComposerChange} onSubmitEditing={send} returnKeyType="send" placeholder={customActive ? 'Describe your preference.' : 'Add more details'} placeholderTextColor={MUTED} style={styles.composerInput} />
              <Pressable accessibilityRole="button" accessibilityLabel="Send details" accessibilityState={{ disabled: !details.trim() }} disabled={!details.trim()} onPress={send} style={({ pressed }) => [styles.sendButton, !details.trim() && { opacity: .62 }, pressed && styles.pressed]}><Icon name="send" color="#000" size={23} /></Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  contentCompact: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', paddingTop: 8, paddingHorizontal: 18 },
  conversation: { flex: 1, minHeight: 155 },
  conversationCompact: { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' },
  uploadWrap: { alignSelf: 'flex-end', width: '52%', maxWidth: 270, minWidth: 190, marginTop: 4, marginRight: 3 },
  uploadCard: { height: 200, overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: BORDER, backgroundColor: '#111' },
  videoThumbnail: { width: '100%', height: '100%' },
  robotScene: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#111820' },
  robotAntenna: { position: 'absolute', top: 19, width: 5, height: 27, borderRadius: 3, backgroundColor: '#9EA9B2' },
  robotHead: { position: 'absolute', top: 37, width: 112, height: 82, alignItems: 'center', justifyContent: 'center', borderRadius: 37, borderWidth: 6, borderColor: '#AEB8BF', backgroundColor: '#525E67' },
  robotFace: { width: 88, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderRadius: 24, backgroundColor: '#080B0E' },
  robotEye: { width: 18, height: 25, borderRadius: 12, borderWidth: 5, borderColor: '#F6F8F0', shadowColor: '#fff', shadowOpacity: .8, shadowRadius: 8 },
  robotBody: { position: 'absolute', top: 109, width: 130, height: 100, alignItems: 'center', paddingTop: 20, borderTopLeftRadius: 52, borderTopRightRadius: 52, backgroundColor: '#606B73' },
  robotChest: { width: 44, height: 24, borderRadius: 8, borderWidth: 2, borderColor: '#252C31', backgroundColor: '#404A51' },
  sceneGlow: { position: 'absolute', right: 18, top: 22, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,.72)' },
  videoShade: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,.13)' },
  playButton: { position: 'absolute', left: '50%', top: '42%', width: 54, height: 54, marginLeft: -27, marginTop: -27, alignItems: 'center', justifyContent: 'center', borderRadius: 27, backgroundColor: 'rgba(10,10,10,.62)' },
  videoMeta: { position: 'absolute', left: 17, right: 14, bottom: 14 }, videoName: { color: TEXT, fontSize: 16, fontWeight: '700' }, videoDetails: { marginTop: 5, color: '#B0B2B0', fontSize: 13 },
  delivered: { position: 'absolute', right: -5, bottom: -9, width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 3, borderColor: '#000', backgroundColor: LIME },
  analysisPill: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, paddingHorizontal: 15, borderRadius: 22, borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(15,15,15,.62)' },
  statusCheck: { width: 23, height: 23, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: LIME }, analysisText: { color: TEXT, fontSize: 15 }, dots: { flexDirection: 'row', gap: 4 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LIME },
  userBubble: { maxWidth: '76%', alignSelf: 'flex-end', marginTop: 10, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 18, backgroundColor: '#202020' }, userBubbleText: { color: TEXT, fontSize: 14 },
  dock: { width: '100%', gap: 8 }, sheet: { maxHeight: 490, minHeight: 410, overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(15,15,15,.96)' },
  handle: { width: 42, height: 4, alignSelf: 'center', marginTop: 13, borderRadius: 2, backgroundColor: '#4A4A4A' }, closeButton: { position: 'absolute', zIndex: 2, top: 14, right: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#202020' },
  questionScroll: { paddingHorizontal: 20, paddingTop: 37, paddingBottom: 12 }, step: { color: LIME, fontSize: 13, lineHeight: 18, fontWeight: '800', letterSpacing: .8 }, question: { marginTop: 13, paddingRight: 40, color: TEXT, fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -.5 }, support: { marginTop: 6, color: MUTED, fontSize: 14, lineHeight: 20 }, options: { gap: 9, marginTop: 18 },
  option: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', backgroundColor: 'rgba(20,20,20,.72)' }, optionSelected: { borderColor: LIME, backgroundColor: 'rgba(168,255,26,.08)' },
  numberBadge: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: '#777' }, numberSelected: { borderColor: LIME }, numberText: { color: '#C8C8C8', fontSize: 14 }, numberTextSelected: { color: LIME }, optionLabel: { flex: 1, color: TEXT, fontSize: 16, fontWeight: '600' }, radio: { width: 27, height: 27, borderRadius: 14, borderWidth: 1.5, borderColor: '#777' }, radioSelected: { alignItems: 'center', justifyContent: 'center', borderColor: LIME, backgroundColor: LIME },
  footer: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER }, skipButton: { minWidth: 54, minHeight: 44, justifyContent: 'center' }, skipText: { color: MUTED, fontSize: 16 }, nextButton: { minWidth: 116, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, borderRadius: 17, backgroundColor: LIME }, nextText: { color: '#000', fontSize: 17, fontWeight: '800' }, disabled: { opacity: .34 },
  composer: { height: 66, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 7, borderRadius: 33, borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(15,15,15,.96)' }, plusButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: '#2B2B2B' }, composerInput: { flex: 1, minWidth: 0, color: TEXT, fontSize: 15 }, sendButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: LIME }, pressed: { opacity: .72, transform: [{ scale: .985 }] },
});

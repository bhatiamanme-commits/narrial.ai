import { useAuth, useUser } from '@clerk/expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
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
import { useVideoPlayer, VideoView } from 'expo-video';

import { markGeneratedVideoReady } from '@/features/publishing/publishing-workflow';
import { MediaReference } from '@/features/media-reference/media-reference';
import { getVideoAnalysisJob, retryVideoAnalysisJob, VideoAnalysisJob } from '@/features/video-analysis/video-analysis-client';
import { ANALYSIS_STEPS, getAnalysisStepIndex, getAnalysisStepStates } from '@/features/video-assistant/video-assistant-state';

const LIME = '#A8FF1A';
const TEXT = '#F7F7F5';
const MUTED = '#929692';
const BORDER = 'rgba(255,255,255,0.18)';
const GENERATED_VIDEO = require('../../assets/videos/chihuahua-bully-crocodile.mp4');

type Question = { id: string; title: string; support: string; options: string[]; customOption?: string; defaultOption?: string };
const QUESTIONS: Question[] = [
  { id: 'format', title: 'What are you creating?', support: 'Choose one format for the videos you want to create.', options: ['Social reel', 'Video ad', 'Explainer', 'Something else'], customOption: 'Something else', defaultOption: 'Social reel' },
  { id: 'audience', title: 'Who is this video for?', support: 'Choose the primary audience.', options: ['Women', 'Men', 'Everyone', 'Custom audience'], customOption: 'Custom audience' },
  { id: 'age', title: 'What age group are you targeting?', support: "Select the audience's main age range.", options: ['9–15', '16–24', '25–39', '40+'] },
  { id: 'tone', title: 'What tone should the video have?', support: 'Choose how the final video should feel.', options: ['Funny', 'Informative', 'Inspiring', 'Product-focused'] },
];

type Answer = { option?: string; custom?: string; skipped?: boolean };
type GenerationInput = { prompt: string; videoCount: string; aspectRatio: string; reference?: MediaReference; referenceId?: string; analysisJobId?: string };
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

function UploadedMediaCard({ reference }: { reference: MediaReference }) {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  const hasThumbnail = Boolean(reference.thumbnailSource) && !thumbnailFailed;
  const isVideo = reference.mediaType === 'video';
  const openPreview = () => {
    if (reference.type === 'url') {
      void Linking.openURL(reference.source);
      return;
    }
    void AccessibilityInfo.announceForAccessibility(`${reference.mediaType} reference selected.`);
  };

  return <View style={styles.uploadWrap}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${reference.type === 'url' ? 'Open' : 'Preview'} ${reference.name}`} onPress={openPreview} style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}>
      {hasThumbnail
        ? <Image source={{ uri: reference.thumbnailSource }} resizeMode="cover" onError={() => setThumbnailFailed(true)} style={styles.videoThumbnail} />
        : <RobotThumbnail />}
      <View style={styles.videoShade} />
      {isVideo ? <View style={styles.playButton}><Icon name="play" size={25} /></View> : null}
      <View style={styles.videoMeta}><Text numberOfLines={1} style={styles.videoName}>{reference.name}</Text></View>
    </Pressable>
    <View style={styles.delivered}><Icon name="check" color="#000" size={15} /></View>
  </View>;
}

function AnalysisStatus({ percentage, stage, failed, onRetry }: { percentage: number; stage?: string; failed?: boolean; onRetry?: () => void }) {
  const done = percentage >= 100;
  const activeStep = getAnalysisStepIndex(percentage);
  const stepStates = getAnalysisStepStates(activeStep);

  if (done || failed) {
    return <View accessibilityLiveRegion="polite" style={styles.analysisPill}>
      {done && !failed ? <View style={styles.statusCheck}><Icon name="check" color="#000" size={15} /></View> : <View style={styles.dots}><View style={styles.dot} /><View style={[styles.dot, { opacity: .7 }]} /><View style={[styles.dot, { opacity: .4 }]} /></View>}
      <Text style={styles.analysisText}>{failed ? 'Analysis failed' : 'Analysis complete'}</Text>
      {failed && onRetry ? <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></Pressable> : null}
    </View>;
  }

  return <View accessibilityLiveRegion="polite" accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percentage, text: stage ?? ANALYSIS_STEPS[activeStep].activity }} style={styles.analysisProgress}>
    <View style={styles.analysisProgressHeader}>
      <View style={styles.analysisStageCopy}><Text style={styles.analysisEyebrow}>NARRIAL IS ANALYZING</Text><Text style={styles.analysisStage}>{stage ?? ANALYSIS_STEPS[activeStep].label}</Text></View>
      <Text style={styles.analysisPercentage}>{percentage}%</Text>
    </View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${percentage}%` }]} /></View>
    <View style={styles.analysisSteps}>
      {ANALYSIS_STEPS.map((step, index) => {
        const stepState = stepStates[index];
        return <View key={step.id} style={[styles.analysisStep, stepState === 'upcoming' && styles.analysisStepMuted]}>
          <View style={[styles.stepMarker, stepState === 'active' && styles.stepMarkerActive, stepState === 'complete' && styles.stepMarkerComplete]}>
            {stepState === 'complete' ? <Icon name="check" color="#000" size={12} /> : <Text style={[styles.stepMarkerText, stepState === 'active' && styles.stepMarkerTextActive]}>{index + 1}</Text>}
          </View>
          <View style={styles.stepCopy}><Text style={[styles.stepLabel, stepState === 'active' && styles.stepLabelActive]}>{step.label}</Text>{stepState === 'active' ? <Text style={styles.stepActivity}>{step.activity}</Text> : null}</View>
        </View>;
      })}
    </View>
  </View>;
}

function AnalysisSummary({ job }: { job: VideoAnalysisJob }) {
  if (!job.analysis) return null;
  return <View style={styles.analysisSummary}>
    <Text accessibilityRole="header" style={styles.analysisSummaryTitle}>What Narrial sees</Text>
    <Text style={styles.analysisSummaryText}>{job.analysis.summary}</Text>
    <Text style={styles.analysisInsight}>Hook · {job.analysis.creativeDNA.openingHook}</Text>
    <Text style={styles.analysisInsight}>Pacing · {job.analysis.creativeDNA.pacing}</Text>
  </View>;
}

function GeneratedVideoCard() {
  const player = useVideoPlayer(GENERATED_VIDEO, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  return <Pressable
    accessibilityRole="button"
    accessibilityLabel="Open generated video full screen with sound"
    onPress={() => router.push('/generated-video')}
    style={({ pressed }) => [styles.generatedVideoWrap, pressed && styles.pressed]}
  >
    <VideoView
      accessibilityLabel="Generated video showing a Chihuahua and bully dog with a crocodile toy"
      contentFit="cover"
      nativeControls={false}
      player={player}
      style={styles.generatedVideo}
    />
  </Pressable>;
}

function OptionRow({ index, label, selected, onPress }: { index: number; label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} accessibilityLabel={`${label}, option ${index}`} onPress={onPress} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.pressed]}>
    <View style={[styles.numberBadge, selected && styles.numberSelected]}><Text style={[styles.numberText, selected && styles.numberTextSelected]}>{index}</Text></View>
    <Text style={styles.optionLabel}>{label}</Text>
    <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <Icon name="check" color="#000" size={18} /> : null}</View>
  </Pressable>;
}

function QuestionSheet({ state, dispatch, composerRef, onAdvance }: { state: State; dispatch: React.Dispatch<Action>; composerRef: React.RefObject<TextInput | null>; onAdvance: (action: 'next' | 'skip') => void }) {
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
      <Pressable accessibilityRole="button" onPress={() => onAdvance('skip')} style={styles.skipButton}><Text style={styles.skipText}>Skip</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: !valid }} disabled={!valid} onPress={() => onAdvance('next')} style={({ pressed }) => [styles.nextButton, !valid && styles.disabled, pressed && styles.pressed]}><Text style={styles.nextText}>{state.index === QUESTIONS.length - 1 ? 'Finish' : 'Next'}</Text><Icon name="arrow" color="#000" size={23} /></Pressable>
    </View>
  </View>;
}

export default function VideoAssistantScreen() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{ referenceId?: string; analysisJobId?: string; referenceName?: string; referenceSource?: string; referenceThumbnailSource?: string; referenceType?: 'file' | 'url'; referenceMediaType?: 'image' | 'video'; prompt?: string; videoCount?: string; aspectRatio?: string }>();
  const { width, height } = useWindowDimensions();
  const compact = height < 760;
  const composerRef = useRef<TextInput>(null);
  const [percentage, setPercentage] = useState(params.analysisJobId ? 0 : 8);
  const [analysisJob, setAnalysisJob] = useState<VideoAnalysisJob | null>(null);
  const [analysisRun, setAnalysisRun] = useState(0);
  const [details, setDetails] = useState('');
  const [sentDetails, setSentDetails] = useState<string[]>([]);
  const reference = params.referenceName && params.referenceSource && (params.referenceType === 'file' || params.referenceType === 'url')
    ? { name: params.referenceName, source: params.referenceSource, thumbnailSource: params.referenceThumbnailSource, type: params.referenceType, mediaType: params.referenceMediaType === 'image' ? 'image' as const : 'video' as const }
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
      ...(params.referenceId ? { referenceId: params.referenceId } : {}),
      ...(params.analysisJobId ? { analysisJobId: params.analysisJobId } : {}),
    },
  });
  const fade = useMemo(() => new Animated.Value(1), []);
  const currentQuestion = QUESTIONS[state.index];
  const answer = state.answers[currentQuestion.id] ?? (currentQuestion.defaultOption ? { option: currentQuestion.defaultOption } : {});
  const customActive = answer.option === currentQuestion.customOption;
  const answerMessages = QUESTIONS.flatMap((question, index) => {
    if (index >= state.index && !state.complete) return [];
    const savedAnswer = state.answers[question.id];
    if (!savedAnswer) return [];
    if (savedAnswer.skipped) return [`Skipped: ${question.title}`];
    return [savedAnswer.custom?.trim() || savedAnswer.option].filter((value): value is string => Boolean(value));
  });

  useEffect(() => {
    if (params.analysisJobId) return;
    const timer = setInterval(() => setPercentage(value => value >= 100 ? 100 : Math.min(100, value + 23)), 420);
    return () => clearInterval(timer);
  }, [params.analysisJobId]);
  useEffect(() => {
    if (!params.analysisJobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) throw new Error('Authentication required');
        const job = await getVideoAnalysisJob({ apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '', clerkToken, jobId: params.analysisJobId! });
        if (cancelled) return;
        setAnalysisJob(job);
        setPercentage(job.progress);
        if (job.status === 'QUEUED' || job.status === 'ANALYZING') timer = setTimeout(poll, 2_000);
      } catch {
        if (!cancelled) setAnalysisJob((current) => current ?? { id: params.analysisJobId!, referenceId: params.referenceId ?? '', status: 'FAILED', progress: 100, stage: 'Analysis failed', errorCode: 'VIDEO_ANALYSIS_REQUEST_FAILED', updatedAt: new Date().toISOString() });
      }
    };
    void poll();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [analysisRun, getToken, params.analysisJobId, params.referenceId]);
  useEffect(() => {
    if (percentage === 100 && analysisJob?.status !== 'FAILED') {
      AccessibilityInfo.announceForAccessibility('Analysis complete. Question 1 of 4. What are you creating?');
      if (user?.id) markGeneratedVideoReady(user.id, 'generated-video-primary');
    }
  }, [analysisJob?.status, percentage, user?.id]);
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
  const advanceQuestion = (action: 'next' | 'skip') => {
    if (action === 'next' && customActive && details.trim()) {
      dispatch({ type: 'custom', value: details });
    }
    dispatch({ type: action });
    setDetails('');
  };
  const retryAnalysis = async () => {
    if (!params.analysisJobId) return;
    if (analysisJob?.errorCode === 'VIDEO_ANALYSIS_REQUEST_FAILED') {
      setAnalysisJob(null);
      setPercentage(0);
      setAnalysisRun((value) => value + 1);
      return;
    }
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error('Authentication required');
      const job = await retryVideoAnalysisJob({ apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '', clerkToken, jobId: params.analysisJobId });
      setAnalysisJob(job);
      setPercentage(job.progress);
      setAnalysisRun((value) => value + 1);
    } catch {
      void AccessibilityInfo.announceForAccessibility('Video analysis could not be retried.');
    }
  };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.content, { maxWidth: Math.min(620, width) }, compact && styles.contentCompact]}>
        <ScrollView style={styles.conversationScroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.conversation, compact && styles.conversationCompact]}>
            {state.generation.reference ? <UploadedMediaCard reference={state.generation.reference} /> : null}
            <AnalysisStatus percentage={percentage} stage={analysisJob?.stage} failed={analysisJob?.status === 'FAILED'} onRetry={retryAnalysis} />
            {analysisJob?.status === 'COMPLETE' ? <AnalysisSummary job={analysisJob} /> : null}
            {percentage >= 100 && analysisJob?.status !== 'FAILED' ? <GeneratedVideoCard /> : null}
            {answerMessages.map((message, index) => <View key={`answer-${index}-${message}`} style={styles.userBubble}><Text style={styles.userBubbleText}>{message}</Text></View>)}
            {sentDetails.map((message, index) => <View key={`${message}-${index}`} style={styles.userBubble}><Text style={styles.userBubbleText}>{message}</Text></View>)}
            {state.complete ? <View style={styles.completionBubble}><View style={styles.completionCheck}><Icon name="check" color="#000" size={17} /></View><Text style={styles.completionText}>there is the video based on the all reference</Text></View> : null}
          </View>
          {percentage >= 100 && analysisJob?.status !== 'FAILED' && !state.complete ? <Animated.View style={{ opacity: fade }}><QuestionSheet state={state} dispatch={dispatch} composerRef={composerRef} onAdvance={advanceQuestion} /></Animated.View> : null}
        </ScrollView>
        <View style={styles.composer}>
          <Pressable accessibilityRole="button" accessibilityLabel="Add attachment" onPress={() => AccessibilityInfo.announceForAccessibility('Upload file, add reference image, or add another video.')} style={styles.plusButton}><Icon name="plus" size={28} /></Pressable>
          <TextInput ref={composerRef} value={details} onChangeText={onComposerChange} onSubmitEditing={send} returnKeyType="send" placeholder={customActive ? 'Describe your preference.' : 'Add more details'} placeholderTextColor={MUTED} style={styles.composerInput} />
          <Pressable accessibilityRole="button" accessibilityLabel="Send details" accessibilityState={{ disabled: !details.trim() }} disabled={!details.trim()} onPress={send} style={({ pressed }) => [styles.sendButton, !details.trim() && { opacity: .62 }, pressed && styles.pressed]}><Icon name="send" color="#000" size={23} /></Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  conversationScroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 8 },
  content: { flex: 1, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  contentCompact: { paddingTop: 8, paddingHorizontal: 18 },
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
  analysisProgress: { width: '100%', marginTop: 18, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: BORDER, backgroundColor: '#101210' },
  analysisProgressHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  analysisStageCopy: { flex: 1 },
  analysisEyebrow: { color: LIME, fontSize: 11, lineHeight: 16, fontWeight: '800', letterSpacing: 1 },
  analysisStage: { marginTop: 3, color: TEXT, fontSize: 17, lineHeight: 22, fontWeight: '700' },
  analysisPercentage: { color: LIME, fontSize: 20, lineHeight: 25, fontWeight: '800' },
  progressTrack: { height: 4, marginTop: 15, overflow: 'hidden', borderRadius: 2, backgroundColor: '#30332F' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: LIME },
  analysisSteps: { gap: 13, marginTop: 17 },
  analysisStep: { minHeight: 32, flexDirection: 'row', alignItems: 'flex-start', gap: 11 }, analysisStepMuted: { opacity: .42 },
  stepMarker: { width: 24, height: 24, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#555A53' },
  stepMarkerActive: { borderColor: LIME, backgroundColor: 'rgba(168,255,26,.12)' }, stepMarkerComplete: { borderColor: LIME, backgroundColor: LIME },
  stepMarkerText: { color: MUTED, fontSize: 11, fontWeight: '700' }, stepMarkerTextActive: { color: LIME }, stepCopy: { flex: 1 },
  stepLabel: { color: '#C4C7C2', fontSize: 14, lineHeight: 19, fontWeight: '600' }, stepLabelActive: { color: TEXT }, stepActivity: { marginTop: 2, color: MUTED, fontSize: 12, lineHeight: 17 },
  retryButton: { marginLeft: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: LIME }, retryText: { color: '#000', fontSize: 12, fontWeight: '800' },
  analysisSummary: { marginTop: 14, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: BORDER, backgroundColor: '#111' }, analysisSummaryTitle: { color: LIME, fontSize: 14, fontWeight: '800' }, analysisSummaryText: { marginTop: 8, color: TEXT, fontSize: 15, lineHeight: 21 }, analysisInsight: { marginTop: 7, color: MUTED, fontSize: 13, lineHeight: 18 },
  generatedVideoWrap: { width: '58%', minWidth: 210, maxWidth: 310, aspectRatio: 9 / 14, marginTop: 18, overflow: 'hidden', borderRadius: 28, borderWidth: 1, borderColor: BORDER, backgroundColor: '#0B0B0B' },
  generatedVideo: { width: '100%', height: '100%' },
  userBubble: { maxWidth: '76%', alignSelf: 'flex-end', marginTop: 10, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 18, backgroundColor: '#202020' }, userBubbleText: { color: TEXT, fontSize: 14 },
  completionBubble: { maxWidth: '82%', minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 28, borderWidth: 1, borderColor: BORDER },
  completionCheck: { width: 30, height: 30, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: LIME },
  completionText: { flex: 1, color: TEXT, fontSize: 15, lineHeight: 21 },
  sheet: { maxHeight: 490, minHeight: 410, overflow: 'hidden', borderRadius: 24, borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(15,15,15,.96)' },
  handle: { width: 42, height: 4, alignSelf: 'center', marginTop: 13, borderRadius: 2, backgroundColor: '#4A4A4A' }, closeButton: { position: 'absolute', zIndex: 2, top: 14, right: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#202020' },
  questionScroll: { paddingHorizontal: 20, paddingTop: 37, paddingBottom: 12 }, step: { color: LIME, fontSize: 13, lineHeight: 18, fontWeight: '800', letterSpacing: .8 }, question: { marginTop: 13, paddingRight: 40, color: TEXT, fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -.5 }, support: { marginTop: 6, color: MUTED, fontSize: 14, lineHeight: 20 }, options: { gap: 9, marginTop: 18 },
  option: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,.28)', backgroundColor: 'rgba(20,20,20,.72)' }, optionSelected: { borderColor: LIME, backgroundColor: 'rgba(168,255,26,.08)' },
  numberBadge: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: '#777' }, numberSelected: { borderColor: LIME }, numberText: { color: '#C8C8C8', fontSize: 14 }, numberTextSelected: { color: LIME }, optionLabel: { flex: 1, color: TEXT, fontSize: 16, fontWeight: '600' }, radio: { width: 27, height: 27, borderRadius: 14, borderWidth: 1.5, borderColor: '#777' }, radioSelected: { alignItems: 'center', justifyContent: 'center', borderColor: LIME, backgroundColor: LIME },
  footer: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: BORDER }, skipButton: { minWidth: 54, minHeight: 44, justifyContent: 'center' }, skipText: { color: MUTED, fontSize: 16 }, nextButton: { minWidth: 116, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, borderRadius: 17, backgroundColor: LIME }, nextText: { color: '#000', fontSize: 17, fontWeight: '800' }, disabled: { opacity: .34 },
  composer: { height: 66, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 7, borderRadius: 33, borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(15,15,15,.96)' }, plusButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: '#2B2B2B' }, composerInput: { flex: 1, minWidth: 0, color: TEXT, fontSize: 15 }, sendButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: LIME }, pressed: { opacity: .72, transform: [{ scale: .985 }] },
});

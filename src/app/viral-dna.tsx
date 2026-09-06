import { useUser } from '@clerk/expo';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { markGeneratedVideoReady } from '@/features/publishing/publishing-workflow';
import { loadViralDNASession, loadVideoProject, saveViralDNASession, saveVideoProject, type ViralDNASessionSeed } from '@/features/video-creation/project-storage';
import { advanceVideoProject, buildClarificationQuestions, buildCreativeBrief, createVideoProject, GENERATION_STAGES, regenerateScene, runQualityCheck, updateSceneScript, type BriefAnswer, type VideoProject, type VideoScene } from '@/features/video-creation/video-project';
import { deriveViralDNA, type ViralDNA } from '@/features/viral-dna/viral-dna';

const C = { bg: '#000000', surface: '#0B0D0A', raised: '#121510', lime: '#A8FF1A', text: '#F7F8F4', muted: '#969B92', border: '#2C3822', danger: '#FF7B72' };
const SAMPLE_VIDEO = require('../../assets/videos/chihuahua-bully-crocodile.mp4');
type Phase = 'dna' | 'questions' | 'brief' | 'generating' | 'editor';

function formatTime(seconds: number) { const rounded = Math.max(0, Math.round(seconds)); return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`; }

function Pill({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return <View style={[styles.pill, accent && styles.pillAccent]}><Text style={[styles.pillText, accent && styles.pillTextAccent]}>{children}</Text></View>;
}

function Action({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, secondary && styles.actionSecondary, disabled && styles.disabled, pressed && styles.pressed]}><Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text></Pressable>;
}

function ReferencePlayer({ seed }: { seed: ViralDNASessionSeed }) {
  const playable = seed.referenceSource && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(seed.referenceSource);
  const player = useVideoPlayer(playable ? seed.referenceSource! : SAMPLE_VIDEO, (instance) => { instance.loop = true; instance.muted = true; });
  return <View style={styles.referenceFrame}>
    {seed.referenceThumbnailSource && !playable ? <Image source={{ uri: seed.referenceThumbnailSource }} contentFit="cover" style={StyleSheet.absoluteFill} /> : <VideoView accessibilityLabel="Analyzed reference video" nativeControls player={player} contentFit="cover" style={StyleSheet.absoluteFill} />}
    <View style={styles.referenceShade} />
    <View style={styles.referenceMeta}><Pill accent>Analyzed</Pill><Text numberOfLines={2} style={styles.referenceTitle}>{seed.referenceName}</Text><Text style={styles.helper}>{seed.platform} · {seed.aspectRatio}</Text></View>
  </View>;
}

function DNAScreen({ seed, dna, onCreate }: { seed: ViralDNASessionSeed; dna: ViralDNA; onCreate: () => void }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const metrics = [
    ['Hook', `${dna.hook.type} · ${dna.hook.durationSeconds}s`], ['Pacing', dna.editing.cutRhythm],
    ['Dominant emotion', dna.hook.emotionalTrigger], ['Visual rhythm', `${dna.retention.visualChangeCount} changes`],
    ['Caption style', dna.editing.captionBehavior], ['Likely payoff', formatTime(dna.retention.payoffTimingSeconds)],
  ];
  return <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
    <View style={styles.eyebrowRow}><Pill accent>Viral DNA</Pill><Text style={styles.confidence}>{Math.round(dna.confidence * 100)}% analysis confidence</Text></View>
    <Text accessibilityRole="header" style={styles.title}>Why the reference holds attention</Text>
    <Text style={styles.subtitle}>Observed structural advantages—not a promise of virality. We’ll transfer the creative principles, never the original content.</Text>
    <View style={[styles.dnaLayout, wide && styles.dnaLayoutWide]}>
      <View style={styles.referenceColumn}><ReferencePlayer seed={seed} /><View style={styles.card}><Text style={styles.cardLabel}>Why this hook works</Text><Text style={styles.cardTitle}>{dna.hook.likelyRetentionDriver}</Text><Text style={styles.body}>{dna.hook.curiosityGap}</Text></View></View>
      <View style={styles.dnaColumn}>
        <View style={styles.metricGrid}>{metrics.map(([label, value]) => <View key={label} style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>)}</View>
        <View style={styles.card}><Text style={styles.cardLabel}>Story structure</Text><Text style={styles.cardTitle}>{dna.narrative.map((beat) => beat.label).join(' → ')}</Text><Text style={styles.body}>{dna.audience.potentialSharingTrigger}</Text></View>
        <View style={styles.card}><View style={styles.rowBetween}><Text style={styles.cardLabel}>Retention timeline</Text><Text style={styles.helper}>{formatTime(dna.retention.totalDurationSeconds)}</Text></View><View style={styles.timelineBar}>{dna.timeline.map((marker) => <View key={marker.id} style={[styles.timelineSegment, { flex: marker.endSeconds - marker.startSeconds }, marker.strength === 'high' && styles.timelineSegmentStrong]} />)}</View>{dna.timeline.map((marker) => <View key={marker.id} style={styles.markerRow}><Text style={styles.markerTime}>{formatTime(marker.startSeconds)}–{formatTime(marker.endSeconds)}</Text><View style={{ flex: 1 }}><Text style={styles.markerLabel}>{marker.label}</Text><Text numberOfLines={1} style={styles.helper}>{marker.description}</Text></View></View>)}</View>
      </View>
    </View>
    <View style={styles.guardrail}><Text style={styles.guardrailTitle}>Built to be original</Text><Text style={styles.body}>The new video will use different wording, scenes, people, voice, captions, music direction, and editing decisions.</Text></View>
    <Action label="Create a New Video from This DNA →" onPress={onCreate} />
  </ScrollView>;
}

function QuestionScreen({ dna, answers, setAnswers, onBack, onDone }: { dna: ViralDNA; answers: BriefAnswer; setAnswers: (answers: BriefAnswer) => void; onBack: () => void; onDone: () => void }) {
  const [questions] = useState(() => buildClarificationQuestions(dna, answers));
  const firstUnanswered = Math.max(0, questions.findIndex((question) => !answers[question.id]));
  const [index, setIndex] = useState(firstUnanswered < 0 ? questions.length - 1 : firstUnanswered);
  const [custom, setCustom] = useState('');
  const question = questions[index];
  const selected = answers[question.id];
  const choose = (value: string) => setAnswers({ ...answers, [question.id]: value });
  const next = () => { if (index === questions.length - 1) onDone(); else { setIndex(index + 1); setCustom(''); } };
  const decide = () => choose(question.id === 'audience' ? dna.audience.likelyAudience : question.id === 'emotion' ? dna.hook.emotionalTrigger : 'No direct CTA');
  return <ScrollView contentContainerStyle={styles.centerPage} keyboardShouldPersistTaps="handled"><View style={styles.questionPanel}>
    <View style={styles.rowBetween}><Text style={styles.step}>QUESTION {index + 1} OF {questions.length}</Text><Text style={styles.helper}>{Math.round(((index + 1) / questions.length) * 100)}%</Text></View>
    <View style={styles.progress}><View style={[styles.progressFill, { width: `${((index + 1) / questions.length) * 100}%` }]} /></View>
    <Text accessibilityRole="header" style={styles.questionTitle}>{question.title}</Text><Text style={styles.subtitle}>{question.explanation}</Text>
    <View accessibilityRole="radiogroup" style={styles.optionList}>{question.options.map((option) => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ checked: selected === option }} onPress={() => choose(option)} style={({ pressed }) => [styles.option, selected === option && styles.optionSelected, pressed && styles.pressed]}><Text style={styles.optionText}>{option}</Text><View style={[styles.radio, selected === option && styles.radioSelected]} /></Pressable>)}</View>
    {question.allowCustom ? <View style={styles.customRow}><TextInput accessibilityLabel="Custom answer" value={custom} onChangeText={setCustom} placeholder="Write a custom answer" placeholderTextColor={C.muted} style={styles.input} /><Pressable accessibilityRole="button" accessibilityLabel="Use custom answer" onPress={() => { if (custom.trim()) choose(custom.trim()); }} style={styles.smallAction}><Text style={styles.smallActionText}>Use</Text></Pressable></View> : null}
    {question.allowNarial ? <Pressable accessibilityRole="button" onPress={decide} style={styles.decide}><Text style={styles.decideText}>Let Narial decide</Text></Pressable> : null}
    <View style={styles.footer}><Action secondary label={index === 0 ? 'Back' : 'Previous'} onPress={() => index === 0 ? onBack() : setIndex(index - 1)} /><Action label={index === questions.length - 1 ? 'Review brief' : 'Continue'} disabled={!selected} onPress={next} /></View>
  </View></ScrollView>;
}

function BriefScreen({ brief, setBrief, dna, onBack, onGenerate }: { brief: ReturnType<typeof buildCreativeBrief>; setBrief: (brief: ReturnType<typeof buildCreativeBrief>) => void; dna: ViralDNA; onBack: () => void; onGenerate: () => void }) {
  const [advanced, setAdvanced] = useState(false);
  const simple = [['Topic', 'topic'], ['Audience', 'audience'], ['Lead emotion', 'emotion'], ['Viewer action', 'action']] as const;
  return <ScrollView contentContainerStyle={styles.page}><Pill accent>Creative brief</Pill><Text accessibilityRole="header" style={styles.title}>One clear direction before production</Text><Text style={styles.subtitle}>Narial chose the remaining details from the reference DNA. You can change any field before clip generation starts.</Text>
    <View style={styles.briefGrid}>{simple.map(([label, key]) => <View key={key} style={styles.field}><Text style={styles.metricLabel}>{label}</Text><TextInput accessibilityLabel={label} value={brief[key]} onChangeText={(value) => setBrief({ ...brief, [key]: value })} style={styles.fieldInput} /></View>)}</View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: advanced }} onPress={() => setAdvanced(!advanced)} style={styles.advancedToggle}><Text style={styles.cardTitle}>Advanced controls</Text><Text style={styles.helper}>{advanced ? 'Hide' : 'Show'} optional production settings</Text></Pressable>
    {advanced ? <View style={styles.briefGrid}>
      <View style={styles.field}><Text style={styles.metricLabel}>Duration</Text><View style={styles.inlineActions}>{[15, 30, 45, 60].map((duration) => <Pressable key={duration} accessibilityRole="button" accessibilityState={{ selected: brief.durationSeconds === duration }} onPress={() => setBrief({ ...brief, durationSeconds: duration })} style={[styles.choiceChip, brief.durationSeconds === duration && styles.choiceChipSelected]}><Text style={styles.choiceChipText}>{duration}s</Text></Pressable>)}</View></View>
      <View style={styles.field}><Text style={styles.metricLabel}>Aspect ratio</Text><View style={styles.inlineActions}>{['9:16', '1:1', '16:9'].map((ratio) => <Pressable key={ratio} accessibilityRole="button" accessibilityState={{ selected: brief.aspectRatio === ratio }} onPress={() => setBrief({ ...brief, aspectRatio: ratio })} style={[styles.choiceChip, brief.aspectRatio === ratio && styles.choiceChipSelected]}><Text style={styles.choiceChipText}>{ratio}</Text></Pressable>)}</View></View>
      {([['Language', 'language'], ['Visual style', 'visualStyle'], ['Caption style', 'captionStyle'], ['Music energy', 'musicEnergy'], ['Pacing', 'pacing']] as const).map(([label, key]) => <View key={key} style={styles.field}><Text style={styles.metricLabel}>{label}</Text><TextInput accessibilityLabel={label} value={brief[key]} onChangeText={(value) => setBrief({ ...brief, [key]: value })} style={styles.fieldInput} /></View>)}
      <View style={styles.metric}><Text style={styles.metricLabel}>Scene count</Text><Text style={styles.metricValue}>7 adaptive clips</Text></View>
    </View> : null}
    <View style={styles.card}><Text style={styles.cardLabel}>Narial’s choice</Text><Text style={styles.body}>A {brief.durationSeconds}-second {brief.aspectRatio} video with {brief.pacing.toLowerCase()} pacing, shaped around the reference’s {dna.hook.type.toLowerCase()} opening.</Text></View>
    <View style={styles.footer}><Action secondary label="Back" onPress={onBack} /><Action label="Plan & generate video →" onPress={onGenerate} disabled={!brief.topic.trim()} /></View>
  </ScrollView>;
}

function GenerationScreen({ project, onOpenEditor }: { project: VideoProject; onOpenEditor: () => void }) {
  const stageIndex = Math.max(0, GENERATION_STAGES.indexOf(project.generation.stage as typeof GENERATION_STAGES[number]));
  return <ScrollView contentContainerStyle={styles.page}><Pill accent>Production in progress</Pill><Text accessibilityRole="header" style={styles.title}>{project.generation.stage}</Text><Text style={styles.subtitle}>Each clip is generated independently, so a retry never resets approved work.</Text>
    <View style={styles.progressHero}><Text style={styles.progressNumber}>{project.generation.progress}%</Text><View style={styles.progress}><View style={[styles.progressFill, { width: `${project.generation.progress}%` }]} /></View><Text style={styles.helper}>Job {project.generation.jobId}</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clipRail}>{project.scenes.map((scene, index) => <View key={scene.id} style={styles.clipCard}><View style={[styles.clipThumb, scene.status === 'ready' && styles.clipThumbReady]}><Text style={styles.clipNumber}>{index + 1}</Text></View><Text style={styles.markerLabel}>Clip {index + 1} · {scene.purpose}</Text><Text style={styles.helper}>{formatTime(scene.startSeconds)}–{formatTime(scene.endSeconds)}</Text><Pill accent={scene.status === 'ready'}>{scene.status}</Pill></View>)}</ScrollView>
    <View style={styles.stageList}>{GENERATION_STAGES.map((stage, index) => <View key={stage} style={[styles.stageRow, index > stageIndex && styles.muted]}><View style={[styles.stageDot, index <= stageIndex && styles.stageDotActive]} /><Text style={styles.body}>{stage}</Text></View>)}</View>
    {project.status === 'preview-ready' ? <Action label="Open unified video workspace →" onPress={onOpenEditor} /> : null}
  </ScrollView>;
}

function SceneInspector({ project, scene, onChange }: { project: VideoProject; scene: VideoScene; onChange: (project: VideoProject) => void }) {
  const [line, setLine] = useState(scene.scriptLine);
  return <View style={styles.inspector}><View style={styles.rowBetween}><View><Text style={styles.cardLabel}>CLIP {project.scenes.indexOf(scene) + 1}</Text><Text style={styles.cardTitle}>{scene.purpose}</Text></View><Pill accent>{scene.status}</Pill></View>
    <Text style={styles.metricLabel}>Script line</Text><TextInput accessibilityLabel="Selected clip script line" multiline value={line} onChangeText={setLine} style={styles.scriptInput} />
    <View style={styles.inlineActions}><Action secondary label="Save line" onPress={() => onChange(updateSceneScript(project, scene.id, line))} /><Action label="Regenerate Clip" onPress={() => onChange(regenerateScene(project, scene.id, `Use revised line: ${line}`))} /></View>
    {[['Voice', scene.voiceEmotion], ['Visual', scene.visualDescription], ['Camera', scene.cameraDirection], ['Transition', scene.transitionOut], ['Sound', `${scene.soundEffect} · ${scene.musicIntensity}`], ['Versions', `${scene.versions.length} · ${scene.activeVersionId}`]].map(([label, value]) => <View key={label} style={styles.inspectorRow}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.body}>{value}</Text></View>)}
  </View>;
}

function EditorScreen({ project, onChange }: { project: VideoProject; onChange: (project: VideoProject) => void }) {
  const { user } = useUser();
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState(project.scenes[0].id);
  const selected = project.scenes.find((scene) => scene.id === selectedId) ?? project.scenes[0];
  const player = useVideoPlayer(SAMPLE_VIDEO, (instance) => { instance.loop = true; });
  const quality = project.quality ?? runQualityCheck(project);
  const publish = () => { if (user?.id) markGeneratedVideoReady(user.id, project.id); router.push('/generated-video'); };
  return <ScrollView contentContainerStyle={styles.page}><View style={styles.rowBetween}><View><Pill accent>Preview ready</Pill><Text accessibilityRole="header" style={styles.title}>Your video, scene by scene</Text></View><Text style={styles.helper}>{formatTime(project.timeline.durationSeconds)} · {project.brief.aspectRatio}</Text></View>
    <View style={[styles.editorLayout, width >= 1000 && styles.editorLayoutWide]}><View style={styles.previewColumn}><View style={styles.previewFrame}><VideoView accessibilityLabel="Unified generated video preview" nativeControls player={player} contentFit="cover" style={StyleSheet.absoluteFill} /><View style={styles.safeCaption}><Text style={styles.captionText}>{selected.scriptLine}</Text></View></View><View style={styles.track}><Text style={styles.trackLabel}>VIDEO</Text><View style={styles.trackContent}>{project.scenes.map((scene) => <Pressable key={scene.id} accessibilityRole="button" accessibilityState={{ selected: selectedId === scene.id }} onPress={() => setSelectedId(scene.id)} style={[styles.trackClip, { flex: scene.durationSeconds }, selectedId === scene.id && styles.trackClipSelected]}><Text numberOfLines={1} style={styles.trackClipText}>{scene.purpose}</Text></Pressable>)}</View></View>{['CAPTIONS', 'VOICEOVER', 'MUSIC'].map((track) => <View key={track} style={styles.track}><Text style={styles.trackLabel}>{track}</Text><View style={styles.audioTrack}><Text style={styles.helper}>{track === 'MUSIC' ? project.timeline.musicTrack : `${project.scenes.length} timed segments`}</Text></View></View>)}</View><SceneInspector key={selected.id} project={project} scene={selected} onChange={onChange} /></View>
    <View style={styles.qualityCard}><View style={styles.rowBetween}><Text style={styles.cardTitle}>Final quality check</Text><Pill accent={quality.status === 'passed'}>{quality.status}</Pill></View>{quality.checks.map((check) => <View key={check.id} style={styles.checkRow}><Text style={[styles.check, !check.passed && { color: C.danger }]}>{check.passed ? '✓' : '!'}</Text><View style={{ flex: 1 }}><Text style={styles.body}>{check.label}</Text><Text style={styles.helper}>{check.detail}</Text></View></View>)}</View>
    <View style={styles.footer}><Action secondary label="Re-edit Automatically" onPress={() => Alert.alert('Automatic edit ready', 'Narial preserved your approved clips and refreshed transitions, caption timing, and audio balance.')} /><Action label="Export or Publish →" onPress={publish} disabled={quality.status !== 'passed'} /></View>
  </ScrollView>;
}

export default function ViralDNAWorkflowScreen() {
  const params = useLocalSearchParams<{ sessionId?: string; projectId?: string }>();
  const [seed, setSeed] = useState<ViralDNASessionSeed | null>(null);
  const [dna, setDna] = useState<ViralDNA | null>(null);
  const [answers, setAnswers] = useState<BriefAnswer>({});
  const [brief, setBrief] = useState<ReturnType<typeof buildCreativeBrief> | null>(null);
  const [project, setProject] = useState<VideoProject | null>(null);
  const [phase, setPhase] = useState<Phase>('dna');
  const [error, setError] = useState('');

  useEffect(() => { void (async () => {
    try {
      if (params.projectId) { const restored = await loadVideoProject(params.projectId); if (restored) { setProject(restored); setSeed({ id: restored.id, referenceId: restored.dna.referenceId, referenceName: 'Analyzed reference', platform: restored.dna.audience.platform, aspectRatio: restored.dna.audience.aspectRatio, analysis: { schemaVersion: 1, summary: '', durationSeconds: restored.dna.retention.totalDurationSeconds, subjects: [], scenes: [], creativeDNA: { openingHook: restored.dna.hook.type, narrativeStructure: '', pacing: restored.dna.editing.cutRhythm, visualStyle: [], colorMood: [], editingPatterns: [], audioStyle: '' }, reusableInsights: [], safetyFlags: [] }, savedAt: restored.updatedAt }); setDna(restored.dna); setBrief(restored.brief); setPhase(restored.status === 'preview-ready' || restored.status === 'editing' ? 'editor' : 'generating'); return; } }
      if (!params.sessionId) throw new Error('This Viral DNA session is missing. Open an analyzed video and try again.');
      const loaded = await loadViralDNASession(params.sessionId); if (!loaded) throw new Error('This saved analysis could not be restored. Open the reference video again.');
      setSeed(loaded); setAnswers(loaded.answers ?? (loaded.topic ? { topic: loaded.topic } : {})); setBrief(loaded.brief ?? null); setPhase(loaded.phase ?? 'dna'); setDna(deriveViralDNA(loaded.analysis, { referenceId: loaded.referenceId, platform: loaded.platform, aspectRatio: loaded.aspectRatio }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'The workflow could not be opened.'); }
  })(); }, [params.projectId, params.sessionId]);

  useEffect(() => { if (!project) return; void saveVideoProject(project); }, [project]);
  useEffect(() => { if (!seed || project || !['dna', 'questions', 'brief'].includes(phase)) return; void saveViralDNASession({ ...seed, answers, ...(brief ? { brief } : {}), phase: phase as 'dna' | 'questions' | 'brief', savedAt: new Date().toISOString() }); }, [answers, brief, phase, project, seed]);
  useEffect(() => {
    if (phase !== 'generating' || !project || project.status === 'preview-ready') return;
    const timer = setTimeout(() => setProject((current) => current ? advanceVideoProject(current) : current), 650);
    return () => clearTimeout(timer);
  }, [phase, project]);

  if (error) return <SafeAreaView style={styles.loading}><Text accessibilityRole="alert" style={styles.cardTitle}>{error}</Text><Action label="Back to generator" onPress={() => router.replace('/generator')} /></SafeAreaView>;
  if (!seed || !dna) return <SafeAreaView style={styles.loading}><ActivityIndicator accessibilityLabel="Opening Viral DNA" color={C.lime} /><Text style={styles.helper}>Opening the saved analysis…</Text></SafeAreaView>;
  const prepareBrief = () => { try { setBrief(buildCreativeBrief(answers, dna)); setPhase('brief'); } catch (reason) { Alert.alert('A topic is still needed', reason instanceof Error ? reason.message : 'Add a topic to continue.'); } };
  const generate = () => { if (!brief) return; const created = createVideoProject({ dna, brief }); setProject(created); setPhase('generating'); router.setParams({ projectId: created.id }); };
  const changeProject = (next: VideoProject) => { setProject(next); if (next.status !== 'preview-ready') setPhase(next.status === 'editing' ? 'editor' : 'generating'); };

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
    {phase === 'dna' ? <DNAScreen seed={seed} dna={dna} onCreate={() => setPhase('questions')} /> : null}
    {phase === 'questions' ? <QuestionScreen dna={dna} answers={answers} setAnswers={setAnswers} onBack={() => setPhase('dna')} onDone={prepareBrief} /> : null}
    {phase === 'brief' && brief ? <BriefScreen brief={brief} setBrief={setBrief} dna={dna} onBack={() => setPhase('questions')} onGenerate={generate} /> : null}
    {phase === 'generating' && project ? <GenerationScreen project={project} onOpenEditor={() => setPhase('editor')} /> : null}
    {phase === 'editor' && project ? <EditorScreen project={project} onChange={changeProject} /> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, backgroundColor: C.bg }, page: { width: '100%', maxWidth: 1240, alignSelf: 'center', gap: 20, padding: 24, paddingBottom: 48 }, centerPage: { flex: 1, justifyContent: 'center', padding: 20 }, questionPanel: { width: '100%', maxWidth: 680, maxHeight: '94%', alignSelf: 'center', padding: 24, borderRadius: 28, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, confidence: { color: C.muted, fontSize: 12 }, title: { marginTop: 4, color: C.text, fontSize: 36, lineHeight: 42, fontWeight: '900', letterSpacing: -1 }, subtitle: { maxWidth: 760, color: C.muted, fontSize: 15, lineHeight: 22 }, body: { color: '#D4D7D0', fontSize: 14, lineHeight: 20 }, helper: { color: C.muted, fontSize: 12, lineHeight: 17 },
  pill: { alignSelf: 'flex-start', minHeight: 25, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 13, backgroundColor: '#20231E' }, pillAccent: { backgroundColor: 'rgba(168,255,26,.13)', borderWidth: 1, borderColor: 'rgba(168,255,26,.35)' }, pillText: { color: '#BEC2B9', fontSize: 11, fontWeight: '800', textTransform: 'capitalize' }, pillTextAccent: { color: C.lime },
  dnaLayout: { gap: 16 }, dnaLayoutWide: { flexDirection: 'row', alignItems: 'flex-start' }, referenceColumn: { flex: .82, minWidth: 0, gap: 16 }, dnaColumn: { flex: 1.18, minWidth: 0, gap: 16 }, referenceFrame: { width: '100%', aspectRatio: 16 / 10, overflow: 'hidden', borderRadius: 26, borderWidth: 1, borderColor: C.border, backgroundColor: C.raised }, referenceShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,.22)' }, referenceMeta: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 7 }, referenceTitle: { color: C.text, fontSize: 19, lineHeight: 24, fontWeight: '800' },
  card: { gap: 8, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, cardLabel: { color: C.lime, fontSize: 11, lineHeight: 16, fontWeight: '900', letterSpacing: .8, textTransform: 'uppercase' }, cardTitle: { color: C.text, fontSize: 18, lineHeight: 24, fontWeight: '800' }, metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, metric: { width: '48%', flexGrow: 1, minWidth: 150, gap: 5, padding: 14, borderRadius: 16, backgroundColor: C.raised, borderWidth: 1, borderColor: C.border }, metricLabel: { color: C.muted, fontSize: 11, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase', letterSpacing: .5 }, metricValue: { color: C.text, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, timelineBar: { height: 7, flexDirection: 'row', gap: 2, overflow: 'hidden', borderRadius: 4, backgroundColor: '#222' }, timelineSegment: { backgroundColor: '#52613E' }, timelineSegmentStrong: { backgroundColor: C.lime }, markerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 6 }, markerTime: { width: 76, color: C.lime, fontSize: 12, fontWeight: '800' }, markerLabel: { color: C.text, fontSize: 13, lineHeight: 18, fontWeight: '800' }, guardrail: { padding: 16, borderLeftWidth: 3, borderLeftColor: C.lime, backgroundColor: 'rgba(168,255,26,.05)' }, guardrailTitle: { marginBottom: 4, color: C.text, fontSize: 15, fontWeight: '800' },
  action: { minHeight: 52, flexShrink: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, borderRadius: 18, backgroundColor: C.lime }, actionSecondary: { borderWidth: 1, borderColor: '#4B5145', backgroundColor: 'transparent' }, actionText: { color: '#071000', fontSize: 15, fontWeight: '900' }, actionTextSecondary: { color: C.text }, disabled: { opacity: .38 }, pressed: { opacity: .72, transform: [{ scale: .987 }] },
  step: { color: C.lime, fontSize: 12, fontWeight: '900', letterSpacing: .8 }, progress: { height: 5, overflow: 'hidden', borderRadius: 3, backgroundColor: '#2B3027' }, progressFill: { height: '100%', borderRadius: 3, backgroundColor: C.lime }, questionTitle: { marginTop: 22, color: C.text, fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -.6 }, optionList: { gap: 9, marginTop: 20 }, option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#343A31', backgroundColor: C.raised }, optionSelected: { borderColor: C.lime, backgroundColor: 'rgba(168,255,26,.08)' }, optionText: { flex: 1, color: C.text, fontSize: 15, fontWeight: '700' }, radio: { width: 19, height: 19, borderRadius: 10, borderWidth: 1, borderColor: '#73786F' }, radioSelected: { borderWidth: 5, borderColor: C.lime, backgroundColor: '#000' }, customRow: { flexDirection: 'row', gap: 8, marginTop: 12 }, input: { flex: 1, minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#3B4137', color: C.text, backgroundColor: C.bg }, smallAction: { minWidth: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#252A22' }, smallActionText: { color: C.lime, fontWeight: '800' }, decide: { alignSelf: 'flex-start', marginTop: 14, paddingVertical: 8 }, decideText: { color: C.lime, fontSize: 14, fontWeight: '800' }, footer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 20 },
  briefGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, field: { width: '48%', minWidth: 240, flexGrow: 1, gap: 6 }, fieldInput: { minHeight: 50, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, borderColor: C.border, color: C.text, backgroundColor: C.raised }, advancedToggle: { gap: 3, paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  choiceChip: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#42483E', backgroundColor: C.raised }, choiceChipSelected: { borderColor: C.lime, backgroundColor: 'rgba(168,255,26,.1)' }, choiceChipText: { color: C.text, fontSize: 13, fontWeight: '800' },
  progressHero: { gap: 12, padding: 20, borderRadius: 22, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border }, progressNumber: { color: C.lime, fontSize: 34, fontWeight: '900' }, clipRail: { gap: 12, paddingVertical: 4 }, clipCard: { width: 152, gap: 7, padding: 10, borderRadius: 18, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, clipThumb: { height: 90, justifyContent: 'flex-end', padding: 10, borderRadius: 12, backgroundColor: '#22271F' }, clipThumbReady: { backgroundColor: '#31451E' }, clipNumber: { color: C.lime, fontSize: 28, fontWeight: '900' }, stageList: { gap: 10 }, stageRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, stageDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#3D4338' }, stageDotActive: { backgroundColor: C.lime }, muted: { opacity: .38 },
  editorLayout: { gap: 16 }, editorLayoutWide: { flexDirection: 'row', alignItems: 'flex-start' }, previewColumn: { flex: 1.3, gap: 8, minWidth: 0 }, previewFrame: { width: '100%', aspectRatio: 16 / 9, overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.raised }, safeCaption: { position: 'absolute', left: '10%', right: '10%', bottom: '10%', alignItems: 'center', padding: 8 }, captionText: { color: '#FFF', fontSize: 18, lineHeight: 23, fontWeight: '900', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 4 }, track: { minHeight: 42, flexDirection: 'row', alignItems: 'stretch', gap: 8 }, trackLabel: { width: 70, alignSelf: 'center', color: C.muted, fontSize: 9, fontWeight: '900' }, trackContent: { flex: 1, flexDirection: 'row', gap: 3 }, trackClip: { minWidth: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, borderRadius: 7, borderWidth: 1, borderColor: '#3A4930', backgroundColor: '#24311B' }, trackClipSelected: { borderColor: C.lime, backgroundColor: '#334923' }, trackClipText: { color: C.text, fontSize: 9, fontWeight: '700' }, audioTrack: { flex: 1, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 7, backgroundColor: '#171C15' }, inspector: { flex: .8, minWidth: 280, gap: 13, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, scriptInput: { minHeight: 92, padding: 12, borderRadius: 13, borderWidth: 1, borderColor: '#41493C', color: C.text, backgroundColor: C.bg, textAlignVertical: 'top' }, inlineActions: { flexDirection: 'row', gap: 8 }, inspectorRow: { gap: 3, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border }, qualityCard: { gap: 11, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }, checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, check: { width: 22, color: C.lime, fontSize: 16, fontWeight: '900' },
});

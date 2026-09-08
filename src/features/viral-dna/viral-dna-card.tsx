import { StyleSheet, Text, View } from 'react-native';
import type { VideoAnalysis } from '@/features/video-analysis/video-analysis-client';
import { deriveViralDna } from './viral-dna';

const LIME = '#A8FF1A', TEXT = '#F7F7F5', MUTED = '#A2A69F';

export function ViralDnaCard({ analysis }: { analysis: VideoAnalysis }) {
  const dna = deriveViralDna(analysis);
  const metrics = [['Pacing', dna.pacing], ['Emotion', dna.dominantEmotion], ['Avg. shot', `${dna.averageShotSeconds}s`], ['Visual changes', `${dna.visualChanges}`]];
  return <View style={s.card}>
    <Text style={s.eyebrow}>VIRAL DNA</Text><Text accessibilityRole="header" style={s.title}>What makes this structure engaging</Text>
    <Text style={s.disclaimer}>Observed creative patterns—not a guarantee of performance.</Text>
    <View style={s.metrics}>{metrics.map(([label, value]) => <View key={label} style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>)}</View>
    <Section label="HOOK DNA" value={dna.hook} /><Section label="STORY SHAPE" value={dna.narrativeStructure} /><Section label="VISUAL + AUDIO RHYTHM" value={`${dna.visualRhythm} · ${dna.audioStyle}`} />
    <View style={s.retention}><Text style={s.retentionText}>{dna.retentionLanguage}</Text></View>
    {dna.timeline.length ? <View style={s.section}><Text style={s.label}>MOMENT-BY-MOMENT STRUCTURE</Text><View style={s.timeline}>{dna.timeline.map((item, index) => <View key={`${item.range}-${index}`} style={s.row}><View style={s.rail}><View style={s.dot} />{index < dna.timeline.length - 1 ? <View style={s.line} /> : null}</View><View style={s.copy}><Text style={s.time}>{item.range}</Text><Text style={s.purpose}>{item.purpose}</Text><Text style={s.description}>{item.description}</Text></View></View>)}</View></View> : null}
  </View>;
}

function Section({ label, value }: { label: string; value: string }) { return <View style={s.section}><Text style={s.label}>{label}</Text><Text style={s.body}>{value}</Text></View>; }

const s = StyleSheet.create({
  card: { marginTop: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.16)', borderRadius: 24, backgroundColor: '#0C0E0B' }, eyebrow: { color: LIME, fontSize: 11, fontWeight: '900', letterSpacing: 1.3 }, title: { marginTop: 5, color: TEXT, fontSize: 21, lineHeight: 27, fontWeight: '800' }, disclaimer: { marginTop: 5, color: MUTED, fontSize: 12, lineHeight: 17 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }, metric: { minWidth: '46%', flexGrow: 1, padding: 11, borderRadius: 14, backgroundColor: '#171A15' }, metricLabel: { color: MUTED, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }, metricValue: { marginTop: 3, color: TEXT, fontSize: 14, fontWeight: '700' },
  section: { marginTop: 18 }, label: { color: LIME, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, body: { marginTop: 4, color: '#D8DBD5', fontSize: 14, lineHeight: 20 }, retention: { marginTop: 17, padding: 13, borderLeftWidth: 3, borderLeftColor: LIME, borderRadius: 10, backgroundColor: 'rgba(168,255,26,.07)' }, retentionText: { color: TEXT, fontSize: 13, lineHeight: 19 },
  timeline: { marginTop: 11 }, row: { minHeight: 67, flexDirection: 'row', gap: 10 }, rail: { width: 12, alignItems: 'center' }, dot: { zIndex: 1, width: 8, height: 8, marginTop: 4, borderRadius: 4, backgroundColor: LIME }, line: { position: 'absolute', top: 12, bottom: -4, width: 1, backgroundColor: '#42463E' }, copy: { flex: 1, paddingBottom: 12 }, time: { color: LIME, fontSize: 11, fontWeight: '800' }, purpose: { color: TEXT, fontSize: 14, lineHeight: 19, fontWeight: '800' }, description: { marginTop: 2, color: MUTED, fontSize: 12, lineHeight: 17 },
});

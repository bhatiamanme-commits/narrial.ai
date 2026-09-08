import { StyleSheet, Text, View } from 'react-native';
import type { ClarificationAnswer } from './creative-brief';
import { buildCreativeBrief } from './creative-brief';

export function CreativeBriefCard({ prompt, aspectRatio, answers }: { prompt?: string; aspectRatio?: string; answers: Record<string, ClarificationAnswer> }) {
  const brief = buildCreativeBrief({ prompt, aspectRatio }, answers);
  return <View style={s.card}><Text style={s.eyebrow}>CREATIVE BRIEF READY</Text><Text accessibilityRole="header" style={s.title}>Here’s what I’ll create</Text>
    {Object.entries({ Topic: brief.topic, Audience: brief.audience, Emotion: brief.primaryEmotion, Action: brief.desiredAction, Format: brief.aspectRatio }).map(([label, value]) => <View key={label} style={s.row}><Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text></View>)}
    <Text style={s.note}>The script, scenes, voice, captions, and editing will be original while using only the reference’s structural principles.</Text>
  </View>;
}
const s = StyleSheet.create({ card: { marginTop: 16, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(168,255,26,.35)', backgroundColor: '#10140D' }, eyebrow: { color: '#A8FF1A', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 }, title: { marginTop: 5, marginBottom: 12, color: '#F7F7F5', fontSize: 20, lineHeight: 26, fontWeight: '800' }, row: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,.13)' }, label: { width: 72, color: '#929692', fontSize: 12, fontWeight: '700' }, value: { flex: 1, color: '#F7F7F5', fontSize: 13, lineHeight: 18 }, note: { marginTop: 12, color: '#B7BBB4', fontSize: 12, lineHeight: 18 } });

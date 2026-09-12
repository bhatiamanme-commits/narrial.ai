import { StyleSheet, Text, View } from 'react-native';

import type { GeneratedStory } from './story-generation-client';

export function StoryCard({ story }: { story: GeneratedStory }) {
  return <View accessibilityLabel={`Generated script: ${story.title}`} style={styles.card}>
    <Text style={styles.eyebrow}>ORIGINAL SCRIPT · {story.scenes.length} SCENES</Text>
    <Text accessibilityRole="header" style={styles.title}>{story.title}</Text>
    <View style={styles.hookBlock}><Text style={styles.sectionLabel}>OPENING HOOK</Text><Text style={styles.hook}>{story.hook}</Text></View>
    <Text style={styles.summary}>{story.story}</Text>
    <View accessibilityRole="list" style={styles.sceneList}>
      {story.scenes.map((scene, index) => <View accessibilityLabel={`Scene ${index + 1}: ${scene.purpose}`} key={`${scene.startSeconds}-${index}`} style={styles.scene}>
        <View style={styles.sceneHeader}><View style={styles.sceneNumber}><Text style={styles.sceneNumberText}>{index + 1}</Text></View><View style={styles.sceneHeading}><Text accessibilityRole="header" style={styles.sceneTitle}>Scene {index + 1} · {scene.purpose}</Text><Text style={styles.time}>{scene.startSeconds}s–{scene.endSeconds}s</Text></View></View>
        <Text style={styles.fieldLabel}>NARRATION</Text><Text style={styles.narration}>{scene.narration}</Text>
        <Text style={styles.fieldLabel}>VISUAL DIRECTION</Text><Text style={styles.visual}>{scene.visual}</Text>
        <View style={styles.emotionBadge}><Text style={styles.emotion}>{scene.emotion}</Text></View>
      </View>)}
    </View>
    <View style={styles.endingBlock}><Text style={styles.sectionLabel}>ENDING</Text><Text style={styles.ending}>{story.ending}</Text></View>
    <Text style={styles.note}>{story.originalityNote}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { marginTop: 18, padding: 18, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(168,255,26,.35)', backgroundColor: '#0D100B' }, eyebrow: { color: '#A8FF1A', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 }, title: { marginTop: 6, color: '#F7F7F5', fontSize: 24, lineHeight: 30, fontWeight: '900' },
  hookBlock: { marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: 'rgba(168,255,26,.08)' }, sectionLabel: { color: '#A8FF1A', fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 1 }, hook: { marginTop: 5, color: '#FFFFFF', fontSize: 17, lineHeight: 24, fontWeight: '700' }, summary: { marginTop: 14, color: '#C8CBC5', fontSize: 14, lineHeight: 21 },
  sceneList: { marginTop: 6 }, scene: { marginTop: 14, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,.13)', backgroundColor: '#111410' }, sceneHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 }, sceneNumber: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#A8FF1A' }, sceneNumberText: { color: '#050505', fontSize: 14, fontWeight: '900' }, sceneHeading: { flex: 1 }, sceneTitle: { color: '#F7F7F5', fontSize: 15, lineHeight: 20, fontWeight: '800' }, time: { marginTop: 2, color: '#A8FF1A', fontSize: 11, fontWeight: '700' },
  fieldLabel: { marginTop: 14, color: '#81867E', fontSize: 9, lineHeight: 13, fontWeight: '900', letterSpacing: .9 }, narration: { marginTop: 4, color: '#F7F7F5', fontSize: 15, lineHeight: 22 }, visual: { marginTop: 4, color: '#B4B8B1', fontSize: 13, lineHeight: 19 }, emotionBadge: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#242A20' }, emotion: { color: '#D9DDD5', fontSize: 11, fontWeight: '700' },
  endingBlock: { marginTop: 16, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,.16)' }, ending: { marginTop: 5, color: '#FFFFFF', fontSize: 15, lineHeight: 22, fontWeight: '700' }, note: { marginTop: 12, color: '#929692', fontSize: 11, lineHeight: 16 },
});

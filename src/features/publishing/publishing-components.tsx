import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import type { SocialPlatformId } from '@/features/social-accounts/social-accounts';

import { formatMetric, type PublishingPost } from './publishing-data';
import { getContentScoreGauge } from './publishing-gauge';
import { PublishingIcon } from './publishing-icons';

const LIME = '#A8FF00';

function MonochromePlatformIcon({ platform }: { platform: SocialPlatformId }) {
  if (platform === 'instagram') return <Svg width={19} height={19} viewBox="0 0 24 24"><Rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#FFF" strokeWidth="2"/><Circle cx="12" cy="12" r="4" fill="none" stroke="#FFF" strokeWidth="2"/><Circle cx="17.5" cy="6.5" r="1.2" fill="#FFF"/></Svg>;
  if (platform === 'tiktok') return <Svg width={19} height={19} viewBox="0 0 24 24"><Path d="M14 3v12.2a4.2 4.2 0 1 1-3.5-4.1M14 3c.6 3.2 2.5 5 5.3 5.3" fill="none" stroke="#FFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
  if (platform === 'youtube') return <Svg width={21} height={17} viewBox="0 0 24 18"><Rect x="1" y="1" width="22" height="16" rx="4" fill="#FFF"/><Path d="m10 5 6 4-6 4Z" fill="#090A09"/></Svg>;
  if (platform === 'facebook') return <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M14.5 22V13h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8h1.9V2.4c-.7-.1-1.7-.2-2.8-.2-2.8 0-4.7 1.7-4.7 4.8v2.5H7.5V13h3.2v9Z" fill="#FFF"/></Svg>;
  if (platform === 'x') return <Svg width={18} height={18} viewBox="0 0 24 24"><Path d="M4 3h4.7l4.2 5.6L17.8 3H20l-6 7.1L20.5 21h-4.7l-4.4-5.9L6.2 21H4l6.2-7.4Z" fill="#FFF"/></Svg>;
  return <Svg width={18} height={18} viewBox="0 0 24 24"><Rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="#FFF" strokeWidth="2"/><Circle cx="8" cy="9" r="1.3" fill="#FFF"/><Path d="M7 12v6m4-6v6m0-3.4c0-3.4 5-3.4 5 0V18" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round"/></Svg>;
}

export function PublishingTabs({ active, onChange }: { active: 'scheduled' | 'published'; onChange: (tab: 'scheduled' | 'published') => void }) {
  return <View accessibilityRole="tablist" style={styles.tabs}>{(['scheduled', 'published'] as const).map((tab) => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: active === tab }} onPress={() => onChange(tab)} style={[styles.tab, active === tab && styles.activeTab]}><Text style={[styles.tabText, active === tab && styles.activeTabText]}>{tab[0].toUpperCase() + tab.slice(1)}</Text></Pressable>)}</View>;
}

export function PlatformDots({ platforms, overlay = false }: { platforms: SocialPlatformId[]; overlay?: boolean }) {
  return <View accessible accessibilityLabel={`Destinations: ${platforms.join(', ')}`} style={[styles.platforms, overlay && styles.platformsOverlay]}>{platforms.map((platform) => <View key={platform} style={styles.platformIcon}><MonochromePlatformIcon platform={platform}/></View>)}</View>;
}

function Metric({ icon, value, label }: { icon: 'eye' | 'heart' | 'share'; value: number; label: string }) {
  return <View accessible accessibilityLabel={`${formatMetric(value)} ${label}`} style={styles.metric}><PublishingIcon name={icon} size={18} color="#C7C7C7"/><View><Text style={styles.metricValue}>{formatMetric(value)}</Text><Text style={styles.metricLabel}>{label}</Text></View></View>;
}

export function PublishingThumbnail({ thumbnail, duration, platforms, compact = false }: Pick<PublishingPost, 'thumbnail' | 'duration'> & { platforms?: SocialPlatformId[]; compact?: boolean }) {
  const copy = thumbnail === 'summit' ? ['5 SECONDS', 'CAN CHANGE', 'EVERYTHING.'] : thumbnail === 'discipline' ? ['DISCIPLINE', 'BUILDS FREEDOM.', 'BUILD YOUR FUTURE.'] : ['STOP WAITING', 'FOR MOTIVATION.', 'BUILD DISCIPLINE.'];
  const background = thumbnail === 'summit' ? styles.summitThumb : thumbnail === 'discipline' ? styles.disciplineThumb : styles.runnerThumb;
  return <View style={[styles.thumbnail, compact && styles.thumbnailCompact, background]}><View style={styles.thumbGlow}/>{platforms?.length ? <PlatformDots platforms={platforms} overlay/> : null}<View style={platforms?.length ? styles.thumbCopyWithPlatforms : null}>{copy.map((line, index) => <Text key={line} style={[styles.thumbText, compact && styles.thumbTextCompact, index === copy.length - 1 && styles.thumbAccent]}>{line}</Text>)}</View><View style={styles.duration}><PublishingIcon name="play" size={14}/><Text style={styles.durationText}>{duration}</Text></View></View>;
}

export function PublishedPostCard({ post, selected, onToggle, onMenu }: { post: PublishingPost; selected: boolean; onToggle: () => void; onMenu: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={`Select ${post.title} for comparison`} onPress={onToggle} style={[styles.postCard, selected && styles.selectedCard]}>
    <PublishingThumbnail thumbnail={post.thumbnail} duration={post.duration} platforms={post.platforms}/><View style={styles.postContent}>
      <View style={styles.postTitleRow}><Text numberOfLines={2} style={styles.postTitle}>{post.title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`More options for ${post.title}`} onPress={(event) => { event.stopPropagation(); onMenu(); }} hitSlop={10} style={styles.more}><PublishingIcon name="more"/></Pressable></View>
      <Text style={styles.postDate}>{post.publishedAtLabel}</Text>
      <View style={styles.status}><PublishingIcon name="check" size={20} color={post.status === 'published' ? LIME : '#FFD44A'}/><Text style={[styles.statusText, post.status === 'partial' && styles.partialText]}>{post.status === 'published' ? 'Published' : 'Partially published'}</Text></View>
      <View style={styles.divider}/><View style={styles.metrics}><Metric icon="eye" value={post.views} label="views"/><Metric icon="heart" value={post.likes} label="likes"/><Metric icon="share" value={post.shares} label="shares"/>{post.topPerformer && <View accessible accessibilityLabel="Top performer" style={styles.badge}><PublishingIcon name="sparkle" size={15} color="#FFD400"/><Text style={styles.badgeText}>Top performer</Text></View>}</View>
    </View>
  </Pressable>;
}

export function SummaryCard({ icon, value, label, change }: { icon: 'calendar' | 'eye' | 'chart'; value: string; label: string; change: string }) {
  return <View accessible accessibilityLabel={`${value} ${label}, up ${change}`} style={styles.summaryCard}><View style={styles.summaryIcon}><PublishingIcon name={icon} size={25} color={LIME}/></View><View><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryChange}>↗ {change}</Text></View></View>;
}

export function ContentPerformanceCard({ posts, views, engagement, score = 82 }: { posts: number; views: string; engagement: string; score?: number }) {
  const metrics = [{ value: String(posts), label: 'Posts' }, { value: views, label: 'Views' }, { value: engagement, label: 'Engagement' }];
  const gauge = getContentScoreGauge(score);
  return <View accessible accessibilityLabel={`Content performance score ${gauge.score} out of 100. ${posts} posts, ${views} views, ${engagement} engagement.`} style={styles.performanceCard}>
    <View style={styles.gaugeWrap}><Svg width="100%" height={132} viewBox="0 0 240 132"><Path d="M20 116 A100 100 0 0 1 220 116" fill="none" stroke="#252A20" strokeWidth="12" strokeLinecap="round"/><Path d="M20 116 A100 100 0 0 1 220 116" fill="none" stroke={LIME} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${gauge.dashLength} 314`}/><Circle cx={gauge.cx} cy={gauge.cy} r="5" fill="#FFF"/></Svg><View style={styles.gaugeScore}><Text style={styles.scoreValue}>{gauge.score}<Text style={styles.scoreTotal}>/100</Text></Text><Text style={styles.scoreLabel}>CONTENT SCORE</Text><Text style={styles.scoreTrend}>↑ 18% this week</Text></View></View>
    <View style={styles.performanceMetrics}>{metrics.map((metric, index) => <View key={metric.label} style={[styles.performanceMetric, index > 0 && styles.performanceMetricBorder]}><Text style={styles.performanceValue}>{metric.value}</Text><Text style={styles.performanceLabel}>{metric.label}</Text><Text style={styles.performanceTrend}>↑ 18%</Text></View>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  tabs: { height: 58, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333' }, tab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' }, activeTab: { borderBottomColor: LIME }, tabText: { color: '#989898', fontSize: 17, fontWeight: '600' }, activeTabText: { color: LIME },
  platforms: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }, platformsOverlay: { position: 'absolute', zIndex: 2, top: 12, left: 12, minHeight: 0, flexDirection: 'column', alignItems: 'center', gap: 3, marginTop: 0 }, platformIcon: { width: 21, height: 21, alignItems: 'center', justifyContent: 'center' },
  postCard: { flexDirection: 'row', gap: 14, padding: 12, borderRadius: 17, borderWidth: 1, borderColor: '#303030', backgroundColor: '#090A09' }, selectedCard: { borderColor: LIME, backgroundColor: '#10150A' }, thumbnail: { width: 128, minHeight: 172, overflow: 'hidden', justifyContent: 'flex-start', padding: 12, borderRadius: 11, backgroundColor: '#212B2E' }, summitThumb: { backgroundColor: '#314047' }, disciplineThumb: { backgroundColor: '#25211B' }, runnerThumb: { backgroundColor: '#343124' }, thumbGlow: { position: 'absolute', left: 42, right: -20, bottom: 12, height: 74, borderRadius: 50, backgroundColor: 'rgba(255,190,70,0.28)' }, thumbCopyWithPlatforms: { marginLeft: 28 }, thumbText: { color: '#FFF', fontSize: 13, lineHeight: 16, fontWeight: '900' }, thumbAccent: { color: LIME }, duration: { position: 'absolute', left: 9, right: 9, bottom: 9, minHeight: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.75)' }, durationText: { color: '#FFF', fontSize: 13 }, postContent: { flex: 1, minWidth: 0, paddingVertical: 3 }, postTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 }, postTitle: { flex: 1, color: '#FFF', fontSize: 20, lineHeight: 25, fontWeight: '800' }, more: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }, postDate: { marginTop: 5, color: '#B2B2B2', fontSize: 14 }, status: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 }, statusText: { color: LIME, fontSize: 15, fontWeight: '600' }, partialText: { color: '#FFD44A' }, divider: { height: 1, marginVertical: 9, backgroundColor: '#333' }, metrics: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 }, metric: { flexDirection: 'row', alignItems: 'center', gap: 5 }, metricValue: { color: '#F4F4F4', fontSize: 14, fontWeight: '600' }, metricLabel: { color: '#9D9D9D', fontSize: 11 }, badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9, borderWidth: 1, borderColor: LIME }, badgeText: { color: '#FFD400', fontSize: 11, fontWeight: '700' },
  summaryCard: { flex: 1, minWidth: 110, minHeight: 112, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#3A4D14', backgroundColor: '#0B0D09' }, summaryIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B2113' }, summaryValue: { color: '#FFF', fontSize: 23, fontWeight: '800' }, summaryLabel: { color: '#B9B9B9', fontSize: 13 }, summaryChange: { marginTop: 8, color: LIME, fontSize: 13, fontWeight: '700' },
  performanceCard: { overflow: 'hidden', marginTop: 16, borderRadius: 20, borderWidth: 1, borderColor: '#303030', backgroundColor: '#090909' }, gaugeWrap: { height: 156, alignItems: 'center', paddingTop: 12 }, gaugeScore: { position: 'absolute', left: 0, right: 0, bottom: 8, alignItems: 'center' }, scoreValue: { color: '#FFF', fontSize: 38, lineHeight: 43, fontWeight: '900' }, scoreTotal: { color: '#989E94', fontSize: 15, fontWeight: '700' }, scoreLabel: { color: '#AEB2AA', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }, scoreTrend: { marginTop: 5, color: LIME, fontSize: 11, fontWeight: '800' }, performanceMetrics: { minHeight: 92, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#292929', backgroundColor: '#101010' }, performanceMetric: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }, performanceMetricBorder: { borderLeftWidth: 1, borderLeftColor: '#292929' }, performanceValue: { color: '#FFF', fontSize: 21, fontWeight: '900' }, performanceLabel: { marginTop: 2, color: '#AEB2AA', fontSize: 12 }, performanceTrend: { marginTop: 5, color: LIME, fontSize: 11, fontWeight: '800' },
  thumbnailCompact: { width: 96, minHeight: 154, padding: 9 },
  thumbTextCompact: { fontSize: 11, lineHeight: 14 },
});

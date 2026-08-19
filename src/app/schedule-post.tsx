import { useUser } from '@clerk/expo';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { getSavedPublishingTargets } from '@/features/social-accounts/social-accounts';
import { clearSchedulingDraft, getSchedulingDraft, SchedulingConflictError, schedulePost } from '@/features/scheduling/scheduling-service';
import { buildCalendarDays, buildScheduledDate, formatScheduleSummary, getDefaultSchedule, getLocalTimezone, type Meridiem, validateSchedule } from '@/features/scheduling/schedule-utils';

const LIME = '#A8FF00';
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const TIMEZONES = [
  getLocalTimezone(),
  { id: 'UTC', label: 'Coordinated Universal Time (GMT)' },
  { id: 'America/New_York', label: 'Eastern Time (GMT-4)' },
  { id: 'America/Los_Angeles', label: 'Pacific Time (GMT-7)' },
  { id: 'Europe/London', label: 'London Time (GMT+1)' },
  { id: 'Asia/Kolkata', label: 'India Standard Time (GMT+5:30)' },
].filter((zone, index, all) => all.findIndex((item) => item.id === zone.id) === index);

function Icon({ name, size = 26, color = '#FFF' }: { name: 'back' | 'more' | 'next' | 'chevron' | 'globe' | 'check'; size?: number; color?: string }) {
  if (name === 'more') return <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="5" cy="12" r="1.8" fill={color}/><Circle cx="12" cy="12" r="1.8" fill={color}/><Circle cx="19" cy="12" r="1.8" fill={color}/></Svg>;
  if (name === 'globe') return <Svg width={size} height={size} viewBox="0 0 24 24"><Circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.7"/><Path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round"/></Svg>;
  if (name === 'check') return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="m5 12 4 4L19 6" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
  const path = name === 'back' ? 'm15 18-6-6 6-6M9 12h10' : name === 'next' ? 'm9 18 6-6-6-6M15 12H4' : 'm9 18 6-6-6-6';
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
}

export default function SchedulePostPage() {
  const { isLoaded, user } = useUser();
  const draft = user?.id ? getSchedulingDraft(user.id) : null;
  const localZone = TIMEZONES[0];
  const now = new Date();
  const [defaultSchedule] = useState(() => getDefaultSchedule(now));
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(defaultSchedule.date.getFullYear(), defaultSchedule.date.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(defaultSchedule.date);
  const [hour, setHour] = useState(defaultSchedule.hour);
  const [minute, setMinute] = useState(defaultSchedule.minute);
  const [meridiem, setMeridiem] = useState<Meridiem>(defaultSchedule.meridiem);
  const [timezone, setTimezone] = useState(localZone);
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const days = useMemo(() => buildCalendarDays(visibleMonth.getFullYear(), visibleMonth.getMonth()), [visibleMonth]);
  const scheduledAt = buildScheduledDate(selectedDate, hour, minute, meridiem);
  const validation = validateSchedule(selectedDate, hour, minute, meridiem);
  const summary = formatScheduleSummary(validation ? null : scheduledAt, timezone.label);
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(visibleMonth);

  useEffect(() => {
    if (isLoaded && !draft && !success) router.replace('/generator');
  }, [draft, isLoaded, success]);

  const changeMonth = (amount: number) => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const chooseDay = (day: number) => {
    setSelectedDate(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day));
    setError('');
  };

  const submit = async () => {
    if (validation || !scheduledAt || submitting || !user?.id) return;
    setSubmitting(true); setError('');
    try {
      await schedulePost({ userId: user.id, accountIds: getSavedPublishingTargets(user.id), postId: draft?.postId ?? 'generated-video-primary', scheduledAt: scheduledAt.toISOString(), timezone: timezone.id });
      clearSchedulingDraft();
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof SchedulingConflictError ? cause.message : cause instanceof Error ? cause.message : 'The post could not be scheduled. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (!isLoaded || (!draft && !success)) return <SafeAreaView style={styles.screen}><View style={styles.guardLoading}><ActivityIndicator accessibilityLabel="Opening generator" color={LIME}/></View></SafeAreaView>;
  if (success) return <SafeAreaView style={styles.screen}><View accessibilityLiveRegion="polite" style={styles.successPage}><View style={styles.successIcon}><Icon name="check" size={42} color="#050505"/></View><Text accessibilityRole="header" style={styles.successTitle}>Post scheduled</Text><Text style={styles.successCopy}>{formatScheduleSummary(scheduledAt, timezone.label)}</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/publishing')} style={styles.doneButton}><Text style={styles.doneText}>View scheduled posts</Text></Pressable></View></SafeAreaView>;

  return <SafeAreaView style={styles.screen} edges={['top', 'bottom']}><View style={styles.page}>
    <View style={styles.topBar}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}><Icon name="back"/></Pressable><Text style={styles.eyebrow}>SCHEDULE</Text><Pressable accessibilityRole="button" accessibilityLabel="Schedule options" onPress={() => setTimezoneOpen(true)} style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}><Icon name="more"/></Pressable></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={styles.title}>Schedule Post</Text><Text style={styles.subtitle}>Choose one date and time for this post.</Text>
      <Text style={styles.label}>POST DATE</Text>
      <View style={styles.calendar}><View style={styles.calendarHeader}><Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => changeMonth(-1)} style={styles.calendarControl}><Icon name="back" size={24}/></Pressable><Text accessibilityRole="header" style={styles.month}>{monthLabel}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => changeMonth(1)} style={styles.calendarControl}><Icon name="chevron" size={24}/></Pressable></View>
        <View style={styles.calendarGrid}>{WEEKDAYS.map((day, index) => <Text key={`${day}-${index}`} accessibilityElementsHidden style={styles.weekday}>{day}</Text>)}{days.map((day, index) => {
          if (!day) return <View key={`blank-${index}`} style={styles.dayCell}/>;
          const selected = selectedDate?.getFullYear() === visibleMonth.getFullYear() && selectedDate?.getMonth() === visibleMonth.getMonth() && selectedDate?.getDate() === day;
          const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
          return <View key={day} style={styles.dayCell}><Pressable accessibilityRole="button" accessibilityLabel={new Intl.DateTimeFormat('en', { dateStyle: 'full' }).format(date)} accessibilityState={{ selected }} onPress={() => chooseDay(day)} style={({ pressed }) => [styles.dayButton, selected && styles.daySelected, pressed && styles.pressed]}><Text style={[styles.dayText, selected && styles.daySelectedText]}>{day}</Text></Pressable></View>;
        })}</View>
      </View>
      <Text style={styles.label}>POST TIME</Text><View style={styles.timeRow}><TextInput accessibilityLabel="Hour" value={hour} onChangeText={(value) => setHour(value.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" maxLength={2} placeholder="10" placeholderTextColor="#777" style={styles.timeInput}/><Text style={styles.colon}>:</Text><TextInput accessibilityLabel="Minute" value={minute} onChangeText={(value) => setMinute(value.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" maxLength={2} placeholder="30" placeholderTextColor="#777" style={styles.timeInput}/><Pressable accessibilityRole="button" accessibilityLabel={`Time period ${meridiem}`} onPress={() => setMeridiem((value) => value === 'AM' ? 'PM' : 'AM')} style={styles.meridiem}><Text style={styles.meridiemText}>{meridiem}</Text><Icon name="chevron" size={20}/></Pressable></View><Text style={styles.helper}>One publishing time per post</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Change time zone, currently ${timezone.label}`} onPress={() => setTimezoneOpen(true)} style={styles.timezoneRow}><Icon name="globe" size={34} color="#AAA"/><View style={styles.timezoneCopy}><Text style={styles.timezoneCaption}>Time zone</Text><Text numberOfLines={2} style={styles.timezoneValue}>{timezone.label}</Text></View><Icon name="chevron" color="#AAA"/></Pressable>
      <Text accessibilityLiveRegion="polite" style={[styles.summary, error && styles.error]}>{error || summary}</Text>
    </ScrollView>
    <Pressable accessibilityRole="button" accessibilityLabel="Schedule post" accessibilityState={{ disabled: Boolean(validation) || submitting, busy: submitting }} disabled={Boolean(validation) || submitting} onPress={submit} style={({ pressed }) => [styles.submit, (validation || submitting) && styles.disabled, pressed && styles.pressed]}>{submitting ? <ActivityIndicator color="#050505"/> : <Text style={styles.submitText}>Schedule Post</Text>}<View style={styles.submitArrow}><Icon name="next"/></View></Pressable>
  </View>
  <Modal visible={timezoneOpen} transparent animationType="fade" onRequestClose={() => setTimezoneOpen(false)}><Pressable accessibilityRole="button" accessibilityLabel="Close time zone chooser" onPress={() => setTimezoneOpen(false)} style={styles.backdrop}><View accessibilityRole="menu" style={styles.sheet} onStartShouldSetResponder={() => true}><Text accessibilityRole="header" style={styles.sheetTitle}>Choose time zone</Text>{TIMEZONES.map((zone) => <Pressable key={zone.id} accessibilityRole="menuitem" accessibilityState={{ selected: zone.id === timezone.id }} onPress={() => { setTimezone(zone); setTimezoneOpen(false); }} style={styles.zoneOption}><Text style={[styles.zoneText, zone.id === timezone.id && styles.zoneSelected]}>{zone.label}</Text>{zone.id === timezone.id && <Icon name="check" size={22} color={LIME}/>}</Pressable>)}</View></Pressable></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020202' }, guardLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, page: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }, topBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, circleButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: LIME, backgroundColor: '#050505' }, eyebrow: { color: '#ECECEC', fontSize: 16, fontWeight: '700', letterSpacing: 2.2 }, pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] }, content: { paddingTop: 24, paddingBottom: 26 }, title: { color: '#F7F7F7', fontSize: 40, lineHeight: 46, fontWeight: '800', letterSpacing: -1 }, subtitle: { marginTop: 8, marginBottom: 26, color: '#A8A8A8', fontSize: 18, lineHeight: 27 }, label: { marginTop: 10, marginBottom: 10, color: '#AAA', fontSize: 15, fontWeight: '700', letterSpacing: 1.5 },
  calendar: { padding: 12, marginBottom: 22, borderWidth: 1, borderColor: '#444', borderRadius: 18, backgroundColor: '#090A09' }, calendarHeader: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, calendarControl: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, month: { color: '#F4F4F4', fontSize: 19, fontWeight: '700' }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { width: '14.2857%', height: 36, textAlign: 'center', color: '#AAA', fontSize: 14, fontWeight: '700', lineHeight: 36 }, dayCell: { width: '14.2857%', height: 43, alignItems: 'center', justifyContent: 'center' }, dayButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, daySelected: { backgroundColor: LIME }, dayText: { color: '#F3F3F3', fontSize: 16, fontWeight: '700' }, daySelectedText: { color: '#050505' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, timeInput: { flex: 1, minWidth: 0, height: 64, borderWidth: 1, borderColor: '#444', borderRadius: 16, backgroundColor: '#090A09', color: '#FFF', fontSize: 24, fontWeight: '700', textAlign: 'center' }, colon: { color: '#FFF', fontSize: 28, fontWeight: '700' }, meridiem: { width: 104, height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#444', borderRadius: 16, backgroundColor: '#090A09' }, meridiemText: { color: '#FFF', fontSize: 19, fontWeight: '700' }, helper: { marginTop: 10, color: '#A8A8A8', fontSize: 15 }, timezoneRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', marginTop: 22, paddingHorizontal: 16, borderWidth: 1, borderColor: '#444', borderRadius: 16, backgroundColor: '#090A09' }, timezoneCopy: { flex: 1, marginHorizontal: 14 }, timezoneCaption: { color: '#999', fontSize: 14 }, timezoneValue: { marginTop: 4, color: '#F3F3F3', fontSize: 16, lineHeight: 21 }, summary: { minHeight: 48, paddingTop: 18, color: '#B6B6B6', fontSize: 15, lineHeight: 22, textAlign: 'center' }, error: { color: '#FF8A80' }, submit: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 35, backgroundColor: LIME }, disabled: { opacity: 0.38 }, submitText: { color: '#050505', fontSize: 22, fontWeight: '800' }, submitArrow: { position: 'absolute', right: 9, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' }, sheet: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 24, paddingBottom: 36, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: '#3A3A3A', backgroundColor: '#141514' }, sheetTitle: { marginBottom: 12, color: '#FFF', fontSize: 22, fontWeight: '800' }, zoneOption: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#393939' }, zoneText: { flex: 1, color: '#DDD', fontSize: 15 }, zoneSelected: { color: LIME, fontWeight: '700' }, successPage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }, successIcon: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: LIME }, successTitle: { marginTop: 24, color: '#FFF', fontSize: 34, fontWeight: '800' }, successCopy: { marginTop: 12, color: '#AAA', fontSize: 17, lineHeight: 26, textAlign: 'center' }, doneButton: { minHeight: 58, justifyContent: 'center', marginTop: 30, paddingHorizontal: 28, borderRadius: 29, backgroundColor: LIME }, doneText: { color: '#050505', fontSize: 17, fontWeight: '800' },
});

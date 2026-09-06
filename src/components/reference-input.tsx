import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getReferenceLinkDetails, MediaReference, normalizeReferenceUrl } from '@/features/media-reference/media-reference';

const LIME = '#B6FF2E';

export function isValidVideoUrl(value: string) {
  return normalizeReferenceUrl(value) !== null;
}

function SheetOption({ title, description, symbol, onPress }: { title: string; description: string; symbol: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
      <View style={styles.optionIcon}><Text style={styles.optionIconText}>{symbol}</Text></View>
      <View style={styles.optionCopy}><Text style={styles.optionTitle}>{title}</Text><Text style={styles.optionDescription}>{description}</Text></View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export function ReferenceInput({ value, onChange }: { value: MediaReference | null; onChange: (reference: MediaReference | null) => void }) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [urlVisible, setUrlVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [clipboardUrl, setClipboardUrl] = useState('');
  const [error, setError] = useState('');
  const [pickerError, setPickerError] = useState('');
  const [addingLink, setAddingLink] = useState(false);

  const openUrlPanel = () => {
    setError('');
    setUrl(value?.type === 'url' ? value.source : '');
    Clipboard.getStringAsync().then((text) => setClipboardUrl(isValidVideoUrl(text) ? text.trim() : '')).catch(() => setClipboardUrl(''));
    setSheetVisible(false);
    setUrlVisible(true);
  };

  const chooseFromGallery = async () => {
    setSheetVisible(false);
    setPickerError('');
    try {
      if (Platform.OS === 'ios') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setPickerError('Allow photo library access to choose a photo or video.');
          setSheetVisible(true);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaType = asset.type === 'video' ? 'video' : 'image';
        let thumbnailSource = asset.uri;
        if (mediaType === 'video') {
          try {
            thumbnailSource = (await VideoThumbnails.getThumbnailAsync(asset.uri)).uri;
          } catch {
            thumbnailSource = '';
          }
        }
        onChange({
          type: 'file',
          mediaType,
          source: asset.uri,
          thumbnailSource: thumbnailSource || undefined,
          name: asset.fileName ?? `Selected ${mediaType}`,
          mimeType: asset.mimeType,
          size: asset.fileSize,
        });
      }
    } catch {
      setPickerError('Unable to open your gallery. Please try again.');
      setSheetVisible(true);
    }
  };

  const addUrl = async () => {
    const normalized = normalizeReferenceUrl(url);
    if (!normalized) {
      setError('Enter a public YouTube link that starts with https://.');
      return;
    }
    setAddingLink(true);
    const details = getReferenceLinkDetails(normalized);
    onChange({ type: 'url', mediaType: 'video', source: normalized, ...details });
    setAddingLink(false);
    setUrlVisible(false);
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={value ? `Reference attached: ${value.name}. Tap to change or remove.` : 'Add a reference photo, video, or video link'} onPress={() => { setPickerError(''); setSheetVisible(true); }} style={({ pressed }) => [styles.cardContent, pressed && styles.pressed]}>
        <Text style={styles.cardTitle}>Reference</Text>
        <View style={styles.cardBottom}><Text numberOfLines={1} style={[styles.cardValue, value && styles.cardValueSelected]}>{value?.name ?? 'Add Files'}</Text><Text style={styles.plus}>{value ? '•••' : '+'}</Text></View>
      </Pressable>

      <Modal transparent visible={sheetVisible} animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.backdrop}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close add reference panel" onPress={() => setSheetVisible(false)} style={styles.backdropDismiss} />
          <View accessibilityViewIsModal style={styles.sheet}>
            <View style={styles.handle} />
            <Text accessibilityRole="header" style={styles.sheetTitle}>{value ? 'Change Reference' : 'Add Reference'}</Text>
            <Text style={styles.sheetSubtitle}>Choose how you want to add your reference.</Text>
            {pickerError ? <Text accessibilityRole="alert" style={[styles.error, styles.pickerError]}>{pickerError}</Text> : null}
            <SheetOption title={pickerError ? 'Try gallery again' : 'Choose from gallery'} description="Select a photo or video from your device" symbol="↑" onPress={async () => {
              setSheetVisible(false);
              await chooseFromGallery();
            }} />
            <SheetOption title="Paste a video link" description="Use a URL from the web" symbol="⌁" onPress={openUrlPanel} />
            {value ? <Pressable accessibilityRole="button" onPress={() => { onChange(null); setSheetVisible(false); }} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}><Text style={styles.removeText}>Remove reference</Text></Pressable> : null}
          </View>
        </View>
      </Modal>

      <Modal transparent visible={urlVisible} animationType="fade" onRequestClose={() => setUrlVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <View style={styles.backdrop}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close video link panel" onPress={() => setUrlVisible(false)} style={styles.backdropDismiss} />
            <View accessibilityViewIsModal style={styles.urlPanel}>
              <View style={styles.urlHeader}><View><Text accessibilityRole="header" style={styles.sheetTitle}>Add Video Link</Text><Text style={styles.sheetSubtitle}>Paste the link to your reference video.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setUrlVisible(false)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable></View>
              {clipboardUrl && clipboardUrl !== url ? <Pressable accessibilityRole="button" onPress={() => { setUrl(clipboardUrl); setError(''); }} style={({ pressed }) => [styles.clipboardButton, pressed && styles.pressed]}><Text numberOfLines={1} style={styles.clipboardText}>Paste from clipboard</Text></Pressable> : null}
              <View style={[styles.urlInputWrap, error ? styles.urlInputError : null]}><TextInput autoFocus autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="done" value={url} onChangeText={(text) => { setUrl(text); setError(''); }} onSubmitEditing={addUrl} placeholder="https://" placeholderTextColor="#666666" style={styles.urlInput} />{url ? <Pressable accessibilityRole="button" accessibilityLabel="Clear URL" onPress={() => { setUrl(''); setError(''); }} style={styles.clearButton}><Text style={styles.clearText}>×</Text></Pressable> : null}</View>
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <Pressable accessibilityRole="button" disabled={!url.trim() || addingLink} onPress={addUrl} style={({ pressed }) => [styles.addButton, (!url.trim() || addingLink) && styles.disabled, pressed && styles.pressed]}>{addingLink ? <ActivityIndicator color="#000000" /> : <Text style={styles.addText}>Add Link</Text>}</Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardContent: { flex: 1, justifyContent: 'space-between' }, cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, cardValue: { flex: 1, color: '#797979', fontSize: 21 }, cardValueSelected: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' }, plus: { color: LIME, fontSize: 32, lineHeight: 34, fontWeight: '300' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' }, backdropDismiss: { position: 'absolute', inset: 0 }, keyboardView: { flex: 1 }, sheet: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 28, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, borderColor: '#303030', backgroundColor: '#101010' }, handle: { width: 42, height: 4, alignSelf: 'center', marginBottom: 20, borderRadius: 2, backgroundColor: '#494949' },
  sheetTitle: { color: '#FFFFFF', fontSize: 23, lineHeight: 29, fontWeight: '800' }, sheetSubtitle: { marginTop: 5, marginBottom: 18, color: '#999999', fontSize: 14, lineHeight: 20 }, option: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 11, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#303030', backgroundColor: '#151515' }, optionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#202020' }, optionIconText: { color: LIME, fontSize: 24 }, optionCopy: { flex: 1 }, optionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, optionDescription: { marginTop: 3, color: '#909090', fontSize: 13 }, chevron: { color: '#777777', fontSize: 28 },
  removeButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 3 }, removeText: { color: '#B5B5B5', fontSize: 14, fontWeight: '600' }, pickerError: { marginTop: 0, marginBottom: 12 }, urlPanel: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 22, paddingBottom: 28, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, borderColor: '#303030', backgroundColor: '#101010' }, urlHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 }, closeButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3A3A3A' }, closeText: { color: '#FFFFFF', fontSize: 24, lineHeight: 26 },
  clipboardButton: { alignSelf: 'flex-start', maxWidth: '100%', marginBottom: 12, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: '#202020' }, clipboardText: { color: LIME, fontSize: 13, fontWeight: '700' }, urlInputWrap: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: '#414141', backgroundColor: '#080808' }, urlInputError: { borderColor: '#80624F' }, urlInput: { flex: 1, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 16 }, clearButton: { width: 46, height: 54, alignItems: 'center', justifyContent: 'center' }, clearText: { color: '#999999', fontSize: 22 }, error: { marginTop: 8, color: '#D2A486', fontSize: 13 }, addButton: { minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 16, borderRadius: 27, backgroundColor: LIME }, addText: { color: '#000000', fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.75 },
});

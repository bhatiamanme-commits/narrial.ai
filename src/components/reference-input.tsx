import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const LIME = '#B6FF2E';

export type VideoReference =
  | { type: 'file'; source: string; name: string; mimeType?: string; size?: number }
  | { type: 'url'; source: string; name: string };

export function isValidVideoUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
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

export function ReferenceInput({ value, onChange }: { value: VideoReference | null; onChange: (reference: VideoReference | null) => void }) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [urlVisible, setUrlVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [clipboardUrl, setClipboardUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!urlVisible) return;
    setError('');
    setUrl(value?.type === 'url' ? value.source : '');
    Clipboard.getStringAsync().then((text) => setClipboardUrl(isValidVideoUrl(text) ? text.trim() : '')).catch(() => setClipboardUrl(''));
  }, [urlVisible, value]);

  const uploadVideo = async () => {
    setSheetVisible(false);
    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true, multiple: false });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onChange({ type: 'file', source: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size });
    }
  };

  const addUrl = () => {
    const normalized = url.trim();
    if (!isValidVideoUrl(normalized)) {
      setError('Enter a valid video URL beginning with http:// or https://.');
      return;
    }
    onChange({ type: 'url', source: normalized, name: 'Video link added' });
    setUrlVisible(false);
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={value ? `Reference attached: ${value.name}. Tap to change or remove.` : 'Add a reference video or video link'} onPress={() => setSheetVisible(true)} style={({ pressed }) => [styles.cardContent, pressed && styles.pressed]}>
        <Text style={styles.cardTitle}>Reference</Text>
        <View style={styles.cardBottom}><Text numberOfLines={1} style={[styles.cardValue, value && styles.cardValueSelected]}>{value?.name ?? 'Add Files'}</Text><Text style={styles.plus}>{value ? '•••' : '+'}</Text></View>
      </Pressable>

      <Modal transparent visible={sheetVisible} animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close add reference panel" onPress={() => setSheetVisible(false)} style={styles.backdrop}>
          <Pressable style={styles.sheet}>
            <View style={styles.handle} />
            <Text accessibilityRole="header" style={styles.sheetTitle}>{value ? 'Change Reference' : 'Add Reference'}</Text>
            <Text style={styles.sheetSubtitle}>Choose how you want to add your reference.</Text>
            <SheetOption title="Upload a video" description="Choose a file from your device" symbol="↑" onPress={async () => {
              setSheetVisible(false);
              await uploadVideo();
            }} />
            <SheetOption title="Paste a video link" description="Use a URL from the web" symbol="⌁" onPress={() => { setSheetVisible(false); setUrlVisible(true); }} />
            {value ? <Pressable accessibilityRole="button" onPress={() => { onChange(null); setSheetVisible(false); }} style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}><Text style={styles.removeText}>Remove reference</Text></Pressable> : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal transparent visible={urlVisible} animationType="fade" onRequestClose={() => setUrlVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close video link panel" onPress={() => setUrlVisible(false)} style={styles.backdrop}>
            <Pressable style={styles.urlPanel}>
              <View style={styles.urlHeader}><View><Text accessibilityRole="header" style={styles.sheetTitle}>Add Video Link</Text><Text style={styles.sheetSubtitle}>Paste the link to your reference video.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setUrlVisible(false)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable></View>
              {clipboardUrl && clipboardUrl !== url ? <Pressable accessibilityRole="button" onPress={() => { setUrl(clipboardUrl); setError(''); }} style={({ pressed }) => [styles.clipboardButton, pressed && styles.pressed]}><Text numberOfLines={1} style={styles.clipboardText}>Paste from clipboard</Text></Pressable> : null}
              <View style={[styles.urlInputWrap, error ? styles.urlInputError : null]}><TextInput autoFocus autoCapitalize="none" autoCorrect={false} keyboardType="url" returnKeyType="done" value={url} onChangeText={(text) => { setUrl(text); setError(''); }} onSubmitEditing={addUrl} placeholder="https://" placeholderTextColor="#666666" style={styles.urlInput} />{url ? <Pressable accessibilityRole="button" accessibilityLabel="Clear URL" onPress={() => { setUrl(''); setError(''); }} style={styles.clearButton}><Text style={styles.clearText}>×</Text></Pressable> : null}</View>
              {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
              <Pressable accessibilityRole="button" disabled={!url.trim()} onPress={addUrl} style={({ pressed }) => [styles.addButton, !url.trim() && styles.disabled, pressed && styles.pressed]}><Text style={styles.addText}>Add Link</Text></Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardContent: { flex: 1, justifyContent: 'space-between' }, cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, cardValue: { flex: 1, color: '#797979', fontSize: 21 }, cardValueSelected: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' }, plus: { color: LIME, fontSize: 32, lineHeight: 34, fontWeight: '300' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.72)' }, keyboardView: { flex: 1 }, sheet: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 28, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, borderColor: '#303030', backgroundColor: '#101010' }, handle: { width: 42, height: 4, alignSelf: 'center', marginBottom: 20, borderRadius: 2, backgroundColor: '#494949' },
  sheetTitle: { color: '#FFFFFF', fontSize: 23, lineHeight: 29, fontWeight: '800' }, sheetSubtitle: { marginTop: 5, marginBottom: 18, color: '#999999', fontSize: 14, lineHeight: 20 }, option: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 11, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#303030', backgroundColor: '#151515' }, optionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#202020' }, optionIconText: { color: LIME, fontSize: 24 }, optionCopy: { flex: 1 }, optionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }, optionDescription: { marginTop: 3, color: '#909090', fontSize: 13 }, chevron: { color: '#777777', fontSize: 28 },
  removeButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 3 }, removeText: { color: '#B5B5B5', fontSize: 14, fontWeight: '600' }, urlPanel: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 22, paddingBottom: 28, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, borderColor: '#303030', backgroundColor: '#101010' }, urlHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 }, closeButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3A3A3A' }, closeText: { color: '#FFFFFF', fontSize: 24, lineHeight: 26 },
  clipboardButton: { alignSelf: 'flex-start', maxWidth: '100%', marginBottom: 12, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: '#202020' }, clipboardText: { color: LIME, fontSize: 13, fontWeight: '700' }, urlInputWrap: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: '#414141', backgroundColor: '#080808' }, urlInputError: { borderColor: '#80624F' }, urlInput: { flex: 1, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 16 }, clearButton: { width: 46, height: 54, alignItems: 'center', justifyContent: 'center' }, clearText: { color: '#999999', fontSize: 22 }, error: { marginTop: 8, color: '#D2A486', fontSize: 13 }, addButton: { minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 16, borderRadius: 27, backgroundColor: LIME }, addText: { color: '#000000', fontSize: 16, fontWeight: '800' }, disabled: { opacity: 0.4 }, pressed: { opacity: 0.75 },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useReceipts } from '../../hooks/useReceipts';
import { ReceiptStatus } from '../../components/receipt/ReceiptStatus';
import { ReceiptUploader } from '../../components/receipt/ReceiptUploader';
import { THEME } from '../../lib/theme';

const { width } = Dimensions.get('window');

type Tab = 'upload' | 'history';

export default function ScanScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { receipts, isLoading, submitReceipt, refetch } = useReceipts();

  const pendingCount = receipts.filter(r => r.status === 'pending').length;
  const approvedCount = receipts.filter(r => r.status === 'approved').length;
  const totalPointsEarned = receipts
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + (r.points_awarded ?? 0), 0);

  const handlePickImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (perm.status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to continue.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.9,
          base64: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.9,
          base64: false,
        });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) return;
    setUploading(true);
    try {
      await submitReceipt(selectedImage);
      setSelectedImage(null);
      setActiveTab('history');
      refetch();
      Alert.alert('Receipt Submitted!', 'Your receipt is being processed. Points will be added once verified.', [{ text: 'OK' }]);
    } catch {
      Alert.alert('Upload Failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Receipt Scanner</Text>
        <Text style={styles.subtitle}>Earn 1 point per $1 spent</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{approvedCount}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxCenter]}>
          <Text style={[styles.statValue, styles.statValuePoints]}>{totalPointsEarned.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Points Earned</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, pendingCount > 0 && styles.statValuePending]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upload' && styles.tabActive]}
          onPress={() => setActiveTab('upload')}
        >
          <Ionicons
            name="camera-outline"
            size={18}
            color={activeTab === 'upload' ? THEME.colors.primary : THEME.colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'upload' && styles.tabTextActive]}>
            Upload Receipt
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color={activeTab === 'history' ? THEME.colors.primary : THEME.colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History
          </Text>
          {pendingCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'upload' ? (
        <ScrollView contentContainerStyle={styles.uploadContent}>
          {selectedImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
              <View style={styles.previewActions}>
                <TouchableOpacity style={styles.retakeBtn} onPress={() => setSelectedImage(null)}>
                  <Ionicons name="refresh-outline" size={18} color={THEME.colors.primary} />
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                      <Text style={styles.submitBtnText}>Submit for Points</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              {uploading && (
                <View style={styles.uploadingBanner}>
                  <ActivityIndicator size="small" color={THEME.colors.primary} />
                  <Text style={styles.uploadingText}>Scanning receipt and detecting fraud...</Text>
                </View>
              )}
            </View>
          ) : (
            <ReceiptUploader
              onCameraPress={() => handlePickImage(true)}
              onGalleryPress={() => handlePickImage(false)}
            />
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How it works</Text>
            {[
              { icon: '📸', text: 'Take a clear photo of your receipt' },
              { icon: '🔍', text: 'Our AI scans and verifies your purchase' },
              { icon: '✅', text: 'Earn 1 point for every $1 spent' },
              { icon: '🎁', text: 'Redeem points for rewards and discounts' },
            ].map((item, i) => (
              <View key={i} style={styles.infoRow}>
                <Text style={styles.infoIcon}>{item.icon}</Text>
                <Text style={styles.infoText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.historyList}>
          {isLoading ? (
            <ActivityIndicator size="large" color={THEME.colors.primary} style={{ marginTop: 40 }} />
          ) : receipts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>No receipts yet</Text>
              <Text style={styles.emptyText}>Upload your first receipt to start earning points!</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab('upload')}>
                <Text style={styles.emptyBtnText}>Upload Receipt</Text>
              </TouchableOpacity>
            </View>
          ) : (
            receipts.map(receipt => (
              <ReceiptStatus key={receipt.id} receipt={receipt} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '700', color: THEME.colors.text },
  subtitle: { fontSize: 14, color: THEME.colors.textSecondary, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statBoxCenter: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: THEME.colors.border,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: THEME.colors.text },
  statValuePoints: { color: THEME.colors.primary },
  statValuePending: { color: THEME.colors.warning },
  statLabel: { fontSize: 12, color: THEME.colors.textSecondary, marginTop: 2 },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: { backgroundColor: THEME.colors.primaryLight },
  tabText: { fontSize: 14, fontWeight: '600', color: THEME.colors.textSecondary },
  tabTextActive: { color: THEME.colors.primary },
  tabBadge: {
    backgroundColor: THEME.colors.warning,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  uploadContent: { paddingHorizontal: 16, paddingBottom: 40 },
  previewContainer: { gap: 12 },
  previewImage: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#f0f0f0' },
  previewActions: { flexDirection: 'row', gap: 10 },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  retakeBtnText: { color: THEME.colors.primary, fontWeight: '600' },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primaryLight,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  uploadingText: { color: THEME.colors.primary, fontSize: 13 },
  infoBox: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  infoTitle: { fontSize: 16, fontWeight: '700', color: THEME.colors.text, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  infoIcon: { fontSize: 20 },
  infoText: { fontSize: 14, color: THEME.colors.textSecondary, flex: 1 },
  historyList: { flex: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: THEME.colors.text, marginBottom: 6 },
  emptyText: { fontSize: 14, color: THEME.colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

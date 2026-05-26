// =============================================================================
// ReceiptUploader — camera + gallery picker with frame overlay
// =============================================================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadows } from '../../lib/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const FRAME_SIZE = SCREEN_W * 0.78;

interface ReceiptUploaderProps {
  onImageSelected: (uri: string) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function ReceiptUploader({
  onImageSelected,
  isUploading = false,
  uploadProgress = 0,
}: ReceiptUploaderProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission',
          'Camera access is needed to scan receipts. Please enable it in Settings.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setCameraOpen(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo?.uri) {
        setCameraOpen(false);
        onImageSelected(photo.uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Gallery access is required to upload receipt photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
      allowsMultipleSelection: false,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      onImageSelected(result.assets[0].uri);
    }
  };

  return (
    <>
      {/* Upload options */}
      <View style={styles.container}>
        <View style={styles.iconArea}>
          <View style={styles.iconCircle}>
            <Ionicons name="receipt-outline" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Scan Your Receipt</Text>
          <Text style={styles.subtitle}>
            Take a photo or upload from your gallery to earn points for local purchases.
          </Text>
        </View>

        {isUploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.uploadingText}>Uploading receipt...</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={openCamera} activeOpacity={0.85}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.primaryBg }]}>
                <Ionicons name="camera" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Take Photo</Text>
              <Text style={styles.actionSub}>Best for clear scans</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionBtn} onPress={pickFromGallery} activeOpacity={0.85}>
              <View style={[styles.actionIcon, { backgroundColor: Colors.goldBg }]}>
                <Ionicons name="images" size={24} color={Colors.goldDark} />
              </View>
              <Text style={styles.actionLabel}>From Gallery</Text>
              <Text style={styles.actionSub}>Existing photos</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.hint}>
          Tip: Ensure the receipt total and business name are clearly visible.
        </Text>
      </View>

      {/* Camera modal */}
      <Modal
        visible={cameraOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCameraOpen(false)}
      >
        <SafeAreaView style={styles.cameraModal}>
          {/* Header */}
          <View style={styles.cameraHeader}>
            <TouchableOpacity onPress={() => setCameraOpen(false)} style={styles.cameraCloseBtn}>
              <Ionicons name="close" size={28} color={Colors.textInverse} />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Scan Receipt</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Camera view */}
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            {/* Overlay with cutout frame */}
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.frame}>
                  {/* Corner marks */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.frameHint}>Align the receipt within the frame</Text>
              </View>
            </View>
          </CameraView>

          {/* Capture button */}
          <View style={styles.cameraFooter}>
            <TouchableOpacity onPress={pickFromGallery} style={styles.galleryThumb}>
              <Ionicons name="images-outline" size={24} color={Colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity onPress={takePhoto} style={styles.shutterButton} activeOpacity={0.8}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
            <View style={{ width: 50 }} />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xxl,
  },
  iconArea: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  actionSub: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  hint: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Upload progress
  uploadingContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  uploadingText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },

  // Camera modal
  cameraModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cameraCloseBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: FRAME_SIZE * 1.4,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  frame: {
    width: FRAME_SIZE,
    borderRadius: Radius.lg,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  frameHint: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.sm,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.gold,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: Radius.sm },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: Radius.sm },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: Radius.sm },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: Radius.sm },

  // Capture area
  cameraFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.huge,
    paddingVertical: Spacing.xxl,
  },
  galleryThumb: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.xl,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.textInverse,
    borderWidth: 2,
    borderColor: '#ccc',
  },
});

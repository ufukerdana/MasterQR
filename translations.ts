export type Language = 'en' | 'tr';

export const translations = {
  en: {
    appTitle: 'MasterQR',
    scanTab: 'Scan',
    generateTab: 'Generate',
    scan: {
        cameraPermissionTitle: 'Camera Access Required',
        cameraPermissionDesc: 'Please allow camera access to scan QR codes.',
        instruction: 'Align QR code within the frame',
        error: 'Camera permission denied or camera not found.'
    },
    generate: {
        title: 'Create QR Code',
        subtitle: 'Enter your content below to generate a new code.',
        placeholder: 'Enter website, text, or email...',
        button: 'Generate QR',
        share: 'Share',
        save: 'Save',
        clear: 'Clear'
    },
    result: {
        title: 'Scanned Content',
        openBrowser: 'Open in Browser',
        copy: 'Copy',
        copied: 'Copied',
        share: 'Share'
    },
    common: {
        shareTitle: 'MasterQR Code',
        shareText: 'Created with MasterQR',
        scannedContent: 'Scanned QR Content',
        clipboardSuccess: 'Content copied to clipboard (Share not supported on this device/browser)',
        clipboardError: 'Could not copy to clipboard.'
    }
  },
  tr: {
    appTitle: 'MasterQR',
    scanTab: 'Tara',
    generateTab: 'Üret',
    scan: {
        cameraPermissionTitle: 'Kamera Erişimi Gerekli',
        cameraPermissionDesc: 'QR kodlarını taramak için lütfen kamera erişimine izin verin.',
        instruction: 'QR kodunu çerçeve içine hizalayın',
        error: 'Kamera izni reddedildi veya kamera bulunamadı.'
    },
    generate: {
        title: 'QR Kod Oluştur',
        subtitle: 'Yeni bir kod oluşturmak için içeriğinizi aşağıya girin.',
        placeholder: 'Web sitesi, metin veya e-posta girin...',
        button: 'QR Oluştur',
        share: 'Paylaş',
        save: 'Kaydet',
        clear: 'Temizle'
    },
    result: {
        title: 'Taranan İçerik',
        openBrowser: 'Tarayıcıda Aç',
        copy: 'Kopyala',
        copied: 'Kopyalandı',
        share: 'Paylaş'
    },
    common: {
        shareTitle: 'MasterQR Kodu',
        shareText: 'MasterQR ile oluşturuldu',
        scannedContent: 'Taranan QR İçeriği',
        clipboardSuccess: 'İçerik panoya kopyalandı (Paylaşım bu cihazda/tarayıcıda desteklenmiyor)',
        clipboardError: 'Panoya kopyalanamadı.'
    }
  }
};
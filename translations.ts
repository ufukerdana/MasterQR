export type Language = 'en' | 'tr';

export const translations = {
  en: {
    appTitle: 'MasterQR',
    scanTab: 'Scan',
    generateTab: 'Generate',
    historyTab: 'History',
    scan: {
        cameraPermissionTitle: 'Camera Access Required',
        cameraPermissionDesc: 'Please allow camera access to scan QR codes.',
        instruction: 'Align QR code within the frame',
        error: 'Camera permission denied or camera not found.',
        batchMode: 'Batch Mode',
        batchModeOn: 'On',
        batchModeOff: 'Off',
        gallery: 'Gallery',
        scanFromImage: 'Scan Image',
        noQrInImage: 'No QR code found in selected image.',
        batchScanSaved: 'Saved to history'
    },
    generate: {
        title: 'Create QR Code',
        subtitle: 'Enter your content below to generate a new code.',
        placeholder: 'Enter website, text, or email...',
        button: 'Generate QR',
        share: 'Share',
        save: 'Save',
        clear: 'Clear',
        color: 'Color'
    },
    result: {
        title: 'Scanned Content',
        openBrowser: 'Open in Browser',
        copy: 'Copy',
        copied: 'Copied',
        share: 'Share',
        secure: 'Secure Link',
        unverified: 'Unverified Link',
        wifi: {
            title: 'Wi-Fi Network',
            ssid: 'Network Name',
            password: 'Password',
            type: 'Security',
            copyPass: 'Copy Password',
            connect: 'Connect (Android only)'
        }
    },
    history: {
        title: 'History',
        empty: 'No scan history yet.',
        clear: 'Clear All',
        export: 'Export CSV',
        clearConfirmTitle: 'Clear History?',
        clearConfirmDesc: 'This cannot be undone.',
        cancel: 'Cancel',
        confirm: 'Clear'
    },
    common: {
        shareTitle: 'MasterQR Code',
        shareText: 'Created with MasterQR',
        scannedContent: 'Scanned QR Content',
        clipboardSuccess: 'Content copied to clipboard',
        clipboardError: 'Could not copy to clipboard.'
    }
  },
  tr: {
    appTitle: 'MasterQR',
    scanTab: 'Tara',
    generateTab: 'Üret',
    historyTab: 'Geçmiş',
    scan: {
        cameraPermissionTitle: 'Kamera Erişimi Gerekli',
        cameraPermissionDesc: 'QR kodlarını taramak için lütfen kamera erişimine izin verin.',
        instruction: 'QR kodunu çerçeve içine hizalayın',
        error: 'Kamera izni reddedildi veya kamera bulunamadı.',
        batchMode: 'Seri Mod',
        batchModeOn: 'Açık',
        batchModeOff: 'Kapalı',
        gallery: 'Galeri',
        scanFromImage: 'Resimden Tara',
        noQrInImage: 'Seçilen resimde QR kod bulunamadı.',
        batchScanSaved: 'Geçmişe kaydedildi'
    },
    generate: {
        title: 'QR Kod Oluştur',
        subtitle: 'Yeni bir kod oluşturmak için içeriğinizi aşağıya girin.',
        placeholder: 'Web sitesi, metin veya e-posta girin...',
        button: 'QR Oluştur',
        share: 'Paylaş',
        save: 'Kaydet',
        clear: 'Temizle',
        color: 'Renk'
    },
    result: {
        title: 'Taranan İçerik',
        openBrowser: 'Tarayıcıda Aç',
        copy: 'Kopyala',
        copied: 'Kopyalandı',
        share: 'Paylaş',
        secure: 'Güvenli Link',
        unverified: 'Doğrulanmamış Link',
        wifi: {
            title: 'Wi-Fi Ağı',
            ssid: 'Ağ Adı',
            password: 'Şifre',
            type: 'Güvenlik',
            copyPass: 'Şifreyi Kopyala',
            connect: 'Bağlan (Sadece Android)'
        }
    },
    history: {
        title: 'Geçmiş',
        empty: 'Henüz tarama geçmişi yok.',
        clear: 'Temizle',
        export: 'CSV Dışa Aktar',
        clearConfirmTitle: 'Geçmişi Temizle?',
        clearConfirmDesc: 'Bu işlem geri alınamaz.',
        cancel: 'İptal',
        confirm: 'Temizle'
    },
    common: {
        shareTitle: 'MasterQR Kodu',
        shareText: 'MasterQR ile oluşturuldu',
        scannedContent: 'Taranan QR İçeriği',
        clipboardSuccess: 'İçerik panoya kopyalandı',
        clipboardError: 'Panoya kopyalanamadı.'
    }
  }
};
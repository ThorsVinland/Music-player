import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'en' | 'ar' | 'fr';

export const translations = {
  en: {
    // Tabs
    library: 'Library',
    playlists: 'Collections',
    settings: 'Settings',

    // Home / Library
    musicLibrary: 'Vault',
    allSongs: 'All Songs',
    scan: 'Scan',
    scanning: 'Scanning for audio files...',
    searchPlaceholder: 'Search songs, artists, files...',
    noSongs: 'No songs found',
    noSongsSubtitle: 'Tap the scan button to find audio files on your device.',
    noMatchingSongs: 'No matching songs',
    noMatchingSubtitle: 'Try searching with a different keyword.',
    loadingLibrary: 'Loading your music library...',

    // Playlists & Collections
    collections: 'Collections',
    playlistsTab: 'Playlists',
    albumsTab: 'Albums',
    favoritesTab: 'Favorites',
    newPlaylist: 'New',
    createPlaylistTitle: 'Create New Playlist',
    playlistNamePlaceholder: 'Playlist name...',
    cancel: 'Cancel',
    create: 'Create',
    delete: 'Delete',
    deletePlaylistConfirm: 'Are you sure you want to delete this playlist?',
    noFavorites: 'No Favorites Yet',
    noFavoritesSubtitle: 'Tap the heart icon on any song to add it to your favorites.',
    trackSingular: 'track',
    trackPlural: 'tracks',

    // Player
    nowPlaying: 'NOW PLAYING',
    tapToExpand: 'Now Playing • Tap to Expand',
    audioFile: 'Audio File',
    musicPlayer: 'Music Player',

    // Song Actions Modal
    addToPlaylist: 'Add to Playlist',
    songInfo: 'Song Info',
    share: 'Share',
    removeFromLibrary: 'Remove from Library',
    selectPlaylist: 'Select Playlist',
    songMetadata: 'Song Metadata',
    titleLabel: 'Title:',
    durationLabel: 'Duration:',
    locationLabel: 'Location:',
    close: 'Close',
    deleteConfirmTitle: 'Remove from Library',
    deleteConfirmMsg: 'Are you sure you want to remove this song from your music library?',
    addedToPlaylistTitle: 'Added to Playlist',
    addedToPlaylistMsg: 'Added to',

    // Settings
    appearance: 'Appearance',
    themeModeSubtitle: 'Choose your preferred theme mode',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    languageSubtitle: 'Choose your preferred app language',

    // Back to exit toast
    pressAgainToExit: 'Press back again to exit the app',
  },
  ar: {
    // Tabs
    library: 'المكتبة',
    playlists: 'المجموعات',
    settings: 'الإعدادات',

    // Home / Library
    musicLibrary: 'Vault',
    allSongs: 'جميع الأغاني',
    scan: 'مسح',
    scanning: 'جاري البحث عن ملفات صوتية...',
    searchPlaceholder: 'ابحث عن أغنية، فنان، ألبوم...',
    noSongs: 'لم يتم العثور على أغانٍ',
    noSongsSubtitle: 'اضغط على زر المسح للبحث عن الملفات الصوتية في جهازك.',
    noMatchingSongs: 'لا توجد نتائج مطابقة',
    noMatchingSubtitle: 'جرب البحث بكلمات مختلفة.',
    loadingLibrary: 'جاري تحميل مكتبة الموسيقى...',

    // Playlists & Collections
    collections: 'المجموعات',
    playlistsTab: 'قوائم التشغيل',
    albumsTab: 'الألبومات',
    favoritesTab: 'المفضلة',
    newPlaylist: 'جديد',
    createPlaylistTitle: 'إنشاء قائمة تشغيل جديدة',
    playlistNamePlaceholder: 'اسم القائمة...',
    cancel: 'إلغاء',
    create: 'إنشاء',
    delete: 'حذف',
    deletePlaylistConfirm: 'هل أنت متأكد من حذف هذه القائمة؟',
    noFavorites: 'لا توجد مفضلات بعد',
    noFavoritesSubtitle: 'اضغط على رمز القلب بجانب أي أغنية لإضافتها للمفضلة.',
    trackSingular: 'أغنية',
    trackPlural: 'أغانٍ',

    // Player
    nowPlaying: 'قيد التشغيل',
    tapToExpand: 'انقر للتكبير',
    audioFile: 'ملف صوتي',
    musicPlayer: 'مشغل الموسيقى',

    // Song Actions Modal
    addToPlaylist: 'إضافة إلى قائمة تشغيل',
    songInfo: 'معلومات الأغنية',
    share: 'مشاركة',
    removeFromLibrary: 'حذف من المكتبة',
    selectPlaylist: 'اختر قائمة تشغيل',
    songMetadata: 'بيانات الأغنية',
    titleLabel: 'العنوان:',
    durationLabel: 'المدة:',
    locationLabel: 'المسار:',
    close: 'إغلاق',
    deleteConfirmTitle: 'حذف من المكتبة',
    deleteConfirmMsg: 'هل أنت متأكد من رغبتك في إزالة هذه الأغنية من المكتبة؟',
    addedToPlaylistTitle: 'تمت الإضافة',
    addedToPlaylistMsg: 'تمت إضافة الأغنية إلى',

    // Settings
    appearance: 'المظهر',
    themeModeSubtitle: 'اختر المظهر المفضل للتطبيق',
    light: 'فاتح',
    dark: 'داكن',
    system: 'تلقائي',
    language: 'اللغة',
    languageSubtitle: 'اختر لغة واجهة التطبيق',

    // Back to exit toast
    pressAgainToExit: 'اضغط مرة أخرى للخروج من التطبيق',
  },
  fr: {
    // Tabs
    library: 'Bibliothèque',
    playlists: 'Collections',
    settings: 'Paramètres',

    // Home / Library
    musicLibrary: 'Vault',
    allSongs: 'Toutes les chansons',
    scan: 'Scanner',
    scanning: 'Recherche de fichiers audio...',
    searchPlaceholder: 'Rechercher des chansons, artistes...',
    noSongs: 'Aucune chanson trouvée',
    noSongsSubtitle: 'Appuyez sur le bouton de scan pour rechercher des fichiers.',
    noMatchingSongs: 'Aucun résultat',
    noMatchingSubtitle: 'Essayez un autre mot-clé.',
    loadingLibrary: 'Chargement de la bibliothèque...',

    // Playlists & Collections
    collections: 'Collections',
    playlistsTab: 'Playlists',
    albumsTab: 'Albums',
    favoritesTab: 'Favoris',
    newPlaylist: 'Nouveau',
    createPlaylistTitle: 'Créer une nouvelle playlist',
    playlistNamePlaceholder: 'Nom de la playlist...',
    cancel: 'Annuler',
    create: 'Créer',
    delete: 'Supprimer',
    deletePlaylistConfirm: 'Voulez-vous vraiment supprimer cette playlist ?',
    noFavorites: 'Aucun favori pour le moment',
    noFavoritesSubtitle: 'Appuyez sur le cœur pour ajouter une chanson aux favoris.',
    trackSingular: 'titre',
    trackPlural: 'titres',

    // Player
    nowPlaying: 'LECTURE EN COURS',
    tapToExpand: 'Lecture en cours • Appuyez pour agrandir',
    audioFile: 'Fichier audio',
    musicPlayer: 'Lecteur de musique',

    // Song Actions Modal
    addToPlaylist: 'Ajouter à une playlist',
    songInfo: 'Infos sur le titre',
    share: 'Partager',
    removeFromLibrary: 'Supprimer de la bibliothèque',
    selectPlaylist: 'Sélectionner une playlist',
    songMetadata: 'Métadonnées du titre',
    titleLabel: 'Titre :',
    durationLabel: 'Durée :',
    locationLabel: 'Emplacement :',
    close: 'Fermer',
    deleteConfirmTitle: 'Supprimer de la bibliothèque',
    deleteConfirmMsg: 'Voulez-vous vraiment supprimer ce titre ?',
    addedToPlaylistTitle: 'Ajouté à la playlist',
    addedToPlaylistMsg: 'Ajouté à',

    // Settings
    appearance: 'Apparence',
    themeModeSubtitle: 'Choisissez votre thème préféré',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    language: 'Langue',
    languageSubtitle: 'Choisissez la langue de l’application',

    // Back to exit toast
    pressAgainToExit: 'Appuyez à nouveau pour quitter l’application',
  },
};

interface LanguageState {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en', // Default to English as requested
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useTranslation = () => {
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';
  return { language, setLanguage, t, isRTL };
};

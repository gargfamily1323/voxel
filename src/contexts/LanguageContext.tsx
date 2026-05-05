import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Language = "en" | "hi" | "hinglish" | "zh" | "es" | "fr";

export const LANGUAGES: { id: Language; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "hinglish", label: "Hinglish", native: "Hinglish" },
  { id: "zh", label: "Chinese", native: "中文" },
  { id: "es", label: "Spanish", native: "Español" },
  { id: "fr", label: "French", native: "Français" },
];

export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  hi: "Hindi",
  hinglish: "Hinglish (Hindi written in Roman/English script, mixing Hindi and English words naturally as spoken in India)",
  zh: "Chinese (Simplified)",
  es: "Spanish",
  fr: "French",
};

type Dict = {
  tagline: string;
  menu: string;
  account: string;
  theme: string;
  language: string;
  accountSettings: string;
  logout: string;
  addAccount: string;
  deleteAccount: string;
  deleteConfirmTitle: string;
  deleteConfirmDesc: string;
  cancel: string;
  delete: string;
  signIn: string;
  signUp: string;
  email: string;
  password: string;
  name: string;
  yourName: string;
  createAccount: string;
  continueWithGoogle: string;
  or: string;
  home: string;
  tasks: string;
  emptyTitle: string;
  emptyDesc: string;
  holdToRecord: string;
  listening: string;
  thinking: string;
  searchTasks: string;
  allCategories: string;
  allPriorities: string;
  allStatus: string;
  active: string;
  completed: string;
  anyTime: string;
  today: string;
  thisWeek: string;
  overdue: string;
  high: string;
  medium: string;
  low: string;
  category: string;
  priority: string;
  status: string;
  due: string;
  clearFilters: string;
  noTasksYet: string;
  noMatch: string;
  viewActive: (n: number) => string;
  addedTasks: (n: number) => string;
  noTasksDetected: string;
  didntCatch: string;
  extractingTasks: string;
  themeDefault: string;
  themeDefaultDesc: string;
  themeClassic: string;
  themeClassicDesc: string;
  themeLight: string;
  themeLightDesc: string;
};

const dictionaries: Record<Language, Dict> = {
  en: {
    tagline: "Voice → Tasks, instantly",
    menu: "Menu", account: "Account", theme: "Theme", language: "Language",
    accountSettings: "Account settings", logout: "Log out", addAccount: "Add new account", deleteAccount: "Delete account",
    deleteConfirmTitle: "Delete your account?",
    deleteConfirmDesc: "This will permanently delete all your tasks and profile data. This cannot be undone.",
    cancel: "Cancel", delete: "Delete",
    signIn: "Sign In", signUp: "Sign Up", email: "Email", password: "Password", name: "Name", yourName: "Your name",
    createAccount: "Create account", continueWithGoogle: "Continue with Google", or: "or",
    home: "Home", tasks: "Tasks",
    emptyTitle: "Speak. We'll handle the rest.",
    emptyDesc: "Hold the record button below and just talk — Voxel will turn your thoughts into organized tasks.",
    holdToRecord: "Hold to record", listening: "Listening…", thinking: "Thinking…",
    searchTasks: "Search tasks…",
    allCategories: "All categories", allPriorities: "All priorities", allStatus: "All status",
    active: "Active", completed: "Completed",
    anyTime: "Any time", today: "Today", thisWeek: "This week", overdue: "Overdue",
    high: "High", medium: "Medium", low: "Low",
    category: "Category", priority: "Priority", status: "Status", due: "Due",
    clearFilters: "Clear filters",
    noTasksYet: "No tasks yet. Hit the mic to start.",
    noMatch: "No tasks match your filters.",
    viewActive: (n) => `View ${n} active task${n > 1 ? "s" : ""} →`,
    addedTasks: (n) => `Added ${n} task${n > 1 ? "s" : ""}`,
    noTasksDetected: "No tasks detected.", didntCatch: "Didn't catch that — try again.",
    extractingTasks: "Extracting tasks…",
    themeDefault: "Default (Neon)", themeDefaultDesc: "The original electric blue + purple",
    themeClassic: "Classic", themeClassicDesc: "Toned-down dark slate",
    themeLight: "Light", themeLightDesc: "Bright mode",
  },
  hi: {
    tagline: "आवाज़ → कार्य, तुरंत",
    menu: "मेनू", account: "खाता", theme: "थीम", language: "भाषा",
    accountSettings: "खाता सेटिंग्स", logout: "लॉग आउट", addAccount: "नया खाता जोड़ें", deleteAccount: "खाता हटाएं",
    deleteConfirmTitle: "क्या आप अपना खाता हटाना चाहते हैं?",
    deleteConfirmDesc: "यह आपके सभी कार्य और प्रोफ़ाइल डेटा को स्थायी रूप से हटा देगा। यह पूर्ववत नहीं किया जा सकता।",
    cancel: "रद्द करें", delete: "हटाएं",
    signIn: "साइन इन", signUp: "साइन अप", email: "ईमेल", password: "पासवर्ड", name: "नाम", yourName: "आपका नाम",
    createAccount: "खाता बनाएं", continueWithGoogle: "Google के साथ जारी रखें", or: "या",
    home: "होम", tasks: "कार्य",
    emptyTitle: "बोलें। बाकी हम संभाल लेंगे।",
    emptyDesc: "नीचे रिकॉर्ड बटन को दबाए रखें और बस बोलें — Voxel आपके विचारों को व्यवस्थित कार्यों में बदल देगा।",
    holdToRecord: "रिकॉर्ड करने के लिए दबाएं", listening: "सुन रहा है…", thinking: "सोच रहा है…",
    searchTasks: "कार्य खोजें…",
    allCategories: "सभी श्रेणियाँ", allPriorities: "सभी प्राथमिकताएँ", allStatus: "सभी स्थिति",
    active: "सक्रिय", completed: "पूर्ण",
    anyTime: "कभी भी", today: "आज", thisWeek: "इस सप्ताह", overdue: "देरी से",
    high: "उच्च", medium: "मध्यम", low: "निम्न",
    category: "श्रेणी", priority: "प्राथमिकता", status: "स्थिति", due: "नियत",
    clearFilters: "फ़िल्टर साफ़ करें",
    noTasksYet: "अभी तक कोई कार्य नहीं। शुरू करने के लिए माइक दबाएं।",
    noMatch: "आपके फ़िल्टर से मेल खाने वाले कोई कार्य नहीं।",
    viewActive: (n) => `${n} सक्रिय कार्य देखें →`,
    addedTasks: (n) => `${n} कार्य जोड़े गए`,
    noTasksDetected: "कोई कार्य नहीं मिला।", didntCatch: "समझ नहीं आया — फिर से कोशिश करें।",
    extractingTasks: "कार्य निकाले जा रहे हैं…",
    themeDefault: "डिफ़ॉल्ट (नियॉन)", themeDefaultDesc: "मूल इलेक्ट्रिक नीला + बैंगनी",
    themeClassic: "क्लासिक", themeClassicDesc: "हल्का गहरा स्लेट",
    themeLight: "लाइट", themeLightDesc: "उज्ज्वल मोड",
  },
  zh: {
    tagline: "语音 → 任务,即时完成",
    menu: "菜单", account: "账户", theme: "主题", language: "语言",
    accountSettings: "账户设置", logout: "登出", addAccount: "添加新账户", deleteAccount: "删除账户",
    deleteConfirmTitle: "删除您的账户?",
    deleteConfirmDesc: "这将永久删除您的所有任务和个人资料数据。此操作无法撤销。",
    cancel: "取消", delete: "删除",
    signIn: "登录", signUp: "注册", email: "邮箱", password: "密码", name: "姓名", yourName: "您的姓名",
    createAccount: "创建账户", continueWithGoogle: "使用 Google 继续", or: "或",
    home: "首页", tasks: "任务",
    emptyTitle: "说话。剩下的交给我们。",
    emptyDesc: "按住下方的录音按钮并开始说话 — Voxel 会将您的想法转化为有组织的任务。",
    holdToRecord: "按住录音", listening: "聆听中…", thinking: "思考中…",
    searchTasks: "搜索任务…",
    allCategories: "所有类别", allPriorities: "所有优先级", allStatus: "所有状态",
    active: "进行中", completed: "已完成",
    anyTime: "任何时间", today: "今天", thisWeek: "本周", overdue: "逾期",
    high: "高", medium: "中", low: "低",
    category: "类别", priority: "优先级", status: "状态", due: "截止",
    clearFilters: "清除筛选",
    noTasksYet: "还没有任务。点击麦克风开始。",
    noMatch: "没有符合筛选条件的任务。",
    viewActive: (n) => `查看 ${n} 个进行中的任务 →`,
    addedTasks: (n) => `已添加 ${n} 个任务`,
    noTasksDetected: "未检测到任务。", didntCatch: "没听清 — 请再试一次。",
    extractingTasks: "正在提取任务…",
    themeDefault: "默认(霓虹)", themeDefaultDesc: "原始的电光蓝 + 紫色",
    themeClassic: "经典", themeClassicDesc: "柔和的深色板岩",
    themeLight: "浅色", themeLightDesc: "明亮模式",
  },
  es: {
    tagline: "Voz → Tareas, al instante",
    menu: "Menú", account: "Cuenta", theme: "Tema", language: "Idioma",
    accountSettings: "Configuración de cuenta", logout: "Cerrar sesión", addAccount: "Agregar nueva cuenta", deleteAccount: "Eliminar cuenta",
    deleteConfirmTitle: "¿Eliminar tu cuenta?",
    deleteConfirmDesc: "Esto eliminará permanentemente todas tus tareas y datos de perfil. Esto no se puede deshacer.",
    cancel: "Cancelar", delete: "Eliminar",
    signIn: "Iniciar sesión", signUp: "Registrarse", email: "Correo", password: "Contraseña", name: "Nombre", yourName: "Tu nombre",
    createAccount: "Crear cuenta", continueWithGoogle: "Continuar con Google", or: "o",
    home: "Inicio", tasks: "Tareas",
    emptyTitle: "Habla. Nosotros nos encargamos del resto.",
    emptyDesc: "Mantén presionado el botón de grabar y solo habla — Voxel convertirá tus pensamientos en tareas organizadas.",
    holdToRecord: "Mantén para grabar", listening: "Escuchando…", thinking: "Pensando…",
    searchTasks: "Buscar tareas…",
    allCategories: "Todas las categorías", allPriorities: "Todas las prioridades", allStatus: "Todos los estados",
    active: "Activas", completed: "Completadas",
    anyTime: "Cualquier momento", today: "Hoy", thisWeek: "Esta semana", overdue: "Atrasadas",
    high: "Alta", medium: "Media", low: "Baja",
    category: "Categoría", priority: "Prioridad", status: "Estado", due: "Vence",
    clearFilters: "Limpiar filtros",
    noTasksYet: "Aún no hay tareas. Pulsa el micrófono para empezar.",
    noMatch: "Ninguna tarea coincide con tus filtros.",
    viewActive: (n) => `Ver ${n} tarea${n > 1 ? "s" : ""} activa${n > 1 ? "s" : ""} →`,
    addedTasks: (n) => `Se agregaron ${n} tarea${n > 1 ? "s" : ""}`,
    noTasksDetected: "No se detectaron tareas.", didntCatch: "No te entendí — intenta de nuevo.",
    extractingTasks: "Extrayendo tareas…",
    themeDefault: "Predeterminado (Neón)", themeDefaultDesc: "El azul eléctrico y púrpura original",
    themeClassic: "Clásico", themeClassicDesc: "Pizarra oscura suavizada",
    themeLight: "Claro", themeLightDesc: "Modo brillante",
  },
  fr: {
    tagline: "Voix → Tâches, instantanément",
    menu: "Menu", account: "Compte", theme: "Thème", language: "Langue",
    accountSettings: "Paramètres du compte", logout: "Se déconnecter", addAccount: "Ajouter un compte", deleteAccount: "Supprimer le compte",
    deleteConfirmTitle: "Supprimer votre compte ?",
    deleteConfirmDesc: "Cela supprimera définitivement toutes vos tâches et données de profil. Cette action est irréversible.",
    cancel: "Annuler", delete: "Supprimer",
    signIn: "Connexion", signUp: "Inscription", email: "E-mail", password: "Mot de passe", name: "Nom", yourName: "Votre nom",
    createAccount: "Créer un compte", continueWithGoogle: "Continuer avec Google", or: "ou",
    home: "Accueil", tasks: "Tâches",
    emptyTitle: "Parlez. Nous nous occupons du reste.",
    emptyDesc: "Maintenez le bouton d'enregistrement ci-dessous et parlez — Voxel transformera vos pensées en tâches organisées.",
    holdToRecord: "Maintenir pour enregistrer", listening: "Écoute…", thinking: "Réflexion…",
    searchTasks: "Rechercher des tâches…",
    allCategories: "Toutes les catégories", allPriorities: "Toutes les priorités", allStatus: "Tous les statuts",
    active: "Actives", completed: "Terminées",
    anyTime: "À tout moment", today: "Aujourd'hui", thisWeek: "Cette semaine", overdue: "En retard",
    high: "Haute", medium: "Moyenne", low: "Basse",
    category: "Catégorie", priority: "Priorité", status: "Statut", due: "Échéance",
    clearFilters: "Effacer les filtres",
    noTasksYet: "Aucune tâche pour le moment. Appuyez sur le micro pour commencer.",
    noMatch: "Aucune tâche ne correspond à vos filtres.",
    viewActive: (n) => `Voir ${n} tâche${n > 1 ? "s" : ""} active${n > 1 ? "s" : ""} →`,
    addedTasks: (n) => `${n} tâche${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""}`,
    noTasksDetected: "Aucune tâche détectée.", didntCatch: "Je n'ai pas compris — réessayez.",
    extractingTasks: "Extraction des tâches…",
    themeDefault: "Par défaut (Néon)", themeDefaultDesc: "Le bleu électrique et violet d'origine",
    themeClassic: "Classique", themeClassicDesc: "Ardoise foncée atténuée",
    themeLight: "Clair", themeLightDesc: "Mode lumineux",
  },
};

interface LanguageCtx {
  language: Language;
  setLanguage: (l: Language) => void;
  t: Dict;
}

const LanguageContext = createContext<LanguageCtx | undefined>(undefined);
const STORAGE_KEY = "voxel-language";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem(STORAGE_KEY) as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageState, t: dictionaries[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Sprout, 
  LayoutDashboard, 
  Map, 
  Droplet, 
  TrendingUp, 
  CloudSun, 
  MessageSquare, 
  Settings, 
  ShieldCheck, 
  HeartHandshake, 
  Layers, 
  History,
  Languages,
  Sun,
  Moon,
  Volume2
} from 'lucide-react';
import './globals.css';

// 12 Supported Languages Translations Map
const TRANSLATIONS = {
  English: {
    title: "AgriVerse AI",
    tagline: "Intelligent Agriculture Powered by AI",
    dashboard: "Dashboard",
    cropRec: "Crop Recommendation",
    diseaseDet: "Disease Detection",
    smartIrr: "Smart Irrigation",
    marketPrice: "Market Prices",
    weather: "Weather Intelligence",
    satellite: "Satellite Analytics",
    chatbot: "AI Chat Assistant",
    admin: "Admin Portal",
    settings: "Settings",
    notifications: "Notifications",
    language: "Language",
    theme: "Theme",
    logout: "Logout",
    totalFarms: "Total Farms",
    waterStress: "Water Stress",
    cropHealth: "Crop Health",
    yieldPred: "Yield Prediction",
    welcomeBack: "Welcome back, Farmer Akash",
    quickRec: "Quick Recommendation",
    alerts: "Active Alerts"
  },
  Hindi: {
    title: "एग्रीवर्स एआई",
    tagline: "कृत्रिम बुद्धिमत्ता द्वारा संचालित स्मार्ट कृषि",
    dashboard: "डैशबोर्ड",
    cropRec: "फसल सिफारिश",
    diseaseDet: "रोग का पता लगाना",
    smartIrr: "स्मार्ट सिंचाई",
    marketPrice: "बाजार मूल्य",
    weather: "मौसम की जानकारी",
    satellite: "सैटेलाइट विश्लेषण",
    chatbot: "एआई चैट सहायक",
    admin: "एडमिन पोर्टल",
    settings: "सेटिंग्स",
    notifications: "सूचनाएं",
    language: "भाषा",
    theme: "थीम",
    logout: "लॉगआउट",
    totalFarms: "कुल फार्म",
    waterStress: "जल तनाव",
    cropHealth: "फसल स्वास्थ्य",
    yieldPred: "उपज का अनुमान",
    welcomeBack: "स्वागत है, किसान आकाश",
    quickRec: "त्वरित सिफारिश",
    alerts: "सक्रिय अलर्ट"
  },
  Tamil: {
    title: "அக்ரிவெர்ஸ் ஏஐ",
    tagline: "செயற்கை நுண்ணறிவு மூலம் ஸ்மார்ட் விவசாயம்",
    dashboard: "டாஷ்போர்டு",
    cropRec: "பயிர் பரிந்துரை",
    diseaseDet: "நோய் கண்டறிதல்",
    smartIrr: "ஸ்மார்ட் நீர்ப்பாசனம்",
    marketPrice: "சந்தை விலைகள்",
    weather: "வானிலை நுண்ணறிவு",
    satellite: "செயற்கைக்கோள் பகுப்பாய்வு",
    chatbot: "ஏஐ அரட்டை உதவியாளர்",
    admin: "நிர்வாகி போர்டல்",
    settings: "அமைப்புகள்",
    notifications: "அறிவிப்புகள்",
    language: "மொழி",
    theme: "தீம்",
    logout: "வெளியேறு",
    totalFarms: "மொத்த பண்ணைகள்",
    waterStress: "நீர் அழுத்தம்",
    cropHealth: "பயிர் ஆரோக்கியம்",
    yieldPred: "மகசூல் கணிப்பு",
    welcomeBack: "வரவேற்கிறோம், விவசாயி ஆகாஷ்",
    quickRec: "விரைவான பரிந்துரை",
    alerts: "செயலில் உள்ள எச்சரிக்கைகள்"
  },
  Telugu: {
    title: "అగ్రివర్స్ ఏఐ",
    tagline: "కృత్రిమ మేధస్సుతో స్మార్ట్ వ్యవసాయం",
    dashboard: "డ్యాష్‌బోర్డ్",
    cropRec: "పంట సిఫార్సు",
    diseaseDet: "వ్యాధి గుర్తింపు",
    smartIrr: "స్మార్ట్ నీటిపారుదల",
    marketPrice: "మార్కెట్ ధరలు",
    weather: "వాతావరణ సమాచారం",
    satellite: "శ్యాటిలైట్ విశ్లేషణ",
    chatbot: "ఏఐ చాట్ అసిస్టెంట్",
    admin: "అడ్మిన్ పోర్టల్",
    settings: "సెట్టింగులు",
    notifications: "నోటిఫికేషన్లు",
    language: "భాష",
    theme: "థీమ్",
    logout: "లాగ్ అవుట్",
    totalFarms: "మొత్తం పొలాలు",
    waterStress: "నీటి ఒత్తిడి",
    cropHealth: "పంట ఆరోగ్యం",
    yieldPred: "దిగుబడి అంచనా",
    welcomeBack: "స్వాగతం, రైతు ఆకాష్",
    quickRec: "త్వరిత సిఫార్సు",
    alerts: "క్రియాశీల హెచ్చరికలు"
  },
  Malayalam: {
    title: "അഗ്രിവേഴ്സ് എഐ",
    tagline: "ആർട്ടിഫിഷ്യൽ ഇന്റലിജൻസ് സ്മാർട്ട് കൃഷി",
    dashboard: "ഡാഷ്‌ബോർഡ്",
    cropRec: "വിള ശുപാർശ",
    diseaseDet: "രോഗം കണ്ടെത്തൽ",
    smartIrr: "സ്മാർട്ട് ജലസേചനം",
    marketPrice: "വിപണി വിലകൾ",
    weather: "കാലാവസ്ഥാ വിവരങ്ങൾ",
    satellite: "ഉപഗ്രഹ വിശകലനം",
    chatbot: "എഐ ചാറ്റ് അസിസ്റ്റന്റ്",
    admin: "അഡ്മിൻ പോർട്ടൽ",
    settings: "ക്രമീകരണങ്ങൾ",
    notifications: "അറിയിപ്പുകൾ",
    language: "ഭാഷ",
    theme: "തീം",
    logout: "ലോഗ് ഔട്ട്",
    totalFarms: "ആകെ ഫാമുകൾ",
    waterStress: "ജല സമ്മർദ്ദം",
    cropHealth: "വിള ആരോഗ്യം",
    yieldPred: "വിളവ് പ്രവചനം",
    welcomeBack: "സ്വാഗതം, കർഷകൻ ആകാശ്",
    quickRec: "ദ്രുത ശുപാർശ",
    alerts: "സജീവ അലേർട്ടുകൾ"
  },
  Kannada: {
    title: "ಅಗ್ರಿವರ್ಸ್ ಎಐ",
    tagline: "ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಯೊಂದಿಗೆ ಸ್ಮಾರ್ಟ್ ಕೃಷಿ",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    cropRec: "ಬೆಳೆ ಶಿಫಾರಸು",
    diseaseDet: "ರೋಗ ಪತ್ತೆಹಚ್ಚುವಿಕೆ",
    smartIrr: "ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ",
    marketPrice: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು",
    weather: "ಹವಾಮಾನ ಮಾಹಿತಿ",
    satellite: "ಉಪಗ್ರಹ ವಿಶ್ಲೇಷಣೆ",
    chatbot: "ಎಐ ಚಾಟ್ ಸಹಾಯಕ",
    admin: "ಅಡ್ಮಿನ್ ಪೋರ್ಟಲ್",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    notifications: "ಅಧಿಸೂಚನೆಗಳು",
    language: "ಭಾಷೆ",
    theme: "ಥೀಮ್",
    logout: "ಲಾಗ್ ಔಟ್",
    totalFarms: "ಒಟ್ಟು ಫಾರ್ಮ್‌ಗಳು",
    waterStress: "ನೀರಿನ ಒತ್ತಡ",
    cropHealth: "ಬೆಳೆ ಆರೋಗ್ಯ",
    yieldPred: "ಇಳುವರಿ ಮುನ್ಸೂಚನೆ",
    welcomeBack: "ಸ್ವಾಗತ, ರೈತ ಆಕಾಶ್",
    quickRec: "ತ್ವರಿತ ಶಿಫಾರಸು",
    alerts: "ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು"
  },
  Marathi: {
    title: "एग्रीव्हर्स एआय",
    tagline: "कृत्रिम बुद्धिमत्तेद्वारे चालवली जाणारी स्मार्ट शेती",
    dashboard: "डॅशबोर्ड",
    cropRec: "पीक शिफारस",
    diseaseDet: "रोग शोधणे",
    smartIrr: "स्मार्ट सिंचन",
    marketPrice: "बाजार भाव",
    weather: "हवामान अंदाज",
    satellite: "सॅटेलाइट विश्लेषण",
    chatbot: "एआय चॅट सहाय्यक",
    admin: "अ‍ॅडमीन पोर्टल",
    settings: "सेटिंग्ज",
    notifications: "सूचना",
    language: "भाषा",
    theme: "थीम",
    logout: "लॉगआउट",
    totalFarms: "एकूण शेती",
    waterStress: "पाणी ताण",
    cropHealth: "पीक आरोग्य",
    yieldPred: "उत्पादन अंदाज",
    welcomeBack: "स्वागत आहे, शेतकरी आकाश",
    quickRec: "त्वरित शिफारस",
    alerts: "सक्रिय अलर्ट"
  },
  Gujarati: {
    title: "એગ્રીવર્સ એઆઈ",
    tagline: "કૃત્રિમ બુદ્ધિમત્તા દ્વારા સ્માર્ટ કૃષિ",
    dashboard: "ડેશબોર્ડ",
    cropRec: "પાકની ભલામણ",
    diseaseDet: "રોગની શોધ",
    smartIrr: "સ્માર્ટ સિંચાઈ",
    marketPrice: "બજાર ભાવો",
    weather: "હવામાન માહિતી",
    satellite: "સેટેલાઇટ વિશ્લેષણ",
    chatbot: "એઆઈ ચેટ સહાયક",
    admin: "એડમિન પોર્ટલ",
    settings: "સેટિંગ્સ",
    notifications: "સૂચનાઓ",
    language: "ભાષા",
    theme: "થીમ",
    logout: "લોગઆઉટ",
    totalFarms: "કુલ ફાર્મ",
    waterStress: "પાણીની તંગી",
    cropHealth: "પાક આરોગ્ય",
    yieldPred: "ઉપજ અનુમાન",
    welcomeBack: "સ્વાગત છે, ખેડૂત આકાશ",
    quickRec: "ઝડપી ભલામણ",
    alerts: "સક્રિય ચેતવણીઓ"
  },
  Punjabi: {
    title: "ਐਗਰੀਵਰਸ ਏਆਈ",
    tagline: "ਆਰਟੀਫੀਸ਼ੀਅਲ ਇੰਟੈਲੀਜੈਂਸ ਦੁਆਰਾ ਸਮਾਰਟ ਖੇਤੀ",
    dashboard: "ਡੈਸ਼ਬੋਰਡ",
    cropRec: "ਫਸਲ ਦੀ ਸਿਫਾਰਸ਼",
    diseaseDet: "ਬੀਮਾਰੀ ਦੀ ਪਛਾਣ",
    smartIrr: "ਸਮਾਰਟ ਸਿੰਚਾਈ",
    marketPrice: "ਮੰਡੀ ਦੇ ਭਾਅ",
    weather: "ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ",
    satellite: "ਸੈਟੇਲਾਈਟ ਵਿਸ਼ਲੇਸ਼ਣ",
    chatbot: "ਏਆਈ ਚੈਟ ਸਹਾਇਕ",
    admin: "ਐਡਮਿਨ ਪੋਰਟਲ",
    settings: "ਸੈਟਿੰਗਾਂ",
    notifications: "ਨੋਟੀਫਿਕੇਸ਼ਨ",
    language: "ਭਾਸ਼ਾ",
    theme: "ਥੀਮ",
    logout: "ਲੌਗਆਊਟ",
    totalFarms: "ਕੁੱਲ ਫਾਰਮ",
    waterStress: "ਪਾਣੀ ਦੀ ਘਾਟ",
    cropHealth: "ਫਸਲ ਦੀ ਸਿਹਤ",
    yieldPred: "ਝਾੜ ਦਾ ਅਨੁਮਾਨ",
    welcomeBack: "ਜੀ ਆਇਆਂ ਨੂੰ, ਕਿਸਾਨ ਅਕਾਸ਼",
    quickRec: "ਤੁਰੰਤ ਸਿਫਾਰਸ਼",
    alerts: "ਸਰਗਰਮ ਅਲਰਟ"
  },
  Bengali: {
    title: "এগ্রিভার্স এআই",
    tagline: "কৃত্রিম বুদ্ধিমত্তা দ্বারা স্মার্ট কৃষি",
    dashboard: "ড্যাশবোর্ড",
    cropRec: "ফসল সুপারিশ",
    diseaseDet: "রোগ নির্ণয়",
    smartIrr: "স্মার্ট সেচ",
    marketPrice: "বাজার দর",
    weather: "আবহাওয়া তথ্য",
    satellite: "স্যাটেলাইট বিশ্লেষণ",
    chatbot: "এআই চ্যাট সহকারী",
    admin: "অ্যাডমিন পোর্টাল",
    settings: "সেটিংস",
    notifications: "বিজ্ঞপ্তি",
    language: "ভাষা",
    theme: "থিম",
    logout: "লগআউট",
    totalFarms: "মোট খামার",
    waterStress: "জলের ঘাটতি",
    cropHealth: "ফসলের স্বাস্থ্য",
    yieldPred: "ফলন পূর্বাভাস",
    welcomeBack: "স্বাগতম, কৃষক আকাশ",
    quickRec: "দ্রুত সুপারিশ",
    alerts: "সক্রিয় সতর্কতা"
  },
  Odia: {
    title: "ଏଗ୍ରିଭର୍ସ ଏଆଇ",
    tagline: "କୃତ୍ରିମ ବୁଦ୍ଧିମତ୍ତା ଦ୍ୱାରା ସ୍ମାର୍ଟ କୃଷି",
    dashboard: "ଡ୍ୟାସବୋର୍ଡ",
    cropRec: "ଫସଲ ସୁପାରିଶ",
    diseaseDet: "ରୋଗ ଚିହ୍ନଟ",
    smartIrr: "ସ୍ମାର୍ଟ ଜଳସେଚନ",
    marketPrice: "ବଜାର ଦର",
    weather: "ପାଣିପାଗ ସୂଚନା",
    satellite: "ଉପଗ୍ରହ ବିଶ୍ଳେଷଣ",
    chatbot: "ଏଆଇ ଚାଟ୍ ସହାୟକ",
    admin: "ଆଡମିନ ପୋର୍ଟାଲ",
    settings: "ସେଟିଂସ",
    notifications: "ବିଜ୍ଞପ୍ତି",
    language: "ଭାଷା",
    theme: "ଥିମ୍",
    logout: "ଲଗଆଉଟ୍",
    totalFarms: "ମୋଟ ଫାର୍ମ",
    waterStress: "ଜଳ ଚାପ",
    cropHealth: "ଫସଲ ସ୍ୱାସ୍ଥ୍ୟ",
    yieldPred: "ଉପଜ ଆକଳନ",
    welcomeBack: "ସ୍ୱାଗତ, କୃଷକ ଆକାଶ",
    quickRec: "ତୁରନ୍ତ ସୁପାରିଶ",
    alerts: "ସକ୍ରିୟ ସୂଚନା"
  },
  Urdu: {
    title: "ایگری ورس اے آئی",
    tagline: "مصنوعی ذہانت سے چلنے والی سمارٹ زراعت",
    dashboard: "ڈیش بورڈ",
    cropRec: "فصل کی سفارش",
    diseaseDet: "بیماری کی تشخیص",
    smartIrr: "سمارٹ آبپاشی",
    marketPrice: "مارکیٹ کی قیمتیں",
    weather: "موسم کی معلومات",
    satellite: "سیٹلائٹ تجزیہ",
    chatbot: "اے آئی چیٹ اسسٹنٹ",
    admin: "ایڈمن پورٹل",
    settings: "ترتیبات",
    notifications: "اطلاعات",
    language: "زبان",
    theme: "تھیم",
    logout: "لاگ آؤٹ",
    totalFarms: "کل فارمز",
    waterStress: "پانی کی کمی",
    cropHealth: "فصل کی صحت",
    yieldPred: "پیداوار کی پیش گوئی",
    welcomeBack: "خوش آمدید، کسان آکاش",
    quickRec: "فوری سفارش",
    alerts: "فعال الرٹس"
  }
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  theme: string;
  setTheme: (theme: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "English",
  setLanguage: () => {},
  t: (key: string) => key,
  theme: "light",
  setTheme: () => {},
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      const savedLanguage = localStorage.getItem("agriverse_lang") || "English";
      const savedTheme = localStorage.getItem("agriverse_theme") || "light";
      setLanguage(savedLanguage);
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("agriverse_lang", lang);
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("agriverse_theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const t = (key: string) => {
    const langDict = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.English;
    return langDict[key as keyof typeof langDict] || TRANSLATIONS.English[key as keyof typeof TRANSLATIONS.English] || key;
  };

  // Prevent hydration mismatches
  if (!isMounted) {
    return (
      <html lang="en">
        <body className="bg-slate-50 text-slate-900">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-600"></div>
          </div>
        </body>
      </html>
    );
  }

  const navItems = [
    { name: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("cropRec"), href: "/crop-recommendation", icon: Sprout },
    { name: t("diseaseDet"), href: "/disease-detection", icon: ShieldCheck },
    { name: t("smartIrr"), href: "/smart-irrigation", icon: Droplet },
    { name: t("marketPrice"), href: "/market-prices", icon: TrendingUp },
    { name: t("weather"), href: "/weather", icon: CloudSun },
    { name: t("satellite"), href: "/satellite-analytics", icon: Layers },
    { name: t("chatbot"), href: "/chatbot", icon: MessageSquare },
  ];

  return (
    <html lang="en">
      <body className={`${theme === 'dark' ? 'dark' : ''} min-h-screen flex`}
        style={{ background: theme === 'dark' ? '#060d08' : '#f0fdf9', color: theme === 'dark' ? '#e8faf2' : '#0a2e1e' }}
      >
        <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange, t, theme, setTheme: handleThemeToggle }}>

          {/* ── Premium Sidebar ─────────────────────────────── */}
          <aside className="sidebar" style={{
            width: '248px', flexShrink: 0, height: '100vh',
            position: 'fixed', left: 0, top: 0, zIndex: 40,
            display: 'flex', flexDirection: 'column', overflowY: 'auto',
          }}>

            {/* Logo */}
            <div style={{
              padding: '24px 20px 20px',
              borderBottom: '1px solid var(--border-base)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
                background: 'linear-gradient(135deg, #059669, #0d9488)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(5,150,105,0.30)',
              }}>
                <Sprout style={{ width: 20, height: 20, color: 'white' }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '15px', fontWeight: 800, lineHeight: 1.2,
                  fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #059669, #0d9488)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>{t('title')}</h1>
                <p style={{ fontSize: '9px', color: theme === 'dark' ? '#3d7a57' : '#8aab97', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '1px' }}>
                  {t('tagline')}
                </p>
              </div>
            </div>

            {/* Nav items */}
            <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {navItems.map((item) => (
                <a key={item.name} href={item.href} className="nav-item">
                  <item.icon style={{ width: 17, height: 17, flexShrink: 0 }} />
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>

            {/* Bottom controls */}
            <div style={{ padding: '12px 12px 20px', borderTop: '1px solid var(--border-base)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Language */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: '10px',
                background: theme === 'dark' ? 'rgba(16,31,22,0.80)' : '#f0fdf9',
                border: `1px solid ${theme === 'dark' ? 'rgba(16,185,129,0.10)' : '#d1fae5'}`,
              }}>
                <Languages style={{ width: 14, height: 14, color: 'var(--accent-1)', flexShrink: 0 }} />
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    fontSize: '12px', fontWeight: 600, color: theme === 'dark' ? '#e8faf2' : '#0a2e1e',
                    cursor: 'pointer', width: '100%',
                  }}
                >
                  {Object.keys(TRANSLATIONS).map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Theme toggle + status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <button
                  onClick={handleThemeToggle}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 12px', borderRadius: '10px',
                    background: theme === 'dark' ? 'rgba(16,31,22,0.80)' : '#f0fdf9',
                    border: `1px solid ${theme === 'dark' ? 'rgba(16,185,129,0.10)' : '#d1fae5'}`,
                    cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                    color: theme === 'dark' ? '#5da882' : '#4b7563', transition: 'all 0.2s',
                  }}
                >
                  {theme === 'light'
                    ? <><Moon style={{ width: 13, height: 13 }} /> Dark mode</>
                    : <><Sun  style={{ width: 13, height: 13 }} /> Light mode</>}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, color: 'var(--accent-1)' }}>
                  <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-1)' }} />
                  Online
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────── */}
          <main style={{ flex: 1, marginLeft: '248px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Top header */}
            <header style={{
              height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 32px', position: 'sticky', top: 0, zIndex: 30,
              background: theme === 'dark' ? 'rgba(6,13,8,0.90)' : 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${theme === 'dark' ? 'rgba(16,185,129,0.10)' : '#d1fae5'}`,
              boxShadow: `0 1px 0 ${theme === 'dark' ? 'rgba(16,185,129,0.06)' : '#d1fae5'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} className="animate-pulse" />
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: theme === 'dark' ? '#e8faf2' : '#0a2e1e', fontFamily: "'Outfit',sans-serif" }}>
                  {t('welcomeBack')}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Weather pill */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 14px', borderRadius: '10px',
                  background: theme === 'dark' ? 'rgba(16,31,22,0.80)' : '#f0fdf9',
                  border: `1px solid ${theme === 'dark' ? 'rgba(16,185,129,0.10)' : '#d1fae5'}`,
                }}>
                  <CloudSun style={{ width: 15, height: 15, color: '#f59e0b' }} />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: theme === 'dark' ? '#e8faf2' : '#0a2e1e', lineHeight: 1.2 }}>28.5°C</p>
                    <p style={{ fontSize: '9px', color: theme === 'dark' ? '#3d7a57' : '#8aab97' }}>Ludhiana, Punjab</p>
                  </div>
                </div>

                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #059669, #0d9488)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '14px', color: 'white',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.25)',
                  fontFamily: "'Outfit',sans-serif",
                }}>A</div>
              </div>
            </header>

            <div style={{ flex: 1, padding: '28px 32px' }}>
              {children}
            </div>
          </main>

        </LanguageContext.Provider>
      </body>
    </html>
  );
}

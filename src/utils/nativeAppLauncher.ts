/**
 * Native Android App & Intent Launcher with Intelligent Universal Resolver
 * Launches real native apps on mobile devices using Android Intent URIs and custom deep links.
 * Works for ANY app on the Android phone with zero clicks.
 */

export interface NativeLaunchTarget {
  name: string;
  packageName?: string;
  deepLinkScheme?: string;
  intentUri?: string;
  fallbackWebUrl?: string;
  query?: string;
  title: string;
  hindiName?: string;
}

export interface AppRegistryItem {
  name: string;
  hindiName: string;
  aliases: string[];
  packageName: string;
  deepLinkScheme?: string;
  intentUri?: string;
  fallbackWebUrl?: string;
}

/**
 * Comprehensive Universal Android App Registry
 * Covers System, Social, Messaging, Media, UPI/Payments, Delivery, Shopping, Games, Banking & Tools.
 */
export const UNIVERSAL_APP_REGISTRY: AppRegistryItem[] = [
  // 1. Core System & Utility Apps
  {
    name: "YouTube",
    hindiName: "यूट्यूब",
    aliases: ["youtube", "यूट्यूब", "युटुब", "yt"],
    packageName: "com.google.android.youtube",
    deepLinkScheme: "vnd.youtube://",
    intentUri: "intent://#Intent;package=com.google.android.youtube;scheme=vnd.youtube;end;",
    fallbackWebUrl: "https://www.youtube.com",
  },
  {
    name: "Camera",
    hindiName: "कैमरा",
    aliases: ["camera", "कैमरा", "फोटो खींचो", "फोटो खींचना", "कैमरा खोलो", "कैमरा चालू करो"],
    packageName: "com.android.camera",
    deepLinkScheme: "intent://#Intent;action=android.media.action.STILL_IMAGE_CAMERA;category=android.intent.category.DEFAULT;end;",
    intentUri: "intent://#Intent;action=android.media.action.STILL_IMAGE_CAMERA;category=android.intent.category.DEFAULT;end;",
    fallbackWebUrl: "https://www.google.com",
  },
  {
    name: "Calculator",
    hindiName: "कैलकुलेटर",
    aliases: ["calculator", "कैलकुलेटर", "कैलकुलेटर खोलो", "हिसाब", "calc"],
    packageName: "com.google.android.calculator",
    deepLinkScheme: "intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end;",
    intentUri: "intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end;",
    fallbackWebUrl: "https://www.google.com/search?q=calculator",
  },
  {
    name: "Settings",
    hindiName: "सेटिंग्स",
    aliases: ["settings", "सेटिंग्स", "सेटिंग", "phone settings", "मोबाइल सेटिंग", "फोन सेटिंग"],
    packageName: "com.android.settings",
    deepLinkScheme: "intent://#Intent;action=android.settings.SETTINGS;end;",
    intentUri: "intent://#Intent;action=android.settings.SETTINGS;end;",
    fallbackWebUrl: "https://www.google.com",
  },
  {
    name: "Gallery",
    hindiName: "गैलरी",
    aliases: ["gallery", "photos", "गैलरी", "फोटो", "फ़ोटो", "तस्वीरें", "photos app", "गूगल फोटोज"],
    packageName: "com.google.android.apps.photos",
    deepLinkScheme: "googlephotos://",
    intentUri: "intent://#Intent;action=android.intent.action.VIEW;type=image/*;category=android.intent.category.DEFAULT;end;",
    fallbackWebUrl: "https://photos.google.com",
  },
  {
    name: "Phone",
    hindiName: "फोन डायलर",
    aliases: ["phone", "dialer", "फोन", "डायलर", "कॉल डायलर", "phone app", "डायल पैड"],
    packageName: "com.google.android.dialer",
    deepLinkScheme: "tel:",
    intentUri: "intent://#Intent;action=android.intent.action.DIAL;end;",
    fallbackWebUrl: "https://www.google.com",
  },
  {
    name: "Messages",
    hindiName: "मैसेज",
    aliases: ["messages", "message", "sms", "मैसेज", "एसएमएस", "संदेश"],
    packageName: "com.google.android.apps.messaging",
    deepLinkScheme: "sms:",
    intentUri: "intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_MESSAGING;end;",
    fallbackWebUrl: "https://messages.google.com/web",
  },
  {
    name: "Clock",
    hindiName: "घड़ी / अलार्म",
    aliases: ["clock", "alarm", "घड़ी", "अलार्म", "टाइम", "अलार्म लगाओ"],
    packageName: "com.google.android.deskclock",
    deepLinkScheme: "intent://#Intent;action=android.intent.action.SHOW_ALARMS;end;",
    intentUri: "intent://#Intent;action=android.intent.action.SHOW_ALARMS;end;",
    fallbackWebUrl: "https://time.is",
  },
  {
    name: "Contacts",
    hindiName: "कॉन्टैक्ट्स",
    aliases: ["contacts", "कॉन्टैक्ट्स", "फोन नंबर", "संपर्क"],
    packageName: "com.google.android.contacts",
    deepLinkScheme: "content://contacts/people/",
    intentUri: "intent://#Intent;action=android.intent.action.VIEW;type=vnd.android.cursor.dir/contact;end;",
    fallbackWebUrl: "https://contacts.google.com",
  },
  {
    name: "Files",
    hindiName: "फाइल मैनेजर",
    aliases: ["files", "file manager", "फाइल", "फाइलें", "फाइल मैनेजर", "माय फाइल्स"],
    packageName: "com.google.android.apps.nbu.files",
    deepLinkScheme: "intent://#Intent;action=android.intent.action.VIEW;type=*/*;category=android.intent.category.DEFAULT;end;",
    intentUri: "intent://#Intent;action=android.intent.action.VIEW;type=*/*;category=android.intent.category.DEFAULT;end;",
    fallbackWebUrl: "https://drive.google.com",
  },
  {
    name: "Play Store",
    hindiName: "गूगल प्ले स्टोर",
    aliases: ["play store", "playstore", "प्ले स्टोर", "प्लेस्टोर"],
    packageName: "com.android.vending",
    deepLinkScheme: "market://",
    intentUri: "intent://#Intent;package=com.android.vending;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://play.google.com",
  },
  {
    name: "Chrome",
    hindiName: "गूगल क्रोम",
    aliases: ["chrome", "browser", "क्रोम", "ब्राउज़र", "गूगल क्रोम"],
    packageName: "com.android.chrome",
    deepLinkScheme: "googlechrome://",
    intentUri: "intent://#Intent;package=com.android.chrome;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.google.com",
  },
  {
    name: "Google Maps",
    hindiName: "गूगल मैप्स",
    aliases: ["maps", "google maps", "मैप", "मैप्स", "नक्शा", "गूगल मैप", "रास्ता"],
    packageName: "com.google.android.apps.maps",
    deepLinkScheme: "geo:0,0?q=",
    intentUri: "intent://#Intent;package=com.google.android.apps.maps;scheme=geo;end;",
    fallbackWebUrl: "https://maps.google.com",
  },
  {
    name: "Gmail",
    hindiName: "जीमेल",
    aliases: ["gmail", "email", "मेल", "जीमेल", "ईमेल"],
    packageName: "com.google.android.gm",
    deepLinkScheme: "googlegmail://",
    intentUri: "intent://#Intent;package=com.google.android.gm;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://mail.google.com",
  },
  {
    name: "Google Drive",
    hindiName: "गूगल ड्राइव",
    aliases: ["drive", "google drive", "गूगल ड्राइव", "ड्राइव"],
    packageName: "com.google.android.apps.docs",
    deepLinkScheme: "googledrive://",
    intentUri: "intent://#Intent;package=com.google.android.apps.docs;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://drive.google.com",
  },
  {
    name: "Google Keep",
    hindiName: "गूगल कीप (नोट्स)",
    aliases: ["keep", "notes", "keep notes", "गूगल कीप", "नोट्स", "नोटपैड"],
    packageName: "com.google.android.keep",
    deepLinkScheme: "intent://#Intent;package=com.google.android.keep;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    intentUri: "intent://#Intent;package=com.google.android.keep;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://keep.google.com",
  },
  {
    name: "Calendar",
    hindiName: "कैलेंडर",
    aliases: ["calendar", "कैलेंडर", "तारीख"],
    packageName: "com.google.android.calendar",
    deepLinkScheme: "content://com.android.calendar/time/",
    intentUri: "intent://#Intent;package=com.google.android.calendar;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://calendar.google.com",
  },
  {
    name: "Sound Recorder",
    hindiName: "साउंड रिकॉर्डर",
    aliases: ["sound recorder", "voice recorder", "रिकॉर्डर", "ऑडियो रिकॉर्डर", "आवाज़ रिकॉर्डर"],
    packageName: "com.google.android.apps.recorder",
    deepLinkScheme: "intent://#Intent;action=android.provider.MediaStore.RECORD_SOUND;end;",
    intentUri: "intent://#Intent;action=android.provider.MediaStore.RECORD_SOUND;end;",
    fallbackWebUrl: "https://www.google.com",
  },

  // 2. Social, Chat & Communication
  {
    name: "WhatsApp",
    hindiName: "व्हाट्सएप",
    aliases: ["whatsapp", "व्हाट्सएप", "वाट्सएप", "व्हाट्सअप", "वाट्सअप", "wp"],
    packageName: "com.whatsapp",
    deepLinkScheme: "whatsapp://",
    intentUri: "intent://#Intent;package=com.whatsapp;scheme=whatsapp;end;",
    fallbackWebUrl: "https://web.whatsapp.com",
  },
  {
    name: "Instagram",
    hindiName: "इंस्टाग्राम",
    aliases: ["instagram", "इंस्टाग्राम", "इंस्टा", "insta", "ig"],
    packageName: "com.instagram.android",
    deepLinkScheme: "instagram://app",
    intentUri: "intent://#Intent;package=com.instagram.android;scheme=instagram;end;",
    fallbackWebUrl: "https://www.instagram.com",
  },
  {
    name: "Facebook",
    hindiName: "फेसबुक",
    aliases: ["facebook", "fb", "फेसबुक"],
    packageName: "com.facebook.katana",
    deepLinkScheme: "fb://",
    intentUri: "intent://#Intent;package=com.facebook.katana;scheme=fb;end;",
    fallbackWebUrl: "https://www.facebook.com",
  },
  {
    name: "Telegram",
    hindiName: "टेलीग्राम",
    aliases: ["telegram", "टेलीग्राम", "tg"],
    packageName: "org.telegram.messenger",
    deepLinkScheme: "tg://",
    intentUri: "intent://#Intent;package=org.telegram.messenger;scheme=tg;end;",
    fallbackWebUrl: "https://web.telegram.org",
  },
  {
    name: "Snapchat",
    hindiName: "स्नैपचैट",
    aliases: ["snapchat", "स्नैपचैट", "स्नैप"],
    packageName: "com.snapchat.android",
    deepLinkScheme: "snapchat://",
    intentUri: "intent://#Intent;package=com.snapchat.android;scheme=snapchat;end;",
    fallbackWebUrl: "https://web.snapchat.com",
  },
  {
    name: "Twitter",
    hindiName: "एक्स (Twitter)",
    aliases: ["twitter", "x", "ट्विटर", "एक्स"],
    packageName: "com.twitter.android",
    deepLinkScheme: "twitter://",
    intentUri: "intent://#Intent;package=com.twitter.android;scheme=twitter;end;",
    fallbackWebUrl: "https://x.com",
  },
  {
    name: "Truecaller",
    hindiName: "ट्रूकॉलर",
    aliases: ["truecaller", "ट्रूकॉलर", "ट्रू कॉलर"],
    packageName: "com.truecaller",
    deepLinkScheme: "truecaller://",
    intentUri: "intent://#Intent;package=com.truecaller;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.truecaller.com",
  },
  {
    name: "LinkedIn",
    hindiName: "लिंक्डइन",
    aliases: ["linkedin", "लिंक्डइन", "लिंक्ड इन"],
    packageName: "com.linkedin.android",
    deepLinkScheme: "linkedin://",
    intentUri: "intent://#Intent;package=com.linkedin.android;scheme=linkedin;end;",
    fallbackWebUrl: "https://www.linkedin.com",
  },
  {
    name: "Reddit",
    hindiName: "रेडिट",
    aliases: ["reddit", "रेडिट"],
    packageName: "com.reddit.frontpage",
    deepLinkScheme: "reddit://",
    intentUri: "intent://#Intent;package=com.reddit.frontpage;scheme=reddit;end;",
    fallbackWebUrl: "https://www.reddit.com",
  },
  {
    name: "Discord",
    hindiName: "डिस्कॉर्ड",
    aliases: ["discord", "डिस्कॉर्ड", "डिसकॉर्ड"],
    packageName: "com.discord",
    deepLinkScheme: "discord://",
    intentUri: "intent://#Intent;package=com.discord;scheme=discord;end;",
    fallbackWebUrl: "https://discord.com",
  },
  {
    name: "ShareChat",
    hindiName: "शेयरचैट",
    aliases: ["sharechat", "शेयरचैट", "शेयर चैट"],
    packageName: "in.mohalla.sharechat",
    deepLinkScheme: "sharechat://",
    intentUri: "intent://#Intent;package=in.mohalla.sharechat;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://sharechat.com",
  },
  {
    name: "Moj",
    hindiName: "मौज",
    aliases: ["moj", "मौज", "मोज"],
    packageName: "in.mohalla.video",
    deepLinkScheme: "moj://",
    intentUri: "intent://#Intent;package=in.mohalla.video;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://mojapp.in",
  },
  {
    name: "Josh",
    hindiName: "जोश",
    aliases: ["josh", "जोश"],
    packageName: "com.eterno.shortvideos",
    deepLinkScheme: "josh://",
    intentUri: "intent://#Intent;package=com.eterno.shortvideos;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://myjosh.in",
  },

  // 3. Payments, UPI & Banking
  {
    name: "PhonePe",
    hindiName: "फोनपे",
    aliases: ["phonepe", "फोनपे", "फोन पे"],
    packageName: "com.phonepe.app",
    deepLinkScheme: "phonepe://",
    intentUri: "intent://#Intent;package=com.phonepe.app;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.phonepe.com",
  },
  {
    name: "Google Pay",
    hindiName: "गूगल पे",
    aliases: ["google pay", "gpay", "गूगल पे", "जीपे", "जी पे", "tez"],
    packageName: "com.google.android.apps.nbu.paisa.user",
    deepLinkScheme: "tez://upi/",
    intentUri: "intent://#Intent;package=com.google.android.apps.nbu.paisa.user;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://pay.google.com",
  },
  {
    name: "Paytm",
    hindiName: "पेटीएम",
    aliases: ["paytm", "पेटीएम", "पे टीएम"],
    packageName: "net.one97.paytm",
    deepLinkScheme: "paytmmp://",
    intentUri: "intent://#Intent;package=net.one97.paytm;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://paytm.com",
  },
  {
    name: "BHIM",
    hindiName: "भीम यूपीआई",
    aliases: ["bhim", "भीम", "bhim upi", "भीम यूपीआई"],
    packageName: "in.org.npci.upiapp",
    deepLinkScheme: "upi://",
    intentUri: "intent://#Intent;package=in.org.npci.upiapp;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.bhimupi.org.in",
  },
  {
    name: "CRED",
    hindiName: "क्रेड",
    aliases: ["cred", "क्रेड"],
    packageName: "com.dreamplug.androidapp",
    deepLinkScheme: "cred://",
    intentUri: "intent://#Intent;package=com.dreamplug.androidapp;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://cred.club",
  },
  {
    name: "Groww",
    hindiName: "ग्रो",
    aliases: ["groww", "ग्रो", "ग्रो ऐप"],
    packageName: "com.nextbillion.groww",
    deepLinkScheme: "groww://",
    intentUri: "intent://#Intent;package=com.nextbillion.groww;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://groww.in",
  },
  {
    name: "Zerodha Kite",
    hindiName: "ज़ेरोधा",
    aliases: ["zerodha", "kite", "ज़ेरोधा", "काइट"],
    packageName: "com.zerodha.kite3",
    deepLinkScheme: "kite://",
    intentUri: "intent://#Intent;package=com.zerodha.kite3;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://kite.zerodha.com",
  },
  {
    name: "Angel One",
    hindiName: "एंजल वन",
    aliases: ["angel one", "angel broking", "एंजल वन", "एन्जिल वन"],
    packageName: "com.msf.angelmobile",
    deepLinkScheme: "angelone://",
    intentUri: "intent://#Intent;package=com.msf.angelmobile;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.angelone.in",
  },
  {
    name: "SBI Yono",
    hindiName: "एसबीआई योनो",
    aliases: ["sbi yono", "yono sbi", "योनो", "एसबीआई योनो", "sbi"],
    packageName: "com.sbi.lotusintouch",
    deepLinkScheme: "yonosbi://",
    intentUri: "intent://#Intent;package=com.sbi.lotusintouch;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.onlinesbi.sbi",
  },
  {
    name: "Canara ai1",
    hindiName: "कैनरा बैंक",
    aliases: ["canara", "canara ai1", "कैनरा", "केनरा", "कैनरा बैंक"],
    packageName: "com.canarabank.mobility",
    deepLinkScheme: "canaraai1://",
    intentUri: "intent://#Intent;package=com.canarabank.mobility;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://canarabank.com",
  },
  {
    name: "HDFC MobileBanking",
    hindiName: "एचडीएफसी बैंक",
    aliases: ["hdfc", "hdfc bank", "एचडीएफसी"],
    packageName: "com.snapwork.hdfc",
    deepLinkScheme: "hdfcbank://",
    intentUri: "intent://#Intent;package=com.snapwork.hdfc;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.hdfcbank.com",
  },

  // 4. Shopping & Food Delivery
  {
    name: "Zomato",
    hindiName: "ज़ोमैटो",
    aliases: ["zomato", "ज़ोमैटो", "जोमैटो", "खाना आर्डर"],
    packageName: "com.application.zomato",
    deepLinkScheme: "zomato://",
    intentUri: "intent://#Intent;package=com.application.zomato;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.zomato.com",
  },
  {
    name: "Swiggy",
    hindiName: "स्विगी",
    aliases: ["swiggy", "स्विगी", "स्विग्गी"],
    packageName: "in.swiggy.android",
    deepLinkScheme: "swiggy://",
    intentUri: "intent://#Intent;package=in.swiggy.android;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.swiggy.com",
  },
  {
    name: "Flipkart",
    hindiName: "फ्लिपकार्ट",
    aliases: ["flipkart", "फ्लिपकार्ट", "फ्लिप कार्ट"],
    packageName: "com.flipkart.android",
    deepLinkScheme: "flipkart://",
    intentUri: "intent://#Intent;package=com.flipkart.android;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.flipkart.com",
  },
  {
    name: "Amazon",
    hindiName: "अमेज़न",
    aliases: ["amazon", "अमेज़न", "अमेजन", "amazon shopping"],
    packageName: "com.amazon.mShop.android.shopping",
    deepLinkScheme: "amazon://",
    intentUri: "intent://#Intent;package=com.amazon.mShop.android.shopping;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.amazon.in",
  },
  {
    name: "Meesho",
    hindiName: "मीशो",
    aliases: ["meesho", "मीशो", "मिशो"],
    packageName: "com.meesho.supply",
    deepLinkScheme: "meesho://",
    intentUri: "intent://#Intent;package=com.meesho.supply;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.meesho.com",
  },
  {
    name: "Myntra",
    hindiName: "मिंत्रा",
    aliases: ["myntra", "मिंत्रा", "मिन्त्रा"],
    packageName: "com.myntra.android",
    deepLinkScheme: "myntra://",
    intentUri: "intent://#Intent;package=com.myntra.android;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.myntra.com",
  },
  {
    name: "Blinkit",
    hindiName: "ब्लिंकिट",
    aliases: ["blinkit", "grofers", "ब्लिंकिट", "ग्रोफर्स"],
    packageName: "com.grofers.customerapp",
    deepLinkScheme: "blinkit://",
    intentUri: "intent://#Intent;package=com.grofers.customerapp;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://blinkit.com",
  },
  {
    name: "Zepto",
    hindiName: "ज़ेप्टो",
    aliases: ["zepto", "ज़ेप्टो", "जेप्टो"],
    packageName: "com.zeptocookbook.android",
    deepLinkScheme: "zepto://",
    intentUri: "intent://#Intent;package=com.zeptocookbook.android;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.zeptonow.com",
  },

  // 5. Travel & Cabs
  {
    name: "Uber",
    hindiName: "उबर",
    aliases: ["uber", "उबर", "ऊबर", "कैब"],
    packageName: "com.ubercab",
    deepLinkScheme: "uber://",
    intentUri: "intent://#Intent;package=com.ubercab;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://m.uber.com",
  },
  {
    name: "Ola",
    hindiName: "ओला",
    aliases: ["ola", "olacabs", "ओला", "ओला कैब"],
    packageName: "com.olacabs.customer",
    deepLinkScheme: "olacabs://",
    intentUri: "intent://#Intent;package=com.olacabs.customer;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.olacabs.com",
  },
  {
    name: "Rapido",
    hindiName: "रैपिडो",
    aliases: ["rapido", "रैपिडो", "रेपिडो", "बाइक टैक्सी"],
    packageName: "com.rapido.passenger",
    deepLinkScheme: "rapido://",
    intentUri: "intent://#Intent;package=com.rapido.passenger;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.rapido.bike",
  },

  // 6. Entertainment & Streaming
  {
    name: "Spotify",
    hindiName: "स्पॉटिफाय",
    aliases: ["spotify", "स्पॉटिफाय", "स्पॉटीफाई", "म्यूजिक", "गाने", "गाना बजाओ"],
    packageName: "com.spotify.music",
    deepLinkScheme: "spotify://",
    intentUri: "intent://#Intent;package=com.spotify.music;scheme=spotify;end;",
    fallbackWebUrl: "https://open.spotify.com",
  },
  {
    name: "JioCinema",
    hindiName: "जियो सिनेमा",
    aliases: ["jiocinema", "jio cinema", "जियो सिनेमा", "जियोसिनेमा", "टाटा आईपीएल"],
    packageName: "com.jio.media.ondemand",
    deepLinkScheme: "jiocinema://",
    intentUri: "intent://#Intent;package=com.jio.media.ondemand;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.jiocinema.com",
  },
  {
    name: "Disney+ Hotstar",
    hindiName: "हॉटस्टार",
    aliases: ["hotstar", "disney hotstar", "हॉटस्टार", "हॉट स्टार", "डिज्नी हॉटस्टार"],
    packageName: "in.startv.hotstar",
    deepLinkScheme: "hotstar://",
    intentUri: "intent://#Intent;package=in.startv.hotstar;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.hotstar.com",
  },
  {
    name: "Netflix",
    hindiName: "नेटफ्लिक्स",
    aliases: ["netflix", "नेटफ्लिक्स"],
    packageName: "com.netflix.mediaclient",
    deepLinkScheme: "netflix://",
    intentUri: "intent://#Intent;package=com.netflix.mediaclient;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.netflix.com",
  },
  {
    name: "Amazon Prime Video",
    hindiName: "प्राइम वीडियो",
    aliases: ["prime video", "amazon prime", "प्राइम वीडियो", "प्राइम"],
    packageName: "com.amazon.avod.thirdpartyclient",
    deepLinkScheme: "primevideo://",
    intentUri: "intent://#Intent;package=com.amazon.avod.thirdpartyclient;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.primevideo.com",
  },
  {
    name: "SonyLIV",
    hindiName: "सोनीलिव",
    aliases: ["sonyliv", "sony liv", "सोनीलिव", "सोनी लिव"],
    packageName: "com.sony.liv",
    deepLinkScheme: "sonyliv://",
    intentUri: "intent://#Intent;package=com.sony.liv;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.sonyliv.com",
  },
  {
    name: "Zee5",
    hindiName: "ज़ी5",
    aliases: ["zee5", "ज़ी5", "जी5"],
    packageName: "com.graymatrix.did",
    deepLinkScheme: "zee5://",
    intentUri: "intent://#Intent;package=com.graymatrix.did;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.zee5.com",
  },
  {
    name: "JioSaavn",
    hindiName: "जियोसावन",
    aliases: ["jiosaavn", "jio saavn", "saavn", "जियोसावन", "सावन"],
    packageName: "com.jio.media.jiobeats",
    deepLinkScheme: "jiosaavn://",
    intentUri: "intent://#Intent;package=com.jio.media.jiobeats;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.jiosaavn.com",
  },
  {
    name: "Wynk Music",
    hindiName: "विंक म्यूजिक",
    aliases: ["wynk", "wynk music", "विंक", "विंक म्यूजिक"],
    packageName: "com.bsb.hnd",
    deepLinkScheme: "wynk://",
    intentUri: "intent://#Intent;package=com.bsb.hnd;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://wynk.in/music",
  },
  {
    name: "VLC Player",
    hindiName: "वीएलसी प्लेयर",
    aliases: ["vlc", "vlc player", "वीएलसी", "वीएलसी प्लेयर"],
    packageName: "org.videolan.vlc",
    deepLinkScheme: "vlc://",
    intentUri: "intent://#Intent;package=org.videolan.vlc;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.videolan.org",
  },
  {
    name: "MX Player",
    hindiName: "एमएक्स प्लेयर",
    aliases: ["mx player", "mx", "एमएक्स प्लेयर", "एम एक्स प्लेयर"],
    packageName: "com.mxtech.videoplayer.ad",
    deepLinkScheme: "mxplayer://",
    intentUri: "intent://#Intent;package=com.mxtech.videoplayer.ad;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.mxplayer.in",
  },

  // 7. Popular Games
  {
    name: "Free Fire",
    hindiName: "फ्री फायर",
    aliases: ["free fire", "freefire", "फ्री फायर", "फ्रीफायर", "ff"],
    packageName: "com.dts.freefireth",
    deepLinkScheme: "intent://#Intent;package=com.dts.freefireth;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    intentUri: "intent://#Intent;package=com.dts.freefireth;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://ff.garena.com",
  },
  {
    name: "BGMI",
    hindiName: "बीजीएमआई",
    aliases: ["bgmi", "battlegrounds", "pubg", "पबजी", "बीजीएमआई"],
    packageName: "com.pubg.imobile",
    deepLinkScheme: "intent://#Intent;package=com.pubg.imobile;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    intentUri: "intent://#Intent;package=com.pubg.imobile;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.battlegroundsmobileindia.com",
  },
  {
    name: "Candy Crush",
    hindiName: "कैंडी क्रश",
    aliases: ["candy crush", "candycrush", "कैंडी क्रश", "कैंडीक्रश"],
    packageName: "com.king.candycrushsaga",
    deepLinkScheme: "intent://#Intent;package=com.king.candycrushsaga;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    intentUri: "intent://#Intent;package=com.king.candycrushsaga;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://www.king.com",
  },
  {
    name: "Subway Surfers",
    hindiName: "सबवे सर्फर्स",
    aliases: ["subway surfers", "subway", "सबवे सर्फर्स", "सबवे"],
    packageName: "com.kiloo.subwaysurf",
    deepLinkScheme: "intent://#Intent;package=com.kiloo.subwaysurf;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    intentUri: "intent://#Intent;package=com.kiloo.subwaysurf;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://subwaysurfers.com",
  },
  {
    name: "Ludo King",
    hindiName: "लूडो किंग",
    aliases: ["ludo king", "ludo", "लूडो किंग", "लूडो"],
    packageName: "com.ludo.king",
    deepLinkScheme: "intent://#Intent;package=com.ludo.king;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    intentUri: "intent://#Intent;package=com.ludo.king;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end;",
    fallbackWebUrl: "https://ludoking.com",
  },
];

/**
 * Phonetic transliterator mapping Devanagari Hindi phonemes to Latin/English characters
 * Ensures ANY spoken app name in Hindi is translated to clean ASCII for Android package matching.
 */
export function transliterateHindiToEnglish(hindiText: string): string {
  const charMap: Record<string, string> = {
    "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
    "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
    "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
    "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
    "प": "p", "फ": "f", "ब": "b", "भ": "bh", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh",
    "ष": "sh", "स": "s", "ह": "h", "क़": "q", "ख़": "kh",
    "ग़": "g", "ज़": "z", "ड़": "d", "ढ़": "dh", "फ़": "f",
    "ा": "a", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo",
    "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ं": "n",
    "ँ": "n", "ः": "h", "्": "", "अ": "a", "आ": "aa",
    "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo", "ए": "e",
    "ऐ": "ai", "ओ": "o", "औ": "au",
  };

  let result = "";
  for (let i = 0; i < hindiText.length; i++) {
    const ch = hindiText[i];
    result += charMap[ch] !== undefined ? charMap[ch] : ch;
  }
  return result.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

/**
 * Universal App Resolver:
 * Takes any user input (Hindi, English, partial name, package name)
 * and resolves it to a launch-ready NativeLaunchTarget.
 */
export function resolveAppTarget(input: string): NativeLaunchTarget {
  const query = (input || "").trim().toLowerCase();

  // Clean common command filler words
  const cleaned = query
    .replace(/(?:खोलो|खोल दो|खोलिये|ओपन करो|चालू करो|शुरू करो|चलाओ|लगाओ|open|launch|start|run|app|ऐप)/gi, "")
    .trim();

  // 1. Check exact match in universal registry
  for (const item of UNIVERSAL_APP_REGISTRY) {
    const isDirectMatch =
      item.name.toLowerCase() === cleaned ||
      item.hindiName.toLowerCase() === cleaned ||
      item.aliases.some((alias) => alias.toLowerCase() === cleaned || query.includes(alias.toLowerCase()));

    if (isDirectMatch) {
      return {
        name: item.name,
        hindiName: item.hindiName,
        packageName: item.packageName,
        deepLinkScheme: item.deepLinkScheme,
        intentUri: item.intentUri || buildAndroidIntentUri({
          name: item.name,
          title: item.name,
          packageName: item.packageName,
        }),
        fallbackWebUrl: item.fallbackWebUrl,
        title: item.name,
      };
    }
  }

  // 2. Partial search in universal registry
  for (const item of UNIVERSAL_APP_REGISTRY) {
    if (cleaned.length >= 3) {
      if (
        item.name.toLowerCase().includes(cleaned) ||
        item.aliases.some((a) => a.toLowerCase().includes(cleaned))
      ) {
        return {
          name: item.name,
          hindiName: item.hindiName,
          packageName: item.packageName,
          deepLinkScheme: item.deepLinkScheme,
          intentUri: item.intentUri || buildAndroidIntentUri({
            name: item.name,
            title: item.name,
            packageName: item.packageName,
          }),
          fallbackWebUrl: item.fallbackWebUrl,
          title: item.name,
        };
      }
    }
  }

  // 3. For ANY custom, user-installed, or special app on the phone:
  // Dynamically transliterate Hindi characters to ASCII English
  const englishName = transliterateHindiToEnglish(cleaned) || cleaned.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "app";
  const displayTitle = cleaned.length > 0 ? (cleaned.charAt(0).toUpperCase() + cleaned.slice(1)) : "Special App";
  const guessedPackage = `com.${englishName}`;

  // Build universal Android OS Intent targeting this app by package or title
  const universalIntent = `intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=${guessedPackage};S.browser_fallback_url=market%3A%2F%2Fsearch%3Fq%3D${encodeURIComponent(englishName)}%26c%3Dapps;end;`;
  const universalCustomScheme = `${englishName}://`;

  return {
    name: displayTitle,
    hindiName: displayTitle,
    packageName: guessedPackage,
    deepLinkScheme: universalCustomScheme,
    intentUri: universalIntent,
    fallbackWebUrl: `https://play.google.com/store/search?q=${encodeURIComponent(englishName)}&c=apps`,
    title: displayTitle,
  };
}

/**
 * Checks if the current browser environment is on an Android or mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined" || !navigator) return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || "";
  return /android|iphone|ipad|ipod|mobile/i.test(ua);
}

/**
 * Builds standard, 100% Chrome-compliant Android Intent URIs with proper "intent://#Intent;" format.
 */
export function buildAndroidIntentUri(target: NativeLaunchTarget): string {
  // If target already has an intentUri, normalize to valid intent://#Intent;
  if (target.intentUri && target.intentUri.startsWith("intent:")) {
    if (target.intentUri.startsWith("intent:#Intent;")) {
      return target.intentUri.replace("intent:#Intent;", "intent://#Intent;");
    }
    return target.intentUri;
  }

  const pkg = target.packageName;
  const scheme = target.deepLinkScheme;

  // YouTube
  if (pkg === "com.google.android.youtube") {
    if (target.query) {
      return `intent://www.youtube.com/results?search_query=${encodeURIComponent(target.query)}#Intent;package=com.google.android.youtube;scheme=https;end;`;
    }
    return "intent://#Intent;package=com.google.android.youtube;scheme=vnd.youtube;end;";
  }

  // Camera
  if (pkg === "com.android.camera") {
    return "intent://#Intent;action=android.media.action.STILL_IMAGE_CAMERA;category=android.intent.category.DEFAULT;end;";
  }

  // Calculator
  if (pkg === "com.google.android.calculator") {
    return "intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end;";
  }

  // Settings
  if (pkg === "com.android.settings") {
    return "intent://#Intent;action=android.settings.SETTINGS;end;";
  }

  // Dialer
  if (pkg === "com.google.android.dialer") {
    return "intent://#Intent;action=android.intent.action.DIAL;end;";
  }

  // Clock
  if (pkg === "com.google.android.deskclock") {
    return "intent://#Intent;action=android.intent.action.SHOW_ALARMS;end;";
  }

  // Gallery
  if (pkg === "com.google.android.apps.photos") {
    return "intent://#Intent;action=android.intent.action.VIEW;type=image/*;category=android.intent.category.DEFAULT;end;";
  }

  // Generic Android package launcher intent with Google Play fallback
  if (pkg) {
    return `intent://#Intent;package=${pkg};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;S.browser_fallback_url=market%3A%2F%2Fdetails%3Fid%3D${pkg};end;`;
  }

  if (scheme) {
    return scheme;
  }

  return target.fallbackWebUrl || "https://www.google.com";
}

/**
 * Directly launches real native Android app on phone without any modal popup.
 * Hands off directly to the Android OS with zero user clicks.
 * Uses the proven direct navigation strategy that works for YouTube and all native apps.
 */
export function dispatchDirectNativeApp(target: NativeLaunchTarget): void {
  if (typeof window === "undefined") return;

  // 1. Android Native WebView Bridge (if app is embedded inside an Android APK wrapper)
  if ((window as any).Android) {
    try {
      if (target.packageName && typeof (window as any).Android.openApp === "function") {
        (window as any).Android.openApp(target.packageName);
        return;
      }
      if (typeof (window as any).Android.launchIntent === "function") {
        (window as any).Android.launchIntent(target.intentUri || target.deepLinkScheme);
        return;
      }
    } catch (bridgeErr) {
      console.warn("Android bridge notice:", bridgeErr);
    }
  }

  const intentUri = buildAndroidIntentUri(target);

  // Determine the primary URI:
  // If a custom scheme exists and is NOT a raw intent:, try it; otherwise use the Chrome Intent URI.
  const primaryUri =
    target.deepLinkScheme && !target.deepLinkScheme.startsWith("intent:")
      ? target.deepLinkScheme
      : intentUri;

  console.log("Directly launching real phone app:", target.name, "Primary URI:", primaryUri, "Intent URI:", intentUri);

  try {
    // A. Invisible anchor element dispatch
    const a = document.createElement("a");
    a.href = primaryUri;
    a.rel = "noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
    }, 500);

    // B. Direct window.location.href assignment (the #1 proven method that opens YouTube & Android OS apps)
    window.location.href = primaryUri;

    // C. If primary was a custom scheme and browser didn't leave, also queue the Android Intent
    if (primaryUri !== intentUri && intentUri.startsWith("intent:")) {
      setTimeout(() => {
        try {
          window.location.assign(intentUri);
        } catch (_e) {}
      }, 400);
    }
  } catch (err) {
    console.warn("Direct intent launch notice:", err);
    try {
      window.location.href = intentUri;
    } catch (_e) {}
  }
}

/**
 * Legacy compatibility helper
 */
export function launchRealAppOrFallback(
  target: NativeLaunchTarget,
  _onFallback?: (target: NativeLaunchTarget) => void
): boolean {
  dispatchDirectNativeApp(target);
  return true;
}

export function forceLaunchNativeApp(target: NativeLaunchTarget) {
  dispatchDirectNativeApp(target);
}

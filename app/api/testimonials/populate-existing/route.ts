// app/api/testimonials/populate-existing/route.ts
// API endpoint to populate existing testimonials with translations

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Translation mappings for existing testimonials - using testimonial IDs for better matching
const translations = {
  'hi': {
    // User names
    'Raina': 'रैना',
    'Sanjay': 'संजय',
    'Karim': 'करीम',
    
    // User roles
    'Student': 'छात्र',
    'Engineer': 'इंजीनियर',
    'Marketing Manager': 'मार्केटिंग मैनेजर',
    'Business Owner': 'व्यापारी',
    
    // User locations
    'Delhi': 'दिल्ली',
    'Gurugram': 'गुरुग्राम',
    
    // Categories
    'Educational Consulting': 'शैक्षिक परामर्श',
    'Life Path & Choices': 'जीवन पथ और विकल्प',
    'Business Consulting': 'व्यापारिक परामर्श',
    
    // Titles
    'A Shot of Clarity!': 'स्पष्टता का एक शॉट!',
    'Clarity Jo Chahiye Thi': 'स्पष्टता जो चाहिए थी',
    
    // Content - Raina (Student)
    'raina_student_content': 'मैं 15 साल की हूं, और ईमानदारी से कहूं तो पढ़ाई मेरे लिए वाकई भ्रमित करने वाली थी। बहुत सारे विषय, बहुत सारे लोग मुझे बता रहे थे कि क्या करना है। मुझे हमेशा यह संदेह रहता था कि क्या मैं सही तरीके से पढ़ रही हूं।\n\nजब मैंने DrishiQ का उपयोग किया, तो इसने मुझे बिल्कुल स्पष्ट रूप से दिखाया कि मैं क्या गलत कर रही थी और मुझे एक स्पष्ट समाधान दिया। ऐसा लगा जैसे किसी ने आखिरकार मुझे समझा हो।\n\nअब मुझे हमेशा खोया हुआ नहीं लगता - मुझे पता है कि किस पर ध्यान देना है, और इससे मुझे बहुत अधिक आत्मविश्वास महसूस होता है।',
    
    // Content - Sanjay (Engineer)
    'sanjay_engineer_content': 'मैंने कुछ साल पहले ही टूर्नामेंट खेलना शुरू किया था, जुनून के लिए ज्यादा कुछ और नहीं। 51 साल की उम्र में, मुझे उम्मीद नहीं थी कि कोई डिजिटल टूल मेरे खेल में फर्क ला सकता है। लेकिन मेरे आश्चर्य के लिए, DrishiQ ने बिल्कुल वही किया।\n\nइसने मेरे बैकहैंड शॉट के बारे में मेरी चुपचाप चली आ रही शंका की पुष्टि की - कुछ ऐसा जिसे मैं कभी अपने दम पर समझ नहीं पाया था। और फिर यह एक कदम आगे बढ़ा: इसने मुझे समाधान दिखाया। सरल, स्पष्ट, और अपनी सटीकता में लगभग अभिभूत करने वाला।\n\nमेरी उम्र के किसी व्यक्ति के लिए, मुझे सफलता की उम्मीद नहीं थी। लेकिन DrishiQ ने मुझे याद दिलाया - स्पष्टता जीवन के किसी भी चरण में आ सकती है, और यह खेल बदल सकती है।',
    
    // Content - Karim (Business Owner)
    'karim_business_content': '40 की उम्र में व्यापार चलाना सरल नहीं होता। मेरे पास बहुत संदेह थे, पर DrishiQ ने उन्हें स्पष्ट किया और सीधे समाधान दिए। अब निर्णय लेना आसान लगता है।'
  },
  'ar': {
    // User names
    'Raina': 'رينا',
    'Sanjay': 'سانجاي',
    
    // User roles
    'Student': 'طالب',
    'Engineer': 'مهندس',
    'Marketing Manager': 'مدير التسويق',
    
    // User locations
    'Delhi': 'دلهي',
    'Gurugram': 'جوروجرام',
    
    // Categories
    'Educational Consulting': 'الاستشارات التعليمية',
    'Life Path & Choices': 'مسار الحياة والخيارات',
    
    // Titles
    'A Shot of Clarity!': 'لقطة من الوضوح!',
    
    // Content
    'I\'m 15, and honestly, studies were really confusing for me. Too many subjects, too many people telling me what to do. I always had this doubt if I was studying the right way.\n\nWhen I used DrishiQ, it showed me exactly what I was missing and gave me a clear fix. It felt like someone finally understood me.\n\nNow I don\'t feel lost all the time — I know what to focus on, and that makes me feel a lot more confident.': 'أنا في الخامسة عشرة من عمري، وبصراحة، كانت الدراسة مربكة جداً بالنسبة لي. مواد كثيرة جداً، أشخاص كثيرون يخبرونني ماذا أفعل. كان لدي دائماً هذا الشك في ما إذا كنت أدرس بالطريقة الصحيحة.\n\nعندما استخدمت DrishiQ، أظهر لي بالضبط ما كنت أفتقده وأعطاني حلاً واضحاً. شعرت وكأن شخصاً ما فهمني أخيراً.\n\nالآن لا أشعر بالضياع طوال الوقت - أعرف على ماذا أركز، وهذا يجعلني أشعر بثقة أكبر بكثير.',
    'I began playing tournaments only a few years ago, more for passion than anything else. At 51, I wasn\'t expecting a digital tool to make a difference in my game. But to my surprise, DrishiQ did exactly that.\n\nIt confirmed a doubt I had been quietly carrying about my backhand shot — something I could never quite figure out on my own. And then it went a step further: it showed me the solution. Simple, clear, and almost overwhelming in its accuracy.\n\nFor someone my age, I didn\'t expect breakthroughs. But DrishiQ reminded me — clarity can come at any stage of life, and it can change the game': 'بدأت في لعب البطولات قبل بضع سنوات فقط، بدافع الشغف أكثر من أي شيء آخر. في سن 51، لم أكن أتوقع أن تؤثر أداة رقمية على لعبتي. لكن لدهشتي، فعل DrishiQ ذلك بالضبط.\n\nأكد شكاً كنت أحمله بصمت حول ضربة الباكهاند - شيء لم أستطع أبداً أن أفهمه بمفردي. ثم ذهب خطوة أبعد: أظهر لي الحل. بسيط، واضح، ومذهل تقريباً في دقته.\n\nلشخص في عمري، لم أكن أتوقع اختراقات. لكن DrishiQ ذكرني - الوضوح يمكن أن يأتي في أي مرحلة من مراحل الحياة، ويمكن أن يغير اللعبة.'
  },
  'zh': {
    // User names
    'Raina': '雷娜',
    'Sanjay': '桑杰',
    'Karim': '卡里姆',
    
    // User roles
    'Student': '学生',
    'Engineer': '工程师',
    'Marketing Manager': '营销经理',
    'Business Owner': '企业主',
    
    // User locations
    'Delhi': '德里',
    'Gurugram': '古尔冈',
    
    // Categories
    'Educational Consulting': '教育咨询',
    'Life Path & Choices': '人生道路与选择',
    'Business Consulting': '商业咨询',
    
    // Titles
    'A Shot of Clarity!': '清晰的一击！',
    'Clarity Jo Chahiye Thi': '需要的清晰度',
    
    // Content - Raina
    'raina_student_content': '我15岁，说实话，学习对我来说真的很困惑。太多科目，太多人告诉我该做什么。我总是怀疑我是否在学习正确的方法。\n\n当我使用DrishiQ时，它准确地向我展示了我缺少什么，并给了我一个清晰的解决方案。感觉终于有人理解我了。\n\n现在我不再总是感到迷茫——我知道该专注于什么，这让我感到更加自信。',
    
    // Content - Sanjay
    'sanjay_engineer_content': '我几年前才开始参加比赛，更多是出于热情而不是其他原因。在51岁时，我没有期望数字工具能改变我的游戏。但令我惊讶的是，DrishiQ做到了这一点。\n\n它确认了我一直默默携带的关于反手击球的疑虑——这是我永远无法独自弄清楚的事情。然后它更进一步：向我展示了解决方案。简单、清晰，其准确性几乎令人震撼。\n\n对于我这个年龄的人来说，我没有期望突破。但DrishiQ提醒我——清晰可以在人生的任何阶段到来，它可以改变游戏。',
    
    // Content - Karim
    'karim_business_content': '40岁经营企业并不简单。我有很多疑虑，但DrishiQ澄清了这些疑虑并提供了直接的解决方案。现在做决定变得容易了。'
  },
  'bn': {
    // User names
    'Raina': 'রাইনা',
    'Sanjay': 'সঞ্জয়',
    'Karim': 'করিম',
    
    // User roles
    'Student': 'ছাত্র',
    'Engineer': 'ইঞ্জিনিয়ার',
    'Marketing Manager': 'মার্কেটিং ম্যানেজার',
    'Business Owner': 'ব্যবসার মালিক',
    
    // User locations
    'Delhi': 'দিল্লি',
    'Gurugram': 'গুড়গাঁও',
    
    // Categories
    'Educational Consulting': 'শিক্ষামূলক পরামর্শ',
    'Life Path & Choices': 'জীবনের পথ ও পছন্দ',
    'Business Consulting': 'ব্যবসায়িক পরামর্শ',
    
    // Titles
    'A Shot of Clarity!': 'স্পষ্টতার একটি শট!',
    'Clarity Jo Chahiye Thi': 'প্রয়োজনীয় স্পষ্টতা',
    
    // Content - Raina
    'raina_student_content': 'আমি ১৫ বছর বয়সী, এবং সত্যি বলতে, পড়াশোনা আমার জন্য সত্যিই বিভ্রান্তিকর ছিল। অনেক বিষয়, অনেক লোক আমাকে কী করতে হবে তা বলছিল। আমার সবসময় এই সন্দেহ ছিল যে আমি সঠিকভাবে পড়ছি কিনা।\n\nযখন আমি DrishiQ ব্যবহার করি, এটি আমাকে ঠিক দেখিয়ে দিল যে আমি কী হারাচ্ছি এবং আমাকে একটি স্পষ্ট সমাধান দিল। মনে হল কেউ অবশেষে আমাকে বুঝেছে।\n\nএখন আমি সবসময় হারিয়ে যাই না - আমি জানি কীতে ফোকাস করতে হবে, এবং এটি আমাকে অনেক বেশি আত্মবিশ্বাসী করে তোলে।',
    
    // Content - Sanjay
    'sanjay_engineer_content': 'আমি কয়েক বছর আগে টুর্নামেন্ট খেলা শুরু করেছিলাম, আবেগের জন্য বেশি কিছু নয়। ৫১ বছর বয়সে, আমি আশা করিনি যে একটি ডিজিটাল টুল আমার খেলায় পার্থক্য আনবে। কিন্তু আমার বিস্ময়ের জন্য, DrishiQ ঠিক তাই করেছিল।\n\nএটি আমার ব্যাকহ্যান্ড শট সম্পর্কে একটি সন্দেহ নিশ্চিত করেছিল - এমন কিছু যা আমি কখনই নিজে বুঝতে পারিনি। এবং তারপর এটি আরও এক ধাপ এগিয়ে গেল: এটি আমাকে সমাধান দেখাল। সহজ, স্পষ্ট, এবং এর নির্ভুলতায় প্রায় অভিভূতকর।\n\nআমার বয়সের কারও জন্য, আমি সাফল্যের আশা করিনি। কিন্তু DrishiQ আমাকে মনে করিয়ে দিল - স্পষ্টতা জীবনের যে কোনও পর্যায়ে আসতে পারে, এবং এটি খেলাটি পরিবর্তন করতে পারে।',
    
    // Content - Karim
    'karim_business_content': '৪০ বছর বয়সে ব্যবসা চালানো সহজ নয়। আমার অনেক সন্দেহ ছিল, কিন্তু DrishiQ সেগুলি স্পষ্ট করেছিল এবং সরাসরি সমাধান দিয়েছিল। এখন সিদ্ধান্ত নেওয়া সহজ লাগে।'
  },
  'de': {
    // User names
    'Raina': 'Raina',
    'Sanjay': 'Sanjay',
    'Karim': 'Karim',
    
    // User roles
    'Student': 'Studentin',
    'Engineer': 'Ingenieur',
    'Marketing Manager': 'Marketing Manager',
    'Business Owner': 'Geschäftsinhaber',
    
    // User locations
    'Delhi': 'Delhi',
    'Gurugram': 'Gurugram',
    
    // Categories
    'Educational Consulting': 'Bildungsberatung',
    'Life Path & Choices': 'Lebensweg & Entscheidungen',
    'Business Consulting': 'Unternehmensberatung',
    
    // Titles
    'A Shot of Clarity!': 'Ein Schuss Klarheit!',
    'Clarity Jo Chahiye Thi': 'Die benötigte Klarheit',
    
    // Content - Raina
    'raina_student_content': 'Ich bin 15 und ehrlich gesagt war das Lernen für mich wirklich verwirrend. Zu viele Fächer, zu viele Leute, die mir sagten, was ich tun soll. Ich hatte immer diesen Zweifel, ob ich richtig lerne.\n\nAls ich DrishiQ verwendete, zeigte es mir genau, was mir fehlte und gab mir eine klare Lösung. Es fühlte sich an, als hätte mich endlich jemand verstanden.\n\nJetzt fühle ich mich nicht mehr die ganze Zeit verloren - ich weiß, worauf ich mich konzentrieren muss, und das macht mich viel selbstbewusster.',
    
    // Content - Sanjay
    'sanjay_engineer_content': 'Ich habe erst vor ein paar Jahren angefangen, Turniere zu spielen, mehr aus Leidenschaft als aus allem anderen. Mit 51 erwartete ich nicht, dass ein digitales Tool einen Unterschied in meinem Spiel machen würde. Aber zu meiner Überraschung tat DrishiQ genau das.\n\nEs bestätigte einen Zweifel, den ich still über meinen Rückhandschlag getragen hatte - etwas, das ich nie ganz allein herausfinden konnte. Und dann ging es noch einen Schritt weiter: Es zeigte mir die Lösung. Einfach, klar und fast überwältigend in seiner Genauigkeit.\n\nFür jemanden in meinem Alter erwartete ich keine Durchbrüche. Aber DrishiQ erinnerte mich daran - Klarheit kann in jedem Lebensabschnitt kommen und das Spiel verändern.',
    
    // Content - Karim
    'karim_business_content': 'Mit 40 Jahren ist es nicht einfach, ein Geschäft zu führen. Ich hatte viele Zweifel, aber DrishiQ hat sie geklärt und direkte Lösungen gegeben. Jetzt fällt es mir leichter, Entscheidungen zu treffen.'
  },
  'es': {
    // User names
    'Raina': 'Raina',
    'Sanjay': 'Sanjay',
    'Karim': 'Karim',
    
    // User roles
    'Student': 'Estudiante',
    'Engineer': 'Ingeniero',
    'Marketing Manager': 'Gerente de Marketing',
    'Business Owner': 'Propietario de Negocio',
    
    // User locations
    'Delhi': 'Delhi',
    'Gurugram': 'Gurugram',
    
    // Categories
    'Educational Consulting': 'Consultoría Educativa',
    'Life Path & Choices': 'Camino de Vida y Decisiones',
    'Business Consulting': 'Consultoría Empresarial',
    
    // Titles
    'A Shot of Clarity!': '¡Un Disparo de Claridad!',
    'Clarity Jo Chahiye Thi': 'La Claridad Necesaria',
    
    // Content - Raina
    'raina_student_content': 'Tengo 15 años y, honestamente, los estudios eran realmente confusos para mí. Demasiadas materias, demasiadas personas diciéndome qué hacer. Siempre tuve esta duda de si estaba estudiando de la manera correcta.\n\nCuando usé DrishiQ, me mostró exactamente lo que me faltaba y me dio una solución clara. Se sintió como si alguien finalmente me entendiera.\n\nAhora no me siento perdida todo el tiempo - sé en qué enfocarme, y eso me hace sentir mucho más confiada.',
    
    // Content - Sanjay
    'sanjay_engineer_content': 'Comencé a jugar torneos solo hace unos años, más por pasión que por cualquier otra cosa. A los 51, no esperaba que una herramienta digital hiciera una diferencia en mi juego. Pero para mi sorpresa, DrishiQ hizo exactamente eso.\n\nConfirmó una duda que había estado llevando silenciosamente sobre mi golpe de revés - algo que nunca pude resolver por mi cuenta. Y luego fue un paso más allá: me mostró la solución. Simple, claro y casi abrumador en su precisión.\n\nPara alguien de mi edad, no esperaba avances. Pero DrishiQ me recordó - la claridad puede venir en cualquier etapa de la vida, y puede cambiar el juego.',
    
    // Content - Karim
    'karim_business_content': 'A los 40 años, dirigir un negocio no es simple. Tenía muchas dudas, pero DrishiQ las aclaró y dio soluciones directas. Ahora tomar decisiones es más fácil.'
  },
  'fr': {
    // User names
    'Raina': 'Raina',
    'Sanjay': 'Sanjay',
    'Karim': 'Karim',
    
    // User roles
    'Student': 'Étudiante',
    'Engineer': 'Ingénieur',
    'Marketing Manager': 'Responsable Marketing',
    'Business Owner': 'Propriétaire d\'Entreprise',
    
    // User locations
    'Delhi': 'Delhi',
    'Gurugram': 'Gurugram',
    
    // Categories
    'Educational Consulting': 'Conseil Éducatif',
    'Life Path & Choices': 'Chemin de Vie et Choix',
    'Business Consulting': 'Conseil d\'Entreprise',
    
    // Titles
    'A Shot of Clarity!': 'Un Coup de Clarté !',
    'Clarity Jo Chahiye Thi': 'La Clarté Nécessaire',
    
    // Content - Raina
    'raina_student_content': 'J\'ai 15 ans et, honnêtement, les études étaient vraiment confuses pour moi. Trop de matières, trop de gens me disant quoi faire. J\'avais toujours ce doute de savoir si j\'étudiais de la bonne façon.\n\nQuand j\'ai utilisé DrishiQ, cela m\'a montré exactement ce qui me manquait et m\'a donné une solution claire. J\'ai eu l\'impression que quelqu\'un me comprenait enfin.\n\nMaintenant je ne me sens plus perdue tout le temps - je sais sur quoi me concentrer, et cela me rend beaucoup plus confiante.',
    
    // Content - Sanjay
    'sanjay_engineer_content': 'J\'ai commencé à jouer des tournois il y a seulement quelques années, plus par passion que pour autre chose. À 51 ans, je ne m\'attendais pas à ce qu\'un outil numérique fasse une différence dans mon jeu. Mais à ma grande surprise, DrishiQ a fait exactement cela.\n\nCela a confirmé un doute que je portais silencieusement sur mon coup de revers - quelque chose que je n\'ai jamais pu comprendre par moi-même. Et puis c\'est allé plus loin : cela m\'a montré la solution. Simple, clair, et presque écrasant dans sa précision.\n\nPour quelqu\'un de mon âge, je ne m\'attendais pas à des percées. Mais DrishiQ m\'a rappelé - la clarté peut venir à n\'importe quel stade de la vie, et peut changer le jeu.',
    
    // Content - Karim
    'karim_business_content': 'À 40 ans, diriger une entreprise n\'est pas simple. J\'avais beaucoup de doutes, mais DrishiQ les a clarifiés et a donné des solutions directes. Maintenant, prendre des décisions est plus facile.'
  },
  'ja': {
    // User names
    'Raina': 'ライナ',
    'Sanjay': 'サンジェイ',
    'Karim': 'カリム',
    
    // User roles
    'Student': '学生',
    'Engineer': 'エンジニア',
    'Marketing Manager': 'マーケティングマネージャー',
    'Business Owner': 'ビジネスオーナー',
    
    // User locations
    'Delhi': 'デリー',
    'Gurugram': 'グルグラム',
    
    // Categories
    'Educational Consulting': '教育コンサルティング',
    'Life Path & Choices': '人生の道と選択',
    'Business Consulting': 'ビジネスコンサルティング',
    
    // Titles
    'A Shot of Clarity!': '明確さの一撃！',
    'Clarity Jo Chahiye Thi': '必要な明確さ',
    
    // Content - Raina
    'raina_student_content': '私は15歳で、正直に言うと、勉強は私にとって本当に混乱していました。科目が多すぎて、何をすべきか教えてくれる人が多すぎました。私は正しい方法で勉強しているかどうか、いつも疑問に思っていました。\n\nDrishiQを使ったとき、それは私が何を欠けているかを正確に示し、明確な解決策を与えてくれました。ついに誰かが私を理解してくれたような気がしました。\n\n今は常に迷子になることはありません - 何に集中すべきかがわかりますし、それが私をずっと自信を持たせてくれます。',
    
    // Content - Sanjay
    'sanjay_engineer_content': '私は数年前にトーナメントを始めたばかりで、他の何よりも情熱からでした。51歳で、デジタルツールが私のゲームに違いをもたらすとは期待していませんでした。しかし、私の驚きに、DrishiQはまさにそれをしました。\n\nそれは私が静かに抱いていたバックハンドショットについての疑念を確認しました - 私が一人で理解できなかった何かです。そして、それはさらに一歩進んで：解決策を示してくれました。シンプルで、明確で、その正確さにおいてほぼ圧倒的でした。\n\n私の年齢の人にとって、私はブレークスルーを期待していませんでした。しかし、DrishiQは私に思い出させてくれました - 明確さは人生のどの段階でも来ることができ、ゲームを変えることができます。',
    
    // Content - Karim
    'karim_business_content': '40歳でビジネスを運営するのは簡単ではありません。多くの疑念がありましたが、DrishiQはそれらを明確にし、直接的な解決策を提供しました。今は意思決定が簡単になりました。'
  },
  'pt': {
    // User names
    'Raina': 'Raina',
    'Sanjay': 'Sanjay',
    'Karim': 'Karim',
    
    // User roles
    'Student': 'Estudante',
    'Engineer': 'Engenheiro',
    'Marketing Manager': 'Gerente de Marketing',
    'Business Owner': 'Proprietário de Negócio',
    
    // User locations
    'Delhi': 'Delhi',
    'Gurugram': 'Gurugram',
    
    // Categories
    'Educational Consulting': 'Consultoria Educacional',
    'Life Path & Choices': 'Caminho da Vida e Escolhas',
    'Business Consulting': 'Consultoria Empresarial',
    
    // Titles
    'A Shot of Clarity!': 'Um Tiro de Clareza!',
    'Clarity Jo Chahiye Thi': 'A Clareza Necessária',
    
    // Content - Raina
    'raina_student_content': 'Tenho 15 anos e, honestamente, os estudos eram realmente confusos para mim. Muitas matérias, muitas pessoas me dizendo o que fazer. Sempre tive essa dúvida se estava estudando da maneira certa.\n\nQuando usei DrishiQ, ele me mostrou exatamente o que estava faltando e me deu uma solução clara. Pareceu que alguém finalmente me entendeu.\n\nAgora não me sinto perdida o tempo todo - sei em que focar, e isso me faz sentir muito mais confiante.',
    
    // Content - Sanjay
    'sanjay_engineer_content': 'Comecei a jogar torneios apenas alguns anos atrás, mais por paixão do que qualquer outra coisa. Aos 51, não esperava que uma ferramenta digital fizesse diferença no meu jogo. Mas para minha surpresa, DrishiQ fez exatamente isso.\n\nConfirmou uma dúvida que eu carregava silenciosamente sobre meu golpe de backhand - algo que nunca consegui descobrir sozinho. E então foi um passo além: me mostrou a solução. Simples, claro e quase esmagador em sua precisão.\n\nPara alguém da minha idade, não esperava avanços. Mas DrishiQ me lembrou - a clareza pode vir em qualquer estágio da vida, e pode mudar o jogo.',
    
    // Content - Karim
    'karim_business_content': 'Aos 40 anos, administrar um negócio não é simples. Tinha muitas dúvidas, mas DrishiQ as esclareceu e deu soluções diretas. Agora tomar decisões é mais fácil.'
  },
  'ru': {
    // User names
    'Raina': 'Райна',
    'Sanjay': 'Санджай',
    'Karim': 'Карим',
    
    // User roles
    'Student': 'Студентка',
    'Engineer': 'Инженер',
    'Marketing Manager': 'Маркетинг-менеджер',
    'Business Owner': 'Владелец бизнеса',
    
    // User locations
    'Delhi': 'Дели',
    'Gurugram': 'Гуруграм',
    
    // Categories
    'Educational Consulting': 'Образовательное консультирование',
    'Life Path & Choices': 'Жизненный путь и выбор',
    'Business Consulting': 'Бизнес-консультирование',
    
    // Titles
    'A Shot of Clarity!': 'Выстрел ясности!',
    'Clarity Jo Chahiye Thi': 'Необходимая ясность',
    
    // Content - Raina
    'raina_student_content': 'Мне 15 лет, и честно говоря, учеба была для меня действительно запутанной. Слишком много предметов, слишком много людей говорят мне, что делать. У меня всегда были сомнения, правильно ли я учусь.\n\nКогда я использовала DrishiQ, он показал мне именно то, чего мне не хватало, и дал четкое решение. Казалось, что кто-то наконец понял меня.\n\nТеперь я не чувствую себя потерянной все время - я знаю, на чем сосредоточиться, и это заставляет меня чувствовать себя намного увереннее.',
    
    // Content - Sanjay
    'sanjay_engineer_content': 'Я начал играть в турниры всего несколько лет назад, больше из страсти, чем из чего-либо еще. В 51 год я не ожидал, что цифровой инструмент изменит мою игру. Но к моему удивлению, DrishiQ сделал именно это.\n\nОн подтвердил сомнение, которое я тихо носил в себе относительно своего удара слева - то, что я никогда не мог понять самостоятельно. А затем пошел дальше: показал мне решение. Простое, ясное и почти подавляющее в своей точности.\n\nДля человека моего возраста я не ожидал прорывов. Но DrishiQ напомнил мне - ясность может прийти на любом этапе жизни и изменить игру.',
    
    // Content - Karim
    'karim_business_content': 'В 40 лет вести бизнес непросто. У меня было много сомнений, но DrishiQ их прояснил и дал прямые решения. Теперь принимать решения стало легче.'
  },
  'ta': {
    // User names
    'Raina': 'ரைனா',
    'Sanjay': 'சஞ்சய்',
    'Karim': 'கரீம்',
    
    // User roles
    'Student': 'மாணவர்',
    'Engineer': 'பொறியாளர்',
    'Marketing Manager': 'மார்க்கெட்டிங் மேனேஜர்',
    'Business Owner': 'வணிக உரிமையாளர்',
    
    // User locations
    'Delhi': 'டெல்லி',
    'Gurugram': 'குருக்ராம்',
    
    // Categories
    'Educational Consulting': 'கல்வி ஆலோசனை',
    'Life Path & Choices': 'வாழ்க்கை பாதை மற்றும் தேர்வுகள்',
    'Business Consulting': 'வணிக ஆலோசனை',
    
    // Titles
    'A Shot of Clarity!': 'தெளிவின் ஒரு ஷாட்!',
    'Clarity Jo Chahiye Thi': 'தேவையான தெளிவு',
    
    // Content - Raina
    'raina_student_content': 'நான் 15 வயதில் இருக்கிறேன், நேர்மையாகச் சொன்னால், படிப்பு எனக்கு மிகவும் குழப்பமாக இருந்தது. பல பாடங்கள், என்ன செய்ய வேண்டும் என்று சொல்லும் பலர். நான் சரியான வழியில் படிக்கிறேனா என்று எப்போதும் சந்தேகம் இருந்தது.\n\nநான் DrishiQ ஐப் பயன்படுத்தியபோது, எனக்கு என்ன குறைவு என்பதை சரியாகக் காட்டியது மற்றும் தெளிவான தீர்வைக் கொடுத்தது. யாரோ இறுதியில் என்னைப் புரிந்து கொண்டது போல் உணர்ந்தேன்.\n\nஇப்போது நான் எப்போதும் தொலைந்து போய்விடுவதில்லை - எதில் கவனம் செலுத்த வேண்டும் என்பது எனக்குத் தெரியும், இது என்னை மிகவும் நம்பிக்கையுடன் உணர வைக்கிறது.',
    
    // Content - Sanjay
    'sanjay_engineer_content': 'நான் சில ஆண்டுகளுக்கு முன்பே போட்டிகளில் விளையாடத் தொடங்கினேன், வேறு எதையும் விட ஆர்வத்தால். 51 வயதில், ஒரு டிஜிட்டல் கருவி எனது விளையாட்டில் மாற்றத்தை ஏற்படுத்தும் என்று எதிர்பார்க்கவில்லை. ஆனால் எனது ஆச்சரியத்திற்கு, DrishiQ அதைச் செய்தது.\n\nஎனது பேக்ஹேண்ட் ஷாட்டைப் பற்றி நான் மெளனமாக வைத்திருந்த சந்தேகத்தை உறுதிப்படுத்தியது - நான் ஒருபோதும் தனியாகக் கண்டுபிடிக்க முடியாத ஒன்று. பின்னர் அது ஒரு படி மேலே சென்றது: எனக்கு தீர்வைக் காட்டியது. எளிமையான, தெளிவான, மற்றும் அதன் துல்லியத்தில் கிட்டத்தட்ட அதிர்ச்சியூட்டும்.\n\nஎனது வயதில் ஒருவருக்கு, நான் முன்னேற்றங்களை எதிர்பார்க்கவில்லை. ஆனால் DrishiQ எனக்கு நினைவூட்டியது - தெளிவு வாழ்க்கையின் எந்த கட்டத்திலும் வரலாம், மற்றும் விளையாட்டை மாற்றலாம்.',
    
    // Content - Karim
    'karim_business_content': '40 வயதில் வணிகத்தை நடத்துவது எளிதல்ல. எனக்கு நிறைய சந்தேகங்கள் இருந்தன, ஆனால் DrishiQ அவற்றை தெளிவுபடுத்தியது மற்றும் நேரடி தீர்வுகளைக் கொடுத்தது. இப்போது முடிவுகளை எடுப்பது எளிதாக உள்ளது.'
  }
};

export async function POST(request: Request) {
  try {
    console.log('Starting translation population...');
    
    // Get all published testimonials only
    const { data: testimonials, error: fetchError } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_published', true);

    if (fetchError) {
      console.error('Error fetching testimonials:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
    }

    console.log(`Found ${testimonials.length} testimonials to translate`);

    const results = [];
    
    // Update each testimonial with translations
    for (const testimonial of testimonials) {
      console.log(`Processing testimonial: ${testimonial.user_name}`);
      
      const updateData = {};
      
      // Add translations for each language
      Object.keys(translations).forEach(language => {
        const langTranslations = translations[language as keyof typeof translations];
        
        // Translate user name (keep original if no translation)
        (updateData as any)[`user_name_${language}`] = langTranslations[testimonial.user_name as keyof typeof langTranslations] || testimonial.user_name;
        
        // Translate user role
        (updateData as any)[`user_role_${language}`] = langTranslations[testimonial.user_role as keyof typeof langTranslations] || testimonial.user_role;
        
        // Translate user location
        (updateData as any)[`user_location_${language}`] = langTranslations[testimonial.user_location as keyof typeof langTranslations] || testimonial.user_location;
        
        // Translate content based on user name and role
        let contentKey = '';
        if (testimonial.user_name === 'Raina' && testimonial.user_role === 'Student') {
          contentKey = 'raina_student_content';
        } else if (testimonial.user_name === 'Sanjay' && testimonial.user_role === 'Engineer') {
          contentKey = 'sanjay_engineer_content';
        } else if (testimonial.user_name === 'Karim' && testimonial.user_role === 'Business Owner') {
          contentKey = 'karim_business_content';
        }
        
        (updateData as any)[`content_${language}`] = contentKey ? langTranslations[contentKey as keyof typeof langTranslations] || testimonial.content : testimonial.content;
        
        // Translate title
        (updateData as any)[`title_${language}`] = langTranslations[testimonial.title as keyof typeof langTranslations] || testimonial.title;
        
        // Translate category
        (updateData as any)[`category_${language}`] = langTranslations[testimonial.category as keyof typeof langTranslations] || testimonial.category;
      });

      // Update the testimonial
      const { error: updateError } = await supabase
        .from('testimonials')
        .update(updateData)
        .eq('id', testimonial.id);

      if (updateError) {
        console.error(`Error updating testimonial ${testimonial.id}:`, updateError);
        results.push({ id: testimonial.id, success: false, error: updateError.message });
      } else {
        console.log(`✅ Updated testimonial ${testimonial.id} with translations`);
        results.push({ id: testimonial.id, success: true });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({ 
      success: true, 
      message: `Translation population completed!`,
      summary: {
        total: testimonials.length,
        successful: successCount,
        failed: failureCount
      },
      results: results
    });

  } catch (error) {
    console.error('Error in translation population:', error);
    return NextResponse.json({ error: 'Translation population failed' }, { status: 500 });
  }
}

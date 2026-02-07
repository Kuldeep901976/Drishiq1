// Script to populate existing testimonials with translations
// Run this after adding the language columns to the database

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Translation mappings for the existing testimonials
const translations = {
  'hi': {
    'Raina': 'रैना',
    'Sanjay': 'संजय',
    'Student': 'छात्र',
    'Engineer': 'इंजीनियर',
    'Marketing Manager': 'मार्केटिंग मैनेजर',
    'I\'m 15, and honestly, studies were really confusing for me. Too many subjects, too many people telling me what to do. I always had this doubt if I was studying the right way.\n\nWhen I used DrishiQ, it showed me exactly what I was missing and gave me a clear fix. It felt like someone finally understood me.\n\nNow I don\'t feel lost all the time — I know what to focus on, and that makes me feel a lot more confident.': 'मैं 15 साल की हूं, और ईमानदारी से कहूं तो पढ़ाई मेरे लिए वाकई भ्रमित करने वाली थी। बहुत सारे विषय, बहुत सारे लोग मुझे बता रहे थे कि क्या करना है। मुझे हमेशा यह संदेह रहता था कि क्या मैं सही तरीके से पढ़ रही हूं।\n\nजब मैंने DrishiQ का उपयोग किया, तो इसने मुझे बिल्कुल स्पष्ट रूप से दिखाया कि मैं क्या गलत कर रही थी और मुझे एक स्पष्ट समाधान दिया। ऐसा लगा जैसे किसी ने आखिरकार मुझे समझा हो।\n\nअब मुझे हमेशा खोया हुआ नहीं लगता - मुझे पता है कि किस पर ध्यान देना है, और इससे मुझे बहुत अधिक आत्मविश्वास महसूस होता है।',
    'I began playing tournaments only a few years ago, more for passion than anything else. At 51, I wasn\'t expecting a digital tool to make a difference in my game. But to my surprise, DrishiQ did exactly that.\n\nIt confirmed a doubt I had been quietly carrying about my backhand shot — something I could never quite figure out on my own. And then it went a step further: it showed me the solution. Simple, clear, and almost overwhelming in its accuracy.\n\nFor someone my age, I didn\'t expect breakthroughs. But DrishiQ reminded me — clarity can come at any stage of life, and it can change the game': 'मैंने कुछ साल पहले ही टूर्नामेंट खेलना शुरू किया था, जुनून के लिए ज्यादा कुछ और नहीं। 51 साल की उम्र में, मुझे उम्मीद नहीं थी कि कोई डिजिटल टूल मेरे खेल में फर्क ला सकता है। लेकिन मेरे आश्चर्य के लिए, DrishiQ ने बिल्कुल वही किया।\n\nइसने मेरे बैकहैंड शॉट के बारे में मेरी चुपचाप चली आ रही शंका की पुष्टि की - कुछ ऐसा जिसे मैं कभी अपने दम पर समझ नहीं पाया था। और फिर यह एक कदम आगे बढ़ा: इसने मुझे समाधान दिखाया। सरल, स्पष्ट, और अपनी सटीकता में लगभग अभिभूत करने वाला।\n\nमेरी उम्र के किसी व्यक्ति के लिए, मुझे सफलता की उम्मीद नहीं थी। लेकिन DrishiQ ने मुझे याद दिलाया - स्पष्टता जीवन के किसी भी चरण में आ सकती है, और यह खेल बदल सकती है।'
  },
  'ar': {
    'Raina': 'رينا',
    'Sanjay': 'سانجاي',
    'Student': 'طالب',
    'Engineer': 'مهندس',
    'Marketing Manager': 'مدير التسويق',
    'I\'m 15, and honestly, studies were really confusing for me. Too many subjects, too many people telling me what to do. I always had this doubt if I was studying the right way.\n\nWhen I used DrishiQ, it showed me exactly what I was missing and gave me a clear fix. It felt like someone finally understood me.\n\nNow I don\'t feel lost all the time — I know what to focus on, and that makes me feel a lot more confident.': 'أنا في الخامسة عشرة من عمري، وبصراحة، كانت الدراسة مربكة جداً بالنسبة لي. مواد كثيرة جداً، أشخاص كثيرون يخبرونني ماذا أفعل. كان لدي دائماً هذا الشك في ما إذا كنت أدرس بالطريقة الصحيحة.\n\nعندما استخدمت DrishiQ، أظهر لي بالضبط ما كنت أفتقده وأعطاني حلاً واضحاً. شعرت وكأن شخصاً ما فهمني أخيراً.\n\nالآن لا أشعر بالضياع طوال الوقت - أعرف على ماذا أركز، وهذا يجعلني أشعر بثقة أكبر بكثير.',
    'I began playing tournaments only a few years ago, more for passion than anything else. At 51, I wasn\'t expecting a digital tool to make a difference in my game. But to my surprise, DrishiQ did exactly that.\n\nIt confirmed a doubt I had been quietly carrying about my backhand shot — something I could never quite figure out on my own. And then it went a step further: it showed me the solution. Simple, clear, and almost overwhelming in its accuracy.\n\nFor someone my age, I didn\'t expect breakthroughs. But DrishiQ reminded me — clarity can come at any stage of life, and it can change the game': 'بدأت في لعب البطولات قبل بضع سنوات فقط، بدافع الشغف أكثر من أي شيء آخر. في سن 51، لم أكن أتوقع أن تؤثر أداة رقمية على لعبتي. لكن لدهشتي، فعل DrishiQ ذلك بالضبط.\n\nأكد شكاً كنت أحمله بصمت حول ضربة الباكهاند - شيء لم أستطع أبداً أن أفهمه بمفردي. ثم ذهب خطوة أبعد: أظهر لي الحل. بسيط، واضح، ومذهل تقريباً في دقته.\n\nلشخص في عمري، لم أكن أتوقع اختراقات. لكن DrishiQ ذكرني - الوضوح يمكن أن يأتي في أي مرحلة من مراحل الحياة، ويمكن أن يغير اللعبة.'
  }
  // Add more languages as needed
};

async function populateTranslations() {
  try {
    console.log('Fetching existing testimonials...');
    
    // Get all existing testimonials
    const { data: testimonials, error: fetchError } = await supabase
      .from('testimonials')
      .select('*');

    if (fetchError) {
      console.error('Error fetching testimonials:', fetchError);
      return;
    }

    console.log(`Found ${testimonials.length} testimonials to translate`);

    // Update each testimonial with translations
    for (const testimonial of testimonials) {
      console.log(`Processing testimonial: ${testimonial.user_name}`);
      
      const updateData = {};
      
      // Add translations for each language
      Object.keys(translations).forEach(language => {
        const langTranslations = translations[language];
        
        // Translate user name (keep original if no translation)
        updateData[`user_name_${language}`] = langTranslations[testimonial.user_name] || testimonial.user_name;
        
        // Translate user role
        updateData[`user_role_${language}`] = langTranslations[testimonial.user_role] || testimonial.user_role;
        
        // Translate content
        updateData[`content_${language}`] = langTranslations[testimonial.content] || testimonial.content;
      });

      // Update the testimonial
      const { error: updateError } = await supabase
        .from('testimonials')
        .update(updateData)
        .eq('id', testimonial.id);

      if (updateError) {
        console.error(`Error updating testimonial ${testimonial.id}:`, updateError);
      } else {
        console.log(`✅ Updated testimonial ${testimonial.id} with translations`);
      }
    }

    console.log('✅ Translation population completed!');
    
  } catch (error) {
    console.error('Error in translation population:', error);
  }
}

// Run the script
populateTranslations();


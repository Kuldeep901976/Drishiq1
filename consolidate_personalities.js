const fs = require('fs');
const path = require('path');

// Define the personality groupings
const personalityGroups = {
  'meetyourself1': ['builder', 'connector', 'dependent'],
  'meetyourself2': ['escaper', 'giver', 'problem-carrier'],
  'meetyourself3': ['rebooter', 'seeker'],
  'meetyourself4': ['solo', 'giving-beyond']
};

// Define all languages
const languages = ['ar', 'bn', 'de', 'es', 'fr', 'hi', 'ja', 'pt', 'ru', 'ta', 'zh'];

// Function to consolidate personality files for a language
function consolidatePersonalities(lang) {
  const langDir = path.join('public', 'locales', lang);
  
  // Check if language directory exists
  if (!fs.existsSync(langDir)) {
    console.log(`Language directory ${langDir} does not exist, skipping...`);
    return;
  }

  // Process each personality group
  Object.entries(personalityGroups).forEach(([groupName, personalities]) => {
    const consolidatedContent = {};
    
    personalities.forEach(personality => {
      const filePath = path.join(langDir, `${personality}.json`);
      
      if (fs.existsSync(filePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          // Merge the personality content into consolidated file
          Object.assign(consolidatedContent, content);
          console.log(`Added ${personality} to ${groupName} for ${lang}`);
        } catch (error) {
          console.error(`Error reading ${filePath}:`, error.message);
        }
      } else {
        console.log(`File ${filePath} does not exist, skipping...`);
      }
    });

    // Write consolidated file
    if (Object.keys(consolidatedContent).length > 0) {
      const outputPath = path.join(langDir, `${groupName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(consolidatedContent, null, 2));
      console.log(`Created ${outputPath}`);
    }
  });
}

// Process all languages
languages.forEach(lang => {
  console.log(`\nProcessing language: ${lang}`);
  consolidatePersonalities(lang);
});

console.log('\nConsolidation complete!');







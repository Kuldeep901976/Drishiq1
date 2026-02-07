# Challenges CSV Import Folder

**Note:** CSV files are actually located in `public/challenges/` folder.

## How to Use

1. **Place your CSV files in `public/challenges/` folder**
   - Name them with language indicators (e.g., `challenges-en.csv`, `challenges-hindi.csv`, `challenges-arabic.csv`)
   - Or use language codes: `challenges-en.csv`, `challenges-hi.csv`, `challenges-ar.csv`

2. **CSV File Format**

   Your CSV files should have columns like:
   - Domain/Category column (e.g., "Category", "Domain", "Category (Domain)")
   - Area/Sub-category column (e.g., "Area", "Area of Challenge", "Sub Category")
   - Challenge column (e.g., "Challenge", "Specific Challenge")
   - Issues/Tags column (optional, e.g., "Issues", "Tags")

   **Example CSV structure:**
   ```csv
   Category (Domain),Area of Challenge,Challenge,Issues
   Business Challenges,Growth & Scaling,Plateau in revenue or growth,growth stall, revenue plateau
   Business Challenges,Strategy & Positioning,Losing market share to competitors,competitive loss, market decline
   ```

3. **Run the import script**

   ```bash
   npm install csv-parser
   node scripts/import-challenges-from-csv.js
   ```

   Or if csv-parser is not installed:
   ```bash
   npm install csv-parser
   node scripts/import-challenges-from-csv.js
   ```

## Supported Languages

The script automatically detects language from filename:
- English: `en`, `english`
- Hindi: `hi`, `hindi`
- Bengali: `bn`, `bengali`, `bangla`
- Tamil: `ta`, `tamil`
- Arabic: `ar`, `arabic`
- Chinese: `zh`, `chinese`
- Japanese: `ja`, `japanese`
- Spanish: `es`, `spanish`
- French: `fr`, `french`
- German: `de`, `german`
- Russian: `ru`, `russian`
- Portuguese: `pt`, `portuguese`

## How It Works

1. Reads all CSV files from this folder
2. Detects language from filename
3. Merges data from all files (same challenge in different languages)
4. Generates `domain_key`, `area_key`, `challenge_key` from English text
5. Sets `is_active = true` and `display_order` automatically
6. Inserts/updates into the `challenges` table

## Notes

- The script uses `upsert` - it won't create duplicates
- If the same challenge appears in multiple files, language columns will be merged
- English data is used as the base (domain_en, area_en, challenge_en)
- Other languages are added as `domain_hi`, `area_hi`, etc.


#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix corrupted apostrophes in English.csv"""

file_path = r'C:\drishiq 1\public\challenges\English.csv'

# Read the file
with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Replace Unicode replacement character (U+FFFD) with apostrophe
# This is the character that appears as 
corrupted_char = '\uFFFD'  # Unicode replacement character
count_before = content.count(corrupted_char)
content = content.replace(corrupted_char, "'")

# Write back
with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print(f"Fixed apostrophes in English.csv (replaced {count_before} corrupted characters)")

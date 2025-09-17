#!/bin/bash

# Create a list of all files with console statements (excluding node_modules and dist)
echo "Finding all files with console statements..."
files_to_process=$(grep -r -l "console\.\(log\|error\|warn\|info\|debug\|trace\|group\|groupEnd\|time\|timeEnd\|assert\|table\|dir\)" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.mjs" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=build \
  --exclude-dir=".git" \
  . 2>/dev/null)

# Process each file
for file in $files_to_process; do
  echo "Processing: $file"

  # Create a temporary file
  temp_file="${file}.tmp"

  # Use sed to remove console statements more carefully
  # First, remove standalone console statements (entire lines)
  sed '/^[[:space:]]*console\.\(log\|error\|warn\|info\|debug\|trace\|group\|groupEnd\|time\|timeEnd\|assert\|table\|dir\)(/d' "$file" > "$temp_file"

  # Move the temp file back
  mv "$temp_file" "$file"
done

echo "Console statements removal complete!"
echo "Files processed: $(echo "$files_to_process" | wc -l | tr -d ' ')"
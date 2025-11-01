# Indicator Schemas for Firestore

This directory contains JSON schema definitions for all built-in indicators.

## Upload to Firestore

These documents should be uploaded to the `/indicators` collection in Firestore.

### Using Firebase CLI

```bash
# Upload all indicators
for file in firestore-data/indicators/*.json; do
  id=$(basename "$file" .json)
  firebase firestore:write "/indicators/$id" "$file"
done
```

### Using Firebase Console

1. Go to Firebase Console → Firestore Database
2. Create/navigate to `indicators` collection
3. For each JSON file:
   - Create a new document with ID matching the file name (without .json)
   - Copy the JSON content
   - Use "Start in JSON mode" and paste the content

### Manual Upload Script

You can also create a Node.js script to upload:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

admin.initializeApp();
const db = admin.firestore();

async function uploadSchemas() {
  const indicatorsDir = path.join(__dirname, 'indicators');
  const files = fs.readdirSync(indicatorsDir)
    .filter(f => f.endsWith('.json') && f !== 'README.md');

  for (const file of files) {
    const id = file.replace('.json', '');
    const data = JSON.parse(
      fs.readFileSync(path.join(indicatorsDir, file), 'utf8')
    );

    await db.collection('indicators').doc(id).set(data);
    console.log(`Uploaded: ${id}`);
  }
}

uploadSchemas();
```

## Schema Files

- **moving-averages.json** - Simple and Exponential Moving Averages
- **rsi.json** - Relative Strength Index
- **macd.json** - Moving Average Convergence Divergence
- **bollinger-bands.json** - Bollinger Bands
- **stochastic.json** - Stochastic Oscillator
- **atr.json** - Average True Range
- **adx.json** - Average Directional Index

## Firestore Rules

Ensure these rules are set in `firestore.rules`:

```
match /indicators/{indicatorId} {
  allow read: if true;
  allow list: if true;
  allow write: if false;  // Backend/admin only
}
```

## Adding New Indicators

1. Create a new JSON file following the schema format
2. Upload to Firestore using one of the methods above
3. The indicator will automatically appear in the UI

## Schema Format

See `app/types/schema.ts` for the TypeScript interface definitions.

#!/usr/bin/env bun

// Script to add sample indicators to Firestore
import { doc, setDoc } from 'firebase/firestore';

async function getFirebaseConfig() {
  try {
    // Import the Firebase config from the app
    const { db } = await import('../app/lib/firebase');
    return { db };
  } catch (error) {
    console.error('Failed to import Firebase config from app:', error);
    console.log('Make sure you are running this from the sc-app directory');
    process.exit(1);
  }
}

const sampleIndicators = [
  {
    id: "volume",
    name: "Volume",
    display: "Bottom",
    visible: false,
    params: {},
    scale: "Value",
    className: "VolumeIndicator",
  },
  {
    id: "rsi",
    name: "RSI",
    display: "StackBottom",
    visible: false,
    params: { period: 14 },
    scale: "Value",
    className: "RSIIndicator",
  },
  {
    id: "macd",
    name: "MACD",
    display: "StackBottom",
    visible: false,
    params: { fast: 12, slow: 26, signal: 9 },
    scale: "Value",
    className: "MACDIndicator",
  },
  {
    id: "bollinger-bands",
    name: "Bollinger Bands",
    display: "Overlay",
    visible: false,
    params: { period: 20, stdDev: 2 },
    scale: "Price",
    className: "BollingerBandsIndicator",
  },
  {
    id: "moving-average-20",
    name: "Moving Average (20)",
    display: "Overlay",
    visible: false,
    params: { period: 20, type: "sma" },
    scale: "Price",
    className: "MovingAverageIndicator",
  },
  {
    id: "moving-average-50",
    name: "Moving Average (50)",
    display: "Overlay",
    visible: false,
    params: { period: 50, type: "sma" },
    scale: "Price",
    className: "MovingAverageIndicator",
  },
  {
    id: "ema-12",
    name: "EMA (12)",
    display: "Overlay",
    visible: false,
    params: { period: 12, type: "ema" },
    scale: "Price",
    className: "MovingAverageIndicator",
  },
  {
    id: "stochastic",
    name: "Stochastic",
    display: "StackBottom",
    visible: false,
    params: { kPeriod: 14, dPeriod: 3, smooth: 3 },
    scale: "Value",
    className: "StochasticIndicator",
  },
  {
    id: "atr",
    name: "Average True Range",
    display: "StackBottom",
    visible: false,
    params: { period: 14 },
    scale: "Value",
    className: "ATRIndicator",
  },
  {
    id: "williams-r",
    name: "Williams %R",
    display: "StackBottom",
    visible: false,
    params: { period: 14 },
    scale: "Value",
    className: "WilliamsRIndicator",
  },
];

async function addSampleIndicators() {
  console.log('📊 Adding Sample Indicators to Firestore');
  console.log('='.repeat(50));

  const { db } = await getFirebaseConfig();

  try {
    console.log(`\n📝 Adding ${sampleIndicators.length} sample indicators...`);

    for (const indicator of sampleIndicators) {
      console.log(`  Adding indicator: ${indicator.name} (${indicator.id})`);

      const indicatorRef = doc(db, 'indicators', indicator.id);
      await setDoc(indicatorRef, indicator);

      console.log(`  ✅ Added: ${indicator.name}`);
    }

    console.log('\n🎉 All sample indicators added successfully!');
    console.log('\nAdded indicators:');
    sampleIndicators.forEach(indicator => {
      console.log(`  • ${indicator.name} (${indicator.display})`);
    });

  } catch (error) {
    console.error('\n❌ Error adding indicators:', error);
    process.exit(1);
  }
}

// Run the script
addSampleIndicators().catch(console.error);

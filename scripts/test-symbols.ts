import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  connectAuthEmulator,
} from "firebase/auth";

// Firebase config (same as in the app)
const firebaseConfig = {
  apiKey: "AIzaSyDLU7reU3IrCx3cAo7j-eU3d8dMWYZ5xQ4",
  authDomain: "spot-canvas-trading.firebaseapp.com",
  projectId: "spot-canvas-trading",
  storageBucket: "spot-canvas-trading.firebasestorage.app",
  messagingSenderId: "1047456970745",
  appId: "1:1047456970745:web:5ad6a5b9cfa6e8b8a2b3c4",
};

async function testSymbolsData() {
  console.log("🔥 Testing Firestore Symbol Data");
  console.log("================================");

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    // Check if we should use emulator
    if (
      process.env.NODE_ENV === "development" &&
      process.env.FIRESTORE_EMULATOR_HOST
    ) {
      console.log("📡 Using Firestore emulator");
      connectFirestoreEmulator(db, "localhost", 8080);
      connectAuthEmulator(auth, "http://localhost:9099");
    }

    // Authenticate if credentials are provided
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;

    if (email && password) {
      console.log("🔐 Authenticating with Firebase...");
      await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Authentication successful");
    } else {
      console.log("⚠️ No authentication credentials provided");
      console.log("   Set TEST_EMAIL and TEST_PASSWORD environment variables");
      console.log(
        "   Testing with anonymous access (may have limited permissions)"
      );
    }

    console.log("📊 Testing symbol data access...\n");

    // Test 1: Check exchanges collection
    console.log("1️⃣ Checking exchanges collection...");
    const exchangesRef = collection(db, "exchanges");
    const exchangesSnapshot = await getDocs(exchangesRef);

    console.log(`   Found ${exchangesSnapshot.docs.length} exchange documents`);
    exchangesSnapshot.forEach((doc) => {
      console.log(`   - Exchange: ${doc.id}`);
    });

    // Test 2: Check coinbase products directly
    console.log("\n2️⃣ Checking coinbase products...");
    const coinbaseProductsRef = collection(
      db,
      "exchanges",
      "coinbase",
      "products"
    );
    const coinbaseSnapshot = await getDocs(coinbaseProductsRef);

    console.log(`   Found ${coinbaseSnapshot.docs.length} coinbase products`);

    if (coinbaseSnapshot.docs.length > 0) {
      console.log("\n   📋 Sample products:");

      // Show first 10 products
      const sampleProducts = coinbaseSnapshot.docs.slice(0, 10);
      sampleProducts.forEach((doc) => {
        const data = doc.data();
        console.log(
          `   - ${doc.id}: ${data.baseAsset || "N/A"}-${
            data.quoteAsset || "N/A"
          } (active: ${data.active !== false})`
        );
      });

      // Show USD pairs specifically
      console.log("\n   💵 USD trading pairs:");
      const usdPairs = coinbaseSnapshot.docs
        .filter((doc) => doc.data().quoteAsset === "USD")
        .slice(0, 20);

      usdPairs.forEach((doc) => {
        const data = doc.data();
        console.log(
          `   - ${doc.id}: ${data.baseAsset}-USD (active: ${
            data.active !== false
          })`
        );
      });

      // Statistics
      const activeProducts = coinbaseSnapshot.docs.filter(
        (doc) => doc.data().active !== false
      );
      const usdProducts = coinbaseSnapshot.docs.filter(
        (doc) => doc.data().quoteAsset === "USD"
      );
      const activeUsdProducts = coinbaseSnapshot.docs.filter(
        (doc) => doc.data().quoteAsset === "USD" && doc.data().active !== false
      );

      console.log("\n   📈 Statistics:");
      console.log(`   - Total products: ${coinbaseSnapshot.docs.length}`);
      console.log(`   - Active products: ${activeProducts.length}`);
      console.log(`   - USD products: ${usdProducts.length}`);
      console.log(`   - Active USD products: ${activeUsdProducts.length}`);

      // Check specific popular symbols
      console.log("\n   🎯 Checking popular symbols:");
      const popularSymbols = [
        "BTC-USD",
        "ETH-USD",
        "ADA-USD",
        "DOGE-USD",
        "SOL-USD",
      ];

      for (const symbol of popularSymbols) {
        const doc = coinbaseSnapshot.docs.find((d) => d.id === symbol);
        if (doc) {
          const data = doc.data();
          console.log(
            `   ✅ ${symbol}: Found (active: ${data.active !== false})`
          );
        } else {
          console.log(`   ❌ ${symbol}: Not found`);
        }
      }
    } else {
      console.log("   ⚠️ No coinbase products found!");

      // Try to list all collections under exchanges/coinbase
      console.log("\n   🔍 Checking what's under exchanges/coinbase/...");
      // Note: Firestore doesn't support listing subcollections directly
      // This would require admin SDK or knowing the collection names
    }

    // Test 3: Test the repository-style access pattern
    console.log("\n3️⃣ Testing repository access pattern...");

    const knownExchanges = ["coinbase"];
    const symbolsMap = new Map();

    for (const exchangeId of knownExchanges) {
      console.log(`   Loading ${exchangeId} products...`);

      const productsRef = collection(db, "exchanges", exchangeId, "products");
      const productsSnapshot = await getDocs(productsRef);

      productsSnapshot.forEach((productDoc) => {
        const data = productDoc.data();
        const symbol = {
          id: productDoc.id,
          exchangeId: exchangeId,
          symbol: productDoc.id,
          baseAsset: data.baseAsset || "",
          quoteAsset: data.quoteAsset || "",
          active: data.active !== false, // Default to true if not specified
          lastUpdate: data.lastUpdate?.toDate(),
        };

        const key = `${exchangeId}:${productDoc.id}`;
        symbolsMap.set(key, symbol);
      });
    }

    console.log(`   📦 Loaded ${symbolsMap.size} symbols into cache`);

    // Filter active USD symbols (what the app would show)
    const activeUsdSymbols = Array.from(symbolsMap.values())
      .filter((s) => s.exchangeId === "coinbase")
      .filter((s) => s.quoteAsset === "USD")
      .filter((s) => s.active)
      .sort((a, b) => {
        const popularOrder = [
          "BTC-USD",
          "ETH-USD",
          "ADA-USD",
          "DOGE-USD",
          "SOL-USD",
        ];
        const aIndex = popularOrder.indexOf(a.symbol);
        const bIndex = popularOrder.indexOf(b.symbol);

        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        return a.symbol.localeCompare(b.symbol);
      });

    console.log(
      `   💰 Active USD symbols for dropdown: ${activeUsdSymbols.length}`
    );
    console.log("   Top 10 symbols that would appear in dropdown:");
    activeUsdSymbols.slice(0, 10).forEach((s, index) => {
      console.log(
        `   ${index + 1}. ${s.symbol} (${s.baseAsset}-${s.quoteAsset})`
      );
    });

    console.log("\n✅ Symbol data test completed successfully!");
    console.log("\n🎉 Summary:");
    console.log(`   - Repository can load ${symbolsMap.size} total symbols`);
    console.log(
      `   - ${activeUsdSymbols.length} active USD pairs available for selection`
    );
    console.log("   - Symbol selection dropdown should work properly");
  } catch (error) {
    console.error("\n❌ Error testing symbols:");
    console.error(error);

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    process.exit(1);
  }
}

// Run the test
testSymbolsData()
  .then(() => {
    console.log("\n🏁 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error);
    process.exit(1);
  });

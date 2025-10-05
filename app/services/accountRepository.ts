import { User } from "firebase/auth";
import { db, isEmulatorMode } from "~/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired";
export type PlanType = "starter" | "pro" | "none";

interface SubscriptionData {
  status: SubscriptionStatus;
  plan: PlanType;
  trialEndsAt?: Date;
  currentPeriodEnd?: Date;
  subscriptionId?: string;
  customerId?: string;
  priceId?: string;
  createdAt?: Date;
}

interface AccountData {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName?: string | null;
  photoURL?: string | null;
  lastUpdated: Date;
}

interface CacheMetadata {
  key: string;
  lastFetched: Date;
  ttlMs: number;
  version: number;
}

type SubscriptionListener = (data: SubscriptionData | null) => void;
type AccountListener = (data: AccountData | null) => void;

const DB_NAME = "SpotCanvasAccountDB";
const DB_VERSION = 1;
const ACCOUNT_STORE = "account";
const SUBSCRIPTION_STORE = "subscription";
const METADATA_STORE = "metadata";

// Cache TTLs
const SUBSCRIPTION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ACCOUNT_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Map price IDs to plan names using environment variables
const PRICE_TO_PLAN: Record<string, PlanType> = {
  [import.meta.env.VITE_STRIPE_PRICE_ID_STARTER]: "starter",
  [import.meta.env.VITE_STRIPE_PRICE_ID_PRO]: "pro",
};

class AccountRepository {
  private db: IDBDatabase | null = null;
  private subscriptionListeners = new Set<SubscriptionListener>();
  private accountListeners = new Set<AccountListener>();
  private initPromise: Promise<void> | null = null;
  private currentUser: User | null = null;
  private fetchInProgress = new Map<string, Promise<any>>();

  constructor() {
    // Initialize DB on first use
  }

  private async initDB(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(ACCOUNT_STORE)) {
          db.createObjectStore(ACCOUNT_STORE, { keyPath: "uid" });
        }

        if (!db.objectStoreNames.contains(SUBSCRIPTION_STORE)) {
          db.createObjectStore(SUBSCRIPTION_STORE, { keyPath: "uid" });
        }

        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: "key" });
        }
      };
    });

    return this.initPromise;
  }

  private async getFromCache<T>(
    storeName: string,
    key: string
  ): Promise<T | null> {
    await this.initDB();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  private async saveToCache<T>(
    storeName: string,
    data: T & { uid?: string; key?: string }
  ): Promise<void> {
    await this.initDB();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async isCacheValid(
    metadataKey: string,
    ttlMs: number
  ): Promise<boolean> {
    const metadata = await this.getFromCache<CacheMetadata>(
      METADATA_STORE,
      metadataKey
    );
    if (!metadata) return false;

    const now = new Date();
    const age = now.getTime() - metadata.lastFetched.getTime();
    return age < ttlMs;
  }

  private async updateMetadata(key: string, ttlMs: number): Promise<void> {
    await this.saveToCache(METADATA_STORE, {
      key,
      lastFetched: new Date(),
      ttlMs,
      version: DB_VERSION,
    });
  }

  private async fetchSubscriptionFromServer(
    user: User
  ): Promise<SubscriptionData | null> {
    const fetchKey = `subscription-${user.uid}`;

    // Check if fetch is already in progress
    if (this.fetchInProgress.has(fetchKey)) {
      return this.fetchInProgress.get(fetchKey)!;
    }

    const fetchPromise = async (): Promise<SubscriptionData | null> => {
      try {
        // If in emulator mode, fetch from Firestore instead of billing API
        if (isEmulatorMode()) {
          const subscriptionDoc = await getDoc(
            doc(db, "subscriptions", user.uid)
          );

          if (subscriptionDoc.exists()) {
            const data = subscriptionDoc.data();
            let plan: PlanType = "none";

            // Map price_id to plan
            if (data.price_id) {
              plan = PRICE_TO_PLAN[data.price_id] || "none";

              // Fallback mapping
              if (plan === "none") {
                const priceId = data.price_id.toLowerCase();
                if (priceId.includes("starter") || priceId.includes("basic")) {
                  plan = "starter";
                } else if (
                  priceId.includes("pro") ||
                  priceId.includes("premium")
                ) {
                  plan = "pro";
                } else if (
                  data.status === "active" ||
                  data.status === "trialing"
                ) {
                  plan = "starter";
                }
              }
            }

            const subscriptionData: SubscriptionData = {
              status: data.status || "active",
              plan,
              subscriptionId: data.subscription_id,
              priceId: data.price_id,
              trialEndsAt: data.trial_end
                ? new Date(data.trial_end * 1000)
                : undefined,
              currentPeriodEnd: data.current_period_end
                ? new Date(data.current_period_end * 1000)
                : undefined,
              customerId: data.customer_id,
              createdAt: new Date(),
            };

            return subscriptionData;
          }

          // Return default active subscription for emulator testing
          return {
            status: "active",
            plan: "starter",
            subscriptionId: "emulator-sub-" + user.uid,
            priceId: import.meta.env.VITE_STRIPE_PRICE_ID_STARTER,
            customerId: "emulator-customer-" + user.uid,
            createdAt: new Date(),
          };
        }

        // Production mode - use billing API
        const idToken = await user.getIdToken();

        const response = await fetch(
          "https://billing-server-346028322665.europe-west1.run.app/api/subscriptions",
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch subscriptions");
        }

        const data = await response.json();
        const subscriptions = data.subscriptions || [];

        // Find the most relevant subscription
        const activeSubscription =
          subscriptions.find(
            (sub: any) => sub.status === "active" || sub.status === "trialing"
          ) || subscriptions[0];

        if (activeSubscription) {
          let plan = PRICE_TO_PLAN[activeSubscription.price_id] || "none";

          // Infer plan if mapping failed
          if (plan === "none" && activeSubscription.price_id) {
            const priceId = activeSubscription.price_id.toLowerCase();
            if (priceId.includes("starter") || priceId.includes("basic")) {
              plan = "starter";
            } else if (priceId.includes("pro") || priceId.includes("premium")) {
              plan = "pro";
            } else if (
              activeSubscription.status === "active" ||
              activeSubscription.status === "trialing"
            ) {
              // Default to starter for any active subscription
              plan = "starter";
            }
          }

          const subscriptionData: SubscriptionData = {
            status: activeSubscription.status,
            plan,
            subscriptionId: activeSubscription.subscription_id,
            priceId: activeSubscription.price_id,
            trialEndsAt: activeSubscription.trial_end
              ? new Date(activeSubscription.trial_end * 1000)
              : undefined,
            currentPeriodEnd: activeSubscription.current_period_end
              ? new Date(activeSubscription.current_period_end * 1000)
              : undefined,
            customerId: activeSubscription.customer_id,
            createdAt: new Date(),
          };

          return subscriptionData;
        }

        return null;
      } catch (error) {
        // In emulator mode, return a default subscription instead of null
        if (isEmulatorMode()) {
          return {
            status: "active",
            plan: "starter",
            subscriptionId: "emulator-sub-" + user.uid,
            priceId: import.meta.env.VITE_STRIPE_PRICE_ID_STARTER,
            customerId: "emulator-customer-" + user.uid,
            createdAt: new Date(),
          };
        }

        return null;
      } finally {
        this.fetchInProgress.delete(fetchKey);
      }
    };

    const promise = fetchPromise();
    this.fetchInProgress.set(fetchKey, promise);
    return promise;
  }

  public async getSubscription(
    user: User | null,
    forceRefresh = false
  ): Promise<SubscriptionData | null> {
    if (!user) return null;

    const metadataKey = `subscription-meta-${user.uid}`;
    const cacheKey = user.uid;

    // Get cached data immediately
    const cachedData = await this.getFromCache<
      SubscriptionData & { uid: string }
    >(SUBSCRIPTION_STORE, cacheKey);

    // Check if cache is valid and not forcing refresh
    const cacheValid =
      !forceRefresh &&
      (await this.isCacheValid(metadataKey, SUBSCRIPTION_TTL_MS));

    if (cachedData && cacheValid) {
      // Return cached data and don't fetch
      return cachedData;
    }

    // If we have cached data, return it immediately and fetch in background
    if (cachedData && !forceRefresh) {
      // Fetch fresh data in background
      this.fetchSubscriptionFromServer(user).then(async (freshData) => {
        if (freshData) {
          await this.saveToCache(SUBSCRIPTION_STORE, {
            ...freshData,
            uid: user.uid,
          });
          await this.updateMetadata(metadataKey, SUBSCRIPTION_TTL_MS);
          this.notifySubscriptionListeners(freshData);
        }
      });

      return cachedData;
    }

    // No cached data or force refresh - fetch and wait
    const freshData = await this.fetchSubscriptionFromServer(user);
    if (freshData) {
      await this.saveToCache(SUBSCRIPTION_STORE, {
        ...freshData,
        uid: user.uid,
      });
      await this.updateMetadata(metadataKey, SUBSCRIPTION_TTL_MS);
      this.notifySubscriptionListeners(freshData);
    }

    return freshData;
  }

  public async getAccount(
    user: User | null,
    forceRefresh = false
  ): Promise<AccountData | null> {
    if (!user) return null;

    const metadataKey = `account-meta-${user.uid}`;
    const cacheKey = user.uid;

    // Get cached data immediately
    const cachedData = await this.getFromCache<AccountData>(
      ACCOUNT_STORE,
      cacheKey
    );

    // Check if cache is valid
    const cacheValid =
      !forceRefresh && (await this.isCacheValid(metadataKey, ACCOUNT_TTL_MS));

    if (cachedData && cacheValid) {
      return cachedData;
    }

    // Create fresh account data from Firebase user
    const accountData: AccountData = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastUpdated: new Date(),
    };

    // Save to cache
    await this.saveToCache(ACCOUNT_STORE, accountData);
    await this.updateMetadata(metadataKey, ACCOUNT_TTL_MS);

    // Notify listeners
    this.notifyAccountListeners(accountData);

    return accountData;
  }

  public async warmCache(user: User): Promise<void> {
    // Pre-fetch both account and subscription data
    await Promise.all([
      this.getAccount(user, true),
      this.getSubscription(user, true),
    ]);
  }

  public async clearCache(uid?: string): Promise<void> {
    await this.initDB();
    if (!this.db) return;

    const stores = [ACCOUNT_STORE, SUBSCRIPTION_STORE];

    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);

      if (uid) {
        store.delete(uid);
      } else {
        store.clear();
      }
    }

    // Clear metadata
    if (uid) {
      const metaTransaction = this.db.transaction(
        [METADATA_STORE],
        "readwrite"
      );
      const metaStore = metaTransaction.objectStore(METADATA_STORE);
      metaStore.delete(`account-meta-${uid}`);
      metaStore.delete(`subscription-meta-${uid}`);
    } else {
      const metaTransaction = this.db.transaction(
        [METADATA_STORE],
        "readwrite"
      );
      const metaStore = metaTransaction.objectStore(METADATA_STORE);
      metaStore.clear();
    }
  }

  public subscribeToSubscription(listener: SubscriptionListener): () => void {
    this.subscriptionListeners.add(listener);
    return () => this.subscriptionListeners.delete(listener);
  }

  public subscribeToAccount(listener: AccountListener): () => void {
    this.accountListeners.add(listener);
    return () => this.accountListeners.delete(listener);
  }

  private notifySubscriptionListeners(data: SubscriptionData | null): void {
    this.subscriptionListeners.forEach((listener) => listener(data));
  }

  private notifyAccountListeners(data: AccountData | null): void {
    this.accountListeners.forEach((listener) => listener(data));
  }

  public setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  // Helper method to check if preview mode is active
  public async getPreviewStatus(
    user: User | null
  ): Promise<{ isPreview: boolean; isExpired: boolean; startTime?: number }> {
    const PREVIEW_DURATION_MINUTES = 5;
    const previewKey = user
      ? `preview_start_${user.uid}`
      : "anonymous_preview_start";
    const previewStart = localStorage.getItem(previewKey);

    if (!previewStart) {
      return { isPreview: false, isExpired: false };
    }

    const startTime = parseInt(previewStart);
    const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
    const isExpired = elapsedMinutes >= PREVIEW_DURATION_MINUTES;

    return { isPreview: true, isExpired, startTime };
  }

  public startPreview(user: User | null): void {
    const previewKey = user
      ? `preview_start_${user.uid}`
      : "anonymous_preview_start";
    if (!localStorage.getItem(previewKey)) {
      localStorage.setItem(previewKey, Date.now().toString());
    }
  }
}

// Singleton instance
export const accountRepository = new AccountRepository();

// Twitter Credentials Management
export interface TwitterCredentials {
  accessToken: string;
  accessSecret: string;
  username: string;
  userId: string;
}

/**
 * Get Twitter API credentials from user's Firestore profile
 */
export async function getTwitterCredentials(
  userId: string
): Promise<TwitterCredentials | null> {
  const userDoc = await getDoc(doc(db, "users", userId));

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return data.twitterCredentials || null;
}

/**
 * Delete Twitter API credentials from user's Firestore profile
 */
export async function deleteTwitterCredentials(userId: string): Promise<void> {
  const { updateDoc, doc, deleteField } = await import("firebase/firestore");
  const userRef = doc(db, "users", userId);

  await updateDoc(userRef, {
    twitterCredentials: deleteField(),
    updatedAt: new Date(),
  });
}

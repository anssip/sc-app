var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, json, redirect } from "@remix-run/node";
import { RemixServer, useLocation, Outlet, Meta, Links, ScrollRestoration, Scripts, Link, useNavigate, Navigate, useLoaderData, useSearchParams } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle, Fragment as Fragment$1 } from "react";
import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, reload } from "firebase/auth";
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp, onSnapshot, collection, query, where, orderBy, limit, getDocs, Timestamp, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import ReactGA from "react-ga4";
import { loadStripe } from "@stripe/stripe-js";
import { useStripe, useElements, CardElement, Elements } from "@stripe/react-stripe-js";
import { User, ChevronDown, Zap, Crown, Star, X, Menu, ArrowLeft, ChevronDownIcon, GripVerticalIcon, Trash2, AlertCircle, Clock, Bot, Download, Share, Loader2, Send, CheckCircle, ArrowRight, ExternalLink, Check, BarChart3, Code2, Smartphone } from "lucide-react";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import { Menu as Menu$1, Transition, Popover, Dialog } from "@headlessui/react";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
    return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) : handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext);
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
    return new Promise((resolve, reject) => {
        let shellRendered = false;
        const { pipe, abort } = renderToPipeableStream(
        /* @__PURE__ */ jsx(RemixServer, {
            context: remixContext,
            url: request.url,
            abortDelay: ABORT_DELAY
        }), {
            onAllReady() {
                shellRendered = true;
                const body = new PassThrough();
                const stream = createReadableStreamFromReadable(body);
                responseHeaders.set("Content-Type", "text/html");
                resolve(new Response(stream, {
                    headers: responseHeaders,
                    status: responseStatusCode
                }));
                pipe(body);
            },
            onShellError(error) {
                reject(error);
            },
            onError(error) {
                responseStatusCode = 500;
                if (shellRendered) {
                    console.error(error);
                }
            }
        });
        setTimeout(abort, ABORT_DELAY);
    });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
    return new Promise((resolve, reject) => {
        let shellRendered = false;
        const { pipe, abort } = renderToPipeableStream(
        /* @__PURE__ */ jsx(RemixServer, {
            context: remixContext,
            url: request.url,
            abortDelay: ABORT_DELAY
        }), {
            onShellReady() {
                shellRendered = true;
                const body = new PassThrough();
                const stream = createReadableStreamFromReadable(body);
                responseHeaders.set("Content-Type", "text/html");
                resolve(new Response(stream, {
                    headers: responseHeaders,
                    status: responseStatusCode
                }));
                pipe(body);
            },
            onShellError(error) {
                reject(error);
            },
            onError(error) {
                responseStatusCode = 500;
                if (shellRendered) {
                    console.error(error);
                }
            }
        });
        setTimeout(abort, ABORT_DELAY);
    });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const firebaseConfig = {
    apiKey: "AIzaSyDkDBUUnxUqV3YZBm9GOrkcULZjBT4azyc",
    authDomain: "spotcanvas-prod.firebaseapp.com",
    projectId: "spotcanvas-prod",
    storageBucket: "spotcanvas-prod.firebasestorage.app",
    messagingSenderId: "346028322665",
    appId: "1:346028322665:web:f278b8364243d165f8d7f8"
};
let app;
let auth$1;
let db;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
}
else {
    app = getApps()[0];
}
auth$1 = getAuth(app);
db = getFirestore(app);
const firebase = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    get auth() {
        return auth$1;
    },
    get db() {
        return db;
    },
    firebaseConfig
}, Symbol.toStringTag, { value: "Module" }));
const signUp = async ({ email, password }) => {
    try {
        console.log("Attempting to sign up with email:", email);
        const userCredential = await createUserWithEmailAndPassword(auth$1, email, password);
        console.log("Sign-up successful:", userCredential.user.email);
        await sendVerificationEmail(userCredential.user);
        return userCredential.user;
    }
    catch (error) {
        console.error("Sign-up failed:", error);
        throw error;
    }
};
const signIn = async ({ email, password }) => {
    try {
        console.log("Attempting to sign in with email:", email);
        const userCredential = await signInWithEmailAndPassword(auth$1, email, password);
        console.log("Sign-in successful:", userCredential.user.email);
        return userCredential.user;
    }
    catch (error) {
        console.error("Sign-in failed:", error);
        throw error;
    }
};
const signInWithGoogle = async () => {
    try {
        console.log("Attempting to sign in with Google");
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth$1, provider);
        console.log("Google sign-in successful:", userCredential.user.email);
        return userCredential.user;
    }
    catch (error) {
        console.error("Google sign-in failed:", error);
        throw error;
    }
};
const logOut = async () => {
    try {
        console.log("Attempting to sign out");
        await signOut(auth$1);
        console.log("Sign-out successful");
    }
    catch (error) {
        console.error("Sign-out failed:", error);
        throw error;
    }
};
const sendVerificationEmail = async (user) => {
    try {
        console.log("Sending verification email to:", user.email);
        console.log("User emailVerified status:", user.emailVerified);
        if (user.emailVerified) {
            console.log("Email already verified, skipping verification email");
            return;
        }
        await sendEmailVerification(user, {
            url: `${window.location.origin}/welcome`,
            // Redirect after verification
            handleCodeInApp: false
            // Don't handle the action code in the app
        });
        console.log("Verification email sent successfully");
    }
    catch (error) {
        console.error("Failed to send verification email:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        if (error.code === "auth/too-many-requests") {
            throw new Error("Too many verification emails sent. Please wait a few minutes and try again.");
        }
        else if (error.code === "auth/requires-recent-login") {
            throw new Error("Please sign in again to send verification email.");
        }
        throw error;
    }
};
const saveUserPreferences = async (userId, email, marketingConsent) => {
    try {
        const userDocRef = doc(db, "users", userId);
        await setDoc(userDocRef, {
            email,
            marketingConsent,
            consentTimestamp: serverTimestamp(),
            emailVerified: false,
            createdAt: serverTimestamp()
        }, { merge: true });
        console.log("User preferences saved");
    }
    catch (error) {
        console.error("Failed to save user preferences:", error);
        throw error;
    }
};
const updateEmailVerificationStatus = async (userId, verified) => {
    try {
        const userDocRef = doc(db, "users", userId);
        await setDoc(userDocRef, {
            emailVerified: verified,
            verifiedAt: verified ? serverTimestamp() : null
        }, { merge: true });
        console.log("Email verification status updated");
    }
    catch (error) {
        console.error("Failed to update verification status:", error);
        throw error;
    }
};
const getErrorMessage = (error) => {
    switch (error.code) {
        case "auth/email-already-in-use":
            return "This email is already registered. Please use a different email or sign in.";
        case "auth/weak-password":
            return "Password should be at least 6 characters long.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/user-not-found":
            return "No account found with this email address.";
        case "auth/wrong-password":
            return "Incorrect password. Please try again.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later.";
        case "auth/popup-closed-by-user":
            return "Sign-in cancelled. Please try again.";
        case "auth/popup-blocked":
            return "Pop-up blocked. Please allow pop-ups and try again.";
        case "auth/cancelled-popup-request":
            return "Sign-in cancelled. Please try again.";
        default:
            return error.message || "An error occurred. Please try again.";
    }
};
const auth = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    getErrorMessage,
    logOut,
    saveUserPreferences,
    sendVerificationEmail,
    signIn,
    signInWithGoogle,
    signUp,
    updateEmailVerificationStatus
}, Symbol.toStringTag, { value: "Module" }));
const DB_NAME = "SpotCanvasAccountDB";
const DB_VERSION = 1;
const ACCOUNT_STORE = "account";
const SUBSCRIPTION_STORE = "subscription";
const METADATA_STORE = "metadata";
const SUBSCRIPTION_TTL_MS = 5 * 60 * 1e3;
const ACCOUNT_TTL_MS = 30 * 60 * 1e3;
const PRICE_TO_PLAN$1 = {
    ["price_0Rx7Lb22sagdNJ63Z15hBqxP"]: "starter",
    ["price_0Rx7MY22sagdNJ63sqxZfef5"]: "pro"
};
class AccountRepository {
    constructor() {
        __publicField(this, "db", null);
        __publicField(this, "subscriptionListeners", /* @__PURE__ */ new Set());
        __publicField(this, "accountListeners", /* @__PURE__ */ new Set());
        __publicField(this, "initPromise", null);
        __publicField(this, "currentUser", null);
        __publicField(this, "fetchInProgress", /* @__PURE__ */ new Map());
    }
    async initDB() {
        if (this.db)
            return;
        if (this.initPromise)
            return this.initPromise;
        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => {
                console.error("Failed to open IndexedDB:", request.error);
                reject(request.error);
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db2 = event.target.result;
                if (!db2.objectStoreNames.contains(ACCOUNT_STORE)) {
                    db2.createObjectStore(ACCOUNT_STORE, { keyPath: "uid" });
                }
                if (!db2.objectStoreNames.contains(SUBSCRIPTION_STORE)) {
                    db2.createObjectStore(SUBSCRIPTION_STORE, { keyPath: "uid" });
                }
                if (!db2.objectStoreNames.contains(METADATA_STORE)) {
                    db2.createObjectStore(METADATA_STORE, { keyPath: "key" });
                }
            };
        });
        return this.initPromise;
    }
    async getFromCache(storeName, key) {
        await this.initDB();
        if (!this.db)
            return null;
        return new Promise((resolve) => {
            const transaction = this.db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => {
                console.error(`Failed to read from ${storeName}:`, request.error);
                resolve(null);
            };
        });
    }
    async saveToCache(storeName, data) {
        await this.initDB();
        if (!this.db)
            return;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error(`Failed to save to ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }
    async isCacheValid(metadataKey, ttlMs) {
        const metadata = await this.getFromCache(METADATA_STORE, metadataKey);
        if (!metadata)
            return false;
        const now = /* @__PURE__ */ new Date();
        const age = now.getTime() - metadata.lastFetched.getTime();
        return age < ttlMs;
    }
    async updateMetadata(key, ttlMs) {
        await this.saveToCache(METADATA_STORE, {
            key,
            lastFetched: /* @__PURE__ */ new Date(),
            ttlMs,
            version: DB_VERSION
        });
    }
    async fetchSubscriptionFromServer(user) {
        const fetchKey = `subscription-${user.uid}`;
        if (this.fetchInProgress.has(fetchKey)) {
            return this.fetchInProgress.get(fetchKey);
        }
        const fetchPromise = async () => {
            try {
                const idToken = await user.getIdToken();
                const response = await fetch("https://billing-server-346028322665.europe-west1.run.app/api/subscriptions", {
                    headers: {
                        "Authorization": `Bearer ${idToken}`
                    }
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch subscriptions");
                }
                const data = await response.json();
                const subscriptions = data.subscriptions || [];
                const activeSubscription = subscriptions.find((sub) => sub.status === "active" || sub.status === "trialing") || subscriptions[0];
                if (activeSubscription) {
                    let plan = PRICE_TO_PLAN$1[activeSubscription.price_id] || "none";
                    if (plan === "none" && activeSubscription.price_id) {
                        const priceId = activeSubscription.price_id.toLowerCase();
                        if (priceId.includes("starter") || priceId.includes("basic")) {
                            plan = "starter";
                        }
                        else if (priceId.includes("pro") || priceId.includes("premium")) {
                            plan = "pro";
                        }
                        else if (activeSubscription.status === "active" || activeSubscription.status === "trialing") {
                            plan = "starter";
                        }
                    }
                    const subscriptionData = {
                        status: activeSubscription.status,
                        plan,
                        subscriptionId: activeSubscription.subscription_id,
                        priceId: activeSubscription.price_id,
                        trialEndsAt: activeSubscription.trial_end ? new Date(activeSubscription.trial_end * 1e3) : void 0,
                        currentPeriodEnd: activeSubscription.current_period_end ? new Date(activeSubscription.current_period_end * 1e3) : void 0,
                        customerId: activeSubscription.customer_id,
                        createdAt: /* @__PURE__ */ new Date()
                    };
                    return subscriptionData;
                }
                return null;
            }
            catch (error) {
                console.error("Failed to fetch subscription data:", error);
                return null;
            }
            finally {
                this.fetchInProgress.delete(fetchKey);
            }
        };
        const promise = fetchPromise();
        this.fetchInProgress.set(fetchKey, promise);
        return promise;
    }
    async getSubscription(user, forceRefresh = false) {
        if (!user)
            return null;
        const metadataKey = `subscription-meta-${user.uid}`;
        const cacheKey = user.uid;
        const cachedData = await this.getFromCache(SUBSCRIPTION_STORE, cacheKey);
        const cacheValid = !forceRefresh && await this.isCacheValid(metadataKey, SUBSCRIPTION_TTL_MS);
        if (cachedData && cacheValid) {
            return cachedData;
        }
        if (cachedData && !forceRefresh) {
            this.fetchSubscriptionFromServer(user).then(async (freshData2) => {
                if (freshData2) {
                    await this.saveToCache(SUBSCRIPTION_STORE, { ...freshData2, uid: user.uid });
                    await this.updateMetadata(metadataKey, SUBSCRIPTION_TTL_MS);
                    this.notifySubscriptionListeners(freshData2);
                }
            });
            return cachedData;
        }
        const freshData = await this.fetchSubscriptionFromServer(user);
        if (freshData) {
            await this.saveToCache(SUBSCRIPTION_STORE, { ...freshData, uid: user.uid });
            await this.updateMetadata(metadataKey, SUBSCRIPTION_TTL_MS);
            this.notifySubscriptionListeners(freshData);
        }
        return freshData;
    }
    async getAccount(user, forceRefresh = false) {
        if (!user)
            return null;
        const metadataKey = `account-meta-${user.uid}`;
        const cacheKey = user.uid;
        const cachedData = await this.getFromCache(ACCOUNT_STORE, cacheKey);
        const cacheValid = !forceRefresh && await this.isCacheValid(metadataKey, ACCOUNT_TTL_MS);
        if (cachedData && cacheValid) {
            return cachedData;
        }
        const accountData = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastUpdated: /* @__PURE__ */ new Date()
        };
        await this.saveToCache(ACCOUNT_STORE, accountData);
        await this.updateMetadata(metadataKey, ACCOUNT_TTL_MS);
        this.notifyAccountListeners(accountData);
        return accountData;
    }
    async warmCache(user) {
        await Promise.all([
            this.getAccount(user, true),
            this.getSubscription(user, true)
        ]);
    }
    async clearCache(uid) {
        await this.initDB();
        if (!this.db)
            return;
        const stores = [ACCOUNT_STORE, SUBSCRIPTION_STORE];
        for (const storeName of stores) {
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            if (uid) {
                store.delete(uid);
            }
            else {
                store.clear();
            }
        }
        if (uid) {
            const metaTransaction = this.db.transaction([METADATA_STORE], "readwrite");
            const metaStore = metaTransaction.objectStore(METADATA_STORE);
            metaStore.delete(`account-meta-${uid}`);
            metaStore.delete(`subscription-meta-${uid}`);
        }
        else {
            const metaTransaction = this.db.transaction([METADATA_STORE], "readwrite");
            const metaStore = metaTransaction.objectStore(METADATA_STORE);
            metaStore.clear();
        }
    }
    subscribeToSubscription(listener) {
        this.subscriptionListeners.add(listener);
        return () => this.subscriptionListeners.delete(listener);
    }
    subscribeToAccount(listener) {
        this.accountListeners.add(listener);
        return () => this.accountListeners.delete(listener);
    }
    notifySubscriptionListeners(data) {
        this.subscriptionListeners.forEach((listener) => listener(data));
    }
    notifyAccountListeners(data) {
        this.accountListeners.forEach((listener) => listener(data));
    }
    setCurrentUser(user) {
        this.currentUser = user;
    }
    // Helper method to check if preview mode is active
    async getPreviewStatus(user) {
        const PREVIEW_DURATION_MINUTES2 = 5;
        const previewKey = user ? `preview_start_${user.uid}` : "anonymous_preview_start";
        const previewStart = localStorage.getItem(previewKey);
        if (!previewStart) {
            return { isPreview: false, isExpired: false };
        }
        const startTime = parseInt(previewStart);
        const elapsedMinutes = (Date.now() - startTime) / (1e3 * 60);
        const isExpired = elapsedMinutes >= PREVIEW_DURATION_MINUTES2;
        return { isPreview: true, isExpired, startTime };
    }
    startPreview(user) {
        const previewKey = user ? `preview_start_${user.uid}` : "anonymous_preview_start";
        if (!localStorage.getItem(previewKey)) {
            localStorage.setItem(previewKey, Date.now().toString());
        }
    }
}
const accountRepository = new AccountRepository();
const AuthContext = createContext({
    user: null,
    loading: true,
    // Default to true - we're loading until proven otherwise
    emailVerified: false,
    refreshUser: async () => {
    }
});
const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [emailVerified, setEmailVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const refreshUser = async () => {
        if (!user)
            return;
        try {
            await reload(user);
            setEmailVerified(user.emailVerified);
            if (user.emailVerified) {
                await updateEmailVerificationStatus(user.uid, true);
            }
            console.log("User refreshed, emailVerified:", user.emailVerified);
        }
        catch (error) {
            console.error("Failed to refresh user:", error);
        }
    };
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        setMounted(true);
        console.log("Setting up auth state listener...");
        const unsubscribe = onAuthStateChanged(auth$1, async (user2) => {
            console.log("Auth state changed:", user2 ? `User: ${user2.email}` : "No user");
            setUser(user2);
            if (user2) {
                setEmailVerified(user2.emailVerified);
                accountRepository.setCurrentUser(user2);
                accountRepository.warmCache(user2).then(() => {
                    console.log("Account cache warmed for user:", user2.email);
                }).catch((error) => {
                    console.error("Failed to warm cache:", error);
                });
                if (!user2.emailVerified) {
                    const intervalId = setInterval(async () => {
                        await reload(user2);
                        if (user2.emailVerified) {
                            setEmailVerified(true);
                            await updateEmailVerificationStatus(user2.uid, true);
                            clearInterval(intervalId);
                            console.log("Email verified!");
                        }
                    }, 3e4);
                    return () => clearInterval(intervalId);
                }
            }
            else {
                setEmailVerified(false);
                accountRepository.setCurrentUser(null);
                accountRepository.clearCache().then(() => {
                    console.log("Cleared account cache on logout");
                }).catch((error) => {
                    console.error("Failed to clear cache on logout:", error);
                });
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    useEffect(() => {
        if (!user)
            return;
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                console.log("User document updated:", userData);
            }
        }, (error) => {
            console.error("Error listening to user document:", error);
        });
        return () => unsubscribe();
    }, [user]);
    const value = {
        user,
        loading,
        emailVerified,
        refreshUser
    };
    console.log("AuthProvider render:", {
        user: user ? user.email : null,
        loading,
        emailVerified,
        mounted
    });
    return /* @__PURE__ */ jsx(AuthContext.Provider, { value, children });
};
const SubscriptionContext = createContext(void 0);
const PRICE_TO_PLAN = {
    ["price_0Rx7Lb22sagdNJ63Z15hBqxP"]: "starter",
    ["price_0Rx7MY22sagdNJ63sqxZfef5"]: "pro"
};
const PREVIEW_DURATION_MINUTES$1 = 5;
function SubscriptionProvider({ children }) {
    const [subscriptionData, setSubscriptionData] = useState({
        status: "none",
        plan: "none",
        isLoading: true
        // Start with loading true to wait for auth check
    });
    const [previewTimer, setPreviewTimer] = useState(null);
    const refreshSubscription = async () => {
        try {
            const auth2 = getAuth();
            const user = auth2.currentUser;
            if (!user) {
                console.log("No authenticated user found");
                const previewStatus = await accountRepository.getPreviewStatus(null);
                if (previewStatus.isPreview) {
                    setSubscriptionData({
                        status: "none",
                        plan: "none",
                        isLoading: false,
                        previewStartTime: previewStatus.startTime,
                        isPreviewExpired: previewStatus.isExpired
                    });
                    if (!previewStatus.isExpired && previewStatus.startTime) {
                        const remainingMs = PREVIEW_DURATION_MINUTES$1 * 60 * 1e3 - (Date.now() - previewStatus.startTime);
                        if (previewTimer)
                            clearTimeout(previewTimer);
                        const timer = setTimeout(() => {
                            setSubscriptionData((prev) => ({ ...prev, isPreviewExpired: true }));
                        }, remainingMs);
                        setPreviewTimer(timer);
                    }
                }
                else {
                    setSubscriptionData({
                        status: "none",
                        plan: "none",
                        isLoading: false
                    });
                }
                return;
            }
            console.log("Fetching subscription for user:", user.uid);
            const subscription = await accountRepository.getSubscription(user);
            if (subscription) {
                console.log("Setting subscription data:", {
                    status: subscription.status,
                    plan: subscription.plan,
                    subscriptionId: subscription.subscriptionId
                });
                setSubscriptionData({
                    status: subscription.status,
                    plan: subscription.plan,
                    subscriptionId: subscription.subscriptionId,
                    trialEndsAt: subscription.trialEndsAt,
                    currentPeriodEnd: subscription.currentPeriodEnd,
                    customerId: subscription.customerId,
                    isLoading: false,
                    // Clear preview-related fields when subscription exists
                    previewStartTime: void 0,
                    isPreviewExpired: void 0
                });
            }
            else {
                const db2 = getFirestore();
                const subscriptionsRef = collection(db2, "subscriptions");
                const q = query(subscriptionsRef, where("firebase_uid", "==", user.uid), orderBy("created_at", "desc"), limit(1));
                try {
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const doc2 = querySnapshot.docs[0];
                        const subData = doc2.data();
                        if (subData.status === "canceled") {
                            const plan = PRICE_TO_PLAN[subData.price_id] || "none";
                            setSubscriptionData({
                                status: "canceled",
                                plan,
                                subscriptionId: subData.subscription_id,
                                trialEndsAt: subData.trial_end ? new Date(subData.trial_end * 1e3) : void 0,
                                isLoading: false
                            });
                            return;
                        }
                    }
                }
                catch (firestoreError) {
                    console.error("Error querying Firestore:", firestoreError);
                }
                const previewStatus = await accountRepository.getPreviewStatus(user);
                if (!previewStatus.isPreview) {
                    accountRepository.startPreview(user);
                    const newPreviewStatus = await accountRepository.getPreviewStatus(user);
                    setSubscriptionData({
                        status: "none",
                        plan: "none",
                        isLoading: false,
                        previewStartTime: newPreviewStatus.startTime,
                        isPreviewExpired: false
                    });
                    const remainingMs = PREVIEW_DURATION_MINUTES$1 * 60 * 1e3;
                    if (previewTimer)
                        clearTimeout(previewTimer);
                    const timer = setTimeout(() => {
                        setSubscriptionData((prev) => ({ ...prev, isPreviewExpired: true }));
                    }, remainingMs);
                    setPreviewTimer(timer);
                }
                else {
                    setSubscriptionData({
                        status: "none",
                        plan: "none",
                        isLoading: false,
                        previewStartTime: previewStatus.startTime,
                        isPreviewExpired: previewStatus.isExpired
                    });
                    if (!previewStatus.isExpired && previewStatus.startTime) {
                        const remainingMs = PREVIEW_DURATION_MINUTES$1 * 60 * 1e3 - (Date.now() - previewStatus.startTime);
                        if (previewTimer)
                            clearTimeout(previewTimer);
                        const timer = setTimeout(() => {
                            setSubscriptionData((prev) => ({ ...prev, isPreviewExpired: true }));
                        }, remainingMs);
                        setPreviewTimer(timer);
                    }
                }
            }
        }
        catch (error) {
            console.error("Failed to fetch subscription data:", error);
            setSubscriptionData((prev) => ({ ...prev, isLoading: false }));
        }
    };
    useEffect(() => {
        refreshSubscription();
        const auth2 = getAuth();
        const unsubscribe = auth2.onAuthStateChanged(async (user) => {
            accountRepository.setCurrentUser(user);
            if (user) {
                const anonymousPreviewKey = "anonymous_preview_start";
                if (localStorage.getItem(anonymousPreviewKey)) {
                    console.log("Clearing anonymous preview timer on user login");
                    localStorage.removeItem(anonymousPreviewKey);
                }
                console.log("User logged in, forcing subscription refresh for:", user.email);
                setSubscriptionData((prev) => ({ ...prev, isLoading: true }));
                const subscription = await accountRepository.getSubscription(user, true);
                if (subscription) {
                    console.log("Fresh subscription data fetched:", {
                        status: subscription.status,
                        plan: subscription.plan,
                        subscriptionId: subscription.subscriptionId
                    });
                    setSubscriptionData({
                        status: subscription.status,
                        plan: subscription.plan,
                        subscriptionId: subscription.subscriptionId,
                        trialEndsAt: subscription.trialEndsAt,
                        currentPeriodEnd: subscription.currentPeriodEnd,
                        customerId: subscription.customerId,
                        isLoading: false,
                        // Clear preview-related fields when subscription exists
                        previewStartTime: void 0,
                        isPreviewExpired: void 0
                    });
                }
                else {
                    refreshSubscription();
                }
            }
            else {
                console.log("User logged out, clearing subscription data");
                setSubscriptionData({
                    status: "none",
                    plan: "none",
                    isLoading: false
                });
            }
        });
        const unsubscribeFromRepo = accountRepository.subscribeToSubscription((subscriptionData2) => {
            if (subscriptionData2) {
                console.log("Subscription updated from repository:", subscriptionData2);
                setSubscriptionData({
                    status: subscriptionData2.status,
                    plan: subscriptionData2.plan,
                    subscriptionId: subscriptionData2.subscriptionId,
                    trialEndsAt: subscriptionData2.trialEndsAt,
                    currentPeriodEnd: subscriptionData2.currentPeriodEnd,
                    customerId: subscriptionData2.customerId,
                    isLoading: false,
                    // Clear preview-related fields when subscription exists
                    previewStartTime: void 0,
                    isPreviewExpired: void 0
                });
            }
        });
        return () => {
            unsubscribe();
            unsubscribeFromRepo();
            if (previewTimer)
                clearTimeout(previewTimer);
        };
    }, []);
    const canAddMoreLayouts = (currentCount) => {
        if (subscriptionData.status === "trialing") {
            return true;
        }
        const hasStarterAccess = ["active", "past_due", "incomplete"].includes(subscriptionData.status) && subscriptionData.plan === "starter";
        if (hasStarterAccess) {
            return currentCount < 2;
        }
        const hasProAccess = ["active", "past_due", "incomplete"].includes(subscriptionData.status) && subscriptionData.plan === "pro";
        if (hasProAccess) {
            return true;
        }
        return false;
    };
    const canAddMoreIndicators = (currentCount) => {
        if (subscriptionData.status === "trialing") {
            return true;
        }
        const hasStarterAccess = ["active", "past_due", "incomplete"].includes(subscriptionData.status) && subscriptionData.plan === "starter";
        if (hasStarterAccess) {
            return currentCount < 2;
        }
        const hasProAccess = ["active", "past_due", "incomplete"].includes(subscriptionData.status) && subscriptionData.plan === "pro";
        if (hasProAccess) {
            return true;
        }
        return false;
    };
    const getLayoutLimit = () => {
        console.log("getLayoutLimit called with:", {
            status: subscriptionData.status,
            plan: subscriptionData.plan,
            isLoading: subscriptionData.isLoading
        });
        if (subscriptionData.status === "trialing") {
            return null;
        }
        const hasStarterAccess = ["active", "past_due", "incomplete"].includes(subscriptionData.status) && subscriptionData.plan === "starter";
        if (hasStarterAccess) {
            console.log("Returning limit 2 for Starter plan");
            return 2;
        }
        const hasProAccess = ["active", "past_due", "incomplete"].includes(subscriptionData.status) && subscriptionData.plan === "pro";
        if (hasProAccess) {
            return null;
        }
        console.log("No subscription detected, returning 0");
        return 0;
    };
    const getIndicatorLimit = () => {
        if (subscriptionData.status === "trialing") {
            return null;
        }
        const hasStarterAccess = ["active", "past_due", "incomplete"].includes(subscriptionData.status) && subscriptionData.plan === "starter";
        if (hasStarterAccess) {
            return 2;
        }
        const hasProAccess = ["active", "past_due", "incomplete"].includes(subscriptionData.status) && subscriptionData.plan === "pro";
        if (hasProAccess) {
            return null;
        }
        return 0;
    };
    return /* @__PURE__ */ jsx(SubscriptionContext.Provider, { value: {
            ...subscriptionData,
            refreshSubscription,
            canAddMoreLayouts,
            canAddMoreIndicators,
            getLayoutLimit,
            getIndicatorLimit
        }, children });
}
function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (context === void 0) {
        throw new Error("useSubscription must be used within a SubscriptionProvider");
    }
    return context;
}
const MEASUREMENT_ID = "G-6RJTJKS2D7";
const initGA = () => {
    ReactGA.initialize(MEASUREMENT_ID);
};
const logPageView = (path2) => {
    ReactGA.send({ hitType: "pageview", page: path2 });
};
const trackFunnelEvent = (step, details) => {
    ReactGA.event({
        category: "Conversion_Funnel",
        action: step,
        ...details
    });
};
const FunnelSteps = {
    VIEW_PRICING: "view_pricing",
    CLICK_START_TRIAL: "click_start_trial",
    VIEW_PAYMENT_METHOD: "view_payment_method",
    CLICK_PURCHASE: "click_purchase",
    PURCHASE_COMPLETE: "purchase_complete"
};
const trackPricingView = (planName, price) => {
    trackFunnelEvent(FunnelSteps.VIEW_PRICING, {
        label: planName,
        value: price
    });
    ReactGA.event("view_item_list", {
        item_list_id: "pricing_plans",
        item_list_name: "Pricing Plans"
    });
};
const trackStartTrialClick = (planName, price) => {
    trackFunnelEvent(FunnelSteps.CLICK_START_TRIAL, {
        label: planName,
        value: price
    });
    ReactGA.event("begin_checkout", {
        currency: "USD",
        value: price,
        items: [{
                item_name: planName,
                price,
                quantity: 1
            }]
    });
};
const trackPaymentMethodView = (planName, price) => {
    trackFunnelEvent(FunnelSteps.VIEW_PAYMENT_METHOD, {
        label: planName,
        value: price
    });
    ReactGA.event("add_payment_info", {
        currency: "USD",
        value: price,
        payment_type: "card"
    });
};
const trackPurchaseClick = (planName, price) => {
    trackFunnelEvent(FunnelSteps.CLICK_PURCHASE, {
        label: planName,
        value: price
    });
};
const trackPurchaseComplete = (planName, price, transactionId) => {
    trackFunnelEvent(FunnelSteps.PURCHASE_COMPLETE, {
        label: planName,
        value: price
    });
    ReactGA.event("purchase", {
        transaction_id: transactionId || Date.now().toString(),
        value: price,
        currency: "USD",
        items: [{
                item_name: planName,
                price,
                quantity: 1
            }]
    });
};
const panelStyles = `
  .react-resizable-panel-group {
    display: flex;
  }
  
  .react-resizable-panel {
    overflow: hidden;
  }
  
  .react-resizable-panel-resize-handle {
    position: relative;
    z-index: 10;
  }
  
  .react-resizable-panel-resize-handle:hover {
    background-color: rgba(99, 102, 241, 0.1);
  }
  
  .react-resizable-panel-resize-handle:active {
    background-color: rgba(99, 102, 241, 0.2);
  }
  
  .react-resizable-panel-resize-handle[data-resize-handle-active] {
    background-color: rgba(99, 102, 241, 0.3);
  }
`;
const links = () => [
    // Favicon links
    { rel: "icon", type: "image/x-icon", href: "/favicon/favicon.ico" },
    { rel: "icon", type: "image/svg+xml", href: "/favicon/favicon.svg" },
    { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon/favicon-96x96.png" },
    { rel: "apple-touch-icon", sizes: "180x180", href: "/favicon/apple-touch-icon.png" },
    { rel: "manifest", href: "/site.webmanifest" },
    // Font preconnect and stylesheet
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous"
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Lexend:wght@100..900&display=swap"
    }
];
function Layout({ children }) {
    return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
            /* @__PURE__ */ jsxs("head", { children: [
                    /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
                    /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
                    /* @__PURE__ */ jsx(Meta, {}),
                    /* @__PURE__ */ jsx(Links, {}),
                    /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: { __html: panelStyles } })
                ] }),
            /* @__PURE__ */ jsxs("body", { children: [
                    children,
                    /* @__PURE__ */ jsx(ScrollRestoration, {}),
                    /* @__PURE__ */ jsx(Scripts, {})
                ] })
        ] });
}
function App() {
    const location = useLocation();
    useEffect(() => {
        initGA();
        if (typeof window !== "undefined") {
            window._cio = window._cio || [];
            const siteId = "4d9f36e34ddeda617136";
            if (!document.getElementById("cio-tracker")) {
                const script = document.createElement("script");
                script.async = true;
                script.id = "cio-tracker";
                script.setAttribute("data-site-id", siteId);
                script.src = "https://assets.customer.io/assets/track.js";
                document.body.appendChild(script);
            }
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.register("/sw.js").then((registration) => {
                    console.log("Service Worker registered with scope:", registration.scope);
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener("statechange", () => {
                                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                    console.log("New service worker available, reload for updates");
                                }
                            });
                        }
                    });
                }).catch((error) => {
                    console.error("Service Worker registration failed:", error);
                });
                navigator.serviceWorker.addEventListener("message", (event) => {
                    if (event.data.type === "SUBSCRIPTION_UPDATED") {
                        console.log("Subscription data updated via service worker");
                    }
                });
            }
        }
    }, []);
    useEffect(() => {
        logPageView(location.pathname + location.search);
    }, [location]);
    return /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(SubscriptionProvider, { children: /* @__PURE__ */ jsx(Outlet, {}) }) });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    Layout,
    default: App,
    links
}, Symbol.toStringTag, { value: "Module" }));
function Button({ children, variant = "primary", size = "md", fullWidth = false, asLink = false, to, href, outlineColor, className = "", ...props }) {
    const baseClasses = "font-medium rounded-full transition-all duration-300 inline-flex items-center justify-center gap-2";
    const sizeClasses = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-4 text-base"
    };
    const variantClasses = {
        primary: "bg-gradient-primary text-black hover:shadow-glow-green hover:scale-105",
        secondary: "bg-transparent border border-gray-600 text-white hover:border-pricing-green hover:bg-pricing-green hover:text-black",
        outline: "bg-transparent border-1 border-gray-500 text-white hover:bg-gray-500/10",
        blue: "bg-primary text-white hover:bg-primary/90 hover:scale-105 hover:shadow-lg"
    };
    const widthClass = fullWidth ? "w-full" : "";
    let finalClassName = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`;
    const customStyle = variant === "outline" && outlineColor ? { borderColor: outlineColor } : void 0;
    if (asLink && to) {
        return /* @__PURE__ */ jsx(Link, { to, className: finalClassName, style: customStyle, children });
    }
    if (href) {
        return /* @__PURE__ */ jsx("a", { href, className: finalClassName, style: customStyle, children });
    }
    return /* @__PURE__ */ jsx("button", { className: finalClassName, style: customStyle, ...props, children });
}
function GoogleSignInButton({ onSignIn, onError, disabled = false, className = "" }) {
    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            onSignIn == null ? void 0 : onSignIn();
        }
        catch (error) {
            const errorMessage = error.code === "auth/popup-closed-by-user" ? "Sign-in cancelled" : error.message || "Failed to sign in with Google";
            onError == null ? void 0 : onError(errorMessage);
        }
    };
    return /* @__PURE__ */ jsxs("button", {
        type: "button",
        onClick: handleGoogleSignIn,
        disabled,
        className: `w-full flex justify-center items-center px-4 py-2 border border-gray-500 rounded-md text-sm font-medium text-white bg-transparent hover:bg-gray-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-dark focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`,
        children: [
            /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5 mr-2", viewBox: "0 0 24 24", children: [
                    /* @__PURE__ */ jsx("path", {
                        fill: "#4285f4",
                        d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    }),
                    /* @__PURE__ */ jsx("path", {
                        fill: "#34a853",
                        d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    }),
                    /* @__PURE__ */ jsx("path", {
                        fill: "#fbbc05",
                        d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    }),
                    /* @__PURE__ */ jsx("path", {
                        fill: "#ea4335",
                        d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    })
                ] }),
            disabled ? "Signing in..." : "Continue with Google"
        ]
    });
}
function AccountMenu() {
    const { user } = useAuth();
    const { status, plan, trialEndsAt } = useSubscription();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [authError, setAuthError] = useState(null);
    const menuRef = useRef(null);
    const isOnChartPage = location.pathname === "/chart";
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    const handleSignOut = async () => {
        try {
            await logOut();
            setIsOpen(false);
        }
        catch (error) {
            console.error("Error signing out:", error);
        }
    };
    return /* @__PURE__ */ jsxs("div", { className: "relative", ref: menuRef, children: [
            /* @__PURE__ */ jsxs("button", {
                onClick: () => setIsOpen(!isOpen),
                className: "flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors",
                children: [
                    /* @__PURE__ */ jsx(User, { className: "h-5 w-5" }),
                    /* @__PURE__ */ jsx("span", { className: "hidden md:inline", children: user ? user.email : "Account" }),
                    /* @__PURE__ */ jsx(ChevronDown, { className: `h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}` })
                ]
            }),
            isOpen && /* @__PURE__ */ jsx("div", { className: "absolute left-0 right-0 sm:left-auto sm:right-0 mt-2 mx-4 sm:mx-0 sm:w-80 bg-black/95 backdrop-blur-sm border border-gray-800 rounded-lg shadow-xl z-[350]", children: user ? (
                // Signed-in menu
                /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
                        /* @__PURE__ */ jsxs("div", { className: "mb-4 pb-4 border-b border-gray-800", children: [
                                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400", children: "Signed in as" }),
                                /* @__PURE__ */ jsx("p", { className: "text-white font-medium break-all", children: user.email }),
                                status !== "none" && /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                                        status === "trialing" && trialEndsAt && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
                                                /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-yellow-500 flex-shrink-0" }),
                                                /* @__PURE__ */ jsxs("span", { className: "text-yellow-500 whitespace-nowrap", children: [
                                                        "Trial ends ",
                                                        new Date(trialEndsAt).toLocaleDateString()
                                                    ] })
                                            ] }),
                                        status === "active" && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 text-sm", children: plan === "pro" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                                                    /* @__PURE__ */ jsx(Crown, { className: "h-4 w-4 text-pricing-green flex-shrink-0" }),
                                                    /* @__PURE__ */ jsx("span", { className: "text-pricing-green whitespace-nowrap", children: "Pro Plan" })
                                                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                                                    /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-blue-500 flex-shrink-0" }),
                                                    /* @__PURE__ */ jsx("span", { className: "text-blue-500 whitespace-nowrap", children: "Starter Plan" })
                                                ] }) })
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                                !isOnChartPage && /* @__PURE__ */ jsx(Link, {
                                    to: "/chart",
                                    onClick: () => setIsOpen(false),
                                    className: "block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap",
                                    children: "Chart Dashboard"
                                }),
                                /* @__PURE__ */ jsx(Link, {
                                    to: "/billing",
                                    onClick: () => setIsOpen(false),
                                    className: "block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap",
                                    children: "Billing & Subscription"
                                }),
                                /* @__PURE__ */ jsx("button", {
                                    onClick: handleSignOut,
                                    className: "block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap",
                                    children: "Sign Out"
                                }),
                                /* @__PURE__ */ jsx(Link, {
                                    to: "/",
                                    onClick: () => setIsOpen(false),
                                    className: "block w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-800 rounded-md transition-colors whitespace-nowrap",
                                    children: "Home"
                                })
                            ] })
                    ] })) : (
                // Signed-out menu
                /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
                        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: "Sign in to Spot Canvas" }),
                        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mb-4", children: "Access professional trading charts with cloud sync" }),
                        authError && /* @__PURE__ */ jsx("div", { className: "text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded mb-3", children: authError }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                                /* @__PURE__ */ jsx(GoogleSignInButton, {
                                    onError: setAuthError,
                                    className: "w-full"
                                }),
                                /* @__PURE__ */ jsx(Button, {
                                    asLink: true,
                                    to: "/signin",
                                    variant: "secondary",
                                    fullWidth: true,
                                    onClick: () => setIsOpen(false),
                                    children: "Sign In"
                                }),
                                /* @__PURE__ */ jsx(Button, {
                                    asLink: true,
                                    to: "/signup",
                                    variant: "primary",
                                    fullWidth: true,
                                    onClick: () => setIsOpen(false),
                                    children: "Create Account"
                                })
                            ] })
                    ] })) })
        ] });
}
const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: "#ffffff",
            fontFamily: "system-ui, sans-serif",
            fontSize: "16px",
            "::placeholder": {
                color: "#6b7280"
            }
        },
        invalid: {
            color: "#ff5555",
            iconColor: "#ff5555"
        }
    }
};
function SimplePaymentForm({ priceId, selectedPlan, onSuccess }) {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMessage, setProcessingMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const handleSubmit = async (event) => {
        var _a, _b;
        event.preventDefault();
        if (!stripe || !elements) {
            return;
        }
        const price = selectedPlan.toLowerCase() === "starter" ? 9 : 29;
        trackPurchaseClick(selectedPlan, price);
        setIsProcessing(true);
        setErrorMessage(null);
        setProcessingMessage("Processing payment...");
        try {
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) {
                throw new Error("Card element not found");
            }
            const auth2 = getAuth();
            const user = auth2.currentUser;
            if (!user) {
                throw new Error("You must be logged in to subscribe");
            }
            const idToken = await user.getIdToken();
            const response = await fetch("https://billing-server-346028322665.europe-west1.run.app/api/subscriptions/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    price_id: priceId
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to create subscription");
            }
            const { client_secret, type } = data;
            setProcessingMessage("Authenticating payment...");
            let result;
            if (type === "setup_intent") {
                result = await stripe.confirmCardSetup(client_secret, {
                    payment_method: {
                        card: cardElement
                    }
                });
            }
            else {
                result = await stripe.confirmCardPayment(client_secret, {
                    payment_method: {
                        card: cardElement
                    }
                });
            }
            if (result.error) {
                throw new Error(result.error.message || "Payment confirmation failed");
            }
            setProcessingMessage("Activating subscription...");
            const confirmResponse = await fetch("https://billing-server-346028322665.europe-west1.run.app/api/subscriptions/confirm", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    subscription_id: data.subscription_id,
                    payment_intent_id: (_a = result.paymentIntent) == null ? void 0 : _a.id,
                    setup_intent_id: (_b = result.setupIntent) == null ? void 0 : _b.id
                })
            });
            const confirmData = await confirmResponse.json();
            if (!confirmResponse.ok) {
                throw new Error(confirmData.error || "Failed to confirm subscription");
            }
            if (onSuccess) {
                onSuccess();
            }
            else {
                navigate("/thank-you");
            }
        }
        catch (error) {
            console.error("Payment error:", error);
            setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
        }
        finally {
            setIsProcessing(false);
            setProcessingMessage("");
        }
    };
    return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-black/40 rounded-lg p-6 border border-gray-800", children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Payment Details" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-gray-400 text-sm mb-6", children: [
                            "Start your 7-day free trial of the ",
                            selectedPlan,
                            " plan. You won't be charged until the trial ends."
                        ] }),
                    /* @__PURE__ */ jsx("div", { className: "bg-black rounded-lg p-4 border border-gray-700", children: /* @__PURE__ */ jsx(CardElement, { options: CARD_ELEMENT_OPTIONS }) })
                ] }),
            errorMessage && /* @__PURE__ */ jsx("div", { className: "bg-red-500/10 border border-red-500/20 rounded-lg p-4", children: /* @__PURE__ */ jsx("p", { className: "text-red-400 text-sm", children: errorMessage }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                    /* @__PURE__ */ jsx(Button, {
                        type: "button",
                        onClick: () => navigate("/pricing"),
                        variant: "secondary",
                        fullWidth: true,
                        disabled: isProcessing,
                        children: "Cancel"
                    }),
                    /* @__PURE__ */ jsx(Button, {
                        type: "submit",
                        variant: "primary",
                        fullWidth: true,
                        disabled: !stripe || isProcessing,
                        children: isProcessing ? processingMessage || "Processing..." : "Start Free Trial"
                    })
                ] }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-xs text-center", children: "By confirming your subscription, you allow Spot Canvas to charge your payment method for this subscription and future renewals on a recurring basis." })
        ] });
}
function Footer({ variant = "default" }) {
    const isDark = variant === "dark";
    return /* @__PURE__ */ jsx("footer", {
        id: "contact",
        className: `${isDark ? "bg-black text-white border-t border-white/20" : "bg-accent-1 text-black rounded-t-3xl"}`,
        children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-6 py-12", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("h3", {
                                className: `${isDark ? "text-white" : "text-black"} font-bold mb-4`,
                                children: "Contact"
                            }),
                            /* @__PURE__ */ jsxs("div", {
                                className: `space-y-2 ${isDark ? "text-gray-300" : "text-black/80"} text-sm`,
                                children: [
                                    /* @__PURE__ */ jsx("p", { children: "Northern Peaks Development" }),
                                    /* @__PURE__ */ jsx("p", { children: "Espoo, Finland" }),
                                    /* @__PURE__ */ jsx("p", { className: "mt-4", children: "Contact Person: Anssi Piirainen" }),
                                    /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("a", {
                                            href: "tel:+358408498385",
                                            className: `${isDark ? "hover:text-white" : "hover:text-black"} font-medium transition-colors`,
                                            children: "+358 40 849 8385"
                                        }) }),
                                    /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("a", {
                                            href: "mailto:anssip@gmail.com",
                                            className: `${isDark ? "hover:text-white" : "hover:text-black"} font-medium transition-colors`,
                                            children: "anssi@spotcanvas.com"
                                        }) })
                                ]
                            })
                        ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("h3", {
                                className: `${isDark ? "text-white" : "text-black"} font-bold mb-4`,
                                children: "Navigation"
                            }),
                            /* @__PURE__ */ jsxs("nav", { className: "space-y-2", children: [
                                    /* @__PURE__ */ jsx(Link, {
                                        to: "/features",
                                        className: `block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`,
                                        children: "Features"
                                    }),
                                    /* @__PURE__ */ jsx(Link, {
                                        to: "/pricing",
                                        className: `block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`,
                                        children: "Pricing"
                                    }),
                                    /* @__PURE__ */ jsx(Link, {
                                        to: "/blog",
                                        className: `block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`,
                                        children: "Blog"
                                    }),
                                    /* @__PURE__ */ jsx(Link, {
                                        to: "/manual",
                                        className: `block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`,
                                        children: "User Manual"
                                    }),
                                    /* @__PURE__ */ jsx("a", {
                                        href: "mailto:anssi@spotcanvas.com",
                                        className: `block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`,
                                        children: "Contact Us"
                                    }),
                                    /* @__PURE__ */ jsx(Link, {
                                        to: "/terms",
                                        className: `block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`,
                                        children: "Terms of Service"
                                    })
                                ] })
                        ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("h3", {
                                className: `${isDark ? "text-white" : "text-black"} font-bold mb-4`,
                                children: "Community"
                            }),
                            /* @__PURE__ */ jsx("nav", { className: "space-y-2", children: /* @__PURE__ */ jsx("a", {
                                    href: "https://discord.gg/wXcRQ7M8Ey",
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className: `block ${isDark ? "text-gray-300 hover:text-white" : "text-black/80 hover:text-black"} font-medium transition-colors text-sm`,
                                    children: "Discord"
                                }) })
                        ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-between", children: [
                            /* @__PURE__ */ jsxs("div", { children: [
                                    /* @__PURE__ */ jsx(Link, { to: "/", className: "block mb-4", children: /* @__PURE__ */ jsx("img", {
                                            src: isDark ? "/full-logo-white.svg" : "/full-logo-black.svg",
                                            alt: "Spot Canvas",
                                            className: "h-10"
                                        }) }),
                                    /* @__PURE__ */ jsx("p", {
                                        className: `${isDark ? "text-gray-400" : "text-black/80"} text-sm`,
                                        children: "Trading charts for the on-chain generation"
                                    })
                                ] }),
                            /* @__PURE__ */ jsxs("p", {
                                className: `${isDark ? "text-gray-500" : "text-black/60"} text-xs mt-8`,
                                children: [
                                    "© ",
                                    ( /* @__PURE__ */new Date()).getFullYear(),
                                    " Northern Peaks Development. All rights reserved."
                                ]
                            })
                        ] })
                ] }) })
    });
}
const PREVIEW_DURATION_MINUTES = 5;
function ProtectedRoute({ children, fallback, allowPreview = false }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [previewExpired, setPreviewExpired] = useState(false);
    const [previewStartTime, setPreviewStartTime] = useState(null);
    useEffect(() => {
        if (allowPreview && !user) {
            const previewKey = "anonymous_preview_start";
            let storedTime = localStorage.getItem(previewKey);
            if (!storedTime) {
                const now = Date.now();
                localStorage.setItem(previewKey, now.toString());
                setPreviewStartTime(now);
            }
            else {
                const startTime = parseInt(storedTime);
                setPreviewStartTime(startTime);
                const elapsedMinutes = (Date.now() - startTime) / (1e3 * 60);
                if (elapsedMinutes >= PREVIEW_DURATION_MINUTES) {
                    setPreviewExpired(true);
                }
                else {
                    const remainingMs = PREVIEW_DURATION_MINUTES * 60 * 1e3 - (Date.now() - startTime);
                    const timer = setTimeout(() => {
                        setPreviewExpired(true);
                    }, remainingMs);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [allowPreview, user]);
    if (loading) {
        return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-lg text-gray-600", children: "Loading..." }) });
    }
    const hasAccess = user || allowPreview && !previewExpired;
    if (!hasAccess) {
        const isPricingFlow = location.pathname === "/payment-method";
        const redirectUrl = isPricingFlow ? `/signin?from=pricing&redirect=${encodeURIComponent(location.pathname + location.search)}` : "/signin";
        return fallback || /* @__PURE__ */ jsx(Navigate, { to: redirectUrl, replace: true });
    }
    return /* @__PURE__ */ jsx(Fragment, { children });
}
const meta$g = () => {
    return [
        { title: "Payment Method - Spot Canvas" },
        { name: "description", content: "Set up your payment method for Spot Canvas" }
    ];
};
async function loader$8({ request }) {
    const url = new URL(request.url);
    const selectedPlan = url.searchParams.get("plan") || "pro";
    const priceIds = {
        starter: "price_0Rx7Lb22sagdNJ63Z15hBqxP",
        // $9/month
        pro: "price_0Rx7MY22sagdNJ63sqxZfef5"
        // $29/month
    };
    return json({
        selectedPlan,
        priceId: priceIds[selectedPlan.toLowerCase()] || priceIds.pro
    });
}
function PaymentMethodPage() {
    const { selectedPlan, priceId } = useLoaderData();
    const navigate = useNavigate();
    const subscription = useSubscription();
    const [stripePromise, setStripePromise] = useState(null);
    const publishableKey = "pk_live_222sagdNJ631i28QVV4x2Sntq9eexUAZ0Tw8as1XE1K7s3jtmBe36eWuYYxK0uX25SxbRy2S1isbKOVhuidYg97kU001PDySw5o";
    useEffect(() => {
        {
            setStripePromise(loadStripe(publishableKey));
        }
    }, [publishableKey]);
    useEffect(() => {
        const price = selectedPlan.toLowerCase() === "starter" ? 9 : 29;
        trackPaymentMethodView(selectedPlan, price);
    }, [selectedPlan]);
    const hasActiveSubscription = subscription && subscription.status !== "none" && subscription.status !== "canceled" && subscription.status !== "incomplete" && subscription.status !== "incomplete_expired";
    const getSubscriptionMessage = () => {
        if (!subscription)
            return "";
        switch (subscription.status) {
            case "trialing":
                return `You're currently on a free trial of the ${subscription.plan} plan.`;
            case "active":
                return `You already have an active ${subscription.plan} subscription.`;
            case "past_due":
                return `Your ${subscription.plan} subscription has a payment issue that needs to be resolved.`;
            default:
                return `You already have a ${subscription.plan} subscription.`;
        }
    };
    return /* @__PURE__ */ jsx(ProtectedRoute, { children: /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-black relative overflow-hidden", children: [
                        /* @__PURE__ */ jsx("nav", { className: "relative z-20 p-6 border-b border-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [
                                    /* @__PURE__ */ jsx(Link, { to: "/", className: "flex items-center", children: /* @__PURE__ */ jsx("img", {
                                            src: "/full-logo-white.svg",
                                            alt: "Spot Canvas",
                                            className: "h-10"
                                        }) }),
                                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                                            /* @__PURE__ */ jsx("button", {
                                                onClick: () => navigate("/pricing"),
                                                className: "text-gray-400 hover:text-white transition-colors",
                                                children: "Back to Pricing"
                                            }),
                                            /* @__PURE__ */ jsx(AccountMenu, {})
                                        ] })
                                ] }) }),
                        /* @__PURE__ */ jsx("div", { className: "relative z-10 max-w-2xl mx-auto px-6 pt-12 pb-20", children: /* @__PURE__ */ jsxs("div", { className: "bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-8", children: [
                                    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold mb-2 text-white", children: "Payment Method" }),
                                    hasActiveSubscription ? /* @__PURE__ */ jsxs(Fragment, { children: [
                                            /* @__PURE__ */ jsxs("div", { className: "bg-accent-1/10 border border-accent-1/30 rounded-lg p-6 mb-6", children: [
                                                    /* @__PURE__ */ jsx("h3", { className: "text-accent-1 font-medium mb-2", children: "You Already Have a Subscription" }),
                                                    /* @__PURE__ */ jsx("p", { className: "text-gray-400 mb-4", children: getSubscriptionMessage() }),
                                                    /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm", children: "Visit your billing page to manage your subscription, update payment methods, or view invoices." })
                                                ] }),
                                            /* @__PURE__ */ jsx(Button, {
                                                onClick: () => navigate("/billing"),
                                                variant: "primary",
                                                fullWidth: true,
                                                children: "Manage Subscription"
                                            })
                                        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                                            /* @__PURE__ */ jsxs("p", { className: "text-gray-400 mb-8", children: [
                                                    "You selected the ",
                                                    /* @__PURE__ */ jsx("span", { className: "text-pricing-green font-semibold capitalize", children: selectedPlan }),
                                                    " plan"
                                                ] }),
                                            stripePromise ? /* @__PURE__ */ jsx(Elements, {
                                                stripe: stripePromise,
                                                options: {
                                                    appearance: {
                                                        theme: "night",
                                                        variables: {
                                                            colorPrimary: "#66ff66",
                                                            colorBackground: "#000000",
                                                            colorText: "#ffffff",
                                                            colorDanger: "#ff5555",
                                                            fontFamily: "system-ui, sans-serif",
                                                            spacingUnit: "4px",
                                                            borderRadius: "8px"
                                                        }
                                                    }
                                                },
                                                children: /* @__PURE__ */ jsx(SimplePaymentForm, { priceId, selectedPlan })
                                            }) : /* @__PURE__ */ jsxs("div", { className: "bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6", children: [
                                                    /* @__PURE__ */ jsx("h3", { className: "text-yellow-500 font-medium mb-2", children: "Stripe Configuration Required" }),
                                                    /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm mb-4", children: "To enable payment processing, please set the VITE_STRIPE_PUBLISHABLE_KEY environment variable." }),
                                                    /* @__PURE__ */ jsxs("p", { className: "text-gray-500 text-xs", children: [
                                                            "Add your Stripe publishable key to your .env file:",
                                                            /* @__PURE__ */ jsx("br", {}),
                                                            /* @__PURE__ */ jsx("code", { className: "text-gray-300", children: "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_..." })
                                                        ] })
                                                ] })
                                        ] })
                                ] }) }),
                        /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-pricing-green/5 rounded-full blur-3xl" }),
                        /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-pricing-green/5 rounded-full blur-3xl" })
                    ] }),
                /* @__PURE__ */ jsx(Footer, {})
            ] }) });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: PaymentMethodPage,
    loader: loader$8,
    meta: meta$g
}, Symbol.toStringTag, { value: "Module" }));
function Navigation({ showGetStarted = true, featuredPost }) {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const isActive = (path2) => {
        return location.pathname === path2;
    };
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMobileMenuOpen(false);
            }
        }
        if (isMobileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isMobileMenuOpen]);
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);
    return /* @__PURE__ */ jsxs("nav", { className: "relative z-20 p-6", ref: menuRef, children: [
            /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center", children: [
                            /* @__PURE__ */ jsx("img", {
                                src: "/icon-logo-white.svg",
                                alt: "Spot Canvas",
                                className: "h-10 md:hidden"
                            }),
                            /* @__PURE__ */ jsx("img", {
                                src: "/full-logo-white.svg",
                                alt: "Spot Canvas",
                                className: "h-10 hidden md:block"
                            })
                        ] }),
                    /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center md:gap-4 lg:gap-8", children: [
                            /* @__PURE__ */ jsx(Link, {
                                to: "/features",
                                className: `transition-colors ${isActive("/features") ? "text-white" : "text-gray-400 hover:text-white"}`,
                                children: "Features"
                            }),
                            /* @__PURE__ */ jsx(Link, {
                                to: "/pricing",
                                className: `transition-colors ${isActive("/pricing") ? "text-white" : "text-gray-400 hover:text-white"}`,
                                children: "Pricing"
                            }),
                            /* @__PURE__ */ jsx(Link, {
                                to: "/blog",
                                className: `transition-colors ${isActive("/blog") ? "text-white" : "text-gray-400 hover:text-white"}`,
                                children: "Blog"
                            }),
                            /* @__PURE__ */ jsx("a", {
                                href: "#contact",
                                className: "text-gray-400 hover:text-white transition-colors",
                                onClick: (e) => {
                                    var _a;
                                    e.preventDefault();
                                    (_a = document.getElementById("contact")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
                                },
                                children: "Contact"
                            }),
                            featuredPost && /* @__PURE__ */ jsxs(Link, {
                                to: `/blog/${featuredPost.slug}`,
                                className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500 bg-purple-500/10 hover:bg-purple-500/20 transition-colors",
                                children: [
                                    /* @__PURE__ */ jsx(Star, { className: "h-3.5 w-3.5 text-purple-400" }),
                                    /* @__PURE__ */ jsx("span", { className: "text-sm text-purple-300 font-medium whitespace-nowrap max-w-[200px] truncate", children: featuredPost.title })
                                ]
                            })
                        ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                            /* @__PURE__ */ jsx(AccountMenu, {}),
                            /* @__PURE__ */ jsx("button", {
                                onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen),
                                className: "md:hidden text-white hover:text-gray-300 transition-colors",
                                "aria-label": "Toggle menu",
                                children: isMobileMenuOpen ? /* @__PURE__ */ jsx(X, { className: "h-6 w-6" }) : /* @__PURE__ */ jsx(Menu, { className: "h-6 w-6" })
                            })
                        ] })
                ] }),
            isMobileMenuOpen && /* @__PURE__ */ jsx("div", { className: "md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-6", children: [
                                /* @__PURE__ */ jsx(Link, { to: "/", className: "flex items-center", children: /* @__PURE__ */ jsx("img", {
                                        src: "/icon-logo-white.svg",
                                        alt: "Spot Canvas",
                                        className: "h-10"
                                    }) }),
                                /* @__PURE__ */ jsx("button", {
                                    onClick: () => setIsMobileMenuOpen(false),
                                    className: "text-white hover:text-gray-300 transition-colors",
                                    "aria-label": "Close menu",
                                    children: /* @__PURE__ */ jsx(X, { className: "h-6 w-6" })
                                })
                            ] }),
                        /* @__PURE__ */ jsx("div", { className: "flex-1 flex flex-col justify-center px-8", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                                    /* @__PURE__ */ jsx(Link, {
                                        to: "/features",
                                        className: `block text-2xl transition-colors ${isActive("/features") ? "text-white" : "text-gray-400 hover:text-white"}`,
                                        children: "Features"
                                    }),
                                    /* @__PURE__ */ jsx(Link, {
                                        to: "/pricing",
                                        className: `block text-2xl transition-colors ${isActive("/pricing") ? "text-white" : "text-gray-400 hover:text-white"}`,
                                        children: "Pricing"
                                    }),
                                    /* @__PURE__ */ jsx(Link, {
                                        to: "/blog",
                                        className: `block text-2xl transition-colors ${isActive("/blog") ? "text-white" : "text-gray-400 hover:text-white"}`,
                                        children: "Blog"
                                    }),
                                    /* @__PURE__ */ jsx("a", {
                                        href: "#contact",
                                        className: "block text-2xl text-gray-400 hover:text-white transition-colors",
                                        onClick: (e) => {
                                            var _a;
                                            e.preventDefault();
                                            setIsMobileMenuOpen(false);
                                            (_a = document.getElementById("contact")) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
                                        },
                                        children: "Contact"
                                    }),
                                    featuredPost && /* @__PURE__ */ jsxs(Link, {
                                        to: `/blog/${featuredPost.slug}`,
                                        className: "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500 bg-purple-500/10",
                                        children: [
                                            /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 text-purple-400" }),
                                            /* @__PURE__ */ jsx("span", { className: "text-lg text-purple-300 font-medium", children: featuredPost.title })
                                        ]
                                    })
                                ] }) })
                    ] }) })
        ] });
}
function ManualCard({ entry: entry2 }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };
    return /* @__PURE__ */ jsx(Link, {
        to: `/manual/${entry2.slug}`,
        className: "group block h-full bg-gray-900 rounded-lg border border-gray-800 hover:border-green-500/50 transition-all duration-300 overflow-hidden",
        children: /* @__PURE__ */ jsxs("div", { className: "p-6 flex flex-col h-full", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                        /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm", children: entry2.category }),
                        /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: formatDate(entry2.publishDate) })
                    ] }),
                /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors line-clamp-2", children: entry2.title }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-400 mb-6 flex-1 line-clamp-3", children: entry2.excerpt }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-auto", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mr-3", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-green-400", children: entry2.author.split(" ").map((n) => n[0]).join("") }) }),
                                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-300", children: entry2.author })
                            ] }),
                        entry2.readingTime && /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: entry2.readingTime })
                    ] })
            ] })
    });
}
const MANUAL_PATH = path.join(process.cwd(), "app", "content", "manual");
function ensureManualDirectory() {
    if (!fs.existsSync(MANUAL_PATH)) {
        fs.mkdirSync(MANUAL_PATH, { recursive: true });
    }
}
function calculateReadingTime$1(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}
async function getAllManualEntries() {
    ensureManualDirectory();
    try {
        const files = fs.readdirSync(MANUAL_PATH);
        const markdownFiles = files.filter((file) => file.endsWith(".md"));
        const entries = markdownFiles.map((filename) => {
            const filePath = path.join(MANUAL_PATH, filename);
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const { data, content } = matter(fileContent);
            const slug = filename.replace(".md", "");
            const readingTime = calculateReadingTime$1(content);
            return {
                slug,
                title: data.title || "Untitled",
                excerpt: data.excerpt || "",
                author: data.author || "Spot Canvas Team",
                publishDate: data.publishDate || ( /* @__PURE__ */new Date()).toISOString(),
                category: data.category || "General",
                readingTime,
                published: data.published !== void 0 ? data.published : true,
                featured: data.featured || false,
                order: data.order || 999
            };
        });
        return entries.filter((entry2) => entry2.published === true).sort((a, b) => {
            if (a.order !== b.order) {
                return (a.order || 999) - (b.order || 999);
            }
            return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        });
    }
    catch (error) {
        console.error("Error reading manual entries:", error);
        return [];
    }
}
async function getManualEntry(slug) {
    ensureManualDirectory();
    try {
        const filePath = path.join(MANUAL_PATH, `${slug}.md`);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(fileContent);
        const isPublished = data.published !== void 0 ? data.published : true;
        if (!isPublished) {
            return null;
        }
        marked.setOptions({
            gfm: true,
            breaks: true,
            pedantic: false,
            headerIds: true,
            mangle: false,
            smartLists: true,
            smartypants: true
        });
        const htmlContent = marked(content);
        const readingTime = calculateReadingTime$1(content);
        return {
            slug,
            title: data.title || "Untitled",
            excerpt: data.excerpt || "",
            content: htmlContent,
            author: data.author || "Spot Canvas Team",
            publishDate: data.publishDate || ( /* @__PURE__ */new Date()).toISOString(),
            category: data.category || "General",
            readingTime,
            published: isPublished,
            featured: data.featured || false,
            order: data.order || 999
        };
    }
    catch (error) {
        console.error(`Error reading manual entry ${slug}:`, error);
        return null;
    }
}
const CacheProfiles = {
    // Static content that rarely changes - cache for 1 hour
    STATIC: {
        public: true,
        maxAge: 3600,
        // 1 hour browser cache
        sMaxAge: 3600,
        // 1 hour CDN cache
        staleWhileRevalidate: 86400
        // 24 hours stale-while-revalidate
    },
    // Blog posts - cache for 5 minutes, allow stale content while revalidating
    BLOG_POST: {
        public: true,
        maxAge: 300,
        // 5 minutes browser cache
        sMaxAge: 600,
        // 10 minutes CDN cache
        staleWhileRevalidate: 3600
        // 1 hour stale-while-revalidate
    },
    // Blog index - shorter cache for list pages
    BLOG_INDEX: {
        public: true,
        maxAge: 60,
        // 1 minute browser cache
        sMaxAge: 300,
        // 5 minutes CDN cache
        staleWhileRevalidate: 600
        // 10 minutes stale-while-revalidate
    },
    // Homepage - balance between freshness and performance
    HOMEPAGE: {
        public: true,
        maxAge: 120,
        // 2 minutes browser cache
        sMaxAge: 300,
        // 5 minutes CDN cache
        staleWhileRevalidate: 1800
        // 30 minutes stale-while-revalidate
    },
    // Pricing page - cache moderately as it may change occasionally
    PRICING: {
        public: true,
        maxAge: 600,
        // 10 minutes browser cache
        sMaxAge: 1800,
        // 30 minutes CDN cache
        staleWhileRevalidate: 3600
        // 1 hour stale-while-revalidate
    },
    // Manual entries - cache for 10 minutes, allow stale content while revalidating
    MANUAL_ENTRY: {
        public: true,
        maxAge: 600,
        // 10 minutes browser cache
        sMaxAge: 1200,
        // 20 minutes CDN cache
        staleWhileRevalidate: 3600
        // 1 hour stale-while-revalidate
    },
    // Manual index - shorter cache for list pages
    MANUAL_INDEX: {
        public: true,
        maxAge: 120,
        // 2 minutes browser cache
        sMaxAge: 300,
        // 5 minutes CDN cache
        staleWhileRevalidate: 600
        // 10 minutes stale-while-revalidate
    }
};
function getCacheControlHeader(options) {
    if (options.noCache) {
        return "no-cache, no-store, must-revalidate";
    }
    const directives = [];
    directives.push(options.public ? "public" : "private");
    if (options.maxAge !== void 0) {
        directives.push(`max-age=${options.maxAge}`);
    }
    if (options.sMaxAge !== void 0) {
        directives.push(`s-maxage=${options.sMaxAge}`);
    }
    if (options.staleWhileRevalidate !== void 0) {
        directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
    }
    return directives.join(", ");
}
function getCacheHeaders(options) {
    return {
        "Cache-Control": getCacheControlHeader(options)
    };
}
const meta$f = () => {
    return [
        { title: "User Manual | Spot Canvas - Learn How to Trade" },
        {
            name: "description",
            content: "Comprehensive user manual and documentation for Spot Canvas. Learn how to use our charting tools, technical indicators, and trading features."
        },
        { property: "og:title", content: "User Manual | Spot Canvas" },
        {
            property: "og:description",
            content: "Comprehensive user manual and documentation for Spot Canvas. Learn how to use our charting tools, technical indicators, and trading features."
        },
        { property: "og:type", content: "website" },
        { property: "twitter:card", content: "summary_large_image" },
        { property: "twitter:title", content: "User Manual | Spot Canvas" },
        {
            property: "twitter:description",
            content: "Comprehensive user manual and documentation for Spot Canvas. Learn how to use our charting tools, technical indicators, and trading features."
        }
    ];
};
const loader$7 = async () => {
    const entries = await getAllManualEntries();
    return json({ entries }, {
        headers: getCacheHeaders(CacheProfiles.MANUAL_INDEX)
    });
};
function ManualIndex() {
    const { entries } = useLoaderData();
    return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-black relative overflow-hidden", children: [
                    /* @__PURE__ */ jsx(Navigation, {}),
                    /* @__PURE__ */ jsxs("main", { className: "relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20", children: [
                            /* @__PURE__ */ jsxs("header", { className: "text-center mb-16", children: [
                                    /* @__PURE__ */ jsx("h1", { className: "text-5xl font-bold text-white mb-4", children: "User Manual" }),
                                    /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-400 max-w-2xl mx-auto", children: "Everything you need to know about using Spot Canvas effectively" })
                                ] }),
                            entries.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-20", children: /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-lg", children: "No manual entries available yet. Check back soon for comprehensive guides." }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                                    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: entries.map((entry2) => /* @__PURE__ */ jsx(ManualCard, { entry: entry2 }, entry2.slug)) }),
                                    entries.length < 3 && /* @__PURE__ */ jsx("div", { className: "mt-16 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-gray-400", children: "More guides and documentation coming soon." }) })
                                ] })
                        ] })
                ] }),
            /* @__PURE__ */ jsx(Footer, { variant: "dark" }),
            /* @__PURE__ */ jsx("script", {
                type: "application/ld+json",
                dangerouslySetInnerHTML: {
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "TechArticle",
                        name: "Spot Canvas User Manual",
                        description: "Comprehensive documentation and guides for using Spot Canvas trading platform",
                        publisher: {
                            "@type": "Organization",
                            name: "Spot Canvas",
                            logo: {
                                "@type": "ImageObject",
                                url: "https://spotcanvas.com/full-logo-white.svg"
                            }
                        },
                        hasPart: entries.map((entry2) => ({
                            "@type": "TechArticle",
                            headline: entry2.title,
                            description: entry2.excerpt,
                            author: {
                                "@type": "Person",
                                name: entry2.author
                            },
                            datePublished: entry2.publishDate,
                            url: `https://spotcanvas.com/manual/${entry2.slug}`
                        }))
                    })
                }
            })
        ] });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: ManualIndex,
    loader: loader$7,
    meta: meta$f
}, Symbol.toStringTag, { value: "Module" }));
const loader$6 = async ({ params }) => {
    const slug = params.slug;
    if (!slug) {
        return redirect("/manual");
    }
    const entry2 = await getManualEntry(slug);
    if (!entry2) {
        return redirect("/manual");
    }
    return json({ entry: entry2 }, {
        headers: getCacheHeaders(CacheProfiles.MANUAL_ENTRY)
    });
};
const meta$e = ({ data }) => {
    if (!data) {
        return [
            { title: "Page Not Found | Spot Canvas User Manual" },
            {
                name: "description",
                content: "The requested manual page could not be found."
            }
        ];
    }
    const { entry: entry2 } = data;
    return [
        { title: `${entry2.title} | Spot Canvas User Manual` },
        { name: "description", content: entry2.excerpt },
        { name: "author", content: entry2.author },
        { property: "article:published_time", content: entry2.publishDate },
        { property: "article:author", content: entry2.author },
        { property: "og:title", content: entry2.title },
        { property: "og:description", content: entry2.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:article:published_time", content: entry2.publishDate },
        { property: "og:article:author", content: entry2.author },
        { property: "twitter:card", content: "summary_large_image" },
        { property: "twitter:title", content: entry2.title },
        { property: "twitter:description", content: entry2.excerpt }
    ];
};
function ManualEntryPage() {
    const { entry: entry2 } = useLoaderData();
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };
    return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-black relative overflow-hidden", children: [
                    /* @__PURE__ */ jsx(Navigation, {}),
                    /* @__PURE__ */ jsxs("main", { className: "relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-20", children: [
                            /* @__PURE__ */ jsxs(Link, {
                                to: "/manual",
                                className: "inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8",
                                children: [
                                    /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
                                    "Back to User Manual"
                                ]
                            }),
                            /* @__PURE__ */ jsxs("article", { children: [
                                    /* @__PURE__ */ jsxs("header", { className: "mb-12", children: [
                                            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
                                                    /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm", children: entry2.category }),
                                                    /* @__PURE__ */ jsxs("span", { className: "text-gray-400", children: [
                                                            "Last updated: ",
                                                            formatDate(entry2.publishDate)
                                                        ] }),
                                                    entry2.readingTime && /* @__PURE__ */ jsxs("span", { className: "text-gray-400", children: [
                                                            "• ",
                                                            entry2.readingTime
                                                        ] })
                                                ] }),
                                            /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-5xl font-bold text-white mb-6", children: entry2.title }),
                                            /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                                                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-4", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-green-400", children: entry2.author.split(" ").map((n) => n[0]).join("") }) }),
                                                    /* @__PURE__ */ jsxs("div", { children: [
                                                            /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: entry2.author }),
                                                            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400", children: "Spot Canvas Team" })
                                                        ] })
                                                ] })
                                        ] }),
                                    /* @__PURE__ */ jsx("div", {
                                        className: "manual-content prose prose-invert max-w-none",
                                        dangerouslySetInnerHTML: { __html: entry2.content }
                                    })
                                ] }),
                            /* @__PURE__ */ jsxs("div", {
                                className: "mt-16 rounded-2xl border border-white/20 p-8 text-center shadow-sm",
                                style: {
                                    background: "linear-gradient(135deg, rgba(143, 255, 0, 0.1), rgba(93, 215, 0, 0.05))"
                                },
                                children: [
                                    /* @__PURE__ */ jsx("h3", { className: "text-2xl font-semibold text-white", children: "Ready to start trading?" }),
                                    /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-400", children: "Put your knowledge into practice with our professional charting tools." }),
                                    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(Button, { asLink: true, to: "/chart", variant: "primary", size: "lg", children: "Launch Dashboard" }) })
                                ]
                            }),
                            /* @__PURE__ */ jsx("div", { className: "mt-16 pt-8 border-gray-800", children: /* @__PURE__ */ jsxs(Link, {
                                    to: "/manual",
                                    className: "inline-flex items-center text-green-400 hover:text-green-300 transition-colors",
                                    children: [
                                        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
                                        "Back to all guides"
                                    ]
                                }) })
                        ] })
                ] }),
            /* @__PURE__ */ jsx(Footer, { variant: "dark" }),
            /* @__PURE__ */ jsx("script", {
                type: "application/ld+json",
                dangerouslySetInnerHTML: {
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "TechArticle",
                        headline: entry2.title,
                        description: entry2.excerpt,
                        author: {
                            "@type": "Person",
                            name: entry2.author
                        },
                        datePublished: entry2.publishDate,
                        publisher: {
                            "@type": "Organization",
                            name: "Spot Canvas",
                            logo: {
                                "@type": "ImageObject",
                                url: "https://spotcanvas.com/full-logo-white.svg"
                            }
                        },
                        mainEntityOfPage: {
                            "@type": "WebPage",
                            "@id": `https://spotcanvas.com/manual/${entry2.slug}`
                        }
                    })
                }
            }),
            /* @__PURE__ */ jsx("style", { jsx: true, children: `
        .manual-content {
          color: #e5e7eb;
        }
        .manual-content h1,
        .manual-content h2,
        .manual-content h3,
        .manual-content h4,
        .manual-content h5,
        .manual-content h6 {
          color: #ffffff;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .manual-content h1 {
          font-size: 2.25rem;
        }
        .manual-content h2 {
          font-size: 1.875rem;
        }
        .manual-content h3 {
          font-size: 1.5rem;
        }
        .manual-content p {
          margin-bottom: 1.25rem;
          line-height: 1.75;
        }
        .manual-content ul,
        .manual-content ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
        }
        .manual-content li {
          margin-bottom: 0.5rem;
        }
        .manual-content strong {
          color: #ffffff;
          font-weight: 600;
        }
        .manual-content code {
          background-color: rgba(143, 255, 0, 0.1);
          color: #8fff00;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }
        .manual-content pre {
          background-color: #1a1a1a;
          border: 1px solid rgba(143, 255, 0, 0.2);
          border-radius: 0.5rem;
          padding: 1rem;
          overflow-x: auto;
          margin-bottom: 1.25rem;
        }
        .manual-content pre code {
          background-color: transparent;
          padding: 0;
        }
        .manual-content table {
          width: 100%;
          margin-bottom: 1.25rem;
          border-collapse: collapse;
        }
        .manual-content th {
          background-color: rgba(143, 255, 0, 0.1);
          color: #ffffff;
          font-weight: 600;
          padding: 0.75rem;
          text-align: left;
          border: 1px solid rgba(143, 255, 0, 0.2);
        }
        .manual-content td {
          padding: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .manual-content blockquote {
          border-left: 4px solid #8fff00;
          padding-left: 1rem;
          margin-left: 0;
          margin-bottom: 1.25rem;
          font-style: italic;
          color: #9ca3af;
        }
        .manual-content a {
          color: #8fff00;
          text-decoration: underline;
        }
        .manual-content a:hover {
          color: #a3ff33;
        }
      ` })
        ] });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: ManualEntryPage,
    loader: loader$6,
    meta: meta$e
}, Symbol.toStringTag, { value: "Module" }));
const meta$d = () => {
    return [
        { title: "Verify Your Email - Spot Canvas" },
        { name: "description", content: "Check your inbox to verify your email address" }
    ];
};
function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const email = searchParams.get("email") || (user == null ? void 0 : user.email) || "";
    const marketingConsent = searchParams.get("marketing") === "true";
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    useEffect(() => {
        if (user == null ? void 0 : user.emailVerified) {
            navigate("/welcome");
        }
    }, [user, navigate]);
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1e3);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);
    const handleResendEmail = async () => {
        var _a, _b;
        if (resendCooldown > 0 || !user)
            return;
        setResending(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await sendVerificationEmail(user);
            setSuccessMessage("Verification email sent! Please check your inbox and spam folder.");
            setResendCooldown(60);
        }
        catch (err) {
            console.error("Failed to resend verification email:", err);
            if ((_a = err.message) == null ? void 0 : _a.includes("Too many")) {
                setError("Too many attempts. Please wait a few minutes before trying again.");
                setResendCooldown(300);
            }
            else if ((_b = err.message) == null ? void 0 : _b.includes("sign in again")) {
                setError("Session expired. Please sign in again to resend the email.");
            }
            else {
                setError("Failed to send verification email. Please check your email address or contact support.");
            }
        }
        finally {
            setResending(false);
        }
    };
    const handleChangeEmail = () => {
        navigate(`/signup?email=${encodeURIComponent(email)}`);
    };
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-primary-dark", children: [
            /* @__PURE__ */ jsx(Navigation, { showGetStarted: false }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full space-y-8", children: [
                        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                                /* @__PURE__ */ jsx("div", { className: "mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-accent-1/10 border-2 border-accent-1/30 mb-8", children: /* @__PURE__ */ jsx("svg", { className: "h-10 w-10 text-accent-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        }) }) }),
                                /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-extrabold text-white", children: [
                                        "Check your ",
                                        /* @__PURE__ */ jsx("span", { className: "text-accent-1", children: "inbox" })
                                    ] }),
                                /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-300", children: "We've sent a verification email to:" }),
                                /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg font-medium text-white", children: email }),
                                /* @__PURE__ */ jsx("p", { className: "mt-6 text-sm text-gray-400", children: "Click the link in the email to verify your account and get started. The email should arrive within a few minutes." })
                            ] }),
                        error && /* @__PURE__ */ jsx("div", { className: "rounded-md bg-red-500/10 p-4 border border-red-500/20", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-red-500", children: error }) }),
                        successMessage && /* @__PURE__ */ jsx("div", { className: "rounded-md bg-green-500/10 p-4 border border-green-500/20", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-green-500", children: successMessage }) }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                                /* @__PURE__ */ jsx(Button, {
                                    onClick: handleResendEmail,
                                    variant: "secondary",
                                    fullWidth: true,
                                    disabled: resending || resendCooldown > 0 || !user,
                                    children: resending ? "Sending..." : resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : "Resend verification email"
                                }),
                                /* @__PURE__ */ jsx("button", {
                                    onClick: handleChangeEmail,
                                    className: "w-full text-sm text-accent-1 hover:text-accent-2 transition-colors",
                                    children: "Wrong email? Sign up with a different address"
                                })
                            ] }),
                        /* @__PURE__ */ jsxs("div", { className: "mt-8 p-4 bg-primary-light rounded-lg border border-gray-700", children: [
                                /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-white mb-2", children: "Can't find the email?" }),
                                /* @__PURE__ */ jsxs("ul", { className: "text-sm text-gray-400 space-y-1", children: [
                                        /* @__PURE__ */ jsx("li", { children: "• Check your spam or junk folder" }),
                                        /* @__PURE__ */ jsxs("li", { children: [
                                                "• Make sure ",
                                                email,
                                                " is spelled correctly"
                                            ] }),
                                        /* @__PURE__ */ jsx("li", { children: "• Add noreply@spotcanvas.com to your contacts" }),
                                        /* @__PURE__ */ jsx("li", { children: "• Wait a few minutes for the email to arrive" })
                                    ] })
                            ] }),
                        marketingConsent && /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 text-center", children: "✓ You've opted in to receive product updates" })
                    ] }) })
        ] });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: VerifyEmail,
    meta: meta$d
}, Symbol.toStringTag, { value: "Module" }));
function BlogCard({ post }) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };
    return /* @__PURE__ */ jsx(Link, {
        to: `/blog/${post.slug}`,
        className: "group block h-full bg-gray-900 rounded-lg border border-gray-800 hover:border-purple-500/50 transition-all duration-300 overflow-hidden",
        children: /* @__PURE__ */ jsxs("div", { className: "p-6 flex flex-col h-full", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                        /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm", children: post.category }),
                        /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: formatDate(post.publishDate) })
                    ] }),
                /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors line-clamp-2", children: post.title }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-400 mb-6 flex-1 line-clamp-3", children: post.excerpt }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-auto", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-3", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-purple-400", children: post.author.split(" ").map((n) => n[0]).join("") }) }),
                                /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-300", children: post.author })
                            ] }),
                        post.readingTime && /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: post.readingTime })
                    ] })
            ] })
    });
}
const BLOG_PATH = path.join(process.cwd(), "app", "content", "blog");
function ensureBlogDirectory() {
    if (!fs.existsSync(BLOG_PATH)) {
        fs.mkdirSync(BLOG_PATH, { recursive: true });
    }
}
function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
}
async function getAllBlogPosts() {
    ensureBlogDirectory();
    try {
        const files = fs.readdirSync(BLOG_PATH);
        const markdownFiles = files.filter((file) => file.endsWith(".md"));
        const posts = markdownFiles.map((filename) => {
            const filePath = path.join(BLOG_PATH, filename);
            const fileContent = fs.readFileSync(filePath, "utf-8");
            const { data, content } = matter(fileContent);
            const slug = filename.replace(".md", "");
            const readingTime = calculateReadingTime(content);
            return {
                slug,
                title: data.title || "Untitled",
                excerpt: data.excerpt || "",
                author: data.author || "Spot Canvas Team",
                publishDate: data.publishDate || ( /* @__PURE__ */new Date()).toISOString(),
                category: data.category || "Uncategorized",
                readingTime,
                published: data.published !== void 0 ? data.published : true,
                featured: data.featured || false
            };
        });
        return posts.filter((post) => post.published === true).sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
    }
    catch (error) {
        console.error("Error reading blog posts:", error);
        return [];
    }
}
async function getBlogPost(slug) {
    ensureBlogDirectory();
    try {
        const filePath = path.join(BLOG_PATH, `${slug}.md`);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(fileContent);
        const isPublished = data.published !== void 0 ? data.published : true;
        if (!isPublished) {
            return null;
        }
        marked.setOptions({
            gfm: true,
            breaks: true,
            pedantic: false,
            headerIds: true,
            mangle: false,
            smartLists: true,
            smartypants: true
        });
        const htmlContent = marked(content);
        const readingTime = calculateReadingTime(content);
        return {
            slug,
            title: data.title || "Untitled",
            excerpt: data.excerpt || "",
            content: htmlContent,
            author: data.author || "Spot Canvas Team",
            publishDate: data.publishDate || ( /* @__PURE__ */new Date()).toISOString(),
            category: data.category || "Uncategorized",
            readingTime,
            published: isPublished,
            featured: data.featured || false
        };
    }
    catch (error) {
        console.error(`Error reading blog post ${slug}:`, error);
        return null;
    }
}
async function getFeaturedBlogPost() {
    const posts = await getAllBlogPosts();
    return posts.find((post) => post.featured === true) || null;
}
const meta$c = () => {
    return [
        { title: "Blog | Spot Canvas - Trading Insights & Updates" },
        {
            name: "description",
            content: "Stay updated with the latest trading insights, product updates, and market analysis from the Spot Canvas team."
        },
        { property: "og:title", content: "Blog | Spot Canvas" },
        {
            property: "og:description",
            content: "Stay updated with the latest trading insights, product updates, and market analysis from the Spot Canvas team."
        },
        { property: "og:type", content: "website" },
        { property: "twitter:card", content: "summary_large_image" },
        { property: "twitter:title", content: "Blog | Spot Canvas" },
        {
            property: "twitter:description",
            content: "Stay updated with the latest trading insights, product updates, and market analysis from the Spot Canvas team."
        }
    ];
};
const loader$5 = async () => {
    const posts = await getAllBlogPosts();
    return json({ posts }, {
        headers: getCacheHeaders(CacheProfiles.BLOG_INDEX)
    });
};
function BlogIndex() {
    const { posts } = useLoaderData();
    return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-black relative overflow-hidden", children: [
                    /* @__PURE__ */ jsx(Navigation, {}),
                    /* @__PURE__ */ jsxs("main", { className: "relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20", children: [
                            /* @__PURE__ */ jsxs("header", { className: "text-center mb-16", children: [
                                    /* @__PURE__ */ jsx("h1", { className: "text-5xl font-bold text-white mb-4", children: "Spot the Difference" }),
                                    /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-400 max-w-2xl mx-auto", children: "Insights, strategies, and analysis from the world of trading and finance" })
                                ] }),
                            posts.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-20", children: /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-lg", children: "No blog posts yet. Check back soon for the latest insights and strategies." }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                                    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: posts.map((post) => /* @__PURE__ */ jsx(BlogCard, { post }, post.slug)) }),
                                    posts.length < 3 && /* @__PURE__ */ jsx("div", { className: "mt-16 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-gray-400", children: "Stay tuned for the latest insights and strategies." }) })
                                ] })
                        ] })
                ] }),
            /* @__PURE__ */ jsx(Footer, { variant: "dark" }),
            /* @__PURE__ */ jsx("script", {
                type: "application/ld+json",
                dangerouslySetInnerHTML: {
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Blog",
                        name: "Spot Canvas Blog",
                        description: "Trading insights, product updates, and market analysis",
                        publisher: {
                            "@type": "Organization",
                            name: "Spot Canvas",
                            logo: {
                                "@type": "ImageObject",
                                url: "https://spotcanvas.com/full-logo-white.svg"
                            }
                        },
                        blogPost: posts.map((post) => ({
                            "@type": "BlogPosting",
                            headline: post.title,
                            description: post.excerpt,
                            author: {
                                "@type": "Person",
                                name: post.author
                            },
                            datePublished: post.publishDate,
                            url: `https://spotcanvas.com/blog/${post.slug}`
                        }))
                    })
                }
            })
        ] });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: BlogIndex,
    loader: loader$5,
    meta: meta$c
}, Symbol.toStringTag, { value: "Module" }));
const loader$4 = async ({ params }) => {
    const slug = params.slug;
    if (!slug) {
        return redirect("/blog");
    }
    const post = await getBlogPost(slug);
    if (!post) {
        return redirect("/blog");
    }
    return json({ post }, {
        headers: getCacheHeaders(CacheProfiles.BLOG_POST)
    });
};
const meta$b = ({ data }) => {
    if (!data) {
        return [
            { title: "Post Not Found | Spot Canvas Blog" },
            {
                name: "description",
                content: "The requested blog post could not be found."
            }
        ];
    }
    const { post } = data;
    return [
        { title: `${post.title} | Spot Canvas Blog` },
        { name: "description", content: post.excerpt },
        { name: "author", content: post.author },
        { property: "article:published_time", content: post.publishDate },
        { property: "article:author", content: post.author },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:article:published_time", content: post.publishDate },
        { property: "og:article:author", content: post.author },
        { property: "twitter:card", content: "summary_large_image" },
        { property: "twitter:title", content: post.title },
        { property: "twitter:description", content: post.excerpt }
    ];
};
function BlogPostPage() {
    const { post } = useLoaderData();
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };
    return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-black relative overflow-hidden", children: [
                    /* @__PURE__ */ jsx(Navigation, {}),
                    /* @__PURE__ */ jsxs("main", { className: "relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-20", children: [
                            /* @__PURE__ */ jsxs(Link, {
                                to: "/blog",
                                className: "inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8",
                                children: [
                                    /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
                                    "Back to Blog"
                                ]
                            }),
                            /* @__PURE__ */ jsxs("article", { children: [
                                    /* @__PURE__ */ jsxs("header", { className: "mb-12", children: [
                                            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
                                                    /* @__PURE__ */ jsx("span", { className: "px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm", children: post.category }),
                                                    /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: formatDate(post.publishDate) }),
                                                    post.readingTime && /* @__PURE__ */ jsxs("span", { className: "text-gray-400", children: [
                                                            "• ",
                                                            post.readingTime
                                                        ] })
                                                ] }),
                                            /* @__PURE__ */ jsx("h1", { className: "text-4xl md:text-5xl font-bold text-white mb-6", children: post.title }),
                                            /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
                                                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mr-4", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-purple-400", children: post.author.split(" ").map((n) => n[0]).join("") }) }),
                                                    /* @__PURE__ */ jsxs("div", { children: [
                                                            /* @__PURE__ */ jsx("p", { className: "font-medium text-white", children: post.author }),
                                                            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400", children: "Spot Canvas Team" })
                                                        ] })
                                                ] })
                                        ] }),
                                    /* @__PURE__ */ jsx("div", {
                                        className: "blog-content",
                                        dangerouslySetInnerHTML: { __html: post.content }
                                    })
                                ] }),
                            /* @__PURE__ */ jsxs("div", {
                                className: "mt-16 rounded-2xl border border-white/20 p-8 text-center shadow-sm",
                                style: {
                                    background: "linear-gradient(135deg, rgba(143, 255, 0, 0.1), rgba(93, 215, 0, 0.05))"
                                },
                                children: [
                                    /* @__PURE__ */ jsx("h3", { className: "text-2xl font-semibold text-white", children: "Ready to chart smarter?" }),
                                    /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-400", children: "Explore live charts in the dashboard." }),
                                    /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(Button, { asLink: true, to: "/chart", variant: "primary", size: "lg", children: "Launch Dashboard" }) })
                                ]
                            }),
                            /* @__PURE__ */ jsx("div", { className: "mt-16 pt-8 border-gray-800", children: /* @__PURE__ */ jsxs(Link, {
                                    to: "/blog",
                                    className: "inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors",
                                    children: [
                                        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4 mr-2" }),
                                        "Back to all posts"
                                    ]
                                }) })
                        ] })
                ] }),
            /* @__PURE__ */ jsx(Footer, { variant: "dark" }),
            /* @__PURE__ */ jsx("script", {
                type: "application/ld+json",
                dangerouslySetInnerHTML: {
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        headline: post.title,
                        description: post.excerpt,
                        author: {
                            "@type": "Person",
                            name: post.author
                        },
                        datePublished: post.publishDate,
                        publisher: {
                            "@type": "Organization",
                            name: "Spot Canvas",
                            logo: {
                                "@type": "ImageObject",
                                url: "https://spotcanvas.com/full-logo-white.svg"
                            }
                        },
                        mainEntityOfPage: {
                            "@type": "WebPage",
                            "@id": `https://spotcanvas.com/blog/${post.slug}`
                        }
                    })
                }
            })
        ] });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: BlogPostPage,
    loader: loader$4,
    meta: meta$b
}, Symbol.toStringTag, { value: "Module" }));
function Login({ title = "Authentication Required", description = "Please sign in to continue", showFeatures = false, layout = "horizontal", className = "" }) {
    const [authError, setAuthError] = useState(null);
    const features = [
        "Real-time cryptocurrency charts",
        "Technical indicators",
        "Portfolio tracking",
        "Live market data"
    ];
    if (layout === "vertical") {
        return /* @__PURE__ */ jsxs("div", { className: `flex flex-col items-center gap-6 ${className}`, children: [
                /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white mb-2", children: title }),
                        /* @__PURE__ */ jsx("p", { className: "text-gray-300 mb-4", children: description })
                    ] }),
                authError && /* @__PURE__ */ jsx("div", { className: "text-sm text-red-500 bg-red-500/10 px-3 py-1 rounded", children: authError }),
                showFeatures && /* @__PURE__ */ jsxs("div", { className: "text-center text-sm text-gray-300", children: [
                        /* @__PURE__ */ jsx("p", { className: "font-medium mb-2 text-white", children: "Features available after sign-in:" }),
                        /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: features.map((feature, index) => /* @__PURE__ */ jsxs("li", { children: [
                                    "• ",
                                    feature
                                ] }, index)) })
                    ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 w-full max-w-sm", children: [
                        /* @__PURE__ */ jsx(GoogleSignInButton, { onError: setAuthError, className: "w-full" }),
                        /* @__PURE__ */ jsx(Button, { asLink: true, to: "/signin", variant: "blue", fullWidth: true, children: "Sign In" }),
                        /* @__PURE__ */ jsx(Button, { asLink: true, to: "/signup", variant: "secondary", fullWidth: true, children: "Create Account" })
                    ] })
            ] });
    }
    return /* @__PURE__ */ jsxs("div", { className: `flex flex-col items-end gap-3 ${className}`, children: [
            authError && /* @__PURE__ */ jsx("div", { className: "text-sm text-red-500 bg-red-500/10 px-3 py-1 rounded", children: authError }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx(GoogleSignInButton, {
                        onError: setAuthError,
                        className: "px-3 py-1.5 text-xs"
                    }),
                    /* @__PURE__ */ jsx(Button, { asLink: true, to: "/signin", variant: "blue", size: "sm", children: "Sign In" }),
                    /* @__PURE__ */ jsx(Button, { asLink: true, to: "/signup", variant: "primary", size: "sm", children: "Sign Up" })
                ] })
        ] });
}
const ChartSettingsContext = createContext(void 0);
const DEFAULT_SETTINGS = {
    symbol: "BTC-USD",
    granularity: "ONE_HOUR",
    indicators: []
};
const ChartSettingsProvider = ({ children, initialSettings = DEFAULT_SETTINGS, onSettingsChange }) => {
    const [settings, setSettingsState] = useState(initialSettings);
    const chartSettingsRef = useRef(/* @__PURE__ */ new Map());
    const [, forceUpdate] = useState({});
    useEffect(() => {
        setSettingsState(initialSettings);
    }, [initialSettings]);
    const triggerUpdate = useCallback(() => {
        forceUpdate({});
    }, []);
    const setSymbol = useCallback((symbol, chartId) => {
        if (chartId) {
            const currentSettings = chartSettingsRef.current.get(chartId) || {
                ...settings
            };
            const newSettings = { ...currentSettings, symbol };
            chartSettingsRef.current.set(chartId, newSettings);
            onSettingsChange == null ? void 0 : onSettingsChange(newSettings, chartId);
            triggerUpdate();
        }
        else {
            const newSettings = { ...settings, symbol };
            setSettingsState(newSettings);
            onSettingsChange == null ? void 0 : onSettingsChange(newSettings);
        }
    }, [settings, onSettingsChange, triggerUpdate]);
    const setGranularity = useCallback((granularity, chartId) => {
        if (chartId) {
            const currentSettings = chartSettingsRef.current.get(chartId) || {
                ...settings
            };
            const newSettings = { ...currentSettings, granularity };
            chartSettingsRef.current.set(chartId, newSettings);
            onSettingsChange == null ? void 0 : onSettingsChange(newSettings, chartId);
            triggerUpdate();
        }
        else {
            const newSettings = { ...settings, granularity };
            setSettingsState(newSettings);
            onSettingsChange == null ? void 0 : onSettingsChange(newSettings);
        }
    }, [settings, onSettingsChange, triggerUpdate]);
    const setIndicators = useCallback((indicators, chartId) => {
        if (chartId) {
            const currentSettings = chartSettingsRef.current.get(chartId) || {
                ...settings
            };
            const resolvedIndicators = typeof indicators === "function" ? indicators(currentSettings.indicators) : indicators;
            const newSettings = { ...currentSettings, indicators: resolvedIndicators };
            chartSettingsRef.current.set(chartId, newSettings);
            onSettingsChange == null ? void 0 : onSettingsChange(newSettings, chartId);
            triggerUpdate();
        }
        else {
            const resolvedIndicators = typeof indicators === "function" ? indicators(settings.indicators) : indicators;
            const newSettings = { ...settings, indicators: resolvedIndicators };
            setSettingsState(newSettings);
            onSettingsChange == null ? void 0 : onSettingsChange(newSettings);
        }
    }, [settings, onSettingsChange, triggerUpdate]);
    const setSettings = useCallback((partialSettings, chartId) => {
        if (chartId) {
            const currentSettings = chartSettingsRef.current.get(chartId) || {
                ...settings
            };
            const newSettings = { ...currentSettings, ...partialSettings };
            chartSettingsRef.current.set(chartId, newSettings);
            onSettingsChange == null ? void 0 : onSettingsChange(newSettings, chartId);
            triggerUpdate();
        }
        else {
            const newSettings = { ...settings, ...partialSettings };
            setSettingsState(newSettings);
            onSettingsChange == null ? void 0 : onSettingsChange(newSettings);
        }
    }, [settings, onSettingsChange, triggerUpdate]);
    const registerChart = useCallback((chartId, initialSettings2) => {
        chartSettingsRef.current.set(chartId, initialSettings2);
        triggerUpdate();
    }, [triggerUpdate]);
    const unregisterChart = useCallback((chartId) => {
        chartSettingsRef.current.delete(chartId);
        triggerUpdate();
    }, [triggerUpdate]);
    const getChartSettings = useCallback((chartId) => {
        return chartSettingsRef.current.get(chartId);
    }, []);
    const contextValue = useMemo(() => ({
        settings,
        setSymbol,
        setGranularity,
        setIndicators,
        setSettings,
        registerChart,
        unregisterChart,
        getChartSettings,
        onSettingsChange
    }), [
        settings,
        setSymbol,
        setGranularity,
        setIndicators,
        setSettings,
        registerChart,
        unregisterChart,
        getChartSettings,
        onSettingsChange
    ]);
    return /* @__PURE__ */ jsx(ChartSettingsContext.Provider, { value: contextValue, children });
};
const useChartSettings = (chartId) => {
    const context = useContext(ChartSettingsContext);
    if (!context) {
        throw new Error("useChartSettings must be used within a ChartSettingsProvider");
    }
    if (chartId) {
        const chartSettings = context.getChartSettings(chartId) || context.settings;
        return {
            settings: chartSettings,
            setSymbol: (symbol) => context.setSymbol(symbol, chartId),
            setGranularity: (granularity) => context.setGranularity(granularity, chartId),
            setIndicators: (indicators) => context.setIndicators(indicators, chartId),
            setSettings: (settings) => context.setSettings(settings, chartId),
            registerChart: (chartIdOrInitialSettings, initialSettings) => {
                if (typeof chartIdOrInitialSettings === "string") {
                    context.registerChart(chartIdOrInitialSettings, initialSettings || context.settings);
                }
                else {
                    context.registerChart(chartId, chartIdOrInitialSettings);
                }
            },
            unregisterChart: (targetChartId) => context.unregisterChart(targetChartId || chartId),
            chartId
        };
    }
    return {
        settings: context.settings,
        setSymbol: context.setSymbol,
        setGranularity: context.setGranularity,
        setIndicators: context.setIndicators,
        setSettings: context.setSettings,
        registerChart: (chartIdOrInitialSettings, initialSettings) => {
            if (typeof chartIdOrInitialSettings === "string") {
                context.registerChart(chartIdOrInitialSettings, initialSettings || context.settings);
            }
            else {
                throw new Error("When using global chart settings, registerChart requires a chartId as the first parameter");
            }
        },
        unregisterChart: (targetChartId) => {
            if (targetChartId) {
                context.unregisterChart(targetChartId);
            }
        },
        getChartSettings: context.getChartSettings
    };
};
const SCChart = forwardRef(({ firestore, initialState, className, style, onReady, onError, chartId, onApiReady }, ref) => {
    var _a;
    console.log(`📈 SCChart: Component initialized with initialState:`, {
        hasInitialState: !!initialState,
        symbol: initialState == null ? void 0 : initialState.symbol,
        granularity: initialState == null ? void 0 : initialState.granularity,
        trendLineCount: ((_a = initialState == null ? void 0 : initialState.trendLines) == null ? void 0 : _a.length) || 0,
        trendLines: initialState == null ? void 0 : initialState.trendLines,
        chartId
    });
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const appRef = useRef(null);
    const apiRef = useRef(null);
    const symbolChangeHandlerRef = useRef(null);
    const indicatorChangeHandlerRef = useRef(null);
    const readyHandlerRef = useRef(null);
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [initError, setInitError] = useState(null);
    const [isApiReady, setIsApiReady] = useState(false);
    const uniqueChartId = useRef(chartId || `chart-${Math.random().toString(36).substr(2, 9)}`);
    const isInitializedRef = useRef(false);
    const isInitializingRef = useRef(false);
    const globalChartSettings = useChartSettings();
    const chartSettings = useChartSettings(uniqueChartId.current);
    useEffect(() => {
        setIsClient(true);
    }, []);
    useEffect(() => {
        if (initialState) {
            const chartId2 = uniqueChartId.current;
            const settings = {
                symbol: initialState.symbol || "BTC-USD",
                granularity: initialState.granularity || "ONE_HOUR",
                indicators: []
            };
            globalChartSettings.registerChart(chartId2, settings);
        }
        return () => {
            globalChartSettings.unregisterChart(uniqueChartId.current);
        };
    }, []);
    useImperativeHandle(ref, () => ({
        setSymbol: async (symbol) => {
            var _a2, _b;
            if (apiRef.current) {
                const currentSymbol = ((_b = (_a2 = apiRef.current).getSymbol) == null ? void 0 : _b.call(_a2)) || "";
                if (currentSymbol === symbol) {
                    return;
                }
                if (apiRef.current.setSymbol) {
                    try {
                        await apiRef.current.setSymbol(symbol);
                        chartSettings.setSymbol(symbol, uniqueChartId.current);
                    }
                    catch (error) {
                        console.error("Failed to set symbol:", error);
                        chartSettings.setSymbol(symbol, uniqueChartId.current);
                    }
                }
                else {
                    console.warn("setSymbol method not available on API");
                    chartSettings.setSymbol(symbol, uniqueChartId.current);
                }
            }
        },
        setGranularity: async (granularity) => {
            var _a2, _b;
            if (apiRef.current) {
                const currentGranularity = ((_b = (_a2 = apiRef.current).getGranularity) == null ? void 0 : _b.call(_a2)) || "";
                if (currentGranularity === granularity) {
                    return;
                }
                if (apiRef.current.setGranularity) {
                    try {
                        await apiRef.current.setGranularity(granularity);
                        chartSettings.setGranularity(granularity, uniqueChartId.current);
                    }
                    catch (error) {
                        console.error("Failed to set granularity:", error);
                        chartSettings.setGranularity(granularity, uniqueChartId.current);
                    }
                }
                else {
                    console.warn("setGranularity method not available on API");
                    chartSettings.setGranularity(granularity, uniqueChartId.current);
                }
            }
        },
        getSymbol: () => {
            var _a2;
            return ((_a2 = apiRef.current) == null ? void 0 : _a2.getSymbol()) || "";
        },
        getGranularity: () => {
            var _a2;
            return ((_a2 = apiRef.current) == null ? void 0 : _a2.getGranularity()) || "ONE_HOUR";
        },
        activateTrendLineTool: () => {
            var _a2;
            if ((_a2 = apiRef.current) == null ? void 0 : _a2.activateTrendLineTool) {
                apiRef.current.activateTrendLineTool();
            }
        },
        deactivateTrendLineTool: () => {
            var _a2;
            if ((_a2 = apiRef.current) == null ? void 0 : _a2.deactivateTrendLineTool) {
                apiRef.current.deactivateTrendLineTool();
            }
        },
        get api() {
            return apiRef.current;
        }
    }), []);
    const setupEventHandlers = useCallback((api, currentInitialState) => {
        if (!api.on)
            return;
        if (readyHandlerRef.current && api.off) {
            api.off("ready", readyHandlerRef.current);
        }
        if (symbolChangeHandlerRef.current && api.off) {
            api.off("symbolChange", symbolChangeHandlerRef.current);
        }
        if (indicatorChangeHandlerRef.current && api.off) {
            api.off("indicatorChange", indicatorChangeHandlerRef.current);
        }
        symbolChangeHandlerRef.current = (event) => {
            if (!isInitializedRef.current) {
                return;
            }
            if (event.newSymbol && event.newSymbol !== chartSettings.settings.symbol) {
                chartSettings.setSymbol(event.newSymbol, uniqueChartId.current);
            }
            if (event.newGranularity && event.newGranularity !== chartSettings.settings.granularity) {
                chartSettings.setGranularity(event.newGranularity, uniqueChartId.current);
            }
        };
        indicatorChangeHandlerRef.current = (event) => {
            if (!isInitializedRef.current) {
                return;
            }
            if (event.action === "show" && event.indicator) {
                chartSettings.setIndicators((currentIndicators) => {
                    const existingIndex = currentIndicators.findIndex((ind) => ind.id === event.indicator.id);
                    let updatedIndicators;
                    if (existingIndex >= 0) {
                        updatedIndicators = [...currentIndicators];
                        updatedIndicators[existingIndex] = {
                            ...updatedIndicators[existingIndex],
                            visible: true,
                            display: event.indicator.display === "main" ? "Overlay" : "Bottom",
                            params: event.indicator.params || {}
                        };
                    }
                    else {
                        updatedIndicators = [
                            ...currentIndicators,
                            {
                                id: event.indicator.id,
                                name: event.indicator.name,
                                display: event.indicator.display === "main" ? "Overlay" : "Bottom",
                                visible: true,
                                params: event.indicator.params || {},
                                scale: event.indicator.scale === "value" ? "Price" : "Value",
                                className: "MarketIndicator"
                            }
                        ];
                    }
                    console.log(`SCChart: Updated indicators for ${event.indicator.id}:`, updatedIndicators.map((i) => `${i.id}(${i.visible})`));
                    return updatedIndicators;
                }, uniqueChartId.current);
            }
            else if (event.action === "hide" && event.indicatorId) {
                chartSettings.setIndicators((currentIndicators) => {
                    const updatedIndicators = currentIndicators.map((ind) => ind.id === event.indicatorId ? { ...ind, visible: false } : ind);
                    console.log(`SCChart: Hidden indicator ${event.indicatorId}:`, updatedIndicators.map((i) => `${i.id}(${i.visible})`));
                    return updatedIndicators;
                }, uniqueChartId.current);
            }
        };
        readyHandlerRef.current = (event) => {
            console.log("SCChart: Chart ready event received:", event);
            isInitializedRef.current = true;
            setIsApiReady(true);
            if ((currentInitialState == null ? void 0 : currentInitialState.indicators) && Array.isArray(currentInitialState.indicators) && currentInitialState.indicators.length > 0 && api.showIndicator) {
                console.log("SCChart: Restoring indicators from initial state:", currentInitialState.indicators);
                if (api.setIndicators) {
                    const indicatorConfigs = currentInitialState.indicators.map((indicatorId) => ({
                        id: indicatorId,
                        name: indicatorId.toUpperCase(),
                        visible: true
                    }));
                    api.setIndicators(indicatorConfigs);
                }
                else {
                    currentInitialState.indicators.forEach((indicatorId) => {
                        if (indicatorId.length > 0) {
                            console.log(`SCChart: Restoring indicator '${indicatorId}'`);
                            try {
                                api.showIndicator({
                                    id: indicatorId,
                                    name: indicatorId.toUpperCase(),
                                    visible: true
                                });
                            }
                            catch (error) {
                                console.error(`SCChart: Failed to show indicator '${indicatorId}':`, error);
                            }
                        }
                    });
                }
            }
            setIsLoading(false);
            if (onReady) {
                onReady();
            }
        };
        api.on("ready", readyHandlerRef.current);
        api.on("symbolChange", symbolChangeHandlerRef.current);
        api.on("indicatorChange", indicatorChangeHandlerRef.current);
    }, [onReady, chartId]);
    useCallback(async (newSymbol, newGranularity) => {
        var _a2, _b, _c, _d;
        try {
            const currentIndicators = ((_b = (_a2 = apiRef.current) == null ? void 0 : _a2.getVisibleIndicators) == null ? void 0 : _b.call(_a2)) || [];
            const visibleIndicatorIds = currentIndicators.map((ind) => ind.id);
            const currentTrendLines = ((_d = (_c = apiRef.current) == null ? void 0 : _c.getTrendLines) == null ? void 0 : _d.call(_c)) || [];
            console.log("SCChart: Preserving indicators for reinit:", visibleIndicatorIds);
            console.log("SCChart: Preserving trend lines for reinit:", currentTrendLines.length);
            if (apiRef.current) {
                if (symbolChangeHandlerRef.current && apiRef.current.off) {
                    apiRef.current.off("symbolChange", symbolChangeHandlerRef.current);
                    symbolChangeHandlerRef.current = null;
                }
                if (indicatorChangeHandlerRef.current && apiRef.current.off) {
                    apiRef.current.off("indicatorChange", indicatorChangeHandlerRef.current);
                    indicatorChangeHandlerRef.current = null;
                }
                if (readyHandlerRef.current && apiRef.current.off) {
                    apiRef.current.off("ready", readyHandlerRef.current);
                    readyHandlerRef.current = null;
                }
                if (apiRef.current.dispose) {
                    apiRef.current.dispose();
                }
            }
            if (appRef.current && appRef.current.cleanup) {
                appRef.current.cleanup();
            }
            if (chartRef.current && chartRef.current.parentElement) {
                chartRef.current.parentElement.removeChild(chartRef.current);
            }
            apiRef.current = null;
            appRef.current = null;
            chartRef.current = null;
            const newInitialState = {
                symbol: newSymbol,
                granularity: newGranularity,
                trendLines: currentTrendLines
                // Preserve trend lines
                // Don't pass indicators - they will be restored after chart is ready
            };
            console.log(`📈 SCChart: Reinitializing chart with preserved state:`, {
                symbol: newInitialState.symbol,
                granularity: newInitialState.granularity,
                trendLineCount: newInitialState.trendLines.length,
                trendLines: newInitialState.trendLines,
                chartId: uniqueChartId.current
            });
            const container = document.querySelector(`[data-chart-id="${uniqueChartId.current}"]`);
            if (!container) {
                throw new Error(`Container not found: ${uniqueChartId.current}`);
            }
            const { createChartContainer, initChartWithApi } = await import("@anssipiirainen/sc-charts");
            const chartContainer = createChartContainer();
            chartRef.current = chartContainer;
            container.appendChild(chartContainer);
            console.log("initChartWithApi", {
                chartContainer,
                firebaseConfig,
                newInitialState
            });
            const { app: app2, api } = initChartWithApi(chartContainer, firebaseConfig, newInitialState);
            if (!app2 || !api) {
                throw new Error("Invalid app or api returned during reinitialization");
            }
            appRef.current = app2;
            apiRef.current = api;
            if (onApiReady && api) {
                onApiReady(api);
            }
            setupEventHandlers(api, {
                ...newInitialState,
                indicators: visibleIndicatorIds
            });
        }
        catch (error) {
            setInitError(`Chart reinitialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }, [firebaseConfig, setupEventHandlers]);
    useEffect(() => {
        setIsClient(true);
    }, []);
    useEffect(() => {
        var _a2, _b, _c;
        console.log(`📈 SCChart: TrendLine effect running - isApiReady: ${isApiReady}, apiRef.current: ${!!apiRef.current}, trendLines: ${((_a2 = initialState == null ? void 0 : initialState.trendLines) == null ? void 0 : _a2.length) || 0}`);
        if (!isApiReady || !apiRef.current || !(initialState == null ? void 0 : initialState.trendLines) || initialState.trendLines.length === 0) {
            return;
        }
        if (isApiReady && apiRef.current && (initialState == null ? void 0 : initialState.trendLines) && initialState.trendLines.length > 0) {
            console.log(`📈 SCChart: Detected trend lines in initialState, adding ${initialState.trendLines.length} trend lines to chart`);
            if (!apiRef.current.addTrendLine) {
                console.error(`📈 SCChart: addTrendLine method not available on API!`);
                console.log(`📈 SCChart: Available API methods:`, Object.keys(apiRef.current));
                return;
            }
            const currentTrendLines = ((_c = (_b = apiRef.current).getTrendLines) == null ? void 0 : _c.call(_b)) || [];
            const currentIds = new Set(currentTrendLines.map((line) => line.id));
            console.log(`📈 SCChart: Current trend lines in chart:`, currentTrendLines);
            initialState.trendLines.forEach((trendLine) => {
                var _a3;
                if (!currentIds.has(trendLine.id)) {
                    try {
                        console.log(`📈 SCChart: Adding trend line ${trendLine.id} to chart:`, JSON.stringify(trendLine, null, 2));
                        const result = (_a3 = apiRef.current) == null ? void 0 : _a3.addTrendLine({
                            ...trendLine,
                            selected: false
                            // trend lines from initial state should not be selected
                        });
                        console.log(`📈 SCChart: Add trend line result:`, result);
                    }
                    catch (error) {
                        console.error(`📈 SCChart: Failed to add trend line ${trendLine.id}:`, error);
                    }
                }
                else {
                    console.log(`📈 SCChart: Trend line ${trendLine.id} already exists in chart`);
                }
            });
            setTimeout(() => {
                var _a3, _b2;
                const updatedTrendLines = (_b2 = (_a3 = apiRef.current).getTrendLines) == null ? void 0 : _b2.call(_a3);
                console.log(`📈 SCChart: Verification - trend lines in chart after adding:`, updatedTrendLines);
            }, 500);
        }
    }, [initialState == null ? void 0 : initialState.trendLines, isApiReady]);
    useEffect(() => {
        if (!isClient || appRef.current || isInitializingRef.current) {
            return;
        }
        const initChart = async () => {
            isInitializingRef.current = true;
            try {
                setIsLoading(true);
                setInitError(null);
                const delay = 100 + uniqueChartId.current.length * 50;
                await new Promise((resolve) => setTimeout(resolve, delay));
                let container = document.querySelector(`[data-chart-id="${uniqueChartId.current}"]`);
                if (!container) {
                    const allContainers = document.querySelectorAll(".trading-chart:not([data-chart-id])");
                    if (allContainers.length > 0) {
                        const altContainer = allContainers[0];
                        altContainer.setAttribute("data-chart-id", uniqueChartId.current);
                        container = altContainer;
                    }
                    else {
                        throw new Error(`Container not found: ${uniqueChartId.current}`);
                    }
                }
                await initializeChart(container);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                setInitError(`Chart initialization failed: ${errorMessage}`);
                setIsLoading(false);
                isInitializingRef.current = false;
                if (onError) {
                    onError(errorMessage);
                }
            }
        };
        const initializeChart = async (container) => {
            const { createChartContainer, initChartWithApi } = await import("@anssipiirainen/sc-charts");
            if (!initChartWithApi) {
                throw new Error("initChartWithApi is not available");
            }
            const chartContainer = createChartContainer();
            chartRef.current = chartContainer;
            container.appendChild(chartContainer);
            const chartInitState = {
                symbol: (initialState == null ? void 0 : initialState.symbol) || "BTC-USD",
                granularity: (initialState == null ? void 0 : initialState.granularity) || "ONE_HOUR",
                // Remove indicators from initial state as they're added after chart is ready
                trendLines: (initialState == null ? void 0 : initialState.trendLines) || []
                // Include trend lines if provided
            };
            console.log(`📈 SCChart: Initializing chart with state:`, {
                symbol: chartInitState.symbol,
                granularity: chartInitState.granularity,
                trendLineCount: chartInitState.trendLines.length,
                trendLines: chartInitState.trendLines,
                chartId: uniqueChartId.current
            });
            const { app: app2, api } = initChartWithApi(chartContainer, firebaseConfig, chartInitState);
            if (!app2 || !api) {
                throw new Error("Invalid app or api returned");
            }
            appRef.current = app2;
            apiRef.current = api;
            if (api) {
                console.log(`📈 SCChart: API initialized and assigned to apiRef`);
                if (onApiReady) {
                    onApiReady(api);
                }
            }
            setupEventHandlers(api, initialState);
        };
        initChart();
    }, [isClient, setupEventHandlers]);
    useEffect(() => {
        return () => {
            if (apiRef.current) {
                if (readyHandlerRef.current && apiRef.current.off) {
                    apiRef.current.off("ready", readyHandlerRef.current);
                    readyHandlerRef.current = null;
                }
                if (symbolChangeHandlerRef.current && apiRef.current.off) {
                    apiRef.current.off("symbolChange", symbolChangeHandlerRef.current);
                    symbolChangeHandlerRef.current = null;
                }
                if (indicatorChangeHandlerRef.current && apiRef.current.off) {
                    apiRef.current.off("indicatorChange", indicatorChangeHandlerRef.current);
                    indicatorChangeHandlerRef.current = null;
                }
                if (apiRef.current.dispose) {
                    apiRef.current.dispose();
                }
            }
            if (appRef.current && appRef.current.cleanup) {
                appRef.current.cleanup();
            }
            if (chartRef.current && chartRef.current.parentElement) {
                chartRef.current.parentElement.removeChild(chartRef.current);
            }
        };
    }, []);
    if (!isClient || isLoading) {
        return /* @__PURE__ */ jsx("div", { className, style, children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full bg-black rounded", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                        /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" }),
                        /* @__PURE__ */ jsx("p", { className: "text-gray-400", children: "Loading..." })
                    ] }) }) });
    }
    if (initError) {
        return /* @__PURE__ */ jsx("div", { className, style, children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded", children: /* @__PURE__ */ jsxs("div", { className: "text-center p-4", children: [
                        /* @__PURE__ */ jsx("div", { className: "text-red-600 dark:text-red-400 mb-2", children: /* @__PURE__ */ jsx("svg", {
                                className: "w-8 h-8 mx-auto",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /* @__PURE__ */ jsx("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                })
                            }) }),
                        /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 dark:text-red-400 mb-3", children: "Chart initialization failed" }),
                        /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 dark:text-red-300 mb-3 max-w-xs", children: initError }),
                        /* @__PURE__ */ jsx("button", {
                            onClick: () => {
                                setInitError(null);
                                if (containerRef.current) {
                                    containerRef.current.innerHTML = "";
                                }
                            },
                            className: "px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors",
                            children: "Retry"
                        })
                    ] }) }) });
    }
    return /* @__PURE__ */ jsx("div", {
        ref: containerRef,
        className,
        style,
        "data-chart-id": uniqueChartId.current
    });
});
SCChart.displayName = "SCChart";
class RepositoryError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = "RepositoryError";
    }
}
class NetworkError extends RepositoryError {
    constructor(message, details) {
        super(message, "NETWORK_ERROR", details);
        this.name = "NetworkError";
    }
}
class ValidationError extends RepositoryError {
    constructor(message, details) {
        super(message, "VALIDATION_ERROR", details);
        this.name = "ValidationError";
    }
}
class Repository {
    constructor(userId) {
        __publicField(this, "userId");
        __publicField(this, "isInitialized", false);
        __publicField(this, "eventCallbacks", []);
        // Client-side caches
        __publicField(this, "layoutsCache", /* @__PURE__ */ new Map());
        __publicField(this, "chartsCache", /* @__PURE__ */ new Map());
        __publicField(this, "symbolsCache", /* @__PURE__ */ new Map());
        __publicField(this, "userSettingsCache", null);
        __publicField(this, "candlesCache", /* @__PURE__ */ new Map());
        // Firestore listeners
        __publicField(this, "unsubscribes", []);
        // Sync queue for offline operations
        __publicField(this, "syncQueue", []);
        __publicField(this, "isSyncing", false);
        this.userId = userId;
    }
    async initialize() {
        if (this.isInitialized) {
            console.log("Repository already initialized, skipping");
            return;
        }
        console.log("Repository: Starting initialization for user:", this.userId);
        try {
            console.log("Repository: Loading initial data...");
            await Promise.all([
                this.loadLayouts(),
                this.loadSymbols(),
                this.loadUserSettings()
            ]);
            console.log("Repository: Setting up real-time listeners...");
            this.setupRealtimeListeners();
            this.isInitialized = true;
            console.log("Repository initialized successfully");
            console.log(`Repository stats: ${this.layoutsCache.size} layouts, ${this.chartsCache.size} charts, ${this.symbolsCache.size} symbols`);
        }
        catch (error) {
            console.error("Failed to initialize repository:", error);
            throw new RepositoryError("Failed to initialize repository", "INIT_ERROR", error);
        }
    }
    // Layout Management
    async getLayouts() {
        this.ensureInitialized();
        return Array.from(this.layoutsCache.values());
    }
    async getLayout(layoutId) {
        this.ensureInitialized();
        return this.layoutsCache.get(layoutId) || null;
    }
    async saveLayout(layoutData) {
        this.ensureInitialized();
        const layoutId = this.generateId();
        const now = /* @__PURE__ */ new Date();
        const layout = {
            ...layoutData,
            id: layoutId,
            userId: this.userId,
            createdAt: now,
            updatedAt: now
        };
        this.validateLayout(layout);
        this.layoutsCache.set(layoutId, layout);
        this.queueSync(async () => {
            const layoutRef = doc(db, "settings", this.userId, "layouts", layoutId);
            await setDoc(layoutRef, {
                ...layout,
                createdAt: Timestamp.fromDate(layout.createdAt),
                updatedAt: Timestamp.fromDate(layout.updatedAt)
            });
        });
        this.emitEvent("layout_saved", layout);
        return layout;
    }
    async updateLayout(layoutId, updates) {
        this.ensureInitialized();
        const existingLayout = this.layoutsCache.get(layoutId);
        if (!existingLayout) {
            throw new RepositoryError("Layout not found", "NOT_FOUND", { layoutId });
        }
        const updatedLayout = {
            ...existingLayout,
            ...updates,
            id: layoutId,
            // Ensure ID doesn't change
            userId: this.userId,
            // Ensure userId doesn't change
            updatedAt: /* @__PURE__ */ new Date()
        };
        this.validateLayout(updatedLayout);
        this.layoutsCache.set(layoutId, updatedLayout);
        this.queueSync(async () => {
            const layoutRef = doc(db, "settings", this.userId, "layouts", layoutId);
            const updateData = {
                updatedAt: Timestamp.fromDate(updatedLayout.updatedAt)
            };
            if (updates.layout) {
                updateData.layout = updates.layout;
            }
            if (updates.name) {
                updateData.name = updates.name;
            }
            if (updates.starredSymbols !== void 0) {
                updateData.starredSymbols = updates.starredSymbols;
            }
            await updateDoc(layoutRef, updateData);
        });
        this.emitEvent("layout_updated", updatedLayout);
        return updatedLayout;
    }
    async deleteLayout(layoutId) {
        this.ensureInitialized();
        if (!this.layoutsCache.has(layoutId)) {
            throw new RepositoryError("Layout not found", "NOT_FOUND", { layoutId });
        }
        this.layoutsCache.delete(layoutId);
        this.queueSync(async () => {
            const layoutRef = doc(db, "settings", this.userId, "layouts", layoutId);
            await deleteDoc(layoutRef);
        });
        this.emitEvent("layout_deleted", { layoutId });
    }
    // Chart Management (Charts are now embedded in layouts)
    async getChart(chartId, layoutId) {
        this.ensureInitialized();
        const cachedChart = this.chartsCache.get(chartId);
        if (cachedChart) {
            return cachedChart;
        }
        if (layoutId) {
            const layout = await this.getLayout(layoutId);
            if (layout) {
                const chart = this.findChartInLayout(layout.layout, chartId);
                if (chart) {
                    this.chartsCache.set(chartId, chart);
                    return chart;
                }
            }
        }
        const layouts = await this.getLayouts();
        for (const layout of layouts) {
            const chart = this.findChartInLayout(layout.layout, chartId);
            if (chart) {
                this.chartsCache.set(chartId, chart);
                return chart;
            }
        }
        return null;
    }
    async saveChart(chartData, layoutId) {
        this.ensureInitialized();
        const chartId = this.generateId();
        const chart = {
            ...chartData,
            id: chartId
        };
        this.validateChart(chart);
        this.chartsCache.set(chartId, chart);
        this.emitEvent("chart_updated", chart);
        return chart;
    }
    async updateChart(chartId, updates, layoutId) {
        this.ensureInitialized();
        let existingChart = null;
        let targetLayout = null;
        if (layoutId) {
            const layout = await this.getLayout(layoutId);
            if (layout) {
                existingChart = this.findChartInLayout(layout.layout, chartId);
                if (existingChart) {
                    targetLayout = layout;
                }
            }
        }
        if (!existingChart || !targetLayout) {
            const layouts = await this.getLayouts();
            for (const layout of layouts) {
                const chart = this.findChartInLayout(layout.layout, chartId);
                if (chart) {
                    existingChart = chart;
                    targetLayout = layout;
                    break;
                }
            }
        }
        if (!existingChart || !targetLayout) {
            throw new RepositoryError("Chart not found", "NOT_FOUND", {
                chartId,
                layoutId
            });
        }
        const updatedChart = {
            ...existingChart,
            ...updates,
            id: chartId
            // Ensure ID doesn't change
        };
        this.validateChart(updatedChart);
        const updatedLayoutNode = this.updateChartInLayout(targetLayout.layout, chartId, updatedChart);
        await this.updateLayout(targetLayout.id, { layout: updatedLayoutNode });
        this.chartsCache.set(chartId, updatedChart);
        this.emitEvent("chart_updated", updatedChart);
        return updatedChart;
    }
    async deleteChart(chartId, layoutId) {
        this.ensureInitialized();
        let targetLayout = null;
        if (layoutId) {
            const layout = await this.getLayout(layoutId);
            if (layout) {
                const chart = this.findChartInLayout(layout.layout, chartId);
                if (chart) {
                    targetLayout = layout;
                }
            }
        }
        if (!targetLayout) {
            const layouts = await this.getLayouts();
            for (const layout of layouts) {
                const chart = this.findChartInLayout(layout.layout, chartId);
                if (chart) {
                    targetLayout = layout;
                    break;
                }
            }
        }
        if (!targetLayout) {
            throw new RepositoryError("Chart not found", "NOT_FOUND", {
                chartId,
                layoutId
            });
        }
        const updatedLayout = this.removeChartFromLayout(targetLayout.layout, chartId);
        await this.updateLayout(targetLayout.id, { layout: updatedLayout });
        this.chartsCache.delete(chartId);
    }
    // Symbol Management
    async getSymbols() {
        this.ensureInitialized();
        return Array.from(this.symbolsCache.values());
    }
    async getActiveSymbols() {
        this.ensureInitialized();
        return Array.from(this.symbolsCache.values()).filter((symbol) => symbol.active);
    }
    async getSymbol(exchangeId, symbol) {
        this.ensureInitialized();
        const key = `${exchangeId}:${symbol}`;
        return this.symbolsCache.get(key) || null;
    }
    // Live price data
    async getCandle(exchangeId, symbol, granularity) {
        this.ensureInitialized();
        const key = `${exchangeId}:${symbol}:${granularity}`;
        return this.candlesCache.get(key) || null;
    }
    subscribeToCandle(exchangeId, symbol, granularity, callback) {
        this.ensureInitialized();
        const candleRef = doc(db, "exchanges", exchangeId, "products", symbol, "intervals", granularity);
        const unsubscribe = onSnapshot(candleRef, (doc2) => {
            if (doc2.exists()) {
                const data = doc2.data();
                const candle = {
                    open: data.open,
                    high: data.high,
                    low: data.low,
                    close: data.close,
                    volume: data.volume,
                    timestamp: data.timestamp,
                    lastUpdate: data.lastUpdate.toDate()
                };
                const key = `${exchangeId}:${symbol}:${granularity}`;
                this.candlesCache.set(key, candle);
                callback(candle);
            }
        });
        this.unsubscribes.push(unsubscribe);
        return unsubscribe;
    }
    // User Settings
    async getSettings() {
        this.ensureInitialized();
        return this.userSettingsCache;
    }
    async updateSettings(settings) {
        this.ensureInitialized();
        const updatedSettings = {
            ...this.userSettingsCache,
            ...settings,
            userId: this.userId
            // Ensure userId doesn't change
        };
        this.userSettingsCache = updatedSettings;
        this.queueSync(async () => {
            const settingsRef = doc(db, "settings", this.userId);
            await setDoc(settingsRef, updatedSettings, { merge: true });
        });
        return updatedSettings;
    }
    async setActiveLayout(layoutId) {
        this.ensureInitialized();
        await this.updateSettings({
            activeLayoutId: layoutId
        });
        console.log("Active layout set to:", layoutId);
    }
    // General repository methods
    async sync() {
        if (this.isSyncing)
            return;
        this.isSyncing = true;
        try {
            while (this.syncQueue.length > 0) {
                const syncOperation = this.syncQueue.shift();
                if (syncOperation) {
                    await syncOperation();
                }
            }
            console.log("Repository sync completed");
        }
        catch (error) {
            console.error("Repository sync failed:", error);
            throw new NetworkError("Sync failed", error);
        }
        finally {
            this.isSyncing = false;
        }
    }
    isOnline() {
        return navigator.onLine;
    }
    // Event system
    addEventListener(callback) {
        this.eventCallbacks.push(callback);
        return () => {
            const index = this.eventCallbacks.indexOf(callback);
            if (index > -1) {
                this.eventCallbacks.splice(index, 1);
            }
        };
    }
    // Private methods
    async loadLayouts() {
        try {
            const layoutsRef = collection(db, "settings", this.userId, "layouts");
            const layoutsSnapshot = await getDocs(layoutsRef);
            layoutsSnapshot.forEach((doc2) => {
                const data = doc2.data();
                const layout = {
                    id: doc2.id,
                    name: data.name,
                    userId: data.userId,
                    layout: data.layout,
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt.toDate(),
                    starredSymbols: data.starredSymbols || []
                };
                this.layoutsCache.set(doc2.id, layout);
                this.extractAndCacheCharts(layout.layout);
            });
            console.log(`Loaded ${this.layoutsCache.size} layouts`);
            console.log(`Extracted ${this.chartsCache.size} charts from layouts`);
        }
        catch (error) {
            console.error("Failed to load layouts:", error);
        }
    }
    async loadSymbols() {
        try {
            const knownExchanges = ["coinbase"];
            for (const exchangeId of knownExchanges) {
                try {
                    const productsRef = collection(db, "exchanges", exchangeId, "products");
                    const productsSnapshot = await getDocs(productsRef);
                    if (productsSnapshot.empty) {
                        console.warn(`Repository.loadSymbols: No products found for exchange: ${exchangeId}`);
                        continue;
                    }
                    let activeCount = 0;
                    let usdCount = 0;
                    const symbolPromises = productsSnapshot.docs.map(async (productDoc) => {
                        var _a;
                        try {
                            const data = productDoc.data();
                            const isActive = await this.checkSymbolActivityFromCandles(exchangeId, productDoc.id);
                            const symbolParts = productDoc.id.split("-");
                            const baseAsset = symbolParts[0];
                            const quoteAsset = symbolParts[1];
                            const symbol = {
                                id: productDoc.id,
                                exchangeId,
                                symbol: productDoc.id,
                                baseAsset,
                                quoteAsset,
                                active: isActive,
                                lastUpdate: (_a = data.lastUpdate) == null ? void 0 : _a.toDate()
                            };
                            const key = `${exchangeId}:${productDoc.id}`;
                            this.symbolsCache.set(key, symbol);
                            if (symbol.active)
                                activeCount++;
                            if (symbol.quoteAsset === "USD")
                                usdCount++;
                            return symbol;
                        }
                        catch (productError) {
                            console.error(`Repository.loadSymbols: Error processing product ${productDoc.id}:`, productError);
                            return null;
                        }
                    });
                    await Promise.all(symbolPromises);
                    console.log(`Repository.loadSymbols: Exchange ${exchangeId}: ${activeCount} active symbols, ${usdCount} USD pairs`);
                }
                catch (exchangeError) {
                    console.error(`Repository.loadSymbols: Error loading products for exchange ${exchangeId}:`, exchangeError);
                }
            }
            const totalSymbols = this.symbolsCache.size;
            const activeSymbols = Array.from(this.symbolsCache.values()).filter((s) => s.active).length;
            const usdSymbols = Array.from(this.symbolsCache.values()).filter((s) => s.quoteAsset === "USD").length;
            const activeUsdSymbols = Array.from(this.symbolsCache.values()).filter((s) => s.active && s.quoteAsset === "USD").length;
            console.log(`Repository.loadSymbols: Successfully loaded ${totalSymbols} symbols into cache`);
            console.log(`Repository.loadSymbols: Active symbols: ${activeSymbols}`);
            console.log(`Repository.loadSymbols: USD symbols: ${usdSymbols}`);
            console.log(`Repository.loadSymbols: Active USD symbols: ${activeUsdSymbols}`);
            const sampleSymbols = Array.from(this.symbolsCache.values()).slice(0, 5);
            console.log("Repository.loadSymbols: Sample symbols:", sampleSymbols.map((s) => `${s.symbol} (active: ${s.active})`));
        }
        catch (error) {
            console.error("Repository.loadSymbols: Failed to load symbols:", error);
            if (error instanceof Error) {
                console.error("Repository.loadSymbols: Error message:", error.message);
                console.error("Repository.loadSymbols: Error stack:", error.stack);
            }
        }
    }
    async loadUserSettings() {
        try {
            const settingsRef = doc(db, "settings", this.userId);
            const settingsSnapshot = await getDoc(settingsRef);
            if (settingsSnapshot.exists()) {
                this.userSettingsCache = settingsSnapshot.data();
            }
            else {
                this.userSettingsCache = {
                    userId: this.userId,
                    theme: "dark",
                    defaultGranularity: "ONE_HOUR",
                    defaultSymbol: "BTC-USD"
                };
            }
            console.log("Loaded user settings");
        }
        catch (error) {
            console.error("Failed to load user settings:", error);
        }
    }
    setupRealtimeListeners() {
        const layoutsRef = collection(db, "settings", this.userId, "layouts");
        const layoutsUnsubscribe = onSnapshot(layoutsRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data();
                const layout = {
                    id: change.doc.id,
                    name: data.name,
                    userId: data.userId,
                    layout: data.layout,
                    createdAt: data.createdAt.toDate(),
                    updatedAt: data.updatedAt.toDate(),
                    starredSymbols: data.starredSymbols || []
                };
                if (change.type === "added" || change.type === "modified") {
                    this.layoutsCache.set(change.doc.id, layout);
                }
                else if (change.type === "removed") {
                    this.layoutsCache.delete(change.doc.id);
                }
            });
        });
        this.unsubscribes.push(layoutsUnsubscribe);
        const chartsRef = collection(db, "settings", this.userId, "charts");
        const chartsUnsubscribe = onSnapshot(chartsRef, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const chart = change.doc.data();
                if (change.type === "added" || change.type === "modified") {
                    this.chartsCache.set(change.doc.id, chart);
                }
                else if (change.type === "removed") {
                    this.chartsCache.delete(change.doc.id);
                }
            });
        });
        this.unsubscribes.push(chartsUnsubscribe);
    }
    queueSync(operation) {
        this.syncQueue.push(operation);
        if (this.isOnline() && !this.isSyncing) {
            setTimeout(() => this.sync(), 100);
        }
    }
    emitEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: /* @__PURE__ */ new Date()
        };
        this.eventCallbacks.forEach((callback) => {
            try {
                callback(event);
            }
            catch (error) {
                console.error("Error in repository event callback:", error);
            }
        });
    }
    validateLayout(layout) {
        if (!layout.name || layout.name.trim().length === 0) {
            throw new ValidationError("Layout name is required");
        }
        if (!layout.layout) {
            throw new ValidationError("Layout structure is required");
        }
        this.validateLayoutNode(layout.layout);
    }
    validateLayoutNode(node) {
        if (!node.type || !["split", "chart"].includes(node.type)) {
            throw new ValidationError("Invalid layout node type");
        }
        if (node.type === "split") {
            if (!node.direction || !["horizontal", "vertical"].includes(node.direction)) {
                throw new ValidationError("Invalid split direction");
            }
            if (typeof node.ratio !== "number" || node.ratio < 0 || node.ratio > 1) {
                throw new ValidationError("Invalid split ratio");
            }
            if (!Array.isArray(node.children) || node.children.length === 0) {
                throw new ValidationError("Split node must have children");
            }
            node.children.forEach((child) => this.validateLayoutNode(child));
        }
        else if (node.type === "chart") {
            if (!node.id || typeof node.id !== "string") {
                throw new ValidationError("Chart node must have a valid ID");
            }
        }
    }
    validateChart(chart) {
        if (!chart.symbol || typeof chart.symbol !== "string") {
            throw new ValidationError("Chart symbol is required");
        }
        if (!chart.granularity) {
            throw new ValidationError("Chart granularity is required");
        }
    }
    isSymbolActive(lastUpdate) {
        if (!lastUpdate)
            return true;
        const updateTime = lastUpdate.toDate ? lastUpdate.toDate() : lastUpdate;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
        return updateTime > weekAgo;
    }
    async checkSymbolActivityFromCandles(exchangeId, productId) {
        try {
            const candleRef = doc(db, "exchanges", exchangeId, "products", productId, "intervals", "ONE_HOUR");
            const candleSnap = await getDoc(candleRef);
            if (!candleSnap.exists()) {
                console.log(`Repository.loadSymbols: ${productId} - No candle data (inactive)`);
                return false;
            }
            const candleData = candleSnap.data();
            if (candleData.lastUpdate) {
                const lastUpdate = candleData.lastUpdate.toDate();
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1e3);
                const isRecent = lastUpdate > dayAgo;
                return isRecent;
            }
            const hasValidData = !!(candleData.close && candleData.open && candleData.high && candleData.low);
            console.log(`Repository.loadSymbols: ${productId} - No lastUpdate, valid data: ${hasValidData}`);
            return hasValidData;
        }
        catch (error) {
            console.warn(`Repository.loadSymbols: Could not check activity for ${exchangeId}:${productId}:`, error);
            return false;
        }
    }
    // Helper methods for manipulating charts within layouts
    findChartInLayout(node, chartId) {
        if (node.type === "chart") {
            const chartNode = node;
            if (chartNode.chart && chartNode.chart.id === chartId) {
                return chartNode.chart;
            }
            if (chartNode.chartId === chartId && chartNode.chart) {
                return chartNode.chart;
            }
        }
        else if (node.type === "split") {
            const splitNode = node;
            for (const child of splitNode.children) {
                const found = this.findChartInLayout(child, chartId);
                if (found)
                    return found;
            }
        }
        return null;
    }
    updateChartInLayout(node, chartId, updatedChart) {
        if (node.type === "chart") {
            const chartNode = node;
            if (chartNode.chart && (chartNode.chart.id === chartId || chartNode.chartId === chartId)) {
                const { chartId: _, ...nodeWithoutChartId } = chartNode;
                const updatedNode = {
                    ...nodeWithoutChartId,
                    chart: updatedChart
                };
                return updatedNode;
            }
            return node;
        }
        else if (node.type === "split") {
            const splitNode = node;
            return {
                ...splitNode,
                children: splitNode.children.map((child) => this.updateChartInLayout(child, chartId, updatedChart))
            };
        }
        return node;
    }
    removeChartFromLayout(node, chartId) {
        if (node.type === "split") {
            const splitNode = node;
            const filteredChildren = splitNode.children.filter((child) => {
                if (child.type === "chart") {
                    const chartNode = child;
                    return !(chartNode.chart && chartNode.chart.id === chartId || chartNode.chartId === chartId);
                }
                return true;
            });
            if (filteredChildren.length === 1) {
                return filteredChildren[0];
            }
            if (filteredChildren.length === 0) {
                return {
                    type: "chart",
                    id: this.generateId(),
                    chart: {
                        id: this.generateId(),
                        symbol: "BTC-USD",
                        granularity: "ONE_HOUR",
                        indicators: []
                    }
                };
            }
            return {
                ...splitNode,
                children: filteredChildren.map((child) => this.removeChartFromLayout(child, chartId))
            };
        }
        return node;
    }
    addChartToLayout(node, chartNode) {
        return {
            type: "split",
            direction: "horizontal",
            ratio: 0.5,
            children: [node, chartNode]
        };
    }
    extractAndCacheCharts(node) {
        if (node.type === "chart") {
            const chartNode = node;
            if (chartNode.chart) {
                this.chartsCache.set(chartNode.chart.id, chartNode.chart);
            }
        }
        else if (node.type === "split") {
            const splitNode = node;
            splitNode.children.forEach((child) => this.extractAndCacheCharts(child));
        }
    }
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    ensureInitialized() {
        if (!this.isInitialized) {
            throw new RepositoryError("Repository not initialized. Call initialize() first.", "NOT_INITIALIZED");
        }
    }
    // Layout-specific starred symbols
    async getLayoutStarredSymbols(layoutId) {
        this.ensureInitialized();
        const layout = await this.getLayout(layoutId);
        if (!layout) {
            return [];
        }
        return layout.starredSymbols || [];
    }
    async updateLayoutStarredSymbols(layoutId, symbols) {
        this.ensureInitialized();
        const layout = await this.getLayout(layoutId);
        if (!layout) {
            throw new RepositoryError("Layout not found", "NOT_FOUND", { layoutId });
        }
        await this.updateLayout(layoutId, {
            starredSymbols: symbols
        });
    }
    // Trend Line Management - stored under charts
    async getTrendLines(layoutId, chartId) {
        this.ensureInitialized();
        try {
            const trendLinesRef = collection(db, "settings", this.userId, "layouts", layoutId, "charts", chartId, "trendLines");
            const snapshot = await getDocs(trendLinesRef);
            const trendLines = [];
            snapshot.forEach((doc2) => {
                const data = doc2.data();
                trendLines.push({
                    id: doc2.id,
                    ...data
                });
            });
            return trendLines;
        }
        catch (error) {
            console.error("Failed to get trend lines:", error);
            throw new RepositoryError("Failed to get trend lines", "TRENDLINE_FETCH_ERROR", error);
        }
    }
    async saveTrendLine(layoutId, chartId, trendLine) {
        this.ensureInitialized();
        try {
            const trendLineRef = doc(db, "settings", this.userId, "layouts", layoutId, "charts", chartId, "trendLines", trendLine.id);
            await setDoc(trendLineRef, trendLine);
        }
        catch (error) {
            console.error("Failed to save trend line:", error);
            throw new RepositoryError("Failed to save trend line", "TRENDLINE_SAVE_ERROR", error);
        }
    }
    async updateTrendLine(layoutId, chartId, trendLineId, updates) {
        this.ensureInitialized();
        try {
            const trendLineRef = doc(db, "settings", this.userId, "layouts", layoutId, "charts", chartId, "trendLines", trendLineId);
            await updateDoc(trendLineRef, updates);
        }
        catch (error) {
            console.error("Failed to update trend line:", error);
            throw new RepositoryError("Failed to update trend line", "TRENDLINE_UPDATE_ERROR", error);
        }
    }
    async deleteTrendLine(layoutId, chartId, trendLineId) {
        this.ensureInitialized();
        try {
            const trendLineRef = doc(db, "settings", this.userId, "layouts", layoutId, "charts", chartId, "trendLines", trendLineId);
            await deleteDoc(trendLineRef);
        }
        catch (error) {
            console.error("Failed to delete trend line:", error);
            throw new RepositoryError("Failed to delete trend line", "TRENDLINE_DELETE_ERROR", error);
        }
    }
    // Cleanup
    destroy() {
        this.unsubscribes.forEach((unsubscribe) => unsubscribe());
        this.unsubscribes = [];
        this.eventCallbacks = [];
        this.layoutsCache.clear();
        this.chartsCache.clear();
        this.symbolsCache.clear();
        this.candlesCache.clear();
        this.userSettingsCache = null;
        this.isInitialized = false;
    }
}
let repositoryInstance = null;
function getRepository(userId) {
    if (!repositoryInstance || repositoryInstance["userId"] !== userId) {
        repositoryInstance == null ? void 0 : repositoryInstance.destroy();
        repositoryInstance = new Repository(userId);
    }
    return repositoryInstance;
}
function destroyRepository() {
    if (repositoryInstance) {
        repositoryInstance.destroy();
        repositoryInstance = null;
    }
}
function useRepository() {
    const { user } = useAuth();
    const [repository, setRepository] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const initializingRef = useRef(false);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);
    useEffect(() => {
        async function initializeRepository() {
            console.log("useRepository: initializeRepository called", {
                userEmail: user == null ? void 0 : user.email,
                isInitializing: initializingRef.current,
                mounted: mountedRef.current
            });
            if (!(user == null ? void 0 : user.email)) {
                console.log("useRepository: No user email, setting isLoading to false");
                if (mountedRef.current) {
                    setIsLoading(false);
                }
                return;
            }
            if (initializingRef.current) {
                console.log("useRepository: Already initializing, skipping");
                return;
            }
            console.log("useRepository: Starting repository initialization");
            initializingRef.current = true;
            if (mountedRef.current) {
                setIsLoading(true);
                setError(null);
            }
            try {
                const userId = user.email;
                const repo = getRepository(userId);
                console.log("useRepository: Calling repo.initialize()");
                await repo.initialize();
                console.log("useRepository: Repository initialized successfully");
                console.log("useRepository: Checking mounted state:", mountedRef.current);
                if (mountedRef.current) {
                    console.log("useRepository: Setting repository and isOnline");
                    setRepository(repo);
                    setIsOnline(repo.isOnline());
                    setIsLoading(false);
                    console.log("useRepository: Repository state updated successfully");
                }
                else {
                    console.log("useRepository: Component unmounted, skipping state update");
                }
            }
            catch (err) {
                console.error("Failed to initialize repository:", err);
                if (mountedRef.current) {
                    setError(err instanceof Error ? err.message : "Failed to initialize repository");
                    setIsLoading(false);
                }
            }
            finally {
                initializingRef.current = false;
                console.log("useRepository: Initialization completed");
            }
        }
        if (user == null ? void 0 : user.email) {
            initializeRepository();
        }
        else {
            setIsLoading(false);
        }
    }, [user == null ? void 0 : user.email]);
    useEffect(() => {
        function handleOnline() {
            setIsOnline(true);
            if (repository) {
                repository.sync().catch(console.error);
            }
        }
        function handleOffline() {
            setIsOnline(false);
        }
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [repository]);
    useEffect(() => {
        return () => {
            if (!user) {
                destroyRepository();
            }
        };
    }, [user]);
    return {
        repository,
        isLoading,
        error,
        isOnline
    };
}
function useLayouts() {
    const { repository, isLoading: repoLoading, error: repoError } = useRepository();
    const [layouts, setLayouts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!repository || repoLoading)
            return;
        async function loadLayouts() {
            if (!repository)
                return;
            try {
                setIsLoading(true);
                setError(null);
                const layouts2 = await repository.getLayouts();
                setLayouts(layouts2);
            }
            catch (err) {
                console.error("Failed to load layouts:", err);
                setError(err instanceof Error ? err.message : "Failed to load layouts");
            }
            finally {
                setIsLoading(false);
            }
        }
        loadLayouts();
        const unsubscribe = repository == null ? void 0 : repository.addEventListener((event) => {
            if (event.type === "layout_saved" || event.type === "layout_updated") {
                setLayouts((prev) => {
                    const updated = [...prev];
                    const index = updated.findIndex((l) => l.id === event.data.id);
                    if (index >= 0) {
                        updated[index] = event.data;
                    }
                    else {
                        updated.push(event.data);
                    }
                    return updated;
                });
            }
            else if (event.type === "layout_deleted") {
                setLayouts((prev) => prev.filter((l) => l.id !== event.data.layoutId));
            }
        });
        return unsubscribe || (() => {
        });
    }, [repository, repoLoading]);
    const saveLayout = async (layoutData) => {
        if (!repository) {
            throw new Error("Repository not available");
        }
        return await repository.saveLayout(layoutData);
    };
    const updateLayout = async (layoutId, updates) => {
        if (!repository) {
            throw new Error("Repository not available");
        }
        return await repository.updateLayout(layoutId, updates);
    };
    const deleteLayout = async (layoutId) => {
        if (!repository) {
            throw new Error("Repository not available");
        }
        await repository.deleteLayout(layoutId);
    };
    const getLayout = (layoutId) => {
        return layouts.find((l) => l.id === layoutId) || null;
    };
    return {
        layouts,
        isLoading: isLoading || repoLoading,
        error: error || repoError,
        saveLayout,
        updateLayout,
        deleteLayout,
        getLayout
    };
}
function useCharts() {
    const { repository, isLoading: repoLoading, error: repoError } = useRepository();
    const [charts, setCharts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!repository || repoLoading)
            return;
        setCharts([]);
        setIsLoading(false);
        const unsubscribe = repository == null ? void 0 : repository.addEventListener((event) => {
            if (event.type === "chart_updated") {
                setCharts((prev) => {
                    const updated = [...prev];
                    const index = updated.findIndex((c) => c.id === event.data.id);
                    if (index >= 0) {
                        updated[index] = event.data;
                    }
                    else {
                        updated.push(event.data);
                    }
                    return updated;
                });
            }
        });
        return unsubscribe || (() => {
        });
    }, [repository, repoLoading]);
    const saveChart = async (chartData, layoutId) => {
        if (!repository) {
            throw new Error("Repository not available");
        }
        return await repository.saveChart(chartData, layoutId || "default");
    };
    const updateChart = async (chartId, updates, layoutId) => {
        if (!repository) {
            throw new Error("Repository not available");
        }
        return await repository.updateChart(chartId, updates, layoutId || "default");
    };
    const deleteChart = async (chartId, layoutId) => {
        if (!repository) {
            throw new Error("Repository not available");
        }
        await repository.deleteChart(chartId, layoutId || "default");
    };
    const getChart = (chartId, layoutId) => {
        const cachedChart = charts.find((c) => c.id === chartId);
        if (cachedChart)
            return cachedChart;
        return null;
    };
    return {
        charts,
        isLoading: isLoading || repoLoading,
        error: error || repoError,
        saveChart,
        updateChart,
        deleteChart,
        getChart
    };
}
function useSymbols() {
    const { user } = useAuth();
    const { repository, isLoading: repoLoading, error: repoError } = useRepository();
    const [symbols, setSymbols] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const DEFAULT_PREVIEW_SYMBOLS = [
        {
            id: "coinbase:BTC-USD",
            exchangeId: "coinbase",
            symbol: "BTC-USD",
            baseAsset: "BTC",
            quoteAsset: "USD",
            displayName: "Bitcoin",
            active: true,
            minOrderSize: 1e-5,
            maxOrderSize: 1e4,
            tickSize: 0.01,
            status: "online",
            tradingDisabled: false,
            auctionMode: false,
            productType: "SPOT",
            quoteCurrencyId: "USD",
            baseCurrencyId: "BTC",
            fcmTradingSessionDetails: null,
            midMarketPrice: ""
        },
        {
            id: "coinbase:ETH-USD",
            exchangeId: "coinbase",
            symbol: "ETH-USD",
            baseAsset: "ETH",
            quoteAsset: "USD",
            displayName: "Ethereum",
            active: true,
            minOrderSize: 1e-4,
            maxOrderSize: 1e4,
            tickSize: 0.01,
            status: "online",
            tradingDisabled: false,
            auctionMode: false,
            productType: "SPOT",
            quoteCurrencyId: "USD",
            baseCurrencyId: "ETH",
            fcmTradingSessionDetails: null,
            midMarketPrice: ""
        },
        {
            id: "coinbase:SOL-USD",
            exchangeId: "coinbase",
            symbol: "SOL-USD",
            baseAsset: "SOL",
            quoteAsset: "USD",
            displayName: "Solana",
            active: true,
            minOrderSize: 1e-3,
            maxOrderSize: 1e4,
            tickSize: 0.01,
            status: "online",
            tradingDisabled: false,
            auctionMode: false,
            productType: "SPOT",
            quoteCurrencyId: "USD",
            baseCurrencyId: "SOL",
            fcmTradingSessionDetails: null,
            midMarketPrice: ""
        },
        {
            id: "coinbase:DOGE-USD",
            exchangeId: "coinbase",
            symbol: "DOGE-USD",
            baseAsset: "DOGE",
            quoteAsset: "USD",
            displayName: "Dogecoin",
            active: true,
            minOrderSize: 1,
            maxOrderSize: 1e7,
            tickSize: 1e-5,
            status: "online",
            tradingDisabled: false,
            auctionMode: false,
            productType: "SPOT",
            quoteCurrencyId: "USD",
            baseCurrencyId: "DOGE",
            fcmTradingSessionDetails: null,
            midMarketPrice: ""
        }
    ];
    useEffect(() => {
        console.log("useSymbols: Effect triggered", {
            hasUser: !!user,
            hasRepository: !!repository,
            repoLoading,
            repoError
        });
        if (!user) {
            console.log("useSymbols: No user, using default preview symbols");
            setSymbols(DEFAULT_PREVIEW_SYMBOLS);
            setIsLoading(false);
            setError(null);
            return;
        }
        if (!repository || repoLoading) {
            console.log("useSymbols: Repository not ready, skipping symbol loading");
            return;
        }
        async function loadSymbols() {
            if (!repository)
                return;
            console.log("useSymbols: Starting to load symbols...");
            try {
                setIsLoading(true);
                setError(null);
                console.log("useSymbols: Calling repository.getSymbols()");
                const symbols2 = await repository.getSymbols();
                console.log("useSymbols: Got symbols from repository:", symbols2.length);
                setSymbols(symbols2);
            }
            catch (err) {
                console.error("useSymbols: Failed to load symbols:", err);
                setError(err instanceof Error ? err.message : "Failed to load symbols");
            }
            finally {
                setIsLoading(false);
                console.log("useSymbols: Loading complete");
            }
        }
        loadSymbols();
    }, [user, repository, repoLoading]);
    const activeSymbols = symbols.filter((symbol) => symbol.active);
    const getSymbol = (exchangeId, symbol) => {
        return symbols.find((s) => s.exchangeId === exchangeId && s.symbol === symbol) || null;
    };
    return {
        symbols,
        activeSymbols,
        isLoading: user ? isLoading || repoLoading : false,
        error: user ? error || repoError : null,
        getSymbol
    };
}
function useUserSettings() {
    const { repository, isLoading: repoLoading, error: repoError } = useRepository();
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!repository || repoLoading)
            return;
        async function loadSettings() {
            if (!repository)
                return;
            try {
                setIsLoading(true);
                setError(null);
                const settings2 = await repository.getSettings();
                setSettings(settings2);
            }
            catch (err) {
                console.error("Failed to load user settings:", err);
                setError(err instanceof Error ? err.message : "Failed to load user settings");
            }
            finally {
                setIsLoading(false);
            }
        }
        loadSettings();
    }, [repository, repoLoading]);
    const updateSettings = async (updates) => {
        if (!repository) {
            throw new Error("Repository not available");
        }
        const updated = await repository.updateSettings(updates);
        setSettings(updated);
        return updated;
    };
    const setActiveLayout = async (layoutId) => {
        if (!repository) {
            throw new Error("Repository not available");
        }
        await repository.setActiveLayout(layoutId);
        setSettings((prev) => prev ? { ...prev, activeLayoutId: layoutId } : null);
    };
    return {
        settings,
        isLoading: isLoading || repoLoading,
        error: error || repoError,
        updateSettings,
        setActiveLayout
    };
}
function useStarredSymbols(layoutId) {
    const { user } = useAuth();
    const { repository, isLoading: repoLoading, error: repoError } = useRepository();
    const [starredSymbols, setStarredSymbols] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!user) {
            setStarredSymbols([]);
            setIsLoading(false);
            setError(null);
            return;
        }
        if (!repository || repoLoading || !layoutId)
            return;
        async function loadStarredSymbols() {
            if (!repository || !layoutId)
                return;
            try {
                setIsLoading(true);
                setError(null);
                const symbols = await repository.getLayoutStarredSymbols(layoutId);
                setStarredSymbols(symbols);
            }
            catch (err) {
                console.error("Failed to load starred symbols:", err);
                setError(err instanceof Error ? err.message : "Failed to load starred symbols");
            }
            finally {
                setIsLoading(false);
            }
        }
        loadStarredSymbols();
        const unsubscribe = repository == null ? void 0 : repository.addEventListener((event) => {
            if (event.type === "layout_updated" && event.data.id === layoutId) {
                loadStarredSymbols();
            }
        });
        return unsubscribe || (() => {
        });
    }, [user, repository, repoLoading, layoutId]);
    const updateStarredSymbols = async (symbols) => {
        if (!repository || !layoutId) {
            throw new Error("Repository or layoutId not available");
        }
        await repository.updateLayoutStarredSymbols(layoutId, symbols);
        setStarredSymbols(symbols);
    };
    const isSymbolStarred = (symbol) => {
        return starredSymbols.includes(symbol);
    };
    return {
        starredSymbols,
        isLoading: user ? isLoading || repoLoading || !layoutId : false,
        error: user ? error || repoError : null,
        updateStarredSymbols,
        isSymbolStarred
    };
}
const useIndicators = (firestore) => {
    const [indicators, setIndicators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchIndicators = async () => {
        if (!firestore) {
            setError("Firestore not available");
            setIsLoading(false);
            return;
        }
        try {
            setIsLoading(true);
            setError(null);
            const indicatorsRef = collection(firestore, "indicators");
            const q = query(indicatorsRef, orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);
            const loadedIndicators = [];
            querySnapshot.forEach((doc2) => {
                const data = doc2.data();
                loadedIndicators.push({
                    id: doc2.id,
                    name: data.name || doc2.id,
                    display: data.display || "Overlay",
                    visible: data.visible || false,
                    params: data.params || {},
                    scale: data.scale || "Price",
                    className: data.className || "MarketIndicator"
                });
            });
            setIndicators(loadedIndicators);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load indicators";
            setError(errorMessage);
            console.error("Error loading indicators:", err);
            const fallbackIndicators = [
                {
                    id: "volume",
                    name: "Volume",
                    display: "Bottom",
                    visible: false,
                    params: {},
                    scale: "Value",
                    className: "VolumeIndicator"
                },
                {
                    id: "rsi",
                    name: "RSI",
                    display: "Bottom",
                    visible: false,
                    params: { period: 14 },
                    scale: "Value",
                    className: "RSIIndicator"
                },
                {
                    id: "macd",
                    name: "MACD",
                    display: "Bottom",
                    visible: false,
                    params: { fast: 12, slow: 26, signal: 9 },
                    scale: "Value",
                    className: "MACDIndicator"
                },
                {
                    id: "bollinger-bands",
                    name: "Bollinger Bands",
                    display: "Overlay",
                    visible: false,
                    params: { period: 20, stdDev: 2 },
                    scale: "Price",
                    className: "BollingerBandsIndicator"
                },
                {
                    id: "moving-average-20",
                    name: "Moving Average (20)",
                    display: "Overlay",
                    visible: false,
                    params: { period: 20, type: "sma" },
                    scale: "Price",
                    className: "MovingAverageIndicator"
                },
                {
                    id: "moving-average-50",
                    name: "Moving Average (50)",
                    display: "Overlay",
                    visible: false,
                    params: { period: 50, type: "sma" },
                    scale: "Price",
                    className: "MovingAverageIndicator"
                },
                {
                    id: "ema-12",
                    name: "EMA (12)",
                    display: "Overlay",
                    visible: false,
                    params: { period: 12, type: "ema" },
                    scale: "Price",
                    className: "MovingAverageIndicator"
                },
                {
                    id: "stochastic",
                    name: "Stochastic",
                    display: "Bottom",
                    visible: false,
                    params: { kPeriod: 14, dPeriod: 3, smooth: 3 },
                    scale: "Value",
                    className: "StochasticIndicator"
                }
            ];
            setIndicators(fallbackIndicators);
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        fetchIndicators();
    }, [firestore]);
    return {
        indicators,
        isLoading,
        error,
        refetch: fetchIndicators
    };
};
const ToolbarButton = ({ onClick, disabled = false, title, active = false, variant = "default", className = "", children }) => {
    const baseClasses = "flex items-center justify-center px-2 py-1 text-sm border rounded transition-colors h-[28px]";
    const variantClasses = {
        default: active ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700 hover:border-blue-600" : "bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
        danger: "bg-gray-800 border-gray-700 text-white hover:bg-red-900 hover:border-red-700"
    };
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
    return /* @__PURE__ */ jsx("button", {
        onClick,
        disabled,
        title,
        className: `${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`,
        children
    });
};
const ToolbarDropdownButton = React.forwardRef(({ disabled = false, title, active = false, className = "", children, ...props }, ref) => {
    const baseClasses = "flex items-center gap-1 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 text-white transition-colors h-[28px]";
    const activeClasses = active ? "bg-gray-700 text-blue-400" : "";
    const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
    return /* @__PURE__ */ jsx("button", {
        ref,
        disabled,
        title,
        className: `${baseClasses} ${activeClasses} ${disabledClasses} ${className}`,
        ...props,
        children
    });
});
ToolbarDropdownButton.displayName = "ToolbarDropdownButton";
const UpgradePrompt = ({ feature, onClose }) => {
    const { status, plan } = useSubscription();
    const getMessage = () => {
        if (status === "none" || status === "canceled") {
            return {
                title: "Subscription Required",
                message: feature === "layouts" ? "Subscribe to save and manage chart layouts" : "Subscribe to add technical indicators to your charts",
                buttonText: "View Plans",
                buttonLink: "/pricing"
            };
        }
        if (status === "active" && plan === "starter") {
            return {
                title: "Upgrade to Pro",
                message: feature === "layouts" ? "You've reached your limit of 2 saved layouts. Upgrade to Pro for unlimited layouts." : "You've reached your limit of 2 indicators per chart. Upgrade to Pro for unlimited indicators.",
                buttonText: "Upgrade to Pro",
                buttonLink: "/billing"
            };
        }
        return null;
    };
    const content = getMessage();
    if (!content)
        return null;
    return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-2", children: content.title }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 dark:text-gray-300 mb-4", children: content.message }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
                        /* @__PURE__ */ jsx("button", {
                            onClick: onClose,
                            className: "px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200",
                            children: "Cancel"
                        }),
                        /* @__PURE__ */ jsx(Link, {
                            to: content.buttonLink,
                            className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700",
                            children: content.buttonText
                        })
                    ] })
            ] }) });
};
const GRANULARITY_OPTIONS = [
    { value: "ONE_MINUTE", label: "1m" },
    { value: "FIVE_MINUTE", label: "5m" },
    { value: "FIFTEEN_MINUTE", label: "15m" },
    { value: "THIRTY_MINUTE", label: "30m" },
    { value: "ONE_HOUR", label: "1h" },
    { value: "TWO_HOUR", label: "2h" },
    { value: "SIX_HOUR", label: "6h" },
    { value: "ONE_DAY", label: "1d" }
];
const ChartToolbar = ({ chartId, chartApiRef, isChangingSymbol = false, isChangingGranularity = false, layoutId, onDelete, onSplitHorizontal, onSplitVertical, onOpenSymbolManager, isTrendLineToolActive = false, onToggleTrendLineTool, onToggleFullscreen, isFullscreen = false }) => {
    var _a;
    const { symbols: allSymbols, isLoading: symbolsLoading, error: symbolsError } = useSymbols();
    const { starredSymbols, isLoading: starredLoading } = useStarredSymbols(layoutId);
    const { settings } = useChartSettings(chartId);
    const { status, plan, canAddMoreIndicators, getIndicatorLimit } = useSubscription();
    const { indicators: availableIndicators, isLoading: indicatorsLoading, error: indicatorsError } = useIndicators(db);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const DEFAULT_SYMBOLS2 = ["BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD"];
    const getDisplaySymbols = () => {
        if (starredSymbols.length > 0) {
            return starredSymbols.map((symbol) => allSymbols.find((s) => s.symbol === symbol)).filter(Boolean);
        }
        return DEFAULT_SYMBOLS2.map((symbol) => allSymbols.find((s) => s.symbol === symbol)).filter(Boolean);
    };
    const displaySymbols = getDisplaySymbols();
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxs(Menu$1, { as: "div", className: "relative", children: [
                    /* @__PURE__ */ jsxs(Menu$1.Button, {
                        as: ToolbarDropdownButton,
                        disabled: symbolsLoading || starredLoading || isChangingSymbol,
                        title: "Select Symbol",
                        className: "font-bold",
                        children: [
                            symbolsLoading || starredLoading ? "Loading..." : symbolsError ? "Error" : settings.symbol,
                            /* @__PURE__ */ jsx(ChevronDownIcon, { className: "w-3 h-3" })
                        ]
                    }),
                    /* @__PURE__ */ jsx(Transition, {
                        as: Fragment$1,
                        enter: "transition ease-out duration-100",
                        enterFrom: "transform opacity-0 scale-95",
                        enterTo: "transform opacity-100 scale-100",
                        leave: "transition ease-in duration-75",
                        leaveFrom: "transform opacity-100 scale-100",
                        leaveTo: "transform opacity-0 scale-95",
                        children: /* @__PURE__ */ jsx(Menu$1.Items, { className: "absolute right-0 mt-2 min-w-[160px] bg-black border border-gray-700 rounded-md shadow-lg z-[200] max-h-96 overflow-y-auto", children: symbolsLoading || starredLoading ? /* @__PURE__ */ jsx("div", { className: "p-3 text-gray-400 text-xs", children: "Loading symbols..." }) : symbolsError ? /* @__PURE__ */ jsx("div", { className: "p-3 text-red-400 text-xs", children: "Error loading symbols" }) : /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                                    displaySymbols.map((symbol) => symbol && /* @__PURE__ */ jsx(Menu$1.Item, { children: ({ active }) => /* @__PURE__ */ jsxs("button", {
                                            onClick: () => {
                                                var _a2;
                                                if ((_a2 = chartApiRef == null ? void 0 : chartApiRef.current) == null ? void 0 : _a2.setSymbol) {
                                                    chartApiRef.current.setSymbol(symbol.symbol);
                                                }
                                            },
                                            className: `w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${active ? "bg-gray-900" : ""} ${settings.symbol === symbol.symbol ? "text-blue-400" : "text-gray-100"}`,
                                            children: [
                                                /* @__PURE__ */ jsx("span", { className: "font-medium", children: symbol.symbol }),
                                                settings.symbol === symbol.symbol && /* @__PURE__ */ jsx("svg", {
                                                    className: "w-3 h-3 flex-shrink-0 ml-2",
                                                    fill: "currentColor",
                                                    viewBox: "0 0 20 20",
                                                    children: /* @__PURE__ */ jsx("path", {
                                                        fillRule: "evenodd",
                                                        d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                                                        clipRule: "evenodd"
                                                    })
                                                })
                                            ]
                                        }) }, symbol.id)),
                                    !displaySymbols.find((s) => (s == null ? void 0 : s.symbol) === settings.symbol) && /* @__PURE__ */ jsx(Menu$1.Item, { children: ({ active }) => /* @__PURE__ */ jsxs("button", {
                                            onClick: () => {
                                            },
                                            className: `w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between text-blue-400 ${active ? "bg-gray-900" : ""}`,
                                            children: [
                                                /* @__PURE__ */ jsx("span", { className: "font-medium", children: settings.symbol }),
                                                /* @__PURE__ */ jsx("svg", {
                                                    className: "w-3 h-3 flex-shrink-0 ml-2",
                                                    fill: "currentColor",
                                                    viewBox: "0 0 20 20",
                                                    children: /* @__PURE__ */ jsx("path", {
                                                        fillRule: "evenodd",
                                                        d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                                                        clipRule: "evenodd"
                                                    })
                                                })
                                            ]
                                        }, settings.symbol) }),
                                    /* @__PURE__ */ jsx("div", { className: "h-px bg-gray-800 my-1" }),
                                    /* @__PURE__ */ jsx(Menu$1.Item, { children: ({ active }) => /* @__PURE__ */ jsxs("button", {
                                            onClick: () => {
                                                if (onOpenSymbolManager) {
                                                    onOpenSymbolManager();
                                                }
                                            },
                                            className: `w-full px-4 py-2.5 text-left text-sm transition-colors text-gray-300 hover:text-white flex items-center ${active ? "bg-gray-900" : ""}`,
                                            children: [
                                                /* @__PURE__ */ jsxs("svg", {
                                                    className: "w-3 h-3 mr-2",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: [
                                                        /* @__PURE__ */ jsx("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                                        }),
                                                        /* @__PURE__ */ jsx("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        })
                                                    ]
                                                }),
                                                "Manage Symbols"
                                            ]
                                        }) })
                                ] }) })
                    })
                ] }),
            /* @__PURE__ */ jsxs(Menu$1, { as: "div", className: "relative", children: [
                    /* @__PURE__ */ jsxs(Menu$1.Button, {
                        as: ToolbarDropdownButton,
                        disabled: isChangingGranularity,
                        title: "Select timeframe",
                        children: [
                            ((_a = GRANULARITY_OPTIONS.find((opt) => opt.value === settings.granularity)) == null ? void 0 : _a.label) || settings.granularity,
                            /* @__PURE__ */ jsx(ChevronDownIcon, { className: "w-3 h-3" })
                        ]
                    }),
                    /* @__PURE__ */ jsx(Transition, {
                        as: Fragment$1,
                        enter: "transition ease-out duration-100",
                        enterFrom: "transform opacity-0 scale-95",
                        enterTo: "transform opacity-100 scale-100",
                        leave: "transition ease-in duration-75",
                        leaveFrom: "transform opacity-100 scale-100",
                        leaveTo: "transform opacity-0 scale-95",
                        children: /* @__PURE__ */ jsx(Menu$1.Items, { className: "absolute right-0 mt-2 w-24 bg-black border border-gray-700 rounded-md shadow-lg z-[200]", children: /* @__PURE__ */ jsx("div", { className: "py-1", children: GRANULARITY_OPTIONS.map((option) => /* @__PURE__ */ jsx(Menu$1.Item, { children: ({ active }) => /* @__PURE__ */ jsx("button", {
                                        onClick: () => {
                                            var _a2;
                                            if ((_a2 = chartApiRef == null ? void 0 : chartApiRef.current) == null ? void 0 : _a2.setGranularity) {
                                                chartApiRef.current.setGranularity(option.value);
                                            }
                                        },
                                        className: `w-full px-3 py-2 text-left text-sm transition-colors ${active ? "bg-gray-900" : ""} ${settings.granularity === option.value ? "text-blue-400" : "text-gray-100"}`,
                                        children: option.label
                                    }) }, option.value)) }) })
                    })
                ] }),
            symbolsError && /* @__PURE__ */ jsx("div", {
                className: "text-red-500 text-xs",
                title: `Symbol loading error: ${symbolsError}`,
                children: "⚠️"
            }),
            (isChangingSymbol || isChangingGranularity || symbolsLoading) && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-gray-600" }),
                    /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-3 w-3 border-b border-blue-600" })
                ] }),
            /* @__PURE__ */ jsx(ToolbarButton, {
                onClick: onToggleTrendLineTool,
                title: isTrendLineToolActive ? "Stop Drawing Trend Lines" : "Draw Trend Line",
                active: isTrendLineToolActive,
                children: /* @__PURE__ */ jsxs("svg", {
                    className: "w-4 h-4",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: [
                        /* @__PURE__ */ jsx("line", { x1: "5", y1: "19", x2: "19", y2: "5", strokeWidth: 2 }),
                        /* @__PURE__ */ jsx("circle", { cx: "5", cy: "19", r: "2", fill: "currentColor" }),
                        /* @__PURE__ */ jsx("circle", { cx: "19", cy: "5", r: "2", fill: "currentColor" })
                    ]
                })
            }),
            /* @__PURE__ */ jsxs(Menu$1, { as: "div", className: "relative", children: [
                    /* @__PURE__ */ jsxs(Menu$1.Button, {
                        as: ToolbarDropdownButton,
                        disabled: indicatorsLoading,
                        title: "Add Indicators",
                        children: [
                            /* @__PURE__ */ jsx("svg", {
                                className: "w-3 h-3",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /* @__PURE__ */ jsx("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                })
                            }),
                            /* @__PURE__ */ jsx(ChevronDownIcon, { className: "w-3 h-3" })
                        ]
                    }),
                    /* @__PURE__ */ jsx(Transition, {
                        as: Fragment$1,
                        enter: "transition ease-out duration-100",
                        enterFrom: "transform opacity-0 scale-95",
                        enterTo: "transform opacity-100 scale-100",
                        leave: "transition ease-in duration-75",
                        leaveFrom: "transform opacity-100 scale-100",
                        leaveTo: "transform opacity-0 scale-95",
                        children: /* @__PURE__ */ jsx(Menu$1.Items, { className: "absolute right-0 mt-2 min-w-[280px] bg-black border border-gray-700 rounded-md shadow-lg z-[200] max-h-96 overflow-y-auto", children: indicatorsError ? /* @__PURE__ */ jsxs("div", { className: "p-3 text-red-400 text-xs", children: [
                                    "Error loading indicators: ",
                                    indicatorsError
                                ] }) : indicatorsLoading ? /* @__PURE__ */ jsx("div", { className: "p-3 text-gray-400 text-xs", children: "Loading indicators..." }) : availableIndicators.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-3 text-gray-400 text-xs", children: "No indicators available" }) : /* @__PURE__ */ jsxs("div", { className: "py-1", children: [
                                    status === "active" && plan === "starter" && /* @__PURE__ */ jsxs("div", { className: "px-4 py-2 text-xs text-gray-400 border-b border-gray-700", children: [
                                            /* @__PURE__ */ jsxs("div", { children: [
                                                    "Starter Plan:",
                                                    " ",
                                                    settings.indicators.filter((ind) => ind.visible).length,
                                                    " ",
                                                    "/ 2 indicators"
                                                ] }),
                                            settings.indicators.filter((ind) => ind.visible).length >= 2 && /* @__PURE__ */ jsxs("div", { className: "text-orange-400 mt-1", children: [
                                                    "Limit reached -",
                                                    " ",
                                                    /* @__PURE__ */ jsx(Link, {
                                                        to: "/billing",
                                                        className: "text-blue-400 hover:underline",
                                                        children: "Upgrade to Pro"
                                                    }),
                                                    " ",
                                                    "for unlimited"
                                                ] })
                                        ] }),
                                    availableIndicators.map((indicator) => {
                                        const isVisible = settings.indicators.some((ind) => ind.id === indicator.id && ind.visible);
                                        const visibleCount = settings.indicators.filter((ind) => ind.visible).length;
                                        const canAdd = canAddMoreIndicators(visibleCount);
                                        const needsUpgrade = !isVisible && !canAdd && (status === "active" || status === "none" || status === "canceled");
                                        return /* @__PURE__ */ jsx(Menu$1.Item, { children: ({ active }) => /* @__PURE__ */ jsxs("button", {
                                                onClick: () => {
                                                    var _a2, _b, _c, _d, _e;
                                                    if ((_a2 = chartApiRef == null ? void 0 : chartApiRef.current) == null ? void 0 : _a2.api) {
                                                        if (isVisible) {
                                                            (_c = (_b = chartApiRef.current.api).hideIndicator) == null ? void 0 : _c.call(_b, indicator.id);
                                                        }
                                                        else if (canAdd) {
                                                            const apiIndicatorConfig = {
                                                                id: indicator.id,
                                                                name: indicator.name,
                                                                visible: true,
                                                                display: indicator.display === "Overlay" ? "main" : "bottom",
                                                                scale: indicator.scale === "Price" ? "value" : "value",
                                                                params: indicator.params || {}
                                                            };
                                                            (_e = (_d = chartApiRef.current.api).showIndicator) == null ? void 0 : _e.call(_d, apiIndicatorConfig);
                                                        }
                                                        else if (needsUpgrade) {
                                                            setShowUpgradePrompt(true);
                                                        }
                                                    }
                                                },
                                                disabled: !isVisible && needsUpgrade,
                                                className: `w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${active ? "bg-gray-900" : ""} ${isVisible ? "text-blue-400" : needsUpgrade ? "text-gray-500 cursor-not-allowed" : "text-gray-100"}`,
                                                children: [
                                                    /* @__PURE__ */ jsxs("div", { children: [
                                                            /* @__PURE__ */ jsx("div", { className: "font-medium", children: indicator.name }),
                                                            /* @__PURE__ */ jsx("div", { className: "text-gray-500 text-xs", children: indicator.display })
                                                        ] }),
                                                    isVisible && /* @__PURE__ */ jsx("svg", {
                                                        className: "w-3 h-3 flex-shrink-0 ml-2",
                                                        fill: "currentColor",
                                                        viewBox: "0 0 20 20",
                                                        children: /* @__PURE__ */ jsx("path", {
                                                            fillRule: "evenodd",
                                                            d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                                                            clipRule: "evenodd"
                                                        })
                                                    })
                                                ]
                                            }) }, indicator.id);
                                    })
                                ] }) })
                    })
                ] }),
            onToggleFullscreen && /* @__PURE__ */ jsx(ToolbarButton, {
                onClick: onToggleFullscreen,
                title: isFullscreen ? "Exit fullscreen" : "Enter fullscreen",
                children: isFullscreen ? /* @__PURE__ */ jsx("svg", {
                    className: "w-4 h-4",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsx("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                    })
                }) : /* @__PURE__ */ jsx("svg", {
                    className: "w-4 h-4",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /* @__PURE__ */ jsx("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    })
                })
            }),
            showUpgradePrompt && /* @__PURE__ */ jsx(UpgradePrompt, {
                feature: "indicators",
                onClose: () => setShowUpgradePrompt(false)
            })
        ] });
};
const ChartHeader = ({ chartId, chartApiRef, isChangingSymbol, isChangingGranularity, layoutId, onDelete, onSplitHorizontal, onSplitVertical, onOpenSymbolManager, isTrendLineToolActive, onToggleTrendLineTool, onToggleFullscreen, isFullscreen }) => {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end px-4 py-2 bg-gray-900 border-b border-gray-800 relative z-50 overflow-visible", children: /* @__PURE__ */ jsx(ChartToolbar, {
            chartId,
            chartApiRef,
            isChangingSymbol,
            isChangingGranularity,
            layoutId,
            onDelete,
            onSplitHorizontal,
            onSplitVertical,
            onOpenSymbolManager,
            onToggleFullscreen,
            isFullscreen,
            isTrendLineToolActive,
            onToggleTrendLineTool
        }) });
};
const LinePreview = ({ color, style, thickness, compact = false }) => /* @__PURE__ */ jsx("div", {
    className: compact ? "w-6" : "w-12",
    style: {
        borderTopColor: color,
        borderTopWidth: thickness,
        borderTopStyle: style
    }
});
const ChartLineToolbar = ({ trendLine, onUpdateSettings, onDelete, isVisible, onClose, defaultSettings, onDefaultSettingsChange }) => {
    const colorInputRef = useRef(null);
    const toolbarRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [position, setPosition] = useState({ x: 50, y: 12 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 640;
            setIsMobile(mobile);
            if (mobile) {
                setPosition({ x: 12, y: 12 });
            }
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);
    useEffect(() => {
        const handleMove = (clientX, clientY) => {
            if (!isDragging || !toolbarRef.current)
                return;
            const parent = toolbarRef.current.parentElement;
            if (!parent)
                return;
            const parentRect = parent.getBoundingClientRect();
            const toolbarRect = toolbarRef.current.getBoundingClientRect();
            const deltaX = clientX - dragStart.x;
            const deltaY = clientY - dragStart.y;
            let newX = startPosition.x + deltaX;
            let newY = startPosition.y + deltaY;
            const minVisibleWidth = 30;
            const maxX = parentRect.width - minVisibleWidth;
            const maxY = parentRect.height - toolbarRect.height - 16;
            newX = Math.max(-toolbarRect.width + minVisibleWidth, Math.min(newX, maxX));
            newY = Math.max(12, Math.min(newY, maxY));
            setPosition({ x: newX, y: newY });
        };
        const handleMouseMove = (e) => {
            handleMove(e.clientX, e.clientY);
        };
        const handleTouchMove = (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
            }
        };
        const handleEnd = () => {
            setIsDragging(false);
        };
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleEnd);
            document.addEventListener("touchmove", handleTouchMove, { passive: false });
            document.addEventListener("touchend", handleEnd);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleEnd);
                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("touchend", handleEnd);
            };
        }
    }, [isDragging, dragStart, startPosition]);
    const handleDragStart = (e) => {
        e.preventDefault();
        setIsDragging(true);
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX, y: clientY });
        setStartPosition(position);
    };
    if (!isVisible)
        return null;
    const quickColors = [
        "#10b981",
        // emerald
        "#3b82f6",
        // blue
        "#ef4444",
        // red
        "#f59e0b",
        // amber
        "#8b5cf6",
        // violet
        "#06b6d4",
        // cyan
        "#e5e5e5"
        // gray
    ];
    const getStyleString = (style) => {
        if (typeof style === "string" && ["solid", "dashed", "dotted"].includes(style)) {
            return style;
        }
        if (typeof style === "number") {
            switch (style) {
                case 1:
                    return "dotted";
                case 2:
                    return "dashed";
                default:
                    return "solid";
            }
        }
        return "solid";
    };
    const currentSettings = trendLine ? {
        color: trendLine.color || "#3b82f6",
        style: getStyleString(trendLine.style),
        thickness: Number(trendLine.lineWidth) || 2,
        extendLeft: trendLine.extendLeft || false,
        extendRight: trendLine.extendRight || false
    } : {
        color: (defaultSettings == null ? void 0 : defaultSettings.color) || "#3b82f6",
        style: getStyleString(defaultSettings == null ? void 0 : defaultSettings.style),
        thickness: Number(defaultSettings == null ? void 0 : defaultSettings.thickness) || 2,
        extendLeft: (defaultSettings == null ? void 0 : defaultSettings.extendLeft) || false,
        extendRight: (defaultSettings == null ? void 0 : defaultSettings.extendRight) || false
    };
    const handleQuickColor = (color) => {
        if (trendLine) {
            onUpdateSettings({ color });
        }
        else if (onDefaultSettingsChange) {
            onDefaultSettingsChange({ ...defaultSettings, color });
        }
    };
    const handleSettingsChange = (settings) => {
        if (trendLine) {
            onUpdateSettings(settings);
        }
        else if (onDefaultSettingsChange) {
            onDefaultSettingsChange({ ...defaultSettings, ...settings });
        }
    };
    const styleLabel = (s) => {
        const str = String(s || "solid");
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    return /* @__PURE__ */ jsx("div", {
        ref: toolbarRef,
        className: "absolute z-[60] pointer-events-none",
        style: {
            left: `${position.x}px`,
            top: `${position.y}px`
        },
        children: /* @__PURE__ */ jsxs("div", { className: `flex items-center rounded-md border border-gray-700 bg-black/90 shadow-lg backdrop-blur pointer-events-auto ${isDragging ? "cursor-grabbing opacity-90" : ""}`, children: [
                /* @__PURE__ */ jsx("div", {
                    className: `flex items-center px-1 py-1 hover:bg-gray-800 rounded-l-md transition-colors border-r border-gray-700 ${isDragging ? "cursor-grabbing bg-gray-800" : "cursor-grab"}`,
                    onMouseDown: handleDragStart,
                    onTouchStart: handleDragStart,
                    title: "Drag to reposition",
                    children: /* @__PURE__ */ jsx(GripVerticalIcon, { className: `h-4 w-4 ${isDragging ? "text-gray-300" : "text-gray-400 hover:text-gray-300"}` })
                }),
                /* @__PURE__ */ jsxs("div", { className: `flex items-center ${isMobile ? "gap-1 px-1" : "gap-2 px-2"} py-1`, children: [
                        /* @__PURE__ */ jsxs(Popover, { className: "relative", children: [
                                /* @__PURE__ */ jsxs(Popover.Button, { as: ToolbarDropdownButton, title: "Line color", className: isMobile ? "px-1" : "", children: [
                                        /* @__PURE__ */ jsx("span", {
                                            className: "h-4 w-4 rounded",
                                            style: { backgroundColor: currentSettings.color },
                                            "aria-label": "Current line color"
                                        }),
                                        !isMobile && /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Color" }),
                                        /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" }) })
                                    ] }),
                                /* @__PURE__ */ jsx(Transition, {
                                    as: Fragment$1,
                                    enter: "transition ease-out duration-200",
                                    enterFrom: "opacity-0 translate-y-1",
                                    enterTo: "opacity-100 translate-y-0",
                                    leave: "transition ease-in duration-150",
                                    leaveFrom: "opacity-100 translate-y-0",
                                    leaveTo: "opacity-0 translate-y-1",
                                    children: /* @__PURE__ */ jsx(Popover.Panel, { className: "absolute left-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-[200]", children: /* @__PURE__ */ jsxs("div", { className: "p-3 space-y-3", children: [
                                                /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-300", children: "Pick color" }),
                                                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 gap-2", children: quickColors.map((c) => /* @__PURE__ */ jsx("button", {
                                                        type: "button",
                                                        className: "h-5 w-5 rounded-full ring-1 ring-white/10 hover:ring-2 hover:ring-white/40 transition-all",
                                                        style: { backgroundColor: c },
                                                        onClick: () => handleQuickColor(c),
                                                        "aria-label": `Choose ${c}`,
                                                        title: c
                                                    }, c)) }),
                                                /* @__PURE__ */ jsx("input", {
                                                    ref: colorInputRef,
                                                    type: "color",
                                                    value: currentSettings.color,
                                                    onChange: (e) => handleSettingsChange({ color: e.target.value }),
                                                    className: "h-8 w-full cursor-pointer bg-transparent",
                                                    "aria-label": "Line color picker"
                                                })
                                            ] }) })
                                })
                            ] }),
                        /* @__PURE__ */ jsxs(Menu$1, { as: "div", className: "relative", children: [
                                /* @__PURE__ */ jsxs(Menu$1.Button, { as: ToolbarDropdownButton, title: `Style: ${styleLabel(currentSettings.style)}`, className: isMobile ? "px-1" : "", children: [
                                        /* @__PURE__ */ jsx(LinePreview, { color: currentSettings.color, style: currentSettings.style, thickness: currentSettings.thickness, compact: isMobile }),
                                        /* @__PURE__ */ jsx(ChevronDownIcon, { className: "h-4 w-4" })
                                    ] }),
                                /* @__PURE__ */ jsx(Transition, {
                                    as: Fragment$1,
                                    enter: "transition ease-out duration-100",
                                    enterFrom: "transform opacity-0 scale-95",
                                    enterTo: "transform opacity-100 scale-100",
                                    leave: "transition ease-in duration-75",
                                    leaveFrom: "transform opacity-100 scale-100",
                                    leaveTo: "transform opacity-0 scale-95",
                                    children: /* @__PURE__ */ jsx(Menu$1.Items, { className: "absolute left-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-[200]", children: /* @__PURE__ */ jsxs("div", { className: "p-1", children: [
                                                /* @__PURE__ */ jsx("div", { className: "px-2 py-1 text-xs text-gray-400", children: "Line style" }),
                                                ["solid", "dashed", "dotted"].map((s) => /* @__PURE__ */ jsx(Menu$1.Item, { children: ({ active }) => /* @__PURE__ */ jsxs("button", {
                                                        onClick: () => handleSettingsChange({ style: s }),
                                                        className: `${active ? "bg-gray-700" : ""} group flex items-center w-full px-2 py-2 text-sm text-white rounded`,
                                                        children: [
                                                            /* @__PURE__ */ jsx("div", { className: "mr-3", children: /* @__PURE__ */ jsx(LinePreview, { color: currentSettings.color, style: s, thickness: currentSettings.thickness }) }),
                                                            styleLabel(s)
                                                        ]
                                                    }) }, s))
                                            ] }) })
                                })
                            ] }),
                        /* @__PURE__ */ jsxs(Menu$1, { as: "div", className: "relative", children: [
                                /* @__PURE__ */ jsxs(Menu$1.Button, { as: ToolbarDropdownButton, title: `Thickness: ${currentSettings.thickness}px`, className: isMobile ? "px-1" : "", children: [
                                        /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: currentSettings.thickness, viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M20 12H4" }) }),
                                        !isMobile && /* @__PURE__ */ jsx("span", { className: "text-xs", children: currentSettings.thickness || 2 }),
                                        /* @__PURE__ */ jsx(ChevronDownIcon, { className: "h-4 w-4" })
                                    ] }),
                                /* @__PURE__ */ jsx(Transition, {
                                    as: Fragment$1,
                                    enter: "transition ease-out duration-100",
                                    enterFrom: "transform opacity-0 scale-95",
                                    enterTo: "transform opacity-100 scale-100",
                                    leave: "transition ease-in duration-75",
                                    leaveFrom: "transform opacity-100 scale-100",
                                    leaveTo: "transform opacity-0 scale-95",
                                    children: /* @__PURE__ */ jsx(Menu$1.Items, { className: "absolute left-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-[200]", children: /* @__PURE__ */ jsxs("div", { className: "p-1", children: [
                                                /* @__PURE__ */ jsx("div", { className: "px-2 py-1 text-xs text-gray-400", children: "Line thickness" }),
                                                [1, 2, 3, 4].map((t) => /* @__PURE__ */ jsx(Menu$1.Item, { children: ({ active }) => /* @__PURE__ */ jsxs("button", {
                                                        onClick: () => handleSettingsChange({ thickness: t }),
                                                        className: `${active ? "bg-gray-700" : ""} group flex items-center w-full px-2 py-2 text-sm text-white rounded`,
                                                        children: [
                                                            /* @__PURE__ */ jsx("svg", { className: "mr-3 h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: t, viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M20 12H4" }) }),
                                                            String(t),
                                                            "px"
                                                        ]
                                                    }) }, t))
                                            ] }) })
                                })
                            ] }),
                        /* @__PURE__ */ jsxs(Menu$1, { as: "div", className: "relative", children: [
                                /* @__PURE__ */ jsxs(Menu$1.Button, { as: ToolbarDropdownButton, title: "Extend line", className: isMobile ? "px-1" : "", children: [
                                        /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" }) }),
                                        /* @__PURE__ */ jsx(ChevronDownIcon, { className: "h-4 w-4" })
                                    ] }),
                                /* @__PURE__ */ jsx(Transition, {
                                    as: Fragment$1,
                                    enter: "transition ease-out duration-100",
                                    enterFrom: "transform opacity-0 scale-95",
                                    enterTo: "transform opacity-100 scale-100",
                                    leave: "transition ease-in duration-75",
                                    leaveFrom: "transform opacity-100 scale-100",
                                    leaveTo: "transform opacity-0 scale-95",
                                    children: /* @__PURE__ */ jsx(Menu$1.Items, { className: "absolute left-0 mt-2 w-40 bg-gray-800 border border-gray-700 rounded-md shadow-xl z-[200]", children: /* @__PURE__ */ jsxs("div", { className: "p-1", children: [
                                                /* @__PURE__ */ jsx("div", { className: "px-2 py-1 text-xs text-gray-400", children: "Extend line" }),
                                                /* @__PURE__ */ jsx(Menu$1.Item, { children: ({ active }) => /* @__PURE__ */ jsxs("button", {
                                                        onClick: () => handleSettingsChange({ extendLeft: !currentSettings.extendLeft }),
                                                        className: `${active ? "bg-gray-700" : ""} group flex items-center justify-between w-full px-2 py-2 text-sm text-white rounded`,
                                                        children: [
                                                            /* @__PURE__ */ jsx("span", { children: "Extend left" }),
                                                            currentSettings.extendLeft && /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) })
                                                        ]
                                                    }) }),
                                                /* @__PURE__ */ jsx(Menu$1.Item, { children: ({ active }) => /* @__PURE__ */ jsxs("button", {
                                                        onClick: () => handleSettingsChange({ extendRight: !currentSettings.extendRight }),
                                                        className: `${active ? "bg-gray-700" : ""} group flex items-center justify-between w-full px-2 py-2 text-sm text-white rounded`,
                                                        children: [
                                                            /* @__PURE__ */ jsx("span", { children: "Extend right" }),
                                                            currentSettings.extendRight && /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "currentColor", viewBox: "0 0 20 20", children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) })
                                                        ]
                                                    }) })
                                            ] }) })
                                })
                            ] }),
                        trendLine && /* @__PURE__ */ jsx(ToolbarButton, {
                            onClick: onDelete,
                            variant: "danger",
                            title: "Delete line",
                            children: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) })
                        })
                    ] }),
                onClose && /* @__PURE__ */ jsx("div", { className: "flex items-center border-l border-gray-700", children: /* @__PURE__ */ jsx("button", {
                        onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onClose();
                        },
                        className: "flex items-center justify-center w-7 h-7 mx-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors",
                        title: "Close trend line tool",
                        type: "button",
                        children: /* @__PURE__ */ jsx("svg", { className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" }) })
                    }) }),
                /* @__PURE__ */ jsx("div", {
                    className: `flex items-center px-1 py-1 hover:bg-gray-800 rounded-r-md transition-colors border-l border-gray-700 ${isDragging ? "cursor-grabbing bg-gray-800" : "cursor-grab"}`,
                    onMouseDown: handleDragStart,
                    onTouchStart: handleDragStart,
                    title: "Drag to reposition",
                    children: /* @__PURE__ */ jsx(GripVerticalIcon, { className: `h-4 w-4 ${isDragging ? "text-gray-300" : "text-gray-400 hover:text-gray-300"}` })
                })
            ] })
    });
};
const DEFAULT_SYMBOLS = ["BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD"];
const SymbolManager = ({ isOpen, onClose, layoutId }) => {
    const { symbols, isLoading: symbolsLoading } = useSymbols();
    const { starredSymbols, updateStarredSymbols, isLoading: starredLoading } = useStarredSymbols(layoutId);
    const [searchQuery, setSearchQuery] = useState("");
    const [pendingSymbols, setPendingSymbols] = useState(/* @__PURE__ */ new Set());
    const [hasInitialized, setHasInitialized] = useState(false);
    useEffect(() => {
        if (isOpen && !hasInitialized && !starredLoading) {
            if (starredSymbols.length === 0) {
                setPendingSymbols(new Set(DEFAULT_SYMBOLS));
            }
            else {
                setPendingSymbols(new Set(starredSymbols));
            }
            setHasInitialized(true);
        }
    }, [isOpen, starredSymbols, starredLoading, hasInitialized]);
    useEffect(() => {
        if (!isOpen) {
            setHasInitialized(false);
        }
    }, [isOpen]);
    const getDisplaySymbols = () => {
        if (starredSymbols.length > 0) {
            return starredSymbols;
        }
        return Array.from(pendingSymbols);
    };
    getDisplaySymbols();
    const availableSymbols = symbols.filter((s) => s.active && s.quoteAsset === "USD" && s.exchangeId === "coinbase").sort((a, b) => a.symbol.localeCompare(b.symbol));
    const filteredSymbols = searchQuery ? availableSymbols.filter((s) => s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || s.baseAsset.toLowerCase().includes(searchQuery.toLowerCase())) : availableSymbols;
    const handleToggleSymbol = (symbol) => {
        setPendingSymbols((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(symbol)) {
                newSet.delete(symbol);
            }
            else {
                newSet.add(symbol);
            }
            return newSet;
        });
    };
    const handleClose = async () => {
        if (layoutId) {
            await updateStarredSymbols(Array.from(pendingSymbols));
        }
        onClose();
    };
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", {
                className: "fixed inset-0 bg-black bg-opacity-50 z-50",
                onClick: handleClose
            }),
            /* @__PURE__ */ jsx("div", { className: "fixed inset-0 flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxs("div", {
                    className: "bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col",
                    onClick: (e) => e.stopPropagation(),
                    children: [
                        /* @__PURE__ */ jsx("div", { className: "p-6 border-b border-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                                    /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-white", children: "Symbol Manager" }),
                                    /* @__PURE__ */ jsx("button", {
                                        onClick: handleClose,
                                        className: "text-gray-400 hover:text-white transition-colors",
                                        children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })
                                    })
                                ] }) }),
                        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-hidden flex flex-col p-6", children: [
                                /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
                                        /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-gray-400 mb-3", children: "Your Symbols" }),
                                        starredLoading ? /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading starred symbols..." }) : pendingSymbols.size === 0 ? /* @__PURE__ */ jsx("div", { className: "text-gray-500 italic", children: "No symbols selected" }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: Array.from(pendingSymbols).map((symbol) => /* @__PURE__ */ jsxs("div", {
                                                className: "bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between group hover:bg-gray-750 transition-colors",
                                                children: [
                                                    /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: symbol }),
                                                    /* @__PURE__ */ jsx("button", {
                                                        onClick: () => handleToggleSymbol(symbol),
                                                        className: "ml-2 text-gray-500 hover:text-red-400 transition-colors",
                                                        title: "Remove symbol",
                                                        children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) })
                                                    })
                                                ]
                                            }, symbol)) })
                                    ] }),
                                /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-h-0", children: [
                                        /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-gray-400 mb-3", children: "Available Symbols" }),
                                        /* @__PURE__ */ jsx("div", { className: "mb-4", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                                                    /* @__PURE__ */ jsx("input", {
                                                        type: "text",
                                                        placeholder: "Search symbols...",
                                                        value: searchQuery,
                                                        onChange: (e) => setSearchQuery(e.target.value),
                                                        className: "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                                    }),
                                                    /* @__PURE__ */ jsx("svg", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) })
                                                ] }) }),
                                        /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto", children: symbolsLoading ? /* @__PURE__ */ jsx("div", { className: "text-gray-500", children: "Loading symbols..." }) : filteredSymbols.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-gray-500 italic", children: "No symbols found" }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: filteredSymbols.map((symbol) => {
                                                    const isSelected = pendingSymbols.has(symbol.symbol);
                                                    return /* @__PURE__ */ jsx("button", {
                                                        onClick: () => handleToggleSymbol(symbol.symbol),
                                                        className: `
                            rounded-lg px-4 py-3 text-left transition-all
                            ${isSelected ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"}
                          `,
                                                        children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                                                                /* @__PURE__ */ jsx("span", { className: "font-medium", children: symbol.symbol }),
                                                                /* @__PURE__ */ jsx("svg", {
                                                                    className: `w-4 h-4 ${isSelected ? "opacity-100" : "opacity-0"}`,
                                                                    fill: "currentColor",
                                                                    viewBox: "0 0 20 20",
                                                                    children: /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" })
                                                                })
                                                            ] })
                                                    }, symbol.id);
                                                }) }) })
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsx("div", { className: "p-6 border-t border-gray-800", children: /* @__PURE__ */ jsx("button", {
                                onClick: handleClose,
                                className: "w-full bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition-colors",
                                children: "Save & Close"
                            }) })
                    ]
                }) })
        ] });
};
const ChartContainer = ({ config, layoutId, onRemove, onConfigUpdate, onApiReady }) => {
    const { updateChart, saveChart, isLoading: chartsLoading } = useCharts();
    const { indicators: availableIndicators = [], isLoading: indicatorsLoading } = useIndicators(db);
    const debounceTimeoutRef = useRef(null);
    const pendingSettingsRef = useRef(null);
    const handleSettingsChange = useCallback(async (settings, chartId) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                const indicatorIds = settings.indicators.filter((indicator) => indicator.visible).map((indicator) => indicator.id);
                const updatedConfig = {
                    ...config,
                    symbol: settings.symbol,
                    granularity: settings.granularity,
                    indicators: indicatorIds
                };
                if (onConfigUpdate) {
                    onConfigUpdate(updatedConfig);
                }
                if (chartsLoading) {
                    console.log("ChartContainer: Skipping persistence - repository still loading");
                    pendingSettingsRef.current = settings;
                    return;
                }
                try {
                    const result = await updateChart(config.id, {
                        symbol: settings.symbol,
                        granularity: settings.granularity,
                        indicators: indicatorIds
                    }, layoutId);
                }
                catch (updateError) {
                    if ((updateError == null ? void 0 : updateError.code) === "NOT_FOUND") {
                        const newChart = await saveChart({
                            symbol: settings.symbol,
                            granularity: settings.granularity,
                            indicators: indicatorIds
                        }, layoutId);
                    }
                    else {
                        throw updateError;
                    }
                }
            }
            catch (error) {
                console.error("Failed to persist settings change to repository:", error);
            }
        }, 500);
    }, [config, onConfigUpdate, chartsLoading, updateChart, saveChart, layoutId]);
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);
    useEffect(() => {
        if (!chartsLoading && pendingSettingsRef.current) {
            console.log("ChartContainer: Repository ready, retrying pending settings save");
            const pendingSettings = pendingSettingsRef.current;
            pendingSettingsRef.current = null;
            handleSettingsChange(pendingSettings, config.id);
        }
    }, [chartsLoading, config.id, handleSettingsChange]);
    const initialSettings = useMemo(() => {
        if (indicatorsLoading || availableIndicators.length === 0) {
            return {
                symbol: config.symbol,
                granularity: config.granularity,
                indicators: []
            };
        }
        const indicatorConfigs = (config.indicators || []).map((indicatorId) => {
            const availableIndicator = availableIndicators.find((ind) => ind.id === indicatorId);
            if (availableIndicator) {
                return {
                    ...availableIndicator,
                    visible: true
                    // Mark as visible since it's in the saved config
                };
            }
            else {
                return {
                    id: indicatorId,
                    name: indicatorId.toUpperCase(),
                    display: "Bottom",
                    visible: true,
                    params: {},
                    scale: "Value",
                    className: "MarketIndicator"
                };
            }
        }).filter(Boolean);
        return {
            symbol: config.symbol,
            granularity: config.granularity,
            indicators: indicatorConfigs
        };
    }, [
        config.symbol,
        config.granularity,
        config.indicators,
        availableIndicators,
        indicatorsLoading
    ]);
    return /* @__PURE__ */ jsx(ChartSettingsProvider, {
        initialSettings,
        onSettingsChange: handleSettingsChange,
        children: /* @__PURE__ */ jsx(ChartContainerInner, {
            config,
            layoutId,
            onRemove,
            onConfigUpdate,
            onApiReady
        })
    });
};
const ChartContainerInner = ({ config, layoutId, onRemove, onConfigUpdate, onApiReady }) => {
    useCharts();
    useIndicators(db);
    const [chartError, setChartError] = useState(null);
    const [isChangingSymbol, setIsChangingSymbol] = useState(false);
    const [isChangingGranularity, setIsChangingGranularity] = useState(false);
    const [isSymbolManagerOpen, setIsSymbolManagerOpen] = useState(false);
    const [trendLines, setTrendLines] = useState([]);
    const [trendLinesLoaded, setTrendLinesLoaded] = useState(false);
    const [selectedTrendLine, setSelectedTrendLine] = useState(null);
    const [selectedTrendLineId, setSelectedTrendLineId] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isTrendLineToolActive, setIsTrendLineToolActive] = useState(false);
    const [defaultTrendLineSettings, setDefaultTrendLineSettings] = useState({
        color: "#3b82f6",
        style: "solid",
        lineWidth: 2,
        extendLeft: false,
        extendRight: false
    });
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const { settings } = useChartSettings(config.id);
    const { user } = useAuth();
    useEffect(() => {
        const loadTrendLines = async () => {
            var _a;
            if (!layoutId || !config.id || !(user == null ? void 0 : user.email) || trendLinesLoaded)
                return;
            try {
                const repository = getRepository(user.email);
                await repository.initialize();
                const loadedTrendLines = await repository.getTrendLines(layoutId, config.id);
                console.log(`📊 ChartContainer: Loaded ${loadedTrendLines.length} trend lines from Firestore for chart ${config.id}:`, loadedTrendLines);
                loadedTrendLines.forEach((line, index) => {
                    var _a2, _b, _c, _d;
                    console.log(`📊 ChartContainer: Loaded trend line ${index + 1} structure:`, {
                        id: line.id,
                        hasStartPoint: !!line.startPoint,
                        hasEndPoint: !!line.endPoint,
                        startPointTimestamp: (_a2 = line.startPoint) == null ? void 0 : _a2.timestamp,
                        startPointPrice: (_b = line.startPoint) == null ? void 0 : _b.price,
                        endPointTimestamp: (_c = line.endPoint) == null ? void 0 : _c.timestamp,
                        endPointPrice: (_d = line.endPoint) == null ? void 0 : _d.price,
                        color: line.color,
                        lineWidth: line.lineWidth,
                        style: line.style,
                        fullStructure: line
                    });
                });
                setTrendLines(loadedTrendLines);
                setTrendLinesLoaded(true);
                if (((_a = chartRef.current) == null ? void 0 : _a.api) && loadedTrendLines.length > 0) {
                    const api = chartRef.current.api;
                    console.log(`📊 ChartContainer: Chart API is ready, adding ${loadedTrendLines.length} trend lines immediately`);
                    loadedTrendLines.forEach((trendLine) => {
                        var _a2;
                        try {
                            console.log(`📊 ChartContainer: Adding trend line to chart via API:`, trendLine);
                            const result = (_a2 = api.addTrendLine) == null ? void 0 : _a2.call(api, trendLine);
                            console.log(`📊 ChartContainer: Add trend line result:`, result);
                        }
                        catch (error) {
                            console.error(`Failed to add trend line ${trendLine.id}:`, error);
                        }
                    });
                    setTimeout(() => {
                        var _a2;
                        const currentTrendLines = (_a2 = api.getTrendLines) == null ? void 0 : _a2.call(api);
                        console.log(`📊 ChartContainer: Verification - trend lines in chart after adding:`, currentTrendLines);
                    }, 500);
                }
            }
            catch (error) {
                console.error("Failed to load trend lines:", error);
                setTrendLinesLoaded(true);
            }
        };
        loadTrendLines();
    }, [layoutId, config.id, user == null ? void 0 : user.email, trendLinesLoaded]);
    const initialState = useMemo(() => ({
        symbol: config.symbol,
        granularity: config.granularity,
        indicators: config.indicators || [],
        trendLines
        // Include loaded trend lines
    }), [config.symbol, config.granularity, config.indicators, trendLines]);
    console.log(`📊 ChartContainer: Passing initialState to SCChart for chart ${config.id}:`, {
        symbol: initialState.symbol,
        granularity: initialState.granularity,
        indicatorCount: initialState.indicators.length,
        trendLineCount: initialState.trendLines.length,
        trendLines: initialState.trendLines
    });
    const handleSplitHorizontal = () => {
        console.log("Split horizontal - not yet implemented");
    };
    const handleSplitVertical = () => {
        console.log("Split vertical - not yet implemented");
    };
    const isIOS = useMemo(() => {
        if (typeof window === "undefined" || typeof navigator === "undefined") {
            return false;
        }
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }, []);
    const isPWA = useMemo(() => {
        if (typeof window === "undefined") {
            return false;
        }
        return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    }, []);
    const isIPhone = useMemo(() => {
        if (typeof window === "undefined" || typeof navigator === "undefined") {
            return false;
        }
        return /iPhone/.test(navigator.userAgent) && !window.MSStream;
    }, []);
    const handleToggleFullscreen = useCallback(() => {
        if (isIOS) {
            if (!isFullscreen) {
                setIsFullscreen(true);
                if (containerRef.current) {
                    containerRef.current.style.position = "fixed";
                    containerRef.current.style.left = "0";
                    containerRef.current.style.right = "0";
                    containerRef.current.style.zIndex = "9999";
                    containerRef.current.style.width = "100vw";
                    if (isIPhone && isPWA) {
                        containerRef.current.style.top = "44px";
                        containerRef.current.style.bottom = "20px";
                        containerRef.current.style.height = "calc(100vh - 64px)";
                    }
                    else {
                        containerRef.current.style.top = "0";
                        containerRef.current.style.bottom = "0";
                        containerRef.current.style.height = "100vh";
                    }
                }
                window.scrollTo(0, 1);
            }
            else {
                setIsFullscreen(false);
                if (containerRef.current) {
                    containerRef.current.style.position = "";
                    containerRef.current.style.top = "";
                    containerRef.current.style.left = "";
                    containerRef.current.style.right = "";
                    containerRef.current.style.bottom = "";
                    containerRef.current.style.zIndex = "";
                    containerRef.current.style.width = "";
                    containerRef.current.style.height = "";
                }
                window.scrollTo(0, 0);
            }
        }
        else {
            if (!isFullscreen) {
                setIsFullscreen(true);
                if (containerRef.current) {
                    containerRef.current.style.position = "fixed";
                    containerRef.current.style.top = "0";
                    containerRef.current.style.left = "0";
                    containerRef.current.style.right = "0";
                    containerRef.current.style.bottom = "0";
                    containerRef.current.style.zIndex = "9999";
                    containerRef.current.style.width = "100vw";
                    containerRef.current.style.height = "100vh";
                }
            }
            else {
                setIsFullscreen(false);
                if (containerRef.current) {
                    containerRef.current.style.position = "";
                    containerRef.current.style.top = "";
                    containerRef.current.style.left = "";
                    containerRef.current.style.right = "";
                    containerRef.current.style.bottom = "";
                    containerRef.current.style.zIndex = "";
                    containerRef.current.style.width = "";
                    containerRef.current.style.height = "";
                }
            }
        }
        window.dispatchEvent(new Event("resize"));
    }, [isFullscreen, isIOS, isIPhone, isPWA]);
    const handleUpdateTrendLineSettings = useCallback((settings2) => {
        var _a, _b;
        if (!selectedTrendLineId || !((_a = chartRef.current) == null ? void 0 : _a.api))
            return;
        const api = chartRef.current.api;
        const updates = {};
        if (settings2.color !== void 0)
            updates.color = settings2.color;
        if (settings2.style !== void 0)
            updates.style = settings2.style;
        if (settings2.thickness !== void 0)
            updates.lineWidth = settings2.thickness;
        if (settings2.extendLeft !== void 0)
            updates.extendLeft = settings2.extendLeft;
        if (settings2.extendRight !== void 0)
            updates.extendRight = settings2.extendRight;
        (_b = api.updateTrendLineSettings) == null ? void 0 : _b.call(api, selectedTrendLineId, updates);
        if (selectedTrendLine) {
            setSelectedTrendLine({
                ...selectedTrendLine,
                ...updates
            });
        }
    }, [selectedTrendLineId, selectedTrendLine]);
    const handleDeleteTrendLine = useCallback(() => {
        var _a, _b;
        if (!selectedTrendLineId || !((_a = chartRef.current) == null ? void 0 : _a.api))
            return;
        const api = chartRef.current.api;
        (_b = api.removeTrendLine) == null ? void 0 : _b.call(api, selectedTrendLineId);
        setSelectedTrendLine(null);
        setSelectedTrendLineId(null);
    }, [selectedTrendLineId]);
    const handleActivateTrendLineTool = useCallback(() => {
        var _a, _b, _c, _d;
        if (!((_a = chartRef.current) == null ? void 0 : _a.api))
            return;
        const api = chartRef.current.api;
        if (isTrendLineToolActive) {
            (_b = api.deactivateTrendLineTool) == null ? void 0 : _b.call(api);
            setIsTrendLineToolActive(false);
            (_c = api.deselectAllTrendLines) == null ? void 0 : _c.call(api);
            setSelectedTrendLineId(null);
            setSelectedTrendLine(null);
        }
        else {
            (_d = api.activateTrendLineTool) == null ? void 0 : _d.call(api, {
                color: defaultTrendLineSettings.color,
                lineWidth: defaultTrendLineSettings.lineWidth,
                style: defaultTrendLineSettings.style,
                extendLeft: defaultTrendLineSettings.extendLeft,
                extendRight: defaultTrendLineSettings.extendRight
            });
            setIsTrendLineToolActive(true);
        }
    }, [isTrendLineToolActive, defaultTrendLineSettings]);
    const handleDeactivateTrendLineTool = useCallback(() => {
        var _a, _b, _c;
        if (!((_a = chartRef.current) == null ? void 0 : _a.api))
            return;
        const api = chartRef.current.api;
        (_b = api.deactivateTrendLineTool) == null ? void 0 : _b.call(api);
        setIsTrendLineToolActive(false);
        (_c = api.deselectAllTrendLines) == null ? void 0 : _c.call(api);
        setSelectedTrendLineId(null);
        setSelectedTrendLine(null);
    }, []);
    useEffect(() => {
        var _a, _b;
        if (!((_a = chartRef.current) == null ? void 0 : _a.api) || !isTrendLineToolActive)
            return;
        const api = chartRef.current.api;
        (_b = api.setTrendLineDefaults) == null ? void 0 : _b.call(api, {
            color: defaultTrendLineSettings.color,
            lineWidth: defaultTrendLineSettings.lineWidth,
            style: defaultTrendLineSettings.style,
            extendLeft: defaultTrendLineSettings.extendLeft,
            extendRight: defaultTrendLineSettings.extendRight
        });
    }, [defaultTrendLineSettings, isTrendLineToolActive]);
    return /* @__PURE__ */ jsxs("div", {
        ref: containerRef,
        className: "h-full flex flex-col bg-gray-900 border border-gray-800 rounded-lg overflow-hidden relative",
        children: [
            /* @__PURE__ */ jsx(ChartHeader, {
                chartId: config.id,
                chartApiRef: chartRef,
                isChangingSymbol,
                isChangingGranularity,
                onDelete: onRemove,
                onSplitHorizontal: handleSplitHorizontal,
                onSplitVertical: handleSplitVertical,
                onOpenSymbolManager: () => setIsSymbolManagerOpen(true),
                onToggleFullscreen: handleToggleFullscreen,
                isFullscreen,
                layoutId,
                isTrendLineToolActive,
                onToggleTrendLineTool: handleActivateTrendLineTool
            }),
            /* @__PURE__ */ jsx(SymbolManager, {
                isOpen: isSymbolManagerOpen,
                onClose: () => setIsSymbolManagerOpen(false),
                layoutId
            }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 relative", children: [
                    /* @__PURE__ */ jsx(ChartLineToolbar, {
                        trendLine: selectedTrendLine,
                        onUpdateSettings: handleUpdateTrendLineSettings,
                        onDelete: handleDeleteTrendLine,
                        isVisible: isTrendLineToolActive || !!selectedTrendLine,
                        onClose: handleDeactivateTrendLineTool,
                        defaultSettings: defaultTrendLineSettings,
                        onDefaultSettingsChange: setDefaultTrendLineSettings
                    }),
                    chartError ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20", children: /* @__PURE__ */ jsxs("div", { className: "text-center p-4", children: [
                                /* @__PURE__ */ jsx("div", { className: "text-red-600 dark:text-red-400 mb-2", children: /* @__PURE__ */ jsx("svg", {
                                        className: "w-8 h-8 mx-auto",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /* @__PURE__ */ jsx("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        })
                                    }) }),
                                /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 dark:text-red-400 mb-3 max-w-xs", children: chartError }),
                                /* @__PURE__ */ jsx("button", {
                                    onClick: () => setChartError(null),
                                    className: "px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors",
                                    children: "Retry"
                                })
                            ] }) }) : /* @__PURE__ */ jsx(SCChart, {
                        ref: chartRef,
                        firestore: db,
                        initialState,
                        style: { width: "100%", height: "100%" },
                        className: "trading-chart",
                        onApiReady,
                        chartId: config.id,
                        onReady: () => {
                            var _a, _b;
                            if (((_a = chartRef.current) == null ? void 0 : _a.api) && layoutId && config.id && (user == null ? void 0 : user.email)) {
                                const api = chartRef.current.api;
                                let previousTrendLines = [];
                                const chartId = config.id;
                                if (trendLines.length > 0 && trendLinesLoaded) {
                                    console.log(`📊 ChartContainer: Chart ready, checking for addTrendLine API...`);
                                    console.log(`📊 ChartContainer: api.addTrendLine exists:`, !!api.addTrendLine);
                                    console.log(`📊 ChartContainer: Available API methods:`, Object.keys(api));
                                    if (api.addTrendLine) {
                                        console.log(`📊 ChartContainer: Adding ${trendLines.length} loaded trend lines to chart after ready`);
                                        trendLines.forEach((trendLine) => {
                                            console.log(`📊 ChartContainer: Adding trend line to chart:`, JSON.stringify(trendLine, null, 2));
                                            try {
                                                const result = api.addTrendLine(trendLine);
                                                console.log(`📊 ChartContainer: Successfully added trend line, result:`, result);
                                                previousTrendLines.push(trendLine);
                                            }
                                            catch (error) {
                                                console.error(`Failed to add trend line ${trendLine.id}:`, error);
                                                try {
                                                    const { id, ...trendLineWithoutId } = trendLine;
                                                    const newId = api.addTrendLine(trendLineWithoutId);
                                                    console.log(`Added trend line with new ID: ${newId}`);
                                                }
                                                catch (error2) {
                                                    console.error(`Failed to add trend line even without ID:`, error2);
                                                }
                                            }
                                        });
                                        setTimeout(() => {
                                            var _a2;
                                            const currentTrendLines = (_a2 = api.getTrendLines) == null ? void 0 : _a2.call(api);
                                            console.log(`📊 ChartContainer: Verification - trend lines in chart after adding:`, currentTrendLines);
                                        }, 1e3);
                                    }
                                    else {
                                        console.error(`📊 ChartContainer: addTrendLine API method not available!`);
                                    }
                                }
                                else {
                                    console.log(`📊 ChartContainer: Chart ready but no trend lines to add yet (trendLines.length = ${trendLines.length}, trendLinesLoaded = ${trendLinesLoaded})`);
                                }
                                if (api.on) {
                                    api.on("trend-line-selected", (event) => {
                                        console.log("Trend line selected:", event);
                                        setSelectedTrendLineId(event.trendLineId);
                                        setSelectedTrendLine(event.trendLine);
                                    });
                                    api.on("trend-line-deselected", () => {
                                        console.log("Trend line deselected");
                                        setSelectedTrendLineId(null);
                                        setSelectedTrendLine(null);
                                    });
                                    api.on("trend-line-deleted", (event) => {
                                        console.log("Trend line deleted:", event);
                                        if (event.trendLineId === selectedTrendLineId) {
                                            setSelectedTrendLineId(null);
                                            setSelectedTrendLine(null);
                                        }
                                    });
                                }
                                const checkAndSaveTrendLines = async () => {
                                    var _a2;
                                    try {
                                        const rawTrendLines = ((_a2 = api.getTrendLines) == null ? void 0 : _a2.call(api)) || [];
                                        const currentTrendLines = [];
                                        for (let i = 0; i < rawTrendLines.length; i++) {
                                            try {
                                                const line = rawTrendLines[i];
                                                const cleanLine = {};
                                                try {
                                                    cleanLine.id = String(line.id || `trend-line-${Date.now()}-${Math.random()}`);
                                                }
                                                catch {
                                                    cleanLine.id = `trend-line-${Date.now()}-${Math.random()}`;
                                                }
                                                try {
                                                    if (line.startPoint) {
                                                        const sp = line.startPoint;
                                                        const timeValue = sp.timestamp !== void 0 ? sp.timestamp : sp.time;
                                                        const priceValue = sp.price !== void 0 ? sp.price : sp.value;
                                                        if (timeValue !== void 0 && priceValue !== void 0) {
                                                            cleanLine.startPoint = {
                                                                timestamp: Number(timeValue),
                                                                price: Number(priceValue)
                                                            };
                                                        }
                                                    }
                                                }
                                                catch (e) {
                                                    console.warn("Could not extract startPoint:", e);
                                                }
                                                try {
                                                    if (line.endPoint) {
                                                        const ep = line.endPoint;
                                                        const timeValue = ep.timestamp !== void 0 ? ep.timestamp : ep.time;
                                                        const priceValue = ep.price !== void 0 ? ep.price : ep.value;
                                                        if (timeValue !== void 0 && priceValue !== void 0) {
                                                            cleanLine.endPoint = {
                                                                timestamp: Number(timeValue),
                                                                price: Number(priceValue)
                                                            };
                                                        }
                                                    }
                                                }
                                                catch (e) {
                                                    console.warn("Could not extract endPoint:", e);
                                                }
                                                try {
                                                    if (line.style) {
                                                        cleanLine.style = {
                                                            color: String(line.style.color || "#2962FF"),
                                                            width: Number(line.style.width || 1),
                                                            style: Number(line.style.style || 0)
                                                        };
                                                    }
                                                }
                                                catch (e) {
                                                    console.warn("Could not extract style:", e);
                                                }
                                                try {
                                                    if (line.extend) {
                                                        cleanLine.extend = {
                                                            left: Boolean(line.extend.left),
                                                            right: Boolean(line.extend.right)
                                                        };
                                                    }
                                                }
                                                catch (e) {
                                                    console.warn("Could not extract extend:", e);
                                                }
                                                try {
                                                    if (line.text !== void 0 && line.text !== null) {
                                                        cleanLine.text = String(line.text);
                                                    }
                                                }
                                                catch (e) {
                                                    console.warn("Could not extract text:", e);
                                                }
                                                currentTrendLines.push(cleanLine);
                                            }
                                            catch (lineError) {
                                                console.error("Error processing trend line at index", i, ":", lineError);
                                            }
                                        }
                                        if (JSON.stringify(currentTrendLines) !== JSON.stringify(previousTrendLines)) {
                                            console.log("📊 ChartContainer: Current trend lines from API:", currentTrendLines);
                                            if (!(user == null ? void 0 : user.email)) {
                                                console.log("📊 ChartContainer: Skipping trend line save for anonymous user");
                                                return;
                                            }
                                            const repository = getRepository(user.email);
                                            await repository.initialize();
                                            for (const trendLine of currentTrendLines) {
                                                console.log("📊 ChartContainer: Saving trend line structure:", {
                                                    id: trendLine.id,
                                                    hasStartPoint: !!trendLine.startPoint,
                                                    hasEndPoint: !!trendLine.endPoint,
                                                    startPoint: trendLine.startPoint,
                                                    endPoint: trendLine.endPoint,
                                                    fullStructure: trendLine
                                                });
                                                await repository.saveTrendLine(layoutId, chartId, trendLine);
                                            }
                                            for (const prevLine of previousTrendLines) {
                                                if (!currentTrendLines.find((line) => line.id === prevLine.id)) {
                                                    await repository.deleteTrendLine(layoutId, chartId, prevLine.id);
                                                }
                                            }
                                            previousTrendLines = [...currentTrendLines];
                                            console.log("Trend lines synchronized:", currentTrendLines.length);
                                        }
                                    }
                                    catch (error) {
                                        console.error("Failed to synchronize trend lines:", error);
                                    }
                                };
                                const intervalId = setInterval(checkAndSaveTrendLines, 2e3);
                                (_b = api.on) == null ? void 0 : _b.call(api, "trend-line-deleted", async (event) => {
                                    if (event.trendLineId) {
                                        try {
                                            if (!(user == null ? void 0 : user.email)) {
                                                console.log("📊 ChartContainer: Skipping trend line delete for anonymous user");
                                                return;
                                            }
                                            const repository = getRepository(user.email);
                                            await repository.initialize();
                                            await repository.deleteTrendLine(layoutId, chartId, event.trendLineId);
                                            console.log("Trend line deleted:", event.trendLineId);
                                            previousTrendLines = previousTrendLines.filter((line) => line.id !== event.trendLineId);
                                        }
                                        catch (error) {
                                            console.error("Failed to delete trend line:", error);
                                        }
                                    }
                                });
                                return () => {
                                    clearInterval(intervalId);
                                };
                            }
                        },
                        onError: (error) => setChartError(error)
                    })
                ] })
        ]
    });
};
const ResizeHandle = ({ direction }) => /* @__PURE__ */ jsx(PanelResizeHandle, {
    className: `
      ${direction === "horizontal" ? "w-1 hover:w-2" : "h-1 hover:h-2"}
      bg-gray-800 hover:bg-gray-700
      transition-all duration-200 ease-in-out
      ${direction === "horizontal" ? "cursor-col-resize" : "cursor-row-resize"}
      flex items-center justify-center
      group
    `,
    children: /* @__PURE__ */ jsx("div", {
        className: `
      ${direction === "horizontal" ? "w-0.5 h-6" : "h-0.5 w-6"}
      bg-gray-600
      group-hover:bg-gray-500
      transition-colors duration-200
    `
    })
});
const renderPanelGroup = (layout, layoutId, onLayoutChange, rootLayout, parentPath = "", onChartApiReady) => {
    const currentPath = parentPath ? `${parentPath}.${layout.id}` : layout.id;
    if (layout.type === "chart" && layout.chart) {
        return /* @__PURE__ */ jsx(Panel, {
            defaultSize: layout.size || layout.defaultSize || 50,
            minSize: layout.minSize || 20,
            className: "relative",
            children: /* @__PURE__ */ jsx(ChartContainer, {
                config: layout.chart,
                layoutId,
                onConfigUpdate: (updatedConfig) => {
                    if (onLayoutChange && rootLayout) {
                        const updateChartInLayout = (currentLayout) => {
                            if (currentLayout.type === "chart" && currentLayout.id === layout.id) {
                                return {
                                    ...currentLayout,
                                    chart: updatedConfig
                                };
                            }
                            else if (currentLayout.type === "group" && currentLayout.children) {
                                return {
                                    ...currentLayout,
                                    children: currentLayout.children.map(updateChartInLayout)
                                };
                            }
                            return currentLayout;
                        };
                        const updatedRootLayout = updateChartInLayout(rootLayout);
                        onLayoutChange(updatedRootLayout, "chart-data");
                    }
                },
                onApiReady: onChartApiReady
            })
        }, layout.id);
    }
    if (layout.type === "group" && layout.children) {
        return /* @__PURE__ */ jsx(Panel, {
            defaultSize: layout.size || layout.defaultSize || 50,
            minSize: layout.minSize || 20,
            children: /* @__PURE__ */ jsx(PanelGroup, {
                direction: layout.direction || "horizontal",
                onLayout: (sizes) => {
                    if (onLayoutChange && rootLayout) {
                        const updateSizesInLayout = (currentLayout, targetId, newSizes) => {
                            var _a;
                            if (currentLayout.id === targetId && currentLayout.type === "group") {
                                return {
                                    ...currentLayout,
                                    sizes: newSizes,
                                    children: (_a = currentLayout.children) == null ? void 0 : _a.map((child, index) => ({
                                        ...child,
                                        size: newSizes[index]
                                    }))
                                };
                            }
                            else if (currentLayout.type === "group" && currentLayout.children) {
                                return {
                                    ...currentLayout,
                                    children: currentLayout.children.map((child) => updateSizesInLayout(child, targetId, newSizes))
                                };
                            }
                            return currentLayout;
                        };
                        const updatedRootLayout = updateSizesInLayout(rootLayout, layout.id, sizes);
                        onLayoutChange(updatedRootLayout, "structure");
                    }
                },
                children: layout.children.map((child, index) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
                        renderPanelGroup(child, layoutId, onLayoutChange, rootLayout || layout, currentPath, onChartApiReady),
                        index < layout.children.length - 1 && /* @__PURE__ */ jsx(ResizeHandle, { direction: layout.direction || "horizontal" })
                    ] }, child.id))
            })
        }, layout.id);
    }
    return null;
};
const ChartPanel = ({ layout, layoutId, onLayoutChange, className = "", onChartApiReady }) => {
    const handleLayoutChange = useCallback((sizes) => {
        if (!onLayoutChange || !layout.children)
            return;
        const updatedLayout = {
            ...layout,
            sizes,
            children: layout.children.map((child, index) => ({
                ...child,
                size: sizes[index]
            }))
        };
        onLayoutChange(updatedLayout, "structure");
    }, [onLayoutChange, layout]);
    return /* @__PURE__ */ jsx("div", { className: `h-full w-full relative ${className}`, children: /* @__PURE__ */ jsx(PanelGroup, {
            direction: layout.direction || "horizontal",
            onLayout: handleLayoutChange,
            children: layout.children ? layout.children.map((child, index) => /* @__PURE__ */ jsxs(React.Fragment, { children: [
                    renderPanelGroup(child, layoutId, onLayoutChange, layout, "", onChartApiReady),
                    index < layout.children.length - 1 && /* @__PURE__ */ jsx(ResizeHandle, { direction: layout.direction || "horizontal" })
                ] }, child.id)) : renderPanelGroup(layout, layoutId, onLayoutChange, layout, "", onChartApiReady)
        }) });
};
const createChartLayout = (id, symbol = "BTC-USD", granularity = "ONE_HOUR", defaultSize, size) => ({
    id,
    type: "chart",
    chart: {
        id,
        symbol,
        granularity,
        indicators: []
    },
    defaultSize,
    size,
    minSize: 20
});
const createGroupLayout = (id, direction, children, defaultSize, sizes) => ({
    id,
    type: "group",
    direction,
    children,
    defaultSize,
    sizes,
    minSize: 20
});
const LAYOUT_PRESETS = {
    single: createChartLayout("main", "BTC-USD"),
    horizontal: createGroupLayout("root", "horizontal", [
        createChartLayout("left", "BTC-USD", "ONE_HOUR", 50, 50),
        createChartLayout("right", "ETH-USD", "ONE_HOUR", 50, 50)
    ], 100, [50, 50]),
    vertical: createGroupLayout("root", "vertical", [
        createChartLayout("top", "BTC-USD", "ONE_HOUR", 50, 50),
        createChartLayout("bottom", "ETH-USD", "ONE_HOUR", 50, 50)
    ], 100, [50, 50]),
    quad: createGroupLayout("root", "horizontal", [
        createGroupLayout("left", "vertical", [
            createChartLayout("top-left", "BTC-USD", "ONE_HOUR", 50, 50),
            createChartLayout("bottom-left", "ETH-USD", "ONE_HOUR", 50, 50)
        ], 50, [50, 50]),
        createGroupLayout("right", "vertical", [
            createChartLayout("top-right", "SOL-USD", "ONE_HOUR", 50, 50),
            createChartLayout("bottom-right", "ADA-USD", "ONE_HOUR", 50, 50)
        ], 50, [50, 50])
    ], 100, [50, 50]),
    triple: createGroupLayout("root", "horizontal", [
        createChartLayout("left", "BTC-USD", "ONE_HOUR", 40, 40),
        createGroupLayout("right", "vertical", [
            createChartLayout("top-right", "ETH-USD", "ONE_HOUR", 50, 50),
            createChartLayout("bottom-right", "SOL-USD", "ONE_HOUR", 50, 50)
        ], 60, [50, 50])
    ], 100, [40, 60])
};
const LayoutPresetButton = ({ name, onClick, icon, disabled }) => /* @__PURE__ */ jsxs("button", {
    onClick,
    disabled,
    className: "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border text-xs h-20 transition-all duration-200 bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed",
    title: `Create new '${name}' layout`,
    children: [
        icon,
        /* @__PURE__ */ jsx("span", { className: "mt-1", children: name })
    ]
});
const LayoutSelectorModal = ({ isOpen, onClose, onSaveLayout, onSelectLayout, onDeleteLayout, layouts, activeLayoutId, loading, canAddMoreLayouts, layoutLimit, subscriptionStatus, subscriptionPlan }) => {
    const [newLayoutName, setNewLayoutName] = useState("");
    const [addLayoutAccordionOpen, setAddLayoutAccordionOpen] = useState(false);
    const [error, setError] = useState(null);
    const [deletingLayoutId, setDeletingLayoutId] = useState(null);
    const handleSave = async (preset) => {
        if (!newLayoutName.trim()) {
            setError("Layout name cannot be empty.");
            return;
        }
        if (!canAddMoreLayouts) {
            setError("Layout limit reached. Please upgrade to create more layouts.");
            return;
        }
        setError(null);
        const success = await onSaveLayout(newLayoutName, preset);
        if (success) {
            setNewLayoutName("");
            setAddLayoutAccordionOpen(false);
        }
        else {
            setError("Failed to save layout. Please try again.");
        }
    };
    const handleDelete = async (layoutId) => {
        if (!onDeleteLayout)
            return;
        const layout = layouts.find((l) => l.id === layoutId);
        if (!layout)
            return;
        if (confirm(`Are you sure you want to delete the layout "${layout.name}"?`)) {
            try {
                setDeletingLayoutId(layoutId);
                await onDeleteLayout(layoutId);
            }
            catch (error2) {
                console.error("Failed to delete layout:", error2);
                alert("Failed to delete layout. Please try again.");
            }
            finally {
                setDeletingLayoutId(null);
            }
        }
    };
    const layoutConfigs = [
        {
            name: "Single",
            key: "single",
            layout: LAYOUT_PRESETS.single,
            icon: /* @__PURE__ */ jsx("div", { className: "w-10 h-8 border-2 border-current rounded-md" })
        },
        {
            name: "Horizontal",
            key: "horizontal",
            layout: LAYOUT_PRESETS.horizontal,
            icon: /* @__PURE__ */ jsxs("div", { className: "flex gap-1 w-10 h-8", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1/2 h-full border-2 border-current rounded-sm" }),
                    /* @__PURE__ */ jsx("div", { className: "w-1/2 h-full border-2 border-current rounded-sm" })
                ] })
        },
        {
            name: "Vertical",
            key: "vertical",
            layout: LAYOUT_PRESETS.vertical,
            icon: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 w-10 h-8", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-full h-1/2 border-2 border-current rounded-sm" }),
                    /* @__PURE__ */ jsx("div", { className: "w-full h-1/2 border-2 border-current rounded-sm" })
                ] })
        },
        {
            name: "Quad",
            key: "quad",
            layout: LAYOUT_PRESETS.quad,
            icon: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1 w-10 h-8", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-full h-full border-2 border-current rounded-sm" }),
                    /* @__PURE__ */ jsx("div", { className: "w-full h-full border-2 border-current rounded-sm" }),
                    /* @__PURE__ */ jsx("div", { className: "w-full h-full border-2 border-current rounded-sm" }),
                    /* @__PURE__ */ jsx("div", { className: "w-full h-full border-2 border-current rounded-sm" })
                ] })
        },
        {
            name: "Triple",
            key: "triple",
            layout: LAYOUT_PRESETS.triple,
            icon: /* @__PURE__ */ jsxs("div", { className: "flex gap-1 w-10 h-8", children: [
                    /* @__PURE__ */ jsx("div", { className: "w-1/2 h-full border-2 border-current rounded-sm" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 w-1/2 h-full", children: [
                            /* @__PURE__ */ jsx("div", { className: "w-full h-1/2 border-2 border-current rounded-sm" }),
                            /* @__PURE__ */ jsx("div", { className: "w-full h-1/2 border-2 border-current rounded-sm" })
                        ] })
                ] })
        }
    ];
    return /* @__PURE__ */ jsxs(Dialog, { open: isOpen, onClose, className: "relative z-[400]", children: [
            /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/60", "aria-hidden": "true" }),
            /* @__PURE__ */ jsx("div", { className: "fixed inset-0 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs(Dialog.Panel, { className: "w-full max-w-md rounded-lg bg-gray-900 shadow-xl border border-gray-700", children: [
                        /* @__PURE__ */ jsxs("div", { className: "p-6 pb-4 border-b border-gray-700 flex items-center justify-between", children: [
                                /* @__PURE__ */ jsxs("div", { children: [
                                        /* @__PURE__ */ jsx(Dialog.Title, { className: "text-lg font-semibold text-white", children: "Layout Manager" }),
                                        /* @__PURE__ */ jsx(Dialog.Description, { className: "mt-0.5 text-sm text-gray-400", children: "Select an active layout or create a new one." })
                                    ] }),
                                /* @__PURE__ */ jsx("button", {
                                    onClick: onClose,
                                    className: "text-gray-400 hover:text-white transition-colors",
                                    children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })
                                })
                            ] }),
                        /* @__PURE__ */ jsxs("div", { className: "p-6 max-h-[60vh] overflow-y-auto", children: [
                                /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
                                        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-semibold text-white mb-3 flex items-center justify-between", children: [
                                                /* @__PURE__ */ jsx("span", { children: "Saved Layouts" }),
                                                !loading && layoutLimit !== null && /* @__PURE__ */ jsxs("span", { className: `text-xs font-normal ${layouts.length >= layoutLimit ? "text-orange-400" : "text-gray-400"}`, children: [
                                                        layouts.length,
                                                        " / ",
                                                        layoutLimit
                                                    ] })
                                            ] }),
                                        layouts.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: layouts.map((layout) => /* @__PURE__ */ jsxs("li", {
                                                className: "flex justify-between items-center p-3 bg-gray-800 border border-gray-700 rounded-lg",
                                                children: [
                                                    /* @__PURE__ */ jsx("span", { className: "font-medium text-white", children: layout.name }),
                                                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                                                            /* @__PURE__ */ jsx("button", {
                                                                onClick: () => handleDelete(layout.id),
                                                                disabled: deletingLayoutId === layout.id || layout.id === activeLayoutId,
                                                                className: "p-1.5 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                                                title: layout.id === activeLayoutId ? "Cannot delete active layout" : "Delete layout",
                                                                children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
                                                            }),
                                                            layout.id === activeLayoutId ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-400", children: [
                                                                    /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full" }),
                                                                    "Active"
                                                                ] }) : /* @__PURE__ */ jsx("button", {
                                                                onClick: () => {
                                                                    onSelectLayout(layout.id);
                                                                    onClose();
                                                                },
                                                                disabled: loading,
                                                                className: "px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-gray-600",
                                                                children: "Activate"
                                                            })
                                                        ] })
                                                ]
                                            }, layout.id)) }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "No saved layouts. Create one below." })
                                    ] }),
                                /* @__PURE__ */ jsxs("div", { children: [
                                        /* @__PURE__ */ jsxs("button", {
                                            onClick: () => setAddLayoutAccordionOpen(!addLayoutAccordionOpen),
                                            className: "w-full flex justify-between items-center text-left text-sm font-semibold text-white p-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 transition-colors",
                                            children: [
                                                "Create New Layout",
                                                /* @__PURE__ */ jsx("svg", {
                                                    className: `w-5 h-5 transition-transform ${addLayoutAccordionOpen ? "transform rotate-180" : ""}`,
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /* @__PURE__ */ jsx("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M19 9l-7 7-7-7"
                                                    })
                                                })
                                            ]
                                        }),
                                        addLayoutAccordionOpen && /* @__PURE__ */ jsxs("div", { className: "mt-2 p-4 bg-gray-800 border border-gray-700 rounded-lg", children: [
                                                !canAddMoreLayouts && /* @__PURE__ */ jsxs("div", { className: "mb-4 p-3 bg-orange-900/20 border border-orange-600/50 rounded-lg flex items-start gap-2", children: [
                                                        /* @__PURE__ */ jsx(AlertCircle, { className: "w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" }),
                                                        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                                                                /* @__PURE__ */ jsx("p", { className: "text-sm text-orange-400 font-medium", children: "Layout Limit Reached" }),
                                                                /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400 mt-1", children: [
                                                                        ["active", "past_due", "incomplete"].includes(subscriptionStatus) && subscriptionPlan === "starter" ? `Starter plan allows ${layoutLimit} saved layouts. ` : "Subscribe to save layouts. ",
                                                                        ["active", "past_due", "incomplete"].includes(subscriptionStatus) && subscriptionPlan === "starter" ? /* @__PURE__ */ jsx(Link, { to: "/billing", className: "text-blue-400 hover:underline", children: "Upgrade to Pro for unlimited layouts" }) : /* @__PURE__ */ jsx(Link, { to: "/pricing", className: "text-blue-400 hover:underline", children: "View pricing plans" })
                                                                    ] })
                                                            ] })
                                                    ] }),
                                                /* @__PURE__ */ jsx("label", {
                                                    htmlFor: "new-layout-name",
                                                    className: "block text-sm font-medium text-gray-300 mb-2",
                                                    children: "Layout Name"
                                                }),
                                                /* @__PURE__ */ jsx("input", {
                                                    id: "new-layout-name",
                                                    type: "text",
                                                    value: newLayoutName,
                                                    onChange: (e) => {
                                                        setNewLayoutName(e.target.value);
                                                        if (error)
                                                            setError(null);
                                                    },
                                                    placeholder: "e.g., 'My Trading Setup'",
                                                    className: "w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed",
                                                    disabled: !canAddMoreLayouts
                                                }),
                                                error && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: error }),
                                                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-300 mt-4 mb-2", children: "Select a Preset" }),
                                                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 sm:grid-cols-5 gap-3", children: layoutConfigs.map((config) => /* @__PURE__ */ jsx(LayoutPresetButton, {
                                                        name: config.name,
                                                        onClick: () => handleSave(config.layout),
                                                        icon: config.icon,
                                                        disabled: loading || !newLayoutName.trim() || !canAddMoreLayouts
                                                    }, config.key)) })
                                            ] })
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-gray-700 flex justify-end", children: /* @__PURE__ */ jsx("button", {
                                onClick: onClose,
                                className: "px-5 py-2 text-sm font-medium text-white bg-gray-800 border border-gray-600 rounded-md hover:bg-gray-700 transition-colors",
                                children: "Close"
                            }) })
                    ] }) })
        ] });
};
function convertToChartPanelLayout(layoutNode, charts = /* @__PURE__ */ new Map()) {
    if (layoutNode.type === "chart") {
        const chartNode = layoutNode;
        const chartConfig = chartNode.chart || charts.get(chartNode.chartId || chartNode.id);
        return {
            id: chartNode.id,
            type: "chart",
            chart: chartConfig || {
                id: chartNode.id,
                symbol: "BTC-USD",
                granularity: "ONE_HOUR",
                indicators: []
            },
            defaultSize: chartNode.size || 50,
            size: chartNode.size,
            minSize: 20
        };
    }
    else {
        const splitNode = layoutNode;
        return {
            id: generateId(),
            type: "group",
            direction: splitNode.direction,
            children: splitNode.children.map((child, index) => {
                const childLayout = convertToChartPanelLayout(child, charts);
                if (splitNode.sizes && splitNode.sizes[index] !== void 0) {
                    return {
                        ...childLayout,
                        size: splitNode.sizes[index],
                        defaultSize: splitNode.sizes[index]
                    };
                }
                return childLayout;
            }),
            defaultSize: splitNode.sizes ? splitNode.sizes[0] : Math.round(splitNode.ratio * 100),
            sizes: splitNode.sizes,
            minSize: 20
        };
    }
}
function convertFromChartPanelLayout(panelLayout, charts = /* @__PURE__ */ new Map()) {
    if (panelLayout.type === "chart" && panelLayout.chart) {
        charts.set(panelLayout.chart.id, panelLayout.chart);
        const chartNode = {
            type: "chart",
            id: panelLayout.id,
            chart: panelLayout.chart
            // Embed the chart directly
        };
        if (panelLayout.size !== void 0) {
            chartNode.size = panelLayout.size;
        }
        return chartNode;
    }
    else if (panelLayout.type === "group" && panelLayout.children) {
        const splitNode = {
            type: "split",
            direction: panelLayout.direction || "horizontal",
            ratio: (panelLayout.defaultSize || 50) / 100,
            children: panelLayout.children.map((child) => convertFromChartPanelLayout(child, charts))
        };
        const sizes = panelLayout.sizes || panelLayout.children.map((child) => child.size || child.defaultSize || 50);
        if (sizes && sizes.every((size) => size !== void 0)) {
            splitNode.sizes = sizes;
        }
        return splitNode;
    }
    else {
        throw new Error("Invalid panel layout structure");
    }
}
function generateId() {
    return `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
const findFirstChart = (layout) => {
    if (layout.type === "chart" && layout.chart) {
        return layout.chart;
    }
    if (layout.type === "group" && layout.children) {
        for (const child of layout.children) {
            const chart = findFirstChart(child);
            if (chart) {
                return chart;
            }
        }
    }
    return null;
};
const generateUniqueChartId = () => {
    return `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
const cloneLayoutWithNewIds = (layout) => {
    const newLayout = { ...layout };
    newLayout.id = `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (newLayout.type === "chart" && newLayout.chart) {
        newLayout.chart = {
            ...newLayout.chart,
            id: generateUniqueChartId()
        };
    }
    else if (newLayout.type === "group" && newLayout.children) {
        newLayout.children = newLayout.children.map((child) => cloneLayoutWithNewIds(child));
    }
    return newLayout;
};
const updateAllChartsWithDefaults = (layout, defaultChart) => {
    const updatedLayout = { ...layout };
    if (updatedLayout.type === "chart" && updatedLayout.chart) {
        updatedLayout.chart = {
            ...updatedLayout.chart,
            symbol: (defaultChart == null ? void 0 : defaultChart.symbol) || "BTC-USD",
            granularity: (defaultChart == null ? void 0 : defaultChart.granularity) || "ONE_HOUR",
            indicators: (defaultChart == null ? void 0 : defaultChart.indicators) || []
        };
    }
    else if (updatedLayout.type === "group" && updatedLayout.children) {
        updatedLayout.children = updatedLayout.children.map((child) => updateAllChartsWithDefaults(child, defaultChart));
    }
    return updatedLayout;
};
const LayoutSelector = ({ currentLayout, currentLayoutId, onLayoutChange, className = "" }) => {
    const { layouts, saveLayout, deleteLayout, isLoading } = useLayouts();
    const { setActiveLayout } = useUserSettings();
    const { status, plan, canAddMoreLayouts, getLayoutLimit, isLoading: subscriptionLoading } = useSubscription();
    const [modalOpen, setModalOpen] = useState(false);
    const handleSaveLayout = async (name, presetLayout) => {
        console.log("Creating new layout:", name);
        if (!canAddMoreLayouts(layouts.length)) {
            console.error("Cannot add more layouts - limit reached");
            return false;
        }
        const defaultChart = findFirstChart(currentLayout);
        console.log("Using default chart config:", defaultChart);
        const layoutWithNewIds = cloneLayoutWithNewIds(presetLayout);
        console.log("Layout with new IDs:", layoutWithNewIds);
        const finalLayout = updateAllChartsWithDefaults(layoutWithNewIds, defaultChart);
        console.log("Final layout with defaults:", finalLayout);
        const charts = /* @__PURE__ */ new Map();
        const repositoryLayout = convertFromChartPanelLayout(finalLayout, charts);
        const layoutData = {
            name,
            userId: "",
            // Will be set by repository
            layout: repositoryLayout
        };
        try {
            console.log("Saving layout to repository...");
            const savedLayout = await saveLayout(layoutData);
            console.log("Layout saved successfully:", savedLayout.id);
            await setActiveLayout(savedLayout.id);
            setTimeout(() => {
                onLayoutChange(finalLayout, savedLayout.id);
                setModalOpen(false);
            }, 100);
            return true;
        }
        catch (error) {
            console.error("Failed to save new layout:", error);
            return false;
        }
    };
    const handleLoadSavedLayout = async (layoutId) => {
        const savedLayout = layouts.find((l) => l.id === layoutId);
        if (!savedLayout) {
            console.warn(`Layout with id ${layoutId} not found.`);
            return;
        }
        console.log("Loading saved layout:", savedLayout.name);
        const charts = /* @__PURE__ */ new Map();
        const panelLayout = convertToChartPanelLayout(savedLayout.layout, charts);
        try {
            await setActiveLayout(savedLayout.id);
        }
        catch (error) {
            console.error("Failed to set active layout:", error);
        }
        setTimeout(() => {
            onLayoutChange(panelLayout, savedLayout.id);
            setModalOpen(false);
        }, 100);
    };
    const activeLayout = layouts.find((l) => l.id === currentLayoutId);
    const activeLayoutName = (activeLayout == null ? void 0 : activeLayout.name) || "Unsaved Layout";
    return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: `flex items-center ${className}`, children: /* @__PURE__ */ jsxs("button", {
                    onClick: () => setModalOpen(true),
                    className: "flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors border border-gray-700",
                    title: "Open layout manager",
                    children: [
                        /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" }) }),
                        /* @__PURE__ */ jsx("span", { children: activeLayoutName }),
                        /* @__PURE__ */ jsx("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })
                    ]
                }) }),
            /* @__PURE__ */ jsx(LayoutSelectorModal, {
                isOpen: modalOpen,
                onClose: () => setModalOpen(false),
                onSaveLayout: handleSaveLayout,
                onSelectLayout: handleLoadSavedLayout,
                onDeleteLayout: deleteLayout,
                layouts,
                activeLayoutId: currentLayoutId,
                loading: isLoading || subscriptionLoading,
                canAddMoreLayouts: canAddMoreLayouts(layouts.length),
                layoutLimit: getLayoutLimit(),
                subscriptionStatus: status,
                subscriptionPlan: plan
            })
        ] });
};
function PreviewTimer({ previewStartTime, onExpire }) {
    const [timeRemaining, setTimeRemaining] = useState(null);
    useEffect(() => {
        const updateTimer = () => {
            const elapsedMs = Date.now() - previewStartTime;
            const remainingMs = Math.max(0, 5 * 60 * 1e3 - elapsedMs);
            if (remainingMs === 0) {
                onExpire == null ? void 0 : onExpire();
                return;
            }
            const minutes = Math.floor(remainingMs / 6e4);
            const seconds = Math.floor(remainingMs % 6e4 / 1e3);
            setTimeRemaining({ minutes, seconds });
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1e3);
        return () => clearInterval(interval);
    }, [previewStartTime, onExpire]);
    if (!timeRemaining)
        return null;
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg", children: [
            /* @__PURE__ */ jsx(Clock, { className: "h-4 w-4 text-yellow-500" }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm text-yellow-500 font-medium", children: [
                    "Preview: ",
                    timeRemaining.minutes,
                    ":",
                    String(timeRemaining.seconds).padStart(2, "0")
                ] })
        ] });
}
const AppToolbar = ({ repository, currentLayout, currentLayoutId, onLayoutChange, migrationStatus, hasPreviewAccess, previewStartTime, onPreviewExpire, showAIChat, onToggleAIChat }) => {
    return /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 px-2 sm:px-4 py-2 bg-gray-900 border-b border-gray-800 relative z-[300]", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 sm:gap-4", children: [
                        /* @__PURE__ */ jsx("img", { src: "/full-logo-accent-1.svg", alt: "Spot Canvas", className: "h-6 w-auto" }),
                        /* @__PURE__ */ jsx(AccountMenu, {}),
                        repository && /* @__PURE__ */ jsxs("div", {
                            className: "flex items-center gap-2",
                            title: repository.isOnline() ? "Repository Online" : "Repository Offline",
                            children: [
                                /* @__PURE__ */ jsx("div", {
                                    className: `h-2 w-2 rounded-full ${repository.isOnline() ? "bg-green-500" : "bg-red-500"}`
                                }),
                                /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 hidden sm:inline", children: repository.isOnline() ? "Online" : "Offline" })
                            ]
                        }),
                        migrationStatus && /* @__PURE__ */ jsx("div", { className: "text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-800", children: migrationStatus }),
                        hasPreviewAccess && previewStartTime && /* @__PURE__ */ jsx(PreviewTimer, {
                            previewStartTime,
                            onExpire: onPreviewExpire || (() => window.location.reload())
                        })
                    ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                        /* @__PURE__ */ jsx("button", {
                            onClick: onToggleAIChat || (() => console.log("AI Chat toggle not connected")),
                            className: `p-2 rounded-lg transition-colors ${showAIChat ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`,
                            title: showAIChat ? "Close AI Assistant" : "Open AI Assistant (Cmd/Ctrl + Shift + A)",
                            "aria-label": showAIChat ? "Close AI Assistant" : "Open AI Assistant",
                            children: /* @__PURE__ */ jsx(Bot, { className: "w-5 h-5" })
                        }),
                        currentLayout && /* @__PURE__ */ jsx(LayoutSelector, {
                            currentLayout,
                            currentLayoutId,
                            onLayoutChange,
                            className: "flex-shrink-0"
                        })
                    ] })
            ] }) });
};
function PWAInstallBanner() {
    const { user } = useAuth();
    const [isDismissed, setIsDismissed] = useState(true);
    const [isIOS, setIsIOS] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isPWA, setIsPWA] = useState(false);
    useEffect(() => {
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
        setIsPWA(isStandalone);
        const checkMobile = () => {
            const width = window.innerWidth;
            const userAgent2 = navigator.userAgent;
            const isMobileDevice = width < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent2);
            setIsMobile(isMobileDevice);
        };
        const userAgent = navigator.userAgent;
        setIsIOS(/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream);
        setIsAndroid(/Android/.test(userAgent));
        checkMobile();
        window.addEventListener("resize", checkMobile);
        if (user == null ? void 0 : user.uid) {
            const storageKey = `pwa-install-dismissed-${user.uid}`;
            const dismissed = localStorage.getItem(storageKey);
            if (!dismissed) {
                setIsDismissed(false);
            }
        }
        else {
            const dismissed = localStorage.getItem("pwa-install-dismissed-guest");
            if (!dismissed) {
                setIsDismissed(false);
            }
        }
        return () => {
            window.removeEventListener("resize", checkMobile);
        };
    }, [user]);
    const handleDismiss = () => {
        setIsDismissed(true);
        const storageKey = (user == null ? void 0 : user.uid) ? `pwa-install-dismissed-${user.uid}` : "pwa-install-dismissed-guest";
        localStorage.setItem(storageKey, "true");
    };
    if (isDismissed || !isMobile || isPWA || !isIOS && !isAndroid) {
        return null;
    }
    return /* @__PURE__ */ jsxs("div", { className: "relative bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mx-4 mt-2 mb-2", children: [
            /* @__PURE__ */ jsx("button", {
                onClick: handleDismiss,
                className: "absolute top-2 right-2 text-blue-500/50 hover:text-blue-500 transition-colors",
                "aria-label": "Dismiss",
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
            }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                    /* @__PURE__ */ jsx(Download, { className: "h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                            /* @__PURE__ */ jsx("h3", { className: "text-blue-400 font-medium mb-1", children: "Install Spot Canvas App" }),
                            /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm mb-3", children: "Add Spot Canvas to your home screen for the best experience - full screen charts without browser controls." }),
                            isIOS && /* @__PURE__ */ jsxs("div", { className: "text-gray-300 text-sm space-y-2", children: [
                                    /* @__PURE__ */ jsx("p", { className: "font-medium", children: "How to install on iOS:" }),
                                    /* @__PURE__ */ jsxs("ol", { className: "list-decimal list-inside space-y-1 text-gray-400", children: [
                                            /* @__PURE__ */ jsxs("li", { className: "flex items-start", children: [
                                                    /* @__PURE__ */ jsx("span", { className: "mr-2", children: "1." }),
                                                    /* @__PURE__ */ jsxs("span", { children: [
                                                            "Tap the ",
                                                            /* @__PURE__ */ jsx(Share, { className: "inline h-4 w-4 mx-1" }),
                                                            " Share button in Safari"
                                                        ] })
                                                ] }),
                                            /* @__PURE__ */ jsxs("li", { className: "flex items-start", children: [
                                                    /* @__PURE__ */ jsx("span", { className: "mr-2", children: "2." }),
                                                    /* @__PURE__ */ jsx("span", { children: 'Scroll down and tap "Add to Home Screen"' })
                                                ] }),
                                            /* @__PURE__ */ jsxs("li", { className: "flex items-start", children: [
                                                    /* @__PURE__ */ jsx("span", { className: "mr-2", children: "3." }),
                                                    /* @__PURE__ */ jsx("span", { children: 'Tap "Add" to install' })
                                                ] })
                                        ] })
                                ] }),
                            isAndroid && /* @__PURE__ */ jsxs("div", { className: "text-gray-300 text-sm space-y-2", children: [
                                    /* @__PURE__ */ jsx("p", { className: "font-medium", children: "How to install on Android:" }),
                                    /* @__PURE__ */ jsxs("ol", { className: "list-decimal list-inside space-y-1 text-gray-400", children: [
                                            /* @__PURE__ */ jsxs("li", { className: "flex items-start", children: [
                                                    /* @__PURE__ */ jsx("span", { className: "mr-2", children: "1." }),
                                                    /* @__PURE__ */ jsx("span", { children: "Tap the menu button (⋮) in your browser" })
                                                ] }),
                                            /* @__PURE__ */ jsxs("li", { className: "flex items-start", children: [
                                                    /* @__PURE__ */ jsx("span", { className: "mr-2", children: "2." }),
                                                    /* @__PURE__ */ jsx("span", { children: 'Tap "Add to Home screen" or "Install app"' })
                                                ] }),
                                            /* @__PURE__ */ jsxs("li", { className: "flex items-start", children: [
                                                    /* @__PURE__ */ jsx("span", { className: "mr-2", children: "3." }),
                                                    /* @__PURE__ */ jsx("span", { children: 'Tap "Add" or "Install" to confirm' })
                                                ] })
                                        ] })
                                ] })
                        ] })
                ] })
        ] });
}
function useMCPClient(userId) {
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId] = useState(() => `session_${Date.now()}`);
    const sendMessage = useCallback(async (message, options = {}) => {
        var _a, _b, _c, _d, _e, _f;
        if (!userId) {
            (_a = options.onError) == null ? void 0 : _a.call(options, new Error("User not authenticated"));
            return;
        }
        try {
            const functionUrl = void 0 ? `${void 0}/chat` : "https://us-central1-spotcanvas-prod.cloudfunctions.net/mcpServer/chat";
            const response = await fetch(functionUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "omit",
                // Don't send credentials for CORS
                mode: "cors",
                body: JSON.stringify({
                    message,
                    userId,
                    sessionId,
                    chartContext: options.chartContext
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const reader = (_b = response.body) == null ? void 0 : _b.getReader();
            const decoder = new TextDecoder();
            if (!reader) {
                throw new Error("No response body");
            }
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data.trim()) {
                            try {
                                const event = JSON.parse(data);
                                switch (event.type) {
                                    case "content":
                                        (_c = options.onStream) == null ? void 0 : _c.call(options, event.content);
                                        break;
                                    case "tool_call":
                                        (_d = options.onToolCall) == null ? void 0 : _d.call(options, event.tool, event.commandId);
                                        break;
                                    case "error":
                                        (_e = options.onError) == null ? void 0 : _e.call(options, new Error(event.error));
                                        break;
                                    case "done":
                                        break;
                                }
                            }
                            catch (e) {
                                console.error("Error parsing SSE data:", e);
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error("Error sending message:", error);
            (_f = options.onError) == null ? void 0 : _f.call(options, error);
        }
    }, [userId, sessionId]);
    const loadHistory = useCallback(async () => {
        if (!userId)
            return [];
        try {
            const baseUrl = "https://us-central1-spotcanvas-prod.cloudfunctions.net/mcpServer";
            const functionUrl = `${baseUrl}/chat/history/${userId}?sessionId=${sessionId}`;
            const response = await fetch(functionUrl, {
                credentials: "omit",
                mode: "cors"
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.messages.map((msg) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.timestamp),
                commands: msg.commands
            }));
        }
        catch (error) {
            console.error("Error loading history:", error);
            return [];
        }
    }, [userId, sessionId]);
    const clearHistory = useCallback(async () => {
        if (!userId)
            return;
        try {
            const baseUrl = "https://us-central1-spotcanvas-prod.cloudfunctions.net/mcpServer";
            const functionUrl = `${baseUrl}/chat/history/${userId}`;
            const response = await fetch(functionUrl, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "omit",
                mode: "cors",
                body: JSON.stringify({ sessionId })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        catch (error) {
            console.error("Error clearing history:", error);
        }
    }, [userId, sessionId]);
    return {
        isConnected,
        sendMessage,
        loadHistory,
        clearHistory,
        sessionId
    };
}
function useChartCommands(userId, chartApi) {
    const processedCommands = useRef(/* @__PURE__ */ new Set());
    useEffect(() => {
        if (!userId || !chartApi)
            return;
        const commandsRef = collection(db, "users", userId, "chart_commands");
        const q = query(commandsRef, where("status", "==", "pending"), orderBy("timestamp", "asc"));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            console.log("[ChartCommands] Snapshot received, changes:", snapshot.docChanges().length);
            for (const change of snapshot.docChanges()) {
                if (change.type === "added") {
                    const commandDoc = change.doc;
                    const commandId = commandDoc.id;
                    console.log("[ChartCommands] New command detected:", {
                        id: commandId,
                        type: change.type
                    });
                    if (processedCommands.current.has(commandId)) {
                        console.log("[ChartCommands] Skipping already processed command:", commandId);
                        continue;
                    }
                    processedCommands.current.add(commandId);
                    const command = commandDoc.data();
                    console.log("[ChartCommands] Processing command:", {
                        commandId,
                        command: command.command,
                        parameters: command.parameters
                    });
                    try {
                        console.log("[ChartCommands] Executing command via Chart API...");
                        const result = await executeChartCommand(chartApi, command.command, command.parameters);
                        console.log("[ChartCommands] Command executed successfully:", {
                            commandId,
                            command: command.command,
                            result
                        });
                        await updateDoc(doc(db, "users", userId, "chart_commands", commandId), {
                            status: "executed",
                            executedAt: serverTimestamp(),
                            result: result || null
                        });
                    }
                    catch (error) {
                        console.error(`[ChartCommands] Failed to execute command ${command.command}:`, error);
                        await updateDoc(doc(db, "users", userId, "chart_commands", commandId), {
                            status: "failed",
                            executedAt: serverTimestamp(),
                            error: error instanceof Error ? error.message : "Unknown error"
                        });
                    }
                }
            }
        });
        return () => {
            unsubscribe();
            processedCommands.current.clear();
        };
    }, [userId, chartApi]);
}
async function executeChartCommand(api, command, params) {
    console.log("[ExecuteChartCommand] Called with:", {
        command,
        params,
        apiAvailable: !!api,
        apiMethods: api ? Object.keys(api).filter((key) => typeof api[key] === "function") : []
    });
    switch (command) {
        case "set_symbol":
            await api.setSymbol(params.symbol);
            return { symbol: params.symbol };
        case "set_granularity":
            await api.setGranularity(params.granularity);
            return { granularity: params.granularity };
        case "show_indicator":
            console.log("[ExecuteChartCommand] show_indicator called with params:", params);
            if (!params.id || !params.name) {
                throw new Error("Indicator ID and name are required for show_indicator command");
            }
            const validIndicatorIds = ["volume", "rsi", "macd", "bollinger-bands", "moving-averages", "atr", "stochastic"];
            if (!validIndicatorIds.includes(params.id)) {
                throw new Error(`Invalid indicator ID: ${params.id}. Valid IDs are: ${validIndicatorIds.join(", ")}`);
            }
            console.log("[ExecuteChartCommand] Calling api.showIndicator with:", {
                id: params.id,
                name: params.name,
                visible: true,
                params: params.params || {}
            });
            api.showIndicator({
                id: params.id,
                name: params.name,
                visible: true,
                params: params.params || {}
            });
            console.log("[ExecuteChartCommand] api.showIndicator called successfully");
            return { indicator: params.id, visible: true };
        case "hide_indicator":
            console.log("[ExecuteChartCommand] hide_indicator called with params:", params);
            if (!params.id) {
                throw new Error("Indicator ID is required for hide_indicator command");
            }
            const validIndicators = ["volume", "rsi", "macd", "bollinger-bands", "moving-averages", "atr", "stochastic"];
            if (!validIndicators.includes(params.id)) {
                throw new Error(`Invalid indicator ID: ${params.id}. Valid IDs are: ${validIndicators.join(", ")}`);
            }
            console.log("[ExecuteChartCommand] Calling api.hideIndicator with ID:", params.id);
            console.log("[ExecuteChartCommand] api.hideIndicator exists?", typeof api.hideIndicator);
            if (api.hideIndicator) {
                api.hideIndicator(params.id);
                console.log("[ExecuteChartCommand] api.hideIndicator called successfully");
            }
            else {
                console.error("[ExecuteChartCommand] api.hideIndicator is not available!");
                throw new Error("Chart API hideIndicator method not available");
            }
            return { indicator: params.id, visible: false };
        case "add_trend_line":
            const lineId = api.addTrendLine({
                start: params.start,
                end: params.end,
                color: params.color || "#2962ff",
                lineWidth: params.lineWidth || 2,
                style: params.style || "solid",
                extendLeft: params.extendLeft || false,
                extendRight: params.extendRight || false,
                selected: false
            });
            return { trendLineId: lineId };
        case "remove_trend_line":
            api.removeTrendLine(params.id);
            return { removed: params.id };
        case "clear_trend_lines":
            api.clearTrendLines();
            return { cleared: true };
        case "set_time_range":
            api.setTimeRange({
                start: params.start,
                end: params.end
            });
            return { timeRange: { start: params.start, end: params.end } };
        case "set_price_range":
            api.setPriceRange({
                min: params.min,
                max: params.max
            });
            return { priceRange: { min: params.min, max: params.max } };
        case "enter_fullscreen":
            await api.enterFullscreen();
            return { fullscreen: true };
        case "exit_fullscreen":
            await api.exitFullscreen();
            return { fullscreen: false };
        case "get_chart_state":
            const state = api.getState();
            return {
                symbol: state.symbol,
                granularity: state.granularity,
                indicators: api.getVisibleIndicators(),
                trendLines: api.getTrendLines(),
                timeRange: api.getTimeRange(),
                priceRange: api.getPriceRange()
            };
        case "activate_trend_line_tool":
            api.activateTrendLineTool({
                color: params.color,
                lineWidth: params.lineWidth,
                style: params.style
            });
            return { toolActive: true };
        case "get_candles":
            return { requested: true };
        default:
            throw new Error(`Unknown command: ${command}`);
    }
}
function AIChatPanel({ onClose, chartApi }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { sendMessage, loadHistory } = useMCPClient(user == null ? void 0 : user.uid);
    useChartCommands(user == null ? void 0 : user.uid, chartApi);
    useEffect(() => {
        if (user == null ? void 0 : user.uid) {
            loadHistory().then((history) => {
                setMessages(history);
            });
        }
    }, [user == null ? void 0 : user.uid, loadHistory]);
    useEffect(() => {
        var _a;
        (_a = messagesEndRef.current) == null ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    const handleSend = async () => {
        var _a, _b, _c, _d;
        if (!inputValue.trim() || isLoading || !user)
            return;
        const userMessage = {
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: "user",
            content: inputValue,
            timestamp: /* @__PURE__ */ new Date()
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);
        let chartContext;
        if (chartApi) {
            try {
                const symbol = (_a = chartApi.getSymbol) == null ? void 0 : _a.call(chartApi);
                const granularity = (_b = chartApi.getGranularity) == null ? void 0 : _b.call(chartApi);
                const timeRange = (_c = chartApi.getTimeRange) == null ? void 0 : _c.call(chartApi);
                const priceRange = (_d = chartApi.getPriceRange) == null ? void 0 : _d.call(chartApi);
                console.log("Chart API values:", {
                    symbol,
                    symbolType: typeof symbol,
                    granularity,
                    granularityType: typeof granularity,
                    timeRange,
                    priceRange
                });
                if (symbol && granularity && timeRange && priceRange) {
                    chartContext = JSON.parse(JSON.stringify({
                        symbol: String(symbol),
                        granularity: String(granularity),
                        timeRange: {
                            start: Number(timeRange.start),
                            end: Number(timeRange.end)
                        },
                        priceRange: {
                            min: Number(priceRange.min),
                            max: Number(priceRange.max),
                            range: Number(priceRange.range || priceRange.max - priceRange.min)
                        }
                    }));
                    console.log("Chart context prepared:", chartContext);
                }
                else {
                    console.warn("Missing chart context values:", {
                        hasSymbol: !!symbol,
                        hasGranularity: !!granularity,
                        hasTimeRange: !!timeRange,
                        hasPriceRange: !!priceRange
                    });
                }
            }
            catch (error) {
                console.warn("Could not get chart context:", error);
            }
        }
        try {
            const assistantMessage = {
                id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                role: "assistant",
                content: "",
                timestamp: /* @__PURE__ */ new Date(),
                commands: []
            };
            setMessages((prev) => [...prev, assistantMessage]);
            await sendMessage(inputValue, {
                chartContext,
                onStream: (chunk) => {
                    setMessages((prev) => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                            updated[lastIndex] = {
                                ...updated[lastIndex],
                                content: updated[lastIndex].content + chunk
                            };
                        }
                        return updated;
                    });
                },
                onToolCall: (tool, commandId) => {
                    setMessages((prev) => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                            updated[lastIndex] = {
                                ...updated[lastIndex],
                                commands: [
                                    ...updated[lastIndex].commands || [],
                                    { id: commandId, command: tool, status: "pending" }
                                ]
                            };
                        }
                        return updated;
                    });
                },
                onError: (error) => {
                    setMessages((prev) => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                            updated[lastIndex] = {
                                ...updated[lastIndex],
                                content: `Error: ${error.message}`
                            };
                        }
                        return updated;
                    });
                }
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    return /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col bg-gray-900 text-white", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-700", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsx(Bot, { className: "w-5 h-5 text-blue-400" }),
                            /* @__PURE__ */ jsx("h2", { className: "font-semibold", children: "AI Assistant" })
                        ] }),
                    /* @__PURE__ */ jsx("button", {
                        onClick: onClose,
                        className: "p-1 hover:bg-gray-800 rounded transition-colors",
                        "aria-label": "Close AI panel",
                        children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
                    })
                ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [
                    messages.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center text-gray-400 mt-8", children: [
                            /* @__PURE__ */ jsx(Bot, { className: "w-12 h-12 mx-auto mb-4 opacity-50" }),
                            /* @__PURE__ */ jsx("p", { children: "Ask me about the chart!" }),
                            /* @__PURE__ */ jsx("p", { className: "text-sm mt-2", children: 'Try: "Show BTC hourly chart with RSI"' })
                        ] }) : messages.map((message, index) => /* @__PURE__ */ jsx("div", {
                        className: `flex ${message.role === "user" ? "justify-end" : "justify-start"}`,
                        children: /* @__PURE__ */ jsxs("div", {
                            className: `max-w-[80%] rounded-lg p-3 ${message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"}`,
                            children: [
                                /* @__PURE__ */ jsx("div", { className: "whitespace-pre-wrap", children: message.content }),
                                message.commands && message.commands.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-1", children: message.commands.map((cmd, cmdIndex) => /* @__PURE__ */ jsxs("div", {
                                        className: "text-xs bg-gray-700 rounded px-2 py-1 inline-block mr-1",
                                        children: [
                                            "✓ ",
                                            cmd.command.replace(/_/g, " ")
                                        ]
                                    }, `${cmd.id}-${cmdIndex}`)) })
                            ]
                        })
                    }, `${message.id}-${index}`)),
                    isLoading && /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsx("div", { className: "bg-gray-800 rounded-lg p-3", children: /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }) }) }),
                    /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
                ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-700 p-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                            /* @__PURE__ */ jsx("textarea", {
                                ref: inputRef,
                                value: inputValue,
                                onChange: (e) => setInputValue(e.target.value),
                                onKeyDown: handleKeyDown,
                                placeholder: "Ask about the chart...",
                                className: "flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500",
                                rows: 1,
                                disabled: isLoading || !user
                            }),
                            /* @__PURE__ */ jsx("button", {
                                onClick: handleSend,
                                disabled: !inputValue.trim() || isLoading || !user,
                                className: "p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors",
                                "aria-label": "Send message",
                                children: /* @__PURE__ */ jsx(Send, { className: "w-5 h-5" })
                            })
                        ] }),
                    !user && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-2", children: "Please sign in to use the AI assistant" })
                ] })
        ] });
}
async function loadChartsForLayout(layoutNode, charts, repository, layoutId) {
    if (layoutNode.type === "chart") {
        const chartId = layoutNode.chartId || layoutNode.id;
        if (chartId && !charts.has(chartId)) {
            try {
                const chartConfig = await repository.getChart(chartId, layoutId);
                if (chartConfig) {
                    charts.set(chartId, chartConfig);
                }
            }
            catch (error) {
                console.error(`Failed to load chart ${chartId}:`, error);
            }
        }
    }
    else if (layoutNode.children && Array.isArray(layoutNode.children)) {
        await Promise.all(layoutNode.children.map((child) => loadChartsForLayout(child, charts, repository, layoutId)));
    }
}
const ChartApp = ({ className = "", initialLayout }) => {
    const { repository, isLoading: repoLoading, error } = useRepository();
    const { layouts, updateLayout, isLoading: layoutsLoading } = useLayouts();
    const { settings, setActiveLayout, isLoading: settingsLoading } = useUserSettings();
    const { user } = useAuth();
    const { status: subscriptionStatus, isLoading: subscriptionLoading } = useSubscription();
    const [currentLayout, setCurrentLayout] = useState(initialLayout || null);
    const [currentLayoutId, setCurrentLayoutId] = useState(null);
    const [migrationStatus, setMigrationStatus] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [showAIChat, setShowAIChat] = useState(false);
    const [chartApi, setChartApi] = useState(null);
    const autoSaveTimeoutRef = useRef(null);
    useRef("unknown");
    useRef(false);
    const createDefaultLayout = () => ({
        id: "default-single",
        type: "chart",
        chart: {
            id: "default-chart",
            symbol: "BTC-USD",
            granularity: "ONE_HOUR",
            indicators: []
        },
        defaultSize: 100,
        minSize: 20
    });
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "A") {
                e.preventDefault();
                setShowAIChat((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);
    useEffect(() => {
        const isAnonymousPreview = !user && subscriptionStatus === "none" && !subscriptionLoading;
        if (isAnonymousPreview && !isInitialized) {
            console.log("Anonymous preview mode - using default layout");
            setCurrentLayout(createDefaultLayout());
            setCurrentLayoutId(null);
            setIsInitialized(true);
            return;
        }
        const isLoading = repoLoading || layoutsLoading || settingsLoading;
        if (isLoading || !repository || isInitialized) {
            return;
        }
        if (currentLayout && initialLayout) {
            setIsInitialized(true);
            return;
        }
        if (settings == null ? void 0 : settings.activeLayoutId) {
            const activeLayout = layouts.find((l) => l.id === settings.activeLayoutId);
            if (activeLayout) {
                const loadActiveLayout = async () => {
                    try {
                        const charts = /* @__PURE__ */ new Map();
                        await loadChartsForLayout(activeLayout.layout, charts, repository, activeLayout.id);
                        const panelLayout = convertToChartPanelLayout(activeLayout.layout, charts);
                        setCurrentLayout(panelLayout);
                        setCurrentLayoutId(activeLayout.id);
                        setIsInitialized(true);
                    }
                    catch (error2) {
                        console.error("Error loading active layout:", error2);
                        setActiveLayout(null).catch(console.error);
                    }
                };
                loadActiveLayout();
                return;
            }
            else if (layouts.length > 0) {
                setActiveLayout(null).catch(console.error);
            }
            else {
                return;
            }
        }
        setCurrentLayout(createDefaultLayout());
        setCurrentLayoutId(null);
        setIsInitialized(true);
    }, [
        repoLoading,
        layoutsLoading,
        settingsLoading,
        repository,
        settings,
        layouts,
        currentLayout,
        initialLayout,
        isInitialized,
        user,
        subscriptionStatus,
        subscriptionLoading,
        setActiveLayout
    ]);
    const autoSaveLayout = useCallback(async () => {
        if (!currentLayout || !currentLayoutId || !repository || !user)
            return;
        try {
            const charts = /* @__PURE__ */ new Map();
            const repositoryLayout = convertFromChartPanelLayout(currentLayout, charts);
            await updateLayout(currentLayoutId, {
                layout: repositoryLayout
            });
        }
        catch (error2) {
            console.error("Auto-save failed:", error2);
        }
    }, [currentLayout, currentLayoutId, repository, updateLayout, user]);
    const handleLayoutChange = useCallback((layout, changeType = "unknown") => {
        console.log("ChartApp: handleLayoutChange called", {
            changeType,
            currentLayoutId,
            hasLayout: !!layout
        });
        setCurrentLayout(layout);
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
            console.log("ChartApp: Cleared existing auto-save timeout");
        }
        if (currentLayoutId && changeType === "structure" && user) {
            console.log("ChartApp: Setting auto-save timeout for structural change");
            autoSaveTimeoutRef.current = setTimeout(() => {
                console.log("ChartApp: Auto-save timeout triggered");
                autoSaveLayout();
            }, 1e3);
        }
        else {
            console.log("ChartApp: Auto-save not triggered", {
                reason: !currentLayoutId ? "No currentLayoutId" : !user ? "No authenticated user" : changeType !== "structure" ? "Not structure change" : "Other"
            });
        }
    }, [currentLayoutId, autoSaveLayout, user]);
    const handleLayoutSelection = useCallback(async (layout, layoutId) => {
        setCurrentLayout(layout);
        setCurrentLayoutId(layoutId || null);
        if (!layoutId) {
            try {
                await setActiveLayout(null);
            }
            catch (error2) {
            }
        }
    }, [setActiveLayout]);
    useEffect(() => {
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, []);
    useCallback(() => {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }, []);
    const isPWA = useCallback(() => {
        return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    }, []);
    const isIPhone = useCallback(() => {
        return /iPhone/.test(navigator.userAgent) && !window.MSStream;
    }, []);
    const isMobile = useCallback(() => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    }, []);
    if (repoLoading) {
        return /* @__PURE__ */ jsx("div", { className: `flex items-center justify-center h-full ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" }),
                    /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Loading..." })
                ] }) });
    }
    if (error) {
        return /* @__PURE__ */ jsx("div", { className: `flex items-center justify-center h-full ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800", children: [
                    /* @__PURE__ */ jsx("div", { className: "text-red-600 dark:text-red-400 mb-2", children: /* @__PURE__ */ jsx("svg", {
                            className: "w-8 h-8 mx-auto",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24",
                            children: /* @__PURE__ */ jsx("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeWidth: 2,
                                d: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            })
                        }) }),
                    /* @__PURE__ */ jsx("p", { className: "text-red-600 dark:text-red-400 font-semibold mb-2", children: "Failed to load chart application" }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 dark:text-red-400 mb-4", children: error }),
                    /* @__PURE__ */ jsx("button", {
                        onClick: () => window.location.reload(),
                        className: "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors",
                        children: "Reload Page"
                    })
                ] }) });
    }
    if (!currentLayout) {
        return /* @__PURE__ */ jsx("div", { className: `flex items-center justify-center h-full ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                    /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2" }),
                    /* @__PURE__ */ jsx("p", { className: "text-gray-500 dark:text-gray-400 mb-4", children: "Loading layout..." })
                ] }) });
    }
    const { trialEndsAt, isPreviewExpired, previewStartTime } = useSubscription();
    const isTrialExpired = subscriptionStatus === "trialing" && trialEndsAt && new Date(trialEndsAt) <= /* @__PURE__ */ new Date();
    const hasActiveSubscription = subscriptionStatus === "active" || subscriptionStatus === "trialing" && !isTrialExpired;
    const hasPreviewAccess = subscriptionStatus === "none" && !isPreviewExpired;
    const shouldShowSubscriptionOverlay = !subscriptionLoading && !hasActiveSubscription && !hasPreviewAccess;
    return /* @__PURE__ */ jsxs("div", { className: `flex flex-col h-full bg-black ${className}`, children: [
            isIPhone() && isPWA() && /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 h-11 bg-gray-900" }),
            /* @__PURE__ */ jsx(PWAInstallBanner, {}),
            /* @__PURE__ */ jsx(AppToolbar, {
                repository,
                currentLayout,
                currentLayoutId,
                onLayoutChange: handleLayoutSelection,
                migrationStatus,
                hasPreviewAccess,
                previewStartTime,
                onPreviewExpire: () => window.location.reload(),
                showAIChat,
                onToggleAIChat: () => setShowAIChat((prev) => !prev)
            }),
            /* @__PURE__ */ jsxs("div", { className: `flex-1 relative bg-black ${isMobile() ? "pb-5" : ""}`, children: [
                    /* @__PURE__ */ jsxs(PanelGroup, { direction: "horizontal", className: "h-full", children: [
                            showAIChat && /* @__PURE__ */ jsxs(Fragment, { children: [
                                    /* @__PURE__ */ jsx(Panel, { defaultSize: 25, minSize: 15, maxSize: 40, children: /* @__PURE__ */ jsx(AIChatPanel, {
                                            onClose: () => setShowAIChat(false),
                                            chartApi
                                        }) }),
                                    /* @__PURE__ */ jsx(PanelResizeHandle, { className: "w-1 bg-gray-800 hover:bg-gray-700 transition-colors" })
                                ] }),
                            /* @__PURE__ */ jsx(Panel, { children: /* @__PURE__ */ jsx(ChartPanel, {
                                    layout: currentLayout,
                                    layoutId: currentLayoutId || void 0,
                                    onLayoutChange: handleLayoutChange,
                                    className: "h-full",
                                    onChartApiReady: setChartApi
                                }) })
                        ] }),
                    shouldShowSubscriptionOverlay && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50", children: /* @__PURE__ */ jsxs("div", { className: "text-center p-8 bg-gray-900/90 rounded-lg border border-gray-700 max-w-md", children: [
                                /* @__PURE__ */ jsx("svg", {
                                    className: "w-16 h-16 mx-auto mb-4 text-yellow-500",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24",
                                    children: /* @__PURE__ */ jsx("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    })
                                }),
                                /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-white mb-3", children: "Subscription Required" }),
                                /* @__PURE__ */ jsx("p", { className: "text-gray-400 mb-6", children: subscriptionStatus === "none" && isPreviewExpired ? "Your 5-minute preview has ended. Subscribe to continue using Spot Canvas with unlimited access." : subscriptionStatus === "canceled" ? "Your subscription has been canceled. Please resubscribe to continue using Spot Canvas." : isTrialExpired ? "Your trial has ended. Choose a plan to continue using Spot Canvas." : "To access live charts and trading features, please subscribe to one of our plans." }),
                                /* @__PURE__ */ jsx("a", {
                                    href: "/pricing",
                                    className: "inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium",
                                    children: subscriptionStatus === "none" && isPreviewExpired ? "Start Free Trial" : "View Pricing Plans"
                                })
                            ] }) })
                ] })
        ] });
};
const ChartAppExample = ({ className = "" }) => {
    const createInitialLayout = () => ({
        id: "example-layout",
        type: "group",
        direction: "horizontal",
        children: [
            {
                id: "left-chart",
                type: "chart",
                chart: {
                    id: "btc-chart",
                    symbol: "BTC-USD",
                    granularity: "ONE_HOUR",
                    indicators: []
                },
                defaultSize: 60,
                minSize: 20
            },
            {
                id: "right-group",
                type: "group",
                direction: "vertical",
                children: [
                    {
                        id: "top-right-chart",
                        type: "chart",
                        chart: {
                            id: "eth-chart",
                            symbol: "ETH-USD",
                            granularity: "ONE_HOUR",
                            indicators: []
                        },
                        defaultSize: 50,
                        minSize: 20
                    },
                    {
                        id: "bottom-right-chart",
                        type: "chart",
                        chart: {
                            id: "ada-chart",
                            symbol: "ADA-USD",
                            granularity: "ONE_DAY",
                            indicators: []
                        },
                        defaultSize: 50,
                        minSize: 20
                    }
                ],
                defaultSize: 40,
                minSize: 20
            }
        ],
        defaultSize: 100,
        minSize: 20
    });
    return /* @__PURE__ */ jsx("div", { className: `h-screen bg-black ${className}`, children: /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsx(ChartApp, {
                className: "h-full",
                initialLayout: createInitialLayout()
            }) }) });
};
const SymbolDebugger = ({ className = "" }) => {
    const { symbols, activeSymbols, isLoading, error } = useSymbols();
    return /* @__PURE__ */ jsxs("div", { className: `p-4 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`, children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white mb-4", children: "Symbol Debugger" }),
            isLoading && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-blue-600 dark:text-blue-400", children: [
                    /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b border-blue-600" }),
                    /* @__PURE__ */ jsx("span", { children: "Loading symbols from repository..." })
                ] }),
            error && /* @__PURE__ */ jsxs("div", { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4", children: [
                    /* @__PURE__ */ jsx("div", { className: "text-red-600 dark:text-red-400 font-semibold", children: "Error loading symbols:" }),
                    /* @__PURE__ */ jsx("div", { className: "text-red-500 dark:text-red-300 text-sm mt-1", children: error })
                ] }),
            !isLoading && !error && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                            /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-3 rounded", children: [
                                    /* @__PURE__ */ jsx("div", { className: "text-blue-900 dark:text-blue-300 font-semibold", children: "Total Symbols" }),
                                    /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-blue-600 dark:text-blue-400", children: symbols.length })
                                ] }),
                            /* @__PURE__ */ jsxs("div", { className: "bg-green-50 dark:bg-green-900/20 p-3 rounded", children: [
                                    /* @__PURE__ */ jsx("div", { className: "text-green-900 dark:text-green-300 font-semibold", children: "Active Symbols" }),
                                    /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold text-green-600 dark:text-green-400", children: activeSymbols.length })
                                ] })
                        ] }),
                    activeSymbols.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("h4", { className: "text-md font-semibold text-gray-800 dark:text-gray-200 mb-2", children: "Popular USD Trading Pairs (Coinbase)" }),
                            /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto", children: activeSymbols.filter((s) => s.exchangeId === "coinbase").filter((s) => s.quoteAsset === "USD").sort((a, b) => {
                                    const popularOrder = [
                                        "BTC-USD",
                                        "ETH-USD",
                                        "ADA-USD",
                                        "DOGE-USD",
                                        "SOL-USD"
                                    ];
                                    const aIndex = popularOrder.indexOf(a.symbol);
                                    const bIndex = popularOrder.indexOf(b.symbol);
                                    if (aIndex !== -1 && bIndex !== -1)
                                        return aIndex - bIndex;
                                    if (aIndex !== -1)
                                        return -1;
                                    if (bIndex !== -1)
                                        return 1;
                                    return a.symbol.localeCompare(b.symbol);
                                }).slice(0, 20).map((symbol) => /* @__PURE__ */ jsxs("div", {
                                    className: "flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0",
                                    children: [
                                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                                                /* @__PURE__ */ jsx("span", { className: "font-mono text-sm font-semibold text-gray-900 dark:text-white", children: symbol.symbol }),
                                                /* @__PURE__ */ jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: [
                                                        symbol.baseAsset,
                                                        " / ",
                                                        symbol.quoteAsset
                                                    ] })
                                            ] }),
                                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                                                /* @__PURE__ */ jsx("span", { className: "text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded", children: symbol.exchangeId }),
                                                symbol.active && /* @__PURE__ */ jsx("div", { className: "h-2 w-2 bg-green-500 rounded-full" })
                                            ] })
                                    ]
                                }, symbol.id)) })
                        ] }),
                    symbols.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("h4", { className: "text-md font-semibold text-gray-800 dark:text-gray-200 mb-2", children: "Exchange Summary" }),
                            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: Object.entries(symbols.reduce((acc, symbol) => {
                                    acc[symbol.exchangeId] = (acc[symbol.exchangeId] || 0) + 1;
                                    return acc;
                                }, {})).map(([exchangeId, count]) => /* @__PURE__ */ jsxs("div", {
                                    className: "flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600",
                                    children: [
                                        /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: exchangeId.charAt(0).toUpperCase() + exchangeId.slice(1) }),
                                        /* @__PURE__ */ jsxs("span", { className: "text-gray-600 dark:text-gray-400", children: [
                                                count,
                                                " symbols"
                                            ] })
                                    ]
                                }, exchangeId)) })
                        ] }),
                    symbols.length === 0 && /* @__PURE__ */ jsxs("div", { className: "text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded", children: [
                            /* @__PURE__ */ jsx("div", { className: "text-yellow-600 dark:text-yellow-400 mb-2", children: /* @__PURE__ */ jsx("svg", {
                                    className: "w-8 h-8 mx-auto",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24",
                                    children: /* @__PURE__ */ jsx("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    })
                                }) }),
                            /* @__PURE__ */ jsx("p", { className: "text-yellow-800 dark:text-yellow-300 font-semibold", children: "No symbols found" }),
                            /* @__PURE__ */ jsx("p", { className: "text-yellow-700 dark:text-yellow-200 text-sm mt-1", children: "The repository may not be initialized or there might be no data in Firestore." })
                        ] })
                ] })
        ] });
};
const meta$a = () => {
    return [
        { title: "Test Chart - Spot Canvas App" },
        {
            name: "description",
            content: "Test the repository-integrated chart system"
        }
    ];
};
function TestChartContent() {
    const { user } = useAuth();
    return /* @__PURE__ */ jsxs("div", { className: "h-screen flex flex-col", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-blue-600 text-white p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                                /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: "Repository Integration Test" }),
                                /* @__PURE__ */ jsx("p", { className: "text-blue-100 text-sm", children: "Testing the new chart system with repository integration" })
                            ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                                /* @__PURE__ */ jsxs("span", { className: "text-blue-100", children: [
                                        "Testing as: ",
                                        user == null ? void 0 : user.email
                                    ] }),
                                /* @__PURE__ */ jsx("a", { href: "/", className: "text-blue-200 hover:text-white underline", children: "← Back to Home" })
                            ] })
                    ] }) }),
            /* @__PURE__ */ jsx("div", { className: "bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                        /* @__PURE__ */ jsx("div", { className: "text-yellow-600 dark:text-yellow-400 text-xl", children: "⚠️" }),
                        /* @__PURE__ */ jsxs("div", { children: [
                                /* @__PURE__ */ jsx("h2", { className: "font-semibold text-yellow-800 dark:text-yellow-200 mb-1", children: "Test Instructions" }),
                                /* @__PURE__ */ jsxs("div", { className: "text-sm text-yellow-700 dark:text-yellow-300 space-y-1", children: [
                                        /* @__PURE__ */ jsx("p", { children: "• Try saving a layout with a custom name" }),
                                        /* @__PURE__ */ jsx("p", { children: "• Switch between different preset layouts" }),
                                        /* @__PURE__ */ jsx("p", { children: "• Change symbols and timeframes - they should persist" }),
                                        /* @__PURE__ */ jsx("p", { children: "• Check that saved layouts appear in the dropdown" }),
                                        /* @__PURE__ */ jsx("p", { children: "• Test offline functionality (disconnect internet)" }),
                                        /* @__PURE__ */ jsx("p", { children: '• Verify repository status shows "Online" when connected' })
                                    ] })
                            ] })
                    ] }) }),
            /* @__PURE__ */ jsx("div", { className: "border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800", children: /* @__PURE__ */ jsx(SymbolDebugger, {}) }),
            /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(ChartAppExample, { className: "h-full" }) }),
            /* @__PURE__ */ jsx("div", { className: "bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                                /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Repository Integration Status:" }),
                                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                                        /* @__PURE__ */ jsx("div", { className: "h-2 w-2 bg-green-500 rounded-full" }),
                                        /* @__PURE__ */ jsx("span", { className: "text-green-600 dark:text-green-400", children: "Active" })
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsx("div", { className: "text-gray-500 dark:text-gray-400", children: "Test environment - Repository Integration v1.0" })
                    ] }) })
        ] });
}
function TestChartRoute() {
    return /* @__PURE__ */ jsx(ProtectedRoute, {
        fallback: /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full", children: [
                    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
                            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Authentication Required" }),
                            /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "Please sign in to test the repository-integrated chart system." })
                        ] }),
                    /* @__PURE__ */ jsx(Login, {
                        title: "",
                        description: "",
                        showFeatures: false,
                        layout: "vertical",
                        className: "w-full"
                    })
                ] }) }),
        children: /* @__PURE__ */ jsx(TestChartContent, {})
    });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: TestChartRoute,
    meta: meta$a
}, Symbol.toStringTag, { value: "Module" }));
const meta$9 = () => {
    return [
        { title: "Welcome to Spot Canvas!" },
        { name: "description", content: "Your free trial has been activated" }
    ];
};
function ThankYouPage() {
    const navigate = useNavigate();
    const { refreshSubscription, status, plan, trialEndsAt } = useSubscription();
    useEffect(() => {
        refreshSubscription();
    }, []);
    useEffect(() => {
        if (plan && plan !== "none") {
            const price = plan.toLowerCase() === "starter" ? 9 : 29;
            const transactionId = `trial_${Date.now()}`;
            trackPurchaseComplete(plan, price, transactionId);
        }
    }, [plan]);
    return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-black relative overflow-hidden flex flex-col", children: [
                    /* @__PURE__ */ jsx("nav", { className: "relative z-20 p-6 border-b border-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between", children: [
                                /* @__PURE__ */ jsx(Link, { to: "/", className: "flex items-center", children: /* @__PURE__ */ jsx("img", {
                                        src: "/full-logo-white.svg",
                                        alt: "Spot Canvas",
                                        className: "h-10"
                                    }) }),
                                /* @__PURE__ */ jsx(AccountMenu, {})
                            ] }) }),
                    /* @__PURE__ */ jsx("div", { className: "flex-1 flex items-center justify-center px-6", children: /* @__PURE__ */ jsxs("div", { className: "text-center max-w-2xl", children: [
                                /* @__PURE__ */ jsx("div", { className: "mb-8 flex justify-center", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                                            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-pricing-green/20 rounded-full blur-xl" }),
                                            /* @__PURE__ */ jsx(CheckCircle, { className: "relative h-24 w-24 text-pricing-green" })
                                        ] }) }),
                                /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-5xl font-bold text-white mb-4", children: [
                                        "Welcome to Spot Canvas ",
                                        plan && plan !== "none" ? /* @__PURE__ */ jsx("span", { className: "capitalize", children: plan }) : "",
                                        "!"
                                    ] }),
                                /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-300 mb-8", children: "Your 7-day free trial has been activated successfully." }),
                                status === "trialing" && trialEndsAt && /* @__PURE__ */ jsxs("div", { className: "bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-6 mb-8 inline-block", children: [
                                        /* @__PURE__ */ jsx("p", { className: "text-gray-400 mb-2", children: "Your trial ends on" }),
                                        /* @__PURE__ */ jsx("p", { className: "text-2xl font-semibold text-white", children: new Date(trialEndsAt).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric"
                                            }) })
                                    ] }),
                                /* @__PURE__ */ jsxs("div", { className: "mb-12", children: [
                                        /* @__PURE__ */ jsxs("p", { className: "text-lg text-gray-300 mb-6", children: [
                                                "You now have access to ",
                                                plan === "starter" ? "Starter" : "Pro",
                                                " features:"
                                            ] }),
                                        /* @__PURE__ */ jsx("ul", { className: "text-left inline-block space-y-3", children: plan === "starter" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                                                    /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-gray-300", children: [
                                                            /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-pricing-green flex-shrink-0" }),
                                                            /* @__PURE__ */ jsx("span", { children: "4 trading symbols" })
                                                        ] }),
                                                    /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-gray-300", children: [
                                                            /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-pricing-green flex-shrink-0" }),
                                                            /* @__PURE__ */ jsx("span", { children: "Basic indicators" })
                                                        ] }),
                                                    /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-gray-300", children: [
                                                            /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-pricing-green flex-shrink-0" }),
                                                            /* @__PURE__ */ jsx("span", { children: "2 charts per layout" })
                                                        ] }),
                                                    /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-gray-300", children: [
                                                            /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-pricing-green flex-shrink-0" }),
                                                            /* @__PURE__ */ jsx("span", { children: "Essential trading tools" })
                                                        ] })
                                                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                                                    /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-gray-300", children: [
                                                            /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-pricing-green flex-shrink-0" }),
                                                            /* @__PURE__ */ jsx("span", { children: "300+ crypto trading pairs" })
                                                        ] }),
                                                    /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-gray-300", children: [
                                                            /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-pricing-green flex-shrink-0" }),
                                                            /* @__PURE__ */ jsx("span", { children: "Advanced multi-chart layouts" })
                                                        ] }),
                                                    /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-gray-300", children: [
                                                            /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-pricing-green flex-shrink-0" }),
                                                            /* @__PURE__ */ jsx("span", { children: "Unlimited saved layouts" })
                                                        ] }),
                                                    /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-gray-300", children: [
                                                            /* @__PURE__ */ jsx(CheckCircle, { className: "h-5 w-5 text-pricing-green flex-shrink-0" }),
                                                            /* @__PURE__ */ jsx("span", { children: "All technical indicators" })
                                                        ] })
                                                ] }) })
                                    ] }),
                                /* @__PURE__ */ jsxs(Button, {
                                    onClick: () => navigate("/chart"),
                                    variant: "primary",
                                    size: "lg",
                                    className: "inline-flex items-center gap-3 text-lg px-8 py-4",
                                    children: [
                                        "Go to Charts Dashboard",
                                        /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5" })
                                    ]
                                }),
                                /* @__PURE__ */ jsx("p", { className: "mt-8 text-sm text-gray-500", children: "You can manage your subscription anytime from your account menu" })
                            ] }) }),
                    /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-pricing-green/10 rounded-full blur-3xl" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-pricing-green/10 rounded-full blur-3xl" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pricing-green/5 rounded-full blur-3xl" })
                ] }),
            /* @__PURE__ */ jsx(Footer, {})
        ] });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: ThankYouPage,
    meta: meta$9
}, Symbol.toStringTag, { value: "Module" }));
const loader$3 = async () => {
    return json({}, {
        headers: getCacheHeaders(CacheProfiles.STATIC)
    });
};
const meta$8 = () => {
    return [
        { title: "SpotCanvas Features | Crypto Charting Platform" },
        {
            name: "description",
            content: "Discover SpotCanvas features: multi-chart layouts, symbol management, drawing tools, indicators, and advanced charting for crypto."
        }
    ];
};
const canonicalHref = () => {
    if (typeof window === "undefined")
        return "/features";
    return `${window.location.origin}/features`;
};
const setMetaTag = (name, content) => {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
};
const ensureCanonical = (href) => {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
    }
    link.setAttribute("href", href);
};
const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "SpotCanvas Features",
    description: "Explore SpotCanvas features: multi-chart layouts, symbol manager, drawing tools, indicators, and advanced charting options for crypto analysis.",
    url: canonicalHref()
};
const LightboxImage = ({ src, alt, caption }) => {
    const [open, setOpen] = useState(false);
    return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("button", {
                type: "button",
                onClick: () => setOpen(true),
                className: "group relative block w-full my-8 overflow-hidden rounded-lg border border-white/30 shadow-lg transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-pricing-green",
                "aria-label": `${alt} - open image`,
                children: /* @__PURE__ */ jsx("img", {
                    src,
                    alt,
                    loading: "lazy",
                    decoding: "async",
                    className: "w-full h-auto"
                })
            }),
            open && /* @__PURE__ */ jsx("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4",
                onClick: () => setOpen(false),
                children: /* @__PURE__ */ jsxs("div", { className: "relative max-w-6xl max-h-[90vh] overflow-auto bg-dark-lighter rounded-lg p-4", children: [
                        /* @__PURE__ */ jsx("button", {
                            onClick: () => setOpen(false),
                            className: "absolute top-2 right-2 text-white hover:text-gray-300 p-2",
                            "aria-label": "Close",
                            children: /* @__PURE__ */ jsx("svg", {
                                className: "w-6 h-6",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /* @__PURE__ */ jsx("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                })
                            })
                        }),
                        /* @__PURE__ */ jsx("img", {
                            src,
                            alt,
                            className: "w-full h-auto max-h-[80vh] object-contain"
                        }),
                        caption && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mt-2", children: caption })
                    ] })
            })
        ] });
};
const FeatureCard$1 = ({ title, src, alt, items }) => /* @__PURE__ */ jsxs("section", { className: "rounded-2xl border border-white/20 bg-dark-lighter/50 p-8 md:p-10 shadow-sm", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold text-white", children: title }),
        /* @__PURE__ */ jsx(LightboxImage, { src, alt }),
        /* @__PURE__ */ jsx("div", { className: "mt-8 w-full", children: /* @__PURE__ */ jsx("ul", { className: "list-disc pl-6 space-y-2 text-gray-400", children: items.map((it) => /* @__PURE__ */ jsxs("li", { children: [
                        /* @__PURE__ */ jsx("span", { className: "text-pricing-green font-semibold", children: it.label }),
                        " ",
                        "- ",
                        it.desc
                    ] }, it.label)) }) })
    ] });
const Features = () => {
    useEffect(() => {
        const title = "SpotCanvas Features | Crypto Charting Platform";
        document.title = title;
        setMetaTag("description", "Discover SpotCanvas features: multi-chart layouts, symbol management, drawing tools, indicators, and advanced charting for crypto.");
        ensureCanonical(canonicalHref());
        setMetaTag("og:title", title);
        setMetaTag("og:description", "Professional cryptocurrency charting with multi-chart layouts, indicators, drawing tools, and more.");
        const script = document.createElement("script");
        script.type = "application/ld+json";
        script.textContent = JSON.stringify(jsonLd);
        document.head.appendChild(script);
        return () => {
            if (script.parentNode) {
                document.head.removeChild(script);
            }
        };
    }, []);
    const IMAGES = {
        symbols: "/screenshots/symbol-manager.png",
        trend: "/screenshots/trend-lines.png",
        indicators: "/screenshots/indicators.png",
        homeHero: "/hero-home.webp",
        panningZooming: "/screenshots/panning-zooming.gif",
        blockchain: "/screenshots/roadmap-blockchain-abstract.webp",
        layouts: "/screenshots/chart-layouts.gif"
    };
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-dark", children: [
            /* @__PURE__ */ jsx(Navigation, { showGetStarted: true }),
            /* @__PURE__ */ jsxs("header", { className: "container mx-auto px-4 pt-8 pb-4", children: [
                    /* @__PURE__ */ jsx("nav", { className: "text-sm text-gray-400 mb-3", "aria-label": "Breadcrumb", children: /* @__PURE__ */ jsxs("ol", { className: "flex gap-2", children: [
                                /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/", className: "underline-offset-4 hover:underline", children: "Home" }) }),
                                /* @__PURE__ */ jsx("li", { "aria-hidden": true, children: "›" }),
                                /* @__PURE__ */ jsx("li", { className: "text-white", children: "Features" })
                            ] }) }),
                    /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold tracking-tight text-white", children: /* @__PURE__ */ jsx("span", { className: "bg-gradient-primary bg-clip-text text-transparent", children: "SpotCanvas Features" }) }),
                    /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-400 max-w-3xl", children: "SpotCanvas is a professional cryptocurrency charting platform designed for traders, market analysts and crypto enthusiasts." })
                ] }),
            /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-4 pb-16", children: [
                    /* @__PURE__ */ jsxs("div", { className: "mt-8 grid grid-cols-1 md:grid-cols-2 gap-8", children: [
                            /* @__PURE__ */ jsx(FeatureCard$1, {
                                title: "Multi-Chart Layout Management",
                                src: IMAGES.layouts,
                                alt: "SpotCanvas multi-chart layouts in a 2x2 grid view with individual toolbars",
                                items: [
                                    {
                                        label: "Preset Layouts",
                                        desc: "Quick access to single, double, triple, and quadruple chart configurations"
                                    },
                                    {
                                        label: "Custom Layouts",
                                        desc: "Create and save personalized chart arrangements"
                                    },
                                    {
                                        label: "Resizable Panels",
                                        desc: "Drag panel borders to adjust chart sizes"
                                    },
                                    {
                                        label: "Nested Layouts",
                                        desc: "Split panels horizontally or vertically for complex arrangements"
                                    },
                                    {
                                        label: "Layout Persistence",
                                        desc: "Save and restore your favorite layouts with all settings intact"
                                    }
                                ]
                            }),
                            /* @__PURE__ */ jsx(FeatureCard$1, {
                                title: "Symbol Management",
                                src: IMAGES.symbols,
                                alt: "Symbol Manager modal showing selected and available crypto pairs in SpotCanvas",
                                items: [
                                    {
                                        label: "Extensive Coverage",
                                        desc: "Access all major cryptocurrency pairs"
                                    },
                                    {
                                        label: "Real-Time Data",
                                        desc: "Live price updates via WebSocket connections"
                                    },
                                    {
                                        label: "Favorites System",
                                        desc: "Quick access to frequently traded pairs"
                                    },
                                    {
                                        label: "Quick Search",
                                        desc: "Fast symbol lookup with intelligent filtering"
                                    },
                                    {
                                        label: "Multiple Timeframes",
                                        desc: "View data from 15-minute to daily granularities"
                                    },
                                    {
                                        label: "Cross-Chart Sync",
                                        desc: "Symbol synchronization across multiple charts (coming soon)"
                                    }
                                ]
                            }),
                            /* @__PURE__ */ jsx(FeatureCard$1, {
                                title: "Trend Lines & Drawing Tools",
                                src: IMAGES.trend,
                                alt: "Drawing tools on a SpotCanvas chart with trend lines and inline toolbar",
                                items: [
                                    {
                                        label: "Trend Lines",
                                        desc: "Draw support and resistance lines with precision"
                                    },
                                    {
                                        label: "Persistent Storage",
                                        desc: "All drawings are automatically saved to the cloud"
                                    },
                                    {
                                        label: "Chart-Specific",
                                        desc: "Each chart maintains its own set of drawings"
                                    },
                                    {
                                        label: "Multiple Line Styles",
                                        desc: "Customize appearance for different analysis types"
                                    },
                                    {
                                        label: "Snap-to-Price",
                                        desc: "Automatic alignment to important price levels (coming soon)"
                                    }
                                ]
                            }),
                            /* @__PURE__ */ jsx(FeatureCard$1, {
                                title: "Technical Indicators",
                                src: IMAGES.indicators,
                                alt: "SpotCanvas indicators including Bollinger Bands and MACD on a crypto chart",
                                items: [
                                    {
                                        label: "Moving Averages",
                                        desc: "SMA and EMA with customizable periods"
                                    },
                                    {
                                        label: "Oscillators",
                                        desc: "RSI, MACD, and Stochastic indicators"
                                    },
                                    {
                                        label: "Volatility Indicators",
                                        desc: "Bollinger Bands and ATR"
                                    },
                                    {
                                        label: "Volume Analysis",
                                        desc: "Real-time volume tracking and visualization"
                                    },
                                    {
                                        label: "Multi-Indicator Support",
                                        desc: "Run multiple indicators simultaneously"
                                    },
                                    {
                                        label: "Custom Parameters",
                                        desc: "Adjust indicator settings to match your strategy (coming soon)"
                                    },
                                    {
                                        label: "Create your own indicators",
                                        desc: "Develop custom indicators using Python (coming soon)"
                                    }
                                ]
                            })
                        ] }),
                    /* @__PURE__ */ jsxs("div", { className: "mt-12 grid grid-cols-1 md:grid-cols-2 gap-8", children: [
                            /* @__PURE__ */ jsx(FeatureCard$1, {
                                title: "Advanced Charting Features",
                                src: IMAGES.panningZooming,
                                alt: "Advanced charting features including candlestick charts and crosshairs",
                                items: [
                                    {
                                        label: "Candlestick Charts",
                                        desc: "Professional OHLC visualization"
                                    },
                                    {
                                        label: "Interactive Crosshairs",
                                        desc: "Precise price and time targeting"
                                    },
                                    {
                                        label: "Zoom & Pan",
                                        desc: "Smooth navigation through price history"
                                    },
                                    {
                                        label: "Touch Support",
                                        desc: "Full mobile and tablet compatibility"
                                    },
                                    {
                                        label: "Chart Types",
                                        desc: "Line, Area, and Bar charts (coming soon)"
                                    },
                                    {
                                        label: "Fullscreen Mode",
                                        desc: "Immersive chart viewing experience"
                                    },
                                    {
                                        label: "Full Window Mode",
                                        desc: "Maximize chart within the application"
                                    },
                                    {
                                        label: "Context Menus",
                                        desc: "Right-click access to chart options"
                                    },
                                    {
                                        label: "Resizable Indicator Panels",
                                        desc: "Adjust panel heights to your preference"
                                    },
                                    {
                                        label: "Real-Time Updates",
                                        desc: "Live candlestick formation and price updates"
                                    },
                                    {
                                        label: "High-Performance Rendering",
                                        desc: "Canvas-based rendering for smooth performance"
                                    },
                                    {
                                        label: "Historical Data",
                                        desc: "Access extensive price history for analysis"
                                    },
                                    { label: "Multiple Timeframes", desc: "1m–1d granularities" }
                                ]
                            }),
                            /* @__PURE__ */ jsx(FeatureCard$1, {
                                title: "Platform Integration",
                                src: IMAGES.homeHero,
                                alt: "SpotCanvas platform integration background hero",
                                items: [
                                    {
                                        label: "Chart API",
                                        desc: "Programmatic control for external applications (coming soon)"
                                    },
                                    {
                                        label: "TypeScript Support",
                                        desc: "Full type definitions for developers (coming soon)"
                                    },
                                    {
                                        label: "Event System",
                                        desc: "Real-time notifications for state changes (coming soon)"
                                    },
                                    {
                                        label: "React Components",
                                        desc: "Ready-to-use components for integration (coming soon)"
                                    }
                                ]
                            }),
                            /* @__PURE__ */ jsx(FeatureCard$1, {
                                title: "🚀 The Road Ahead: Blockchain Data Overlays and more",
                                src: IMAGES.blockchain,
                                alt: "Abstract blockchain network illustration for SpotCanvas roadmap",
                                items: [
                                    {
                                        label: "Multi-Asset Comparison",
                                        desc: "Compare multiple cryptocurrencies side-by-side"
                                    },
                                    {
                                        label: "Price Alerts",
                                        desc: "Set notifications for price movements"
                                    },
                                    {
                                        label: "Pattern Recognition",
                                        desc: "Identify chart patterns automatically"
                                    },
                                    {
                                        label: "Strategy Backtesting",
                                        desc: "Test trading strategies on historical data"
                                    },
                                    {
                                        label: "Export Capabilities",
                                        desc: "Export chart images and data"
                                    },
                                    {
                                        label: "Custom Indicators",
                                        desc: "Create and save custom technical indicators"
                                    },
                                    {
                                        label: "Watchlists",
                                        desc: "Organize symbols into custom watchlists"
                                    },
                                    {
                                        label: "Notes & Annotations",
                                        desc: "Add text annotations to charts"
                                    },
                                    {
                                        label: "Availability",
                                        desc: "Planned availability during 2026"
                                    }
                                ]
                            })
                        ] }),
                    /* @__PURE__ */ jsxs("div", {
                        className: "mt-16 rounded-2xl border border-white/20 p-8 text-center shadow-sm",
                        style: {
                            background: "linear-gradient(135deg, rgba(143, 255, 0, 0.1), rgba(93, 215, 0, 0.05))"
                        },
                        children: [
                            /* @__PURE__ */ jsx("h3", { className: "text-2xl font-semibold text-white", children: "Ready to chart smarter?" }),
                            /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-400", children: "Explore live charts in the dashboard." }),
                            /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx(Button, { asLink: true, to: "/chart", variant: "primary", size: "lg", children: "Launch Dashboard" }) })
                        ]
                    }),
                    /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx(Link, {
                            to: "/",
                            className: "inline-flex items-center text-gray-400 underline-offset-4 hover:underline",
                            children: "← Back to Home"
                        }) })
                ] }),
            /* @__PURE__ */ jsx(Footer, {})
        ] });
};
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: Features,
    loader: loader$3,
    meta: meta$8
}, Symbol.toStringTag, { value: "Module" }));
const meta$7 = () => {
    return [
        { title: "Billing - Spot Canvas" },
        { name: "description", content: "Manage your Spot Canvas subscription" }
    ];
};
function BillingContent() {
    useNavigate();
    const { user, emailVerified } = useAuth();
    const { status, plan, trialEndsAt, subscriptionId, refreshSubscription } = useSubscription();
    const [isLoading, setIsLoading] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (user && !emailVerified) {
            console.log("User email not verified, billing features restricted");
        }
    }, [user, emailVerified]);
    const handleActivateSubscription = async () => {
        if (!emailVerified) {
            setError("Please verify your email address before activating your subscription");
            return;
        }
        if (!subscriptionId) {
            setError("No subscription ID found");
            return;
        }
        setIsActivating(true);
        setError(null);
        try {
            const auth2 = getAuth();
            const user2 = auth2.currentUser;
            if (!user2) {
                throw new Error("You must be logged in to activate subscription");
            }
            const idToken = await user2.getIdToken();
            const response = await fetch(`https://billing-server-346028322665.europe-west1.run.app/api/subscriptions/${subscriptionId}/activate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`
                }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to activate subscription");
            }
            if (data.client_secret) {
                setError("Payment confirmation required. Please use the Manage Billing option to update your payment method.");
            }
            else {
                await refreshSubscription();
                setError(null);
                alert("Subscription activated successfully!");
            }
        }
        catch (error2) {
            console.error("Activation error:", error2);
            setError(error2 instanceof Error ? error2.message : "Failed to activate subscription");
        }
        finally {
            setIsActivating(false);
        }
    };
    const handleManageBilling = async () => {
        if (!emailVerified) {
            setError("Please verify your email address before managing billing");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const auth2 = getAuth();
            const user2 = auth2.currentUser;
            if (!user2) {
                throw new Error("You must be logged in to manage billing");
            }
            const idToken = await user2.getIdToken();
            const response = await fetch("https://billing-server-346028322665.europe-west1.run.app/api/customer/portal", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    return_url: window.location.href
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to create portal session");
            }
            window.location.href = data.url;
        }
        catch (error2) {
            console.error("Billing portal error:", error2);
            setError(error2 instanceof Error ? error2.message : "Failed to open billing portal");
        }
        finally {
            setIsLoading(false);
        }
    };
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-primary-dark relative overflow-hidden", children: [
            /* @__PURE__ */ jsx(Navigation, {}),
            /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-20", children: [
                    /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold mb-8 text-white", children: "Billing & Subscription" }),
                    user && !emailVerified && /* @__PURE__ */ jsx("div", { className: "bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-8", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start", children: [
                                /* @__PURE__ */ jsx("svg", { className: "h-5 w-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    }) }),
                                /* @__PURE__ */ jsxs("div", { children: [
                                        /* @__PURE__ */ jsx("p", { className: "text-yellow-500 font-medium", children: "Email verification required" }),
                                        /* @__PURE__ */ jsx("p", { className: "text-yellow-500/80 text-sm mt-1", children: "Please verify your email address before managing billing. Check your inbox for the verification link." }),
                                        /* @__PURE__ */ jsx(Button, {
                                            asLink: true,
                                            to: "/verify-email",
                                            variant: "secondary",
                                            className: "mt-3",
                                            size: "sm",
                                            children: "Go to Verification"
                                        })
                                    ] })
                            ] }) }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-8 mb-8", children: [
                            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-6 text-white", children: "Current Plan" }),
                            status === "none" ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8", children: [
                                    /* @__PURE__ */ jsx("p", { className: "text-gray-400 mb-6", children: "You don't have an active subscription." }),
                                    /* @__PURE__ */ jsx(Button, { asLink: true, to: "/pricing", variant: "primary", children: "View Plans" })
                                ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
                                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                                            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                                                    plan === "pro" ? /* @__PURE__ */ jsx("img", {
                                                        src: "/icon-crown.svg",
                                                        alt: "Pro Plan",
                                                        className: "h-12 w-12 text-pricing-green",
                                                        style: {
                                                            filter: "brightness(0) saturate(100%) invert(68%) sepia(97%) saturate(379%) hue-rotate(70deg) brightness(104%) contrast(98%)"
                                                        }
                                                    }) : /* @__PURE__ */ jsx("img", {
                                                        src: "/icon-zap.svg",
                                                        alt: "Basic Plan",
                                                        className: "h-12 w-12 text-blue-500",
                                                        style: {
                                                            filter: "brightness(0) saturate(100%) invert(49%) sepia(100%) saturate(2419%) hue-rotate(190deg) brightness(103%) contrast(102%)"
                                                        }
                                                    }),
                                                    /* @__PURE__ */ jsxs("div", { children: [
                                                            /* @__PURE__ */ jsxs("h3", { className: "text-xl font-semibold text-white capitalize", children: [
                                                                    plan,
                                                                    " Plan"
                                                                ] }),
                                                            /* @__PURE__ */ jsx("p", { className: "text-gray-400", children: plan === "pro" ? "$39/month" : "$14/month" })
                                                        ] })
                                                ] }),
                                            /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                                                    status === "trialing" && trialEndsAt && /* @__PURE__ */ jsxs("div", { children: [
                                                            /* @__PURE__ */ jsx("p", { className: "text-yellow-500 font-medium", children: "Trial Period" }),
                                                            /* @__PURE__ */ jsxs("p", { className: "text-gray-400 text-sm", children: [
                                                                    "Ends ",
                                                                    new Date(trialEndsAt).toLocaleDateString()
                                                                ] })
                                                        ] }),
                                                    status === "active" && /* @__PURE__ */ jsx("span", { className: "text-pricing-green font-medium", children: "Active" }),
                                                    status === "canceled" && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-2", children: [
                                                            /* @__PURE__ */ jsx("span", { className: "text-red-500 font-medium", children: "Canceled" }),
                                                            /* @__PURE__ */ jsx(Button, {
                                                                onClick: handleActivateSubscription,
                                                                variant: "primary",
                                                                disabled: isActivating,
                                                                size: "sm",
                                                                className: "inline-flex items-center gap-2",
                                                                children: isActivating ? /* @__PURE__ */ jsxs(Fragment, { children: [
                                                                        /* @__PURE__ */ jsx(Loader2, { className: "h-3 w-3 animate-spin" }),
                                                                        "Activating..."
                                                                    ] }) : "Activate"
                                                            })
                                                        ] }),
                                                    status === "past_due" && /* @__PURE__ */ jsx("span", { className: "text-orange-500 font-medium", children: "Past Due" }),
                                                    status === "incomplete" && /* @__PURE__ */ jsx("span", { className: "text-yellow-500 font-medium", children: "Incomplete" })
                                                ] })
                                        ] }),
                                    /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-800 pt-6", children: [
                                            /* @__PURE__ */ jsx("h4", { className: "text-lg font-medium mb-4 text-white", children: "Your plan includes:" }),
                                            /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: plan === "pro" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                                                        /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-gray-300", children: [
                                                                /* @__PURE__ */ jsx("span", { className: "text-pricing-green", children: "✓" }),
                                                                "300+ crypto trading pairs"
                                                            ] }),
                                                        /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-gray-300", children: [
                                                                /* @__PURE__ */ jsx("span", { className: "text-pricing-green", children: "✓" }),
                                                                "Advanced multi-chart layouts"
                                                            ] }),
                                                        /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-gray-300", children: [
                                                                /* @__PURE__ */ jsx("span", { className: "text-pricing-green", children: "✓" }),
                                                                "Unlimited saved layouts"
                                                            ] }),
                                                        /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-gray-300", children: [
                                                                /* @__PURE__ */ jsx("span", { className: "text-pricing-green", children: "✓" }),
                                                                "All indicators"
                                                            ] })
                                                    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                                                        /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-gray-300", children: [
                                                                /* @__PURE__ */ jsx("span", { className: "text-blue-500", children: "✓" }),
                                                                "4 trading symbols"
                                                            ] }),
                                                        /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-gray-300", children: [
                                                                /* @__PURE__ */ jsx("span", { className: "text-blue-500", children: "✓" }),
                                                                "Basic indicators"
                                                            ] }),
                                                        /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-gray-300", children: [
                                                                /* @__PURE__ */ jsx("span", { className: "text-blue-500", children: "✓" }),
                                                                "2 charts per layout"
                                                            ] })
                                                    ] }) })
                                        ] })
                                ] })
                        ] }),
                    status !== "none" && /* @__PURE__ */ jsxs("div", { className: "bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-2xl p-8", children: [
                            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-6 text-white", children: "Manage Subscription" }),
                            error && /* @__PURE__ */ jsx("div", { className: "bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6", children: /* @__PURE__ */ jsx("p", { className: "text-red-400 text-sm", children: error }) }),
                            /* @__PURE__ */ jsx("p", { className: "text-gray-400 mb-6", children: "Access the Stripe Customer Portal to update your payment method, download invoices, change your plan, or cancel your subscription." }),
                            /* @__PURE__ */ jsx(Button, {
                                onClick: handleManageBilling,
                                variant: "primary",
                                disabled: isLoading,
                                className: "inline-flex items-center gap-2",
                                children: isLoading ? /* @__PURE__ */ jsxs(Fragment, { children: [
                                        /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
                                        "Opening Portal..."
                                    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                                        "Manage Billing",
                                        /* @__PURE__ */ jsx(ExternalLink, { className: "h-4 w-4" })
                                    ] })
                            })
                        ] })
                ] }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/4 w-96 h-96 bg-pricing-green/5 rounded-full blur-3xl" }),
            /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/4 w-96 h-96 bg-pricing-green/5 rounded-full blur-3xl" })
        ] });
}
function BillingRoute() {
    return /* @__PURE__ */ jsx(ProtectedRoute, { children: /* @__PURE__ */ jsx(BillingContent, {}) });
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: BillingRoute,
    meta: meta$7
}, Symbol.toStringTag, { value: "Module" }));
function PricingCard({ name, price, period, features, buttonText, popular = false, onGetStarted }) {
    return /* @__PURE__ */ jsxs("div", {
        className: `relative z-10 overflow-hidden transition-all duration-300 hover:scale-105 bg-black/60 backdrop-blur-sm border rounded-2xl p-8 flex flex-col h-full ${popular ? "border-highlight shadow-glow-green" : "border-gray-500/30"}`,
        children: [
            popular && /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 z-10", children: /* @__PURE__ */ jsx("div", { className: "relative w-0 h-0 border-t-[90px] border-r-[90px] border-t-gray-500 border-r-transparent", children: /* @__PURE__ */ jsxs("div", { className: "absolute top-[-82px] left-[12px] transform -rotate-45 text-black text-center", children: [
                            /* @__PURE__ */ jsx("div", { className: "text-sm leading-tight", children: "Most" }),
                            /* @__PURE__ */ jsx("div", { className: "text-sm leading-tight", children: "Popular" })
                        ] }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "text-center pb-6", children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-white mb-6", children: name }),
                    /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("span", { className: "text-5xl font-bold text-pricing-green", children: price }),
                            /* @__PURE__ */ jsx("p", { className: "text-sm mt-2 text-gray-400", children: period })
                        ] })
                ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-6 border-t border-gray-800 flex-1 flex flex-col", children: [
                    /* @__PURE__ */ jsx("ul", { className: "space-y-4 mb-8 flex-1", children: features.map((feature, index) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
                                /* @__PURE__ */ jsx(Check, { className: "h-5 w-5 mt-0.5 text-pricing-green flex-shrink-0" }),
                                /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-300", children: feature })
                            ] }, index)) }),
                    /* @__PURE__ */ jsx(Button, {
                        onClick: onGetStarted,
                        variant: popular ? "primary" : "secondary",
                        fullWidth: true,
                        children: buttonText
                    })
                ] })
        ]
    });
}
function SubscriptionExistsModal({ isOpen, onClose, subscriptionStatus, currentPlan }) {
    const navigate = useNavigate();
    if (!isOpen)
        return null;
    const getStatusMessage = () => {
        switch (subscriptionStatus) {
            case "trialing":
                return `You're currently on a free trial of the ${currentPlan} plan.`;
            case "active":
                return `You already have an active ${currentPlan} subscription.`;
            case "past_due":
                return `Your ${currentPlan} subscription has a payment issue.`;
            case "canceled":
                return `Your ${currentPlan} subscription is canceled but still active until the end of the billing period.`;
            default:
                return `You already have a ${currentPlan} subscription.`;
        }
    };
    return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", {
                className: "fixed inset-0 bg-black bg-opacity-50 z-50",
                onClick: onClose
            }),
            /* @__PURE__ */ jsx("div", { className: "fixed inset-0 flex items-center justify-center z-50 p-4", children: /* @__PURE__ */ jsxs("div", {
                    className: "bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-800",
                    onClick: (e) => e.stopPropagation(),
                    children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-white", children: "Existing Subscription" }),
                                /* @__PURE__ */ jsx("button", {
                                    onClick: onClose,
                                    className: "text-gray-400 hover:text-white transition-colors",
                                    children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })
                                })
                            ] }),
                        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
                                /* @__PURE__ */ jsx("p", { className: "text-gray-300 mb-4", children: getStatusMessage() }),
                                /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm", children: "You can manage your subscription, change plans, or update payment methods from your billing page." })
                            ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
                                /* @__PURE__ */ jsx(Button, {
                                    onClick: () => navigate("/billing"),
                                    variant: "primary",
                                    fullWidth: true,
                                    children: "Manage Subscription"
                                }),
                                /* @__PURE__ */ jsx(Button, {
                                    onClick: onClose,
                                    variant: "secondary",
                                    fullWidth: true,
                                    children: "Close"
                                })
                            ] })
                    ]
                }) })
        ] });
}
function AccordionItem({ question, answer, isOpen, onToggle }) {
    return /* @__PURE__ */ jsxs("div", { className: "border-b border-gray-800", children: [
            /* @__PURE__ */ jsxs("button", {
                onClick: onToggle,
                className: "w-full text-left py-6 px-8 flex items-center justify-between hover:bg-gray-900/50 transition-colors",
                children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-white pr-4", children: question }),
                    /* @__PURE__ */ jsx(ChevronDown, {
                        className: `w-7 h-7 text-accent-1 transition-transform ${isOpen ? "rotate-180" : ""}`,
                        strokeWidth: 3
                    })
                ]
            }),
            /* @__PURE__ */ jsx("div", {
                className: `overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96" : "max-h-0"}`,
                children: /* @__PURE__ */ jsx("div", { className: "px-8 pb-6 text-gray-400 leading-relaxed", style: { fontFamily: "var(--font-secondary)" }, children: answer })
            })
        ] });
}
function Accordion({ items }) {
    const [openIndex, setOpenIndex] = useState(null);
    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };
    return /* @__PURE__ */ jsx("div", { className: "bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden", children: items.map((item, index) => /* @__PURE__ */ jsx(AccordionItem, {
            question: item.question,
            answer: item.answer,
            isOpen: openIndex === index,
            onToggle: () => handleToggle(index)
        }, index)) });
}
const meta$6 = () => {
    return [
        { title: "Pricing - Spot Canvas" },
        {
            name: "description",
            content: "Choose the perfect plan to match your needs and ambition. Start your free trial today!"
        }
    ];
};
async function loader$2() {
    const plans = [
        {
            name: "Starter",
            price: "$9",
            period: "Per month",
            features: [
                "Asset library incl. saved symbols",
                "2 Indicators per chart",
                "2 Saved chart layouts",
                "Technical analysis",
                "All basic charting features"
            ],
            buttonText: "Start Trial"
        },
        {
            name: "Pro",
            price: "$29",
            period: "Per month",
            features: [
                "All features of the Starter plan",
                "Unlimited indicators per chart",
                "Unlimited chart layouts"
            ],
            buttonText: "Start Trial",
            popular: true
        }
    ];
    return json({ plans }, {
        headers: getCacheHeaders(CacheProfiles.PRICING)
    });
}
const faqItems$1 = [
    {
        question: "How does the free trial work?",
        answer: "You get a 7-day free trial with full access to the Pro plan features. Credit card is required to start your trial. You can cancel anytime during the trial period without any charges."
    },
    {
        question: "What's the difference between Starter and Pro plans?",
        answer: "The Starter plan includes basic charting features with up to 2 indicators per chart and 2 saved layouts. The Pro plan offers unlimited indicators per chart and unlimited saved layouts."
    },
    {
        question: "Can I change my plan later?",
        answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll have immediate access to the new features. When downgrading, the change will take effect at the next billing cycle."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit and debit cards including Visa, Mastercard, American Express, and Discover. All payments are processed securely through Stripe."
    },
    {
        question: "Do you offer discounts for annual billing?",
        answer: "Currently, we offer monthly billing only."
    }
];
function PricingPage() {
    const { plans } = useLoaderData();
    const navigate = useNavigate();
    const { user } = useAuth();
    const subscription = useSubscription();
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    useEffect(() => {
        trackPricingView();
    }, []);
    const handleGetStarted = (planName) => {
        const plan = plans.find((p) => p.name === planName);
        const price = plan ? parseInt(plan.price.replace("$", "")) : 0;
        trackStartTrialClick(planName, price);
        if (!user) {
            navigate(`/payment-method?plan=${encodeURIComponent(planName)}`);
            return;
        }
        if (subscription && subscription.status !== "none" && subscription.status !== "canceled" && subscription.status !== "incomplete" && subscription.status !== "incomplete_expired") {
            setShowSubscriptionModal(true);
            return;
        }
        navigate(`/payment-method?plan=${encodeURIComponent(planName)}`);
    };
    return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-black relative overflow-hidden", children: [
                    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 pointer-events-none", children: [
                            /* @__PURE__ */ jsxs("svg", {
                                className: "absolute top-0 right-0 w-1/2 h-1/2",
                                viewBox: "0 0 800 400",
                                children: [
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M 400 100 Q 600 150, 700 50",
                                        stroke: "rgba(143, 255, 0, 0.1)",
                                        strokeWidth: "2",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M 300 200 Q 500 250, 750 100",
                                        stroke: "rgba(143, 255, 0, 0.05)",
                                        strokeWidth: "1",
                                        fill: "none"
                                    })
                                ]
                            }),
                            /* @__PURE__ */ jsxs("svg", {
                                className: "absolute bottom-0 left-0 w-1/2 h-1/2",
                                viewBox: "0 0 800 400",
                                children: [
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M 100 300 Q 300 250, 400 350",
                                        stroke: "rgba(143, 255, 0, 0.1)",
                                        strokeWidth: "2",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M 50 200 Q 250 150, 300 300",
                                        stroke: "rgba(143, 255, 0, 0.05)",
                                        strokeWidth: "1",
                                        fill: "none"
                                    })
                                ]
                            })
                        ] }),
                    /* @__PURE__ */ jsx(Navigation, {}),
                    /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20", children: [
                            /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
                                    /* @__PURE__ */ jsxs("h1", { className: "text-6xl md:text-7xl mb-6", children: [
                                            "Pricing ",
                                            /* @__PURE__ */ jsx("span", { className: "text-pricing-green", children: "Plans" })
                                        ] }),
                                    /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-400 max-w-2xl mx-auto", children: "Choose the perfect plan to match your needs and ambition. Both plans include a free 7-day trial period. During the trial period, you will have access to the Pro plan features." })
                                ] }),
                            /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-8 max-w-4xl mx-auto relative", children: plans.map((plan, index) => /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                                            /* @__PURE__ */ jsx(PricingCard, {
                                                ...plan,
                                                onGetStarted: () => handleGetStarted(plan.name)
                                            }),
                                            plan.popular && /* @__PURE__ */ jsx("div", { className: "absolute -top-16 -right-16 md:-top-20 md:-right-20 lg:-top-24 lg:-right-24 opacity-20 animate-spin-slow z-0 pointer-events-none", children: /* @__PURE__ */ jsx("img", {
                                                    src: "/icon-logo-white.svg",
                                                    alt: "",
                                                    className: "w-32 md:w-40 lg:w-48"
                                                }) })
                                        ] }, plan.name)) }) }),
                            /* @__PURE__ */ jsx("div", { className: "mt-64", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
                                        /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
                                                /* @__PURE__ */ jsx("h2", { className: "text-4xl lg:text-5xl font-bold text-white mb-4", children: "Frequently Asked Questions" }),
                                                /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-400", children: "Everything you need to know about our pricing and plans" })
                                            ] }),
                                        /* @__PURE__ */ jsx(Accordion, { items: faqItems$1 })
                                    ] }) })
                        ] })
                ] }),
            /* @__PURE__ */ jsx(Footer, { variant: "dark" }),
            /* @__PURE__ */ jsx(SubscriptionExistsModal, {
                isOpen: showSubscriptionModal,
                onClose: () => setShowSubscriptionModal(false),
                subscriptionStatus: (subscription == null ? void 0 : subscription.status) || "none",
                currentPlan: (subscription == null ? void 0 : subscription.plan) || "none"
            })
        ] });
}
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: PricingPage,
    loader: loader$2,
    meta: meta$6
}, Symbol.toStringTag, { value: "Module" }));
class CustomerIO {
    constructor() {
        __publicField(this, "config");
        __publicField(this, "isInitialized", false);
        this.config = {
            siteId: typeof window !== "undefined" ? "4d9f36e34ddeda617136" : "",
            trackApiKey: typeof window !== "undefined" ? "0b5ddaed9172862fdeda" : ""
            // Optional for server-side
        };
        if (this.config.siteId) {
            this.isInitialized = true;
        }
        else {
            console.warn("Customer.io not initialized: missing VITE_CUSTOMER_IO_SITE_ID");
        }
    }
    /**
     * Identify a user in Customer.io
     */
    async identify(userData) {
        if (!this.isInitialized) {
            console.log("Customer.io not initialized, skipping identify");
            return;
        }
        try {
            console.log("Customer.io identify:", {
                id: userData.userId,
                email: userData.email,
                created_at: userData.createdAt || Math.floor(Date.now() / 1e3),
                email_verified: userData.emailVerified,
                marketing_consent: userData.marketingConsent
            });
            if (typeof window !== "undefined" && window._cio) {
                window._cio.identify({
                    id: userData.userId,
                    email: userData.email,
                    created_at: userData.createdAt || Math.floor(Date.now() / 1e3),
                    email_verified: userData.emailVerified,
                    marketing_consent: userData.marketingConsent
                });
            }
        }
        catch (error) {
            console.error("Failed to identify user in Customer.io:", error);
        }
    }
    /**
     * Track an event in Customer.io
     */
    async track(eventName, eventData) {
        if (!this.isInitialized) {
            console.log("Customer.io not initialized, skipping track");
            return;
        }
        try {
            console.log("Customer.io track event:", eventName, eventData);
            if (typeof window !== "undefined" && window._cio) {
                window._cio.track(eventName, eventData || {});
            }
        }
        catch (error) {
            console.error("Failed to track event in Customer.io:", error);
        }
    }
    /**
     * Update user's marketing consent
     */
    async updateMarketingConsent(userId, consent) {
        if (!this.isInitialized) {
            console.log("Customer.io not initialized, skipping consent update");
            return;
        }
        try {
            console.log("Customer.io update marketing consent:", { userId, consent });
            await this.track("marketing_consent_updated", {
                user_id: userId,
                consent,
                timestamp: Date.now()
            });
            if (typeof window !== "undefined" && window._cio) {
                window._cio.identify({
                    id: userId,
                    marketing_consent: consent,
                    marketing_consent_updated_at: Math.floor(Date.now() / 1e3)
                });
            }
        }
        catch (error) {
            console.error("Failed to update marketing consent in Customer.io:", error);
        }
    }
    /**
     * Track user signup event
     */
    async trackSignup(userData) {
        await this.identify(userData);
        await this.track("user_signed_up", {
            email: userData.email,
            marketing_consent: userData.marketingConsent,
            signup_method: "email"
        });
    }
    /**
     * Track email verification event
     */
    async trackEmailVerified(userId, email) {
        await this.track("email_verified", {
            user_id: userId,
            email,
            verified_at: Date.now()
        });
        if (typeof window !== "undefined" && window._cio) {
            window._cio.identify({
                id: userId,
                email_verified: true,
                email_verified_at: Math.floor(Date.now() / 1e3)
            });
        }
    }
    /**
     * Track subscription started event
     */
    async trackSubscriptionStarted(userId, planDetails) {
        await this.track("subscription_started", {
            user_id: userId,
            ...planDetails,
            started_at: Date.now()
        });
    }
    /**
     * Remove a user from Customer.io (for GDPR compliance)
     */
    async deleteUser(userId) {
        if (!this.isInitialized) {
            console.log("Customer.io not initialized, skipping delete");
            return;
        }
        try {
            console.log("Customer.io delete user:", userId);
            await this.track("user_deleted", {
                user_id: userId,
                deleted_at: Date.now()
            });
        }
        catch (error) {
            console.error("Failed to delete user from Customer.io:", error);
        }
    }
}
const customerIO = new CustomerIO();
const meta$5 = () => {
    return [
        { title: "Welcome to Spot Canvas" },
        {
            name: "description",
            content: "Your email has been verified successfully"
        }
    ];
};
function Welcome() {
    const navigate = useNavigate();
    const { user, emailVerified, refreshUser, loading } = useAuth();
    const [checking, setChecking] = useState(true);
    useEffect(() => {
        if (loading) {
            console.log("Auth is loading, waiting...");
            return;
        }
        const checkVerification = async () => {
            if (!user) {
                console.log("No user found after auth loaded, redirecting to signup");
                navigate("/signup");
                return;
            }
            console.log("User found:", user.email, "emailVerified:", user.emailVerified);
            console.log("Context emailVerified:", emailVerified);
            await refreshUser();
            if (user.emailVerified || emailVerified) {
                try {
                    console.log("Email is verified, updating Firestore and tracking");
                    const { updateEmailVerificationStatus: updateEmailVerificationStatus2 } = await Promise.resolve().then(() => auth);
                    await updateEmailVerificationStatus2(user.uid, true);
                    const { doc: doc2, getDoc: getDoc2 } = await import("firebase/firestore");
                    const { db: db2 } = await Promise.resolve().then(() => firebase);
                    const userDoc = await getDoc2(doc2(db2, "users", user.uid));
                    const userData = userDoc.data();
                    if (userData == null ? void 0 : userData.marketingConsent) {
                        await customerIO.identify({
                            userId: user.uid,
                            email: user.email || "",
                            emailVerified: true,
                            verifiedAt: Math.floor(Date.now() / 1e3)
                        });
                        await customerIO.trackEmailVerified(user.uid, user.email || "");
                        console.log("Updated verification status in Customer.io");
                    }
                    else {
                        console.log("User verified but no marketing consent - not sending to Customer.io");
                    }
                }
                catch (error) {
                    console.error("Failed to update verification status:", error);
                }
                setChecking(false);
            }
            else {
                console.log("Email not yet verified in Firebase Auth");
                try {
                    const { getAuth: getAuth2 } = await import("firebase/auth");
                    const auth$12 = getAuth2();
                    if (auth$12.currentUser) {
                        await auth$12.currentUser.reload();
                        console.log("After reload, emailVerified:", auth$12.currentUser.emailVerified);
                        if (auth$12.currentUser.emailVerified) {
                            const { updateEmailVerificationStatus: updateEmailVerificationStatus2 } = await Promise.resolve().then(() => auth);
                            await updateEmailVerificationStatus2(auth$12.currentUser.uid, true);
                            window.location.reload();
                        }
                    }
                }
                catch (error) {
                    console.error("Failed to reload user:", error);
                }
            }
            setChecking(false);
        };
        checkVerification();
    }, [user, navigate, refreshUser, loading, emailVerified]);
    const handleViewPricing = () => {
        navigate("/pricing");
    };
    if (loading || checking) {
        return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-primary-dark flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-white", children: loading ? "Loading authentication..." : "Verifying your email..." }) });
    }
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-primary-dark", children: [
            /* @__PURE__ */ jsx(Navigation, { showGetStarted: false }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full space-y-8", children: [
                        /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                                /* @__PURE__ */ jsx("div", { className: "mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-500/10 border-2 border-green-500/30 mb-8", children: /* @__PURE__ */ jsx("svg", {
                                        className: "h-10 w-10 text-green-500",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /* @__PURE__ */ jsx("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M5 13l4 4L19 7"
                                        })
                                    }) }),
                                /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-extrabold text-white", children: [
                                        "Email ",
                                        /* @__PURE__ */ jsx("span", { className: "text-accent-1", children: "Verified!" })
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mt-4 text-gray-300", children: [
                                        "Welcome to Spot Canvas, ",
                                        user == null ? void 0 : user.email
                                    ] }),
                                /* @__PURE__ */ jsx("p", { className: "mt-6 text-gray-400", children: "Your account has been successfully verified. You are a few clicks away from full access to all features." })
                            ] }),
                        /* @__PURE__ */ jsxs("div", { className: "bg-primary-light rounded-lg border border-gray-700 p-6", children: [
                                /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-white mb-4", children: "What's next?" }),
                                /* @__PURE__ */ jsxs("ul", { className: "space-y-3 text-sm text-gray-300", children: [
                                        /* @__PURE__ */ jsxs("li", { className: "flex items-start", children: [
                                                /* @__PURE__ */ jsx("svg", {
                                                    className: "h-5 w-5 text-accent-1 mr-2 mt-0.5 flex-shrink-0",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /* @__PURE__ */ jsx("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    })
                                                }),
                                                /* @__PURE__ */ jsx("span", { children: "Start your 7-day free trial to unlock all features" })
                                            ] }),
                                        /* @__PURE__ */ jsxs("li", { className: "flex items-start", children: [
                                                /* @__PURE__ */ jsx("svg", {
                                                    className: "h-5 w-5 text-accent-1 mr-2 mt-0.5 flex-shrink-0",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /* @__PURE__ */ jsx("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    })
                                                }),
                                                /* @__PURE__ */ jsx("span", { children: "Create and customize your trading charts" })
                                            ] }),
                                        /* @__PURE__ */ jsxs("li", { className: "flex items-start", children: [
                                                /* @__PURE__ */ jsx("svg", {
                                                    className: "h-5 w-5 text-accent-1 mr-2 mt-0.5 flex-shrink-0",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /* @__PURE__ */ jsx("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    })
                                                }),
                                                /* @__PURE__ */ jsx("span", { children: "Access real-time market data and indicators" })
                                            ] }),
                                        /* @__PURE__ */ jsxs("li", { className: "flex items-start", children: [
                                                /* @__PURE__ */ jsx("svg", {
                                                    className: "h-5 w-5 text-accent-1 mr-2 mt-0.5 flex-shrink-0",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /* @__PURE__ */ jsx("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    })
                                                }),
                                                /* @__PURE__ */ jsx("span", { children: "Save and share your chart configurations" })
                                            ] })
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsx(Button, { onClick: handleViewPricing, variant: "primary", fullWidth: true, children: "View Plans and Start Free Trial" }) })
                    ] }) })
        ] });
}
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: Welcome,
    meta: meta$5
}, Symbol.toStringTag, { value: "Module" }));
function FeatureCard({ title, description, timeline, icon, backgroundImage }) {
    if (backgroundImage) {
        return /* @__PURE__ */ jsxs("div", { className: "relative bg-gray-900 rounded-lg border border-gray-800 hover:border-purple-500/50 transition-all duration-300 group overflow-hidden", children: [
                /* @__PURE__ */ jsx("div", {
                    className: "absolute inset-0",
                    style: {
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center top",
                        backgroundRepeat: "no-repeat"
                    }
                }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-gray-900/30 pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "relative z-10 p-8", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
                                /* @__PURE__ */ jsx("div", { className: "px-3 py-1 bg-purple-500/30 backdrop-blur-sm text-purple-400 rounded-full text-sm", children: timeline }),
                                icon && /* @__PURE__ */ jsx("div", { className: "text-purple-400/60 group-hover:text-purple-400 transition-colors", children: icon })
                            ] }),
                        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors drop-shadow-lg", children: title }),
                        /* @__PURE__ */ jsx("p", { className: "text-gray-300 leading-relaxed drop-shadow-lg", children: description })
                    ] })
            ] });
    }
    return /* @__PURE__ */ jsx("div", { className: "relative bg-gray-900 rounded-lg border border-gray-800 p-8 hover:border-purple-500/50 transition-all duration-300 group overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-4", children: [
                        /* @__PURE__ */ jsx("div", { className: "px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm", children: timeline }),
                        icon && /* @__PURE__ */ jsx("div", { className: "text-purple-400/60 group-hover:text-purple-400 transition-colors", children: icon })
                    ] }),
                /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-white mb-3 group-hover:text-purple-400 transition-colors", children: title }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-400 leading-relaxed", children: description })
            ] }) });
}
const loader$1 = async () => {
    const featuredPost = await getFeaturedBlogPost();
    return json({ featuredPost }, {
        headers: getCacheHeaders(CacheProfiles.HOMEPAGE)
    });
};
const meta$4 = () => {
    return [
        { title: "Spot Canvas - Trading charts for the on-chain generation" },
        {
            name: "description",
            content: "Trading charts for the on-chain generation"
        }
    ];
};
function Index() {
    const { featuredPost } = useLoaderData();
    const { user, loading } = useAuth();
    const { status: subscriptionStatus } = useSubscription();
    const navigate = useNavigate();
    const getCtaButtonConfig = () => {
        if (!user) {
            return {
                label: "See it in action",
                onClick: () => navigate("/chart")
            };
        }
        else if (subscriptionStatus === "active" || subscriptionStatus === "trialing") {
            return {
                label: "Open Charts",
                onClick: () => navigate("/chart")
            };
        }
        else {
            return {
                label: "Get started",
                onClick: () => navigate("/pricing")
            };
        }
    };
    const ctaButtonConfig = getCtaButtonConfig();
    if (loading) {
        return /* @__PURE__ */ jsx("div", { className: "flex h-screen items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "text-lg text-gray-500", children: "Loading..." }) });
    }
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-primary-dark", children: [
            /* @__PURE__ */ jsx(Navigation, { featuredPost }),
            /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden", children: [
                    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 pointer-events-none overflow-hidden", children: [
                            /* @__PURE__ */ jsxs("svg", {
                                className: "absolute top-0 left-0 w-full h-full hidden lg:block",
                                viewBox: "0 0 1600 800",
                                preserveAspectRatio: "none",
                                children: [
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -100 200 Q 400 100, 700 250 Q 900 350, 850 500",
                                        stroke: "rgba(143, 255, 0, 0.2)",
                                        strokeWidth: "3",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -50 350 Q 400 280, 600 380 Q 750 450, 700 550",
                                        stroke: "rgba(143, 255, 0, 0.18)",
                                        strokeWidth: "2.5",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -100 50 Q 600 150, 900 100 Q 950 90, 920 120",
                                        stroke: "rgba(143, 255, 0, 0.25)",
                                        strokeWidth: "3",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -150 450 Q 400 380, 650 480 Q 780 530, 750 600",
                                        stroke: "rgba(143, 255, 0, 0.22)",
                                        strokeWidth: "4",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -100 500 Q 350 420, 550 520 Q 700 580, 680 650",
                                        stroke: "rgba(143, 255, 0, 0.16)",
                                        strokeWidth: "3",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M 1200 100 Q 1350 200, 1400 350 Q 1450 500, 1500 650",
                                        stroke: "rgba(143, 255, 0, 0.08)",
                                        strokeWidth: "1.5",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M 1300 50 Q 1450 150, 1500 300 Q 1550 450, 1600 600",
                                        stroke: "rgba(143, 255, 0, 0.06)",
                                        strokeWidth: "1",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -200 650 Q 300 600, 600 700 T 1200 650 T 1800 700",
                                        stroke: "rgba(143, 255, 0, 0.1)",
                                        strokeWidth: "2",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -150 380 Q 450 320, 600 420 Q 720 500, 700 580",
                                        stroke: "rgba(143, 255, 0, 0.12)",
                                        strokeWidth: "5",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -100 420 Q 500 360, 700 440 Q 800 480, 780 550",
                                        stroke: "rgba(143, 255, 0, 0.14)",
                                        strokeWidth: "2.5",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -200 470 Q 400 400, 600 500 Q 750 560, 720 630",
                                        stroke: "rgba(143, 255, 0, 0.15)",
                                        strokeWidth: "3",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -100 250 Q 1000 180, 1650 280",
                                        stroke: "rgba(143, 255, 0, 0.04)",
                                        strokeWidth: "1",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -50 150 Q 500 80, 800 180 Q 900 220, 880 280",
                                        stroke: "rgba(143, 255, 0, 0.05)",
                                        strokeWidth: "1",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -100 440 Q 450 370, 650 460 Q 750 510, 730 580",
                                        stroke: "rgba(143, 255, 0, 0.28)",
                                        strokeWidth: "2",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -150 750 Q 400 680, 800 780 T 1750 750",
                                        stroke: "rgba(143, 255, 0, 0.09)",
                                        strokeWidth: "3",
                                        fill: "none"
                                    })
                                ]
                            }),
                            /* @__PURE__ */ jsxs("svg", {
                                className: "absolute top-0 left-0 w-full h-full lg:hidden",
                                viewBox: "0 0 800 1200",
                                preserveAspectRatio: "none",
                                children: [
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -50 100 Q 200 50, 400 150 T 850 100",
                                        stroke: "rgba(143, 255, 0, 0.2)",
                                        strokeWidth: "2",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -100 250 Q 300 200, 600 300 T 900 250",
                                        stroke: "rgba(143, 255, 0, 0.15)",
                                        strokeWidth: "2",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -50 400 Q 400 350, 850 450",
                                        stroke: "rgba(143, 255, 0, 0.25)",
                                        strokeWidth: "3",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -100 500 Q 300 450, 600 550 T 900 500",
                                        stroke: "rgba(143, 255, 0, 0.18)",
                                        strokeWidth: "2.5",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -50 700 Q 400 650, 850 750",
                                        stroke: "rgba(143, 255, 0, 0.12)",
                                        strokeWidth: "2",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -100 900 Q 400 850, 900 950",
                                        stroke: "rgba(143, 255, 0, 0.08)",
                                        strokeWidth: "1.5",
                                        fill: "none"
                                    }),
                                    /* @__PURE__ */ jsx("path", {
                                        d: "M -50 1100 Q 400 1050, 850 1150",
                                        stroke: "rgba(143, 255, 0, 0.1)",
                                        strokeWidth: "2",
                                        fill: "none"
                                    })
                                ]
                            })
                        ] }),
                    /* @__PURE__ */ jsx("div", { className: "pt-20 pb-32 relative z-10", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-12 items-center", children: [
                                    /* @__PURE__ */ jsxs("div", { className: "lg:col-span-6", children: [
                                            /* @__PURE__ */ jsxs("h1", { className: "text-5xl lg:text-7xl text-white mb-8 font-primary whitespace-nowrap", children: [
                                                    "Trading Charts",
                                                    " ",
                                                    /* @__PURE__ */ jsx("p", { className: "text-accent-1 relative mt-4", children: /* @__PURE__ */ jsx("span", { children: "Reimagined." }) })
                                                ] }),
                                            /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-200 my-8 leading-relaxed", children: "Trading charts, reimagined for the on-chain world." }),
                                            /* @__PURE__ */ jsx("div", { className: "flex gap-4", children: /* @__PURE__ */ jsx(Button, {
                                                    variant: "outline",
                                                    size: "lg",
                                                    outlineColor: "var(--color-accent-1)",
                                                    className: "!px-8 !py-4 !text-base border-2 hover:!bg-accent-1/10 hover:!text-accent-1",
                                                    onClick: ctaButtonConfig.onClick,
                                                    children: ctaButtonConfig.label
                                                }) })
                                        ] }),
                                    /* @__PURE__ */ jsx("div", { className: "lg:col-span-6 relative lg:-mr-6", children: /* @__PURE__ */ jsxs("div", { className: "relative lg:scale-150 lg:origin-left", children: [
                                                /* @__PURE__ */ jsx("img", {
                                                    src: "/hero-home.webp",
                                                    alt: "Spot Canvas Trading Charts",
                                                    className: "rounded-xl shadow-2xl w-full"
                                                }),
                                                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-accent-1/20 to-transparent rounded-xl pointer-events-none" })
                                            ] }) })
                                ] }) }) })
                ] }),
            /* @__PURE__ */ jsx("section", { id: "features", className: "py-20 bg-black/50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-6", children: [
                        /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-4xl lg:text-5xl font-bold text-white mb-4 font-primary", children: "Features" }),
                                /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-300 max-w-3xl mx-auto", children: "Powerful tools and capabilities designed for crypto enthusiasts and traders." })
                            ] }),
                        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: [
                                /* @__PURE__ */ jsx(FeatureCard, {
                                    title: "Technical Analysis & Indicators",
                                    description: "Analyze markets with essential drawing tools and prebuilt indicators.",
                                    timeline: "Available",
                                    icon: /* @__PURE__ */ jsx(BarChart3, { className: "w-6 h-6" })
                                }),
                                /* @__PURE__ */ jsx(FeatureCard, {
                                    title: "Multi-Chart Layouts",
                                    description: "Arrange several charts in a single layout to compare and analyze market trends. Save your favorite layouts for quick access at any time.",
                                    timeline: "Available",
                                    icon: /* @__PURE__ */ jsx(Code2, { className: "w-6 h-6" })
                                }),
                                /* @__PURE__ */ jsx(FeatureCard, {
                                    title: "Clear UX on both desktops and mobile",
                                    description: "Our user experience is optimized for both desktop and mobile - mobile UX is a priority for us.",
                                    timeline: "Available",
                                    icon: /* @__PURE__ */ jsx(Smartphone, { className: "w-6 h-6" }),
                                    backgroundImage: "/phone2.png"
                                })
                            ] }),
                        /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-12", children: /* @__PURE__ */ jsx(Button, {
                                to: "/features",
                                variant: "primary",
                                size: "lg",
                                asLink: true,
                                className: "inline-flex text-center gap-2",
                                children: "Learn more"
                            }) })
                    ] }) }),
            /* @__PURE__ */ jsx("section", { className: "py-20", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-6", children: [
                        /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-4xl lg:text-5xl font-bold text-white mb-4 font-primary", children: "Frequently Asked Questions" }),
                                /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-300", children: "Everything you need to know about Spot Canvas" })
                            ] }),
                        /* @__PURE__ */ jsx(Accordion, { items: faqItems })
                    ] }) }),
            /* @__PURE__ */ jsx(Footer, {})
        ] });
}
const faqItems = [
    {
        question: "What's unique about Spot Canvas?",
        answer: `We have just gotten started with our journey to revolutionize the financial tooling. Our focus in cryptocurrencies trading and we are offering intuitive, easy-to-se use tools for this purpose. In the next phases we plan
      to provide insights derived from the blockhains directly to the charts. AI-powered insights and predictions are obviously in the focus too.
      `
    },
    {
        question: "How does customer support work?",
        answer: "We provide email support with responses within 24 hours. You can reach us at info@spotcanvas.com for any questions or assistance you need."
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes, you can cancel your subscription at any time. There are no long-term commitments, and you'll continue to have access until the end of your current billing period."
    },
    {
        question: "What's the development roadmap?",
        answer: "Our roadmap includes: Q3-Q4/2025 - Blockchain Insights in the charts, Q1/2026 - Scriptable indicators, Q2/2026 - AI-powered market analysis and predictions"
    },
    {
        question: "How do I change my plan?",
        answer: /* @__PURE__ */ jsxs(Fragment, { children: [
                "Upgrading and downgrading can be done easily in your personal",
                " ",
                /* @__PURE__ */ jsx(Link, {
                    to: "/billing",
                    className: "text-accent-1 hover:text-accent-2 underline",
                    children: "Billing page"
                }),
                ". Changes take effect immediately."
            ] })
    }
];
const route13 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: Index,
    loader: loader$1,
    meta: meta$4
}, Symbol.toStringTag, { value: "Module" }));
const meta$3 = () => {
    return [
        { title: "Sign In - Spot Canvas" },
        { name: "description", content: "Sign in to your account" }
    ];
};
function SignIn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fromPricing = searchParams.get("from") === "pricing";
    const redirectTo = searchParams.get("redirect") || "/";
    useEffect(() => {
        if (user) {
            console.log(`Redirecting to ${redirectTo} - user signed in`);
            navigate(redirectTo);
        }
    }, [user, navigate, redirectTo]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        console.log("Client-side sign-in attempt with email:", formData.email);
        try {
            await signIn({ email: formData.email, password: formData.password });
            console.log("Client-side sign-in successful");
        }
        catch (signInError) {
            console.error("Client-side sign-in failed:", signInError);
            setError(getErrorMessage(signInError));
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-primary-dark", children: [
            /* @__PURE__ */ jsx(Navigation, { showGetStarted: false }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full space-y-8", children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                                /* @__PURE__ */ jsxs("h2", { className: "mt-6 text-center text-3xl font-extrabold text-white", children: [
                                        "Sign in to your ",
                                        /* @__PURE__ */ jsx("span", { className: "text-accent-1", children: "account" })
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mt-2 text-center text-sm text-gray-300", children: [
                                        "Or",
                                        " ",
                                        /* @__PURE__ */ jsx(Button, {
                                            asLink: true,
                                            to: `/signup${fromPricing ? "?from=pricing&redirect=" + encodeURIComponent(redirectTo) : ""}`,
                                            variant: "outline",
                                            size: "sm",
                                            outlineColor: "var(--color-accent-1)",
                                            className: "!px-3 !py-1 !text-xs border-2 hover:!bg-accent-1/10 hover:!text-accent-1",
                                            children: "create a new account"
                                        })
                                    ] }),
                                fromPricing && /* @__PURE__ */ jsx("div", { className: "mt-4 p-4 bg-accent-1/10 border border-accent-1/30 rounded-lg", children: /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-accent-1", children: [
                                            "Welcome! Please sign in to continue with your subscription. New to Spot Canvas?",
                                            " ",
                                            /* @__PURE__ */ jsx("a", {
                                                href: `/signup?from=pricing&redirect=${encodeURIComponent(redirectTo)}`,
                                                className: "underline hover:text-white transition-colors",
                                                children: "Create an account"
                                            }),
                                            " ",
                                            "to get started with your free trial."
                                        ] }) })
                            ] }),
                        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mt-8 space-y-6", children: [
                                error && /* @__PURE__ */ jsx("div", { className: "rounded-md bg-red-500/10 p-4 border border-red-500/20", children: /* @__PURE__ */ jsx("div", { className: "flex", children: /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-red-500", children: error }) }) }) }),
                                /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(GoogleSignInButton, { onError: setError, disabled: isSubmitting }) }),
                                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                                        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("div", { className: "w-full border-t border-gray-500" }) }),
                                        /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-sm", children: /* @__PURE__ */ jsx("span", { className: "px-2 bg-primary-dark text-gray-300", children: "Or continue with email" }) })
                                    ] }),
                                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                                        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("input", {
                                                id: "email",
                                                name: "email",
                                                type: "email",
                                                autoComplete: "email",
                                                required: true,
                                                value: formData.email,
                                                onChange: handleInputChange,
                                                className: "appearance-none relative block w-full px-3 py-2 border border-gray-500 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-accent-1 focus:border-accent-1 focus:z-10 sm:text-sm",
                                                placeholder: "Enter your email",
                                                disabled: isSubmitting
                                            }) }),
                                        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("input", {
                                                id: "password",
                                                name: "password",
                                                type: "password",
                                                autoComplete: "current-password",
                                                required: true,
                                                value: formData.password,
                                                onChange: handleInputChange,
                                                className: "appearance-none relative block w-full px-3 py-2 border border-gray-500 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-accent-1 focus:border-accent-1 focus:z-10 sm:text-sm",
                                                placeholder: "Enter your password",
                                                disabled: isSubmitting
                                            }) })
                                    ] }),
                                /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Button, {
                                        type: "submit",
                                        variant: "blue",
                                        fullWidth: true,
                                        disabled: isSubmitting,
                                        children: isSubmitting ? "Signing in..." : "Sign in"
                                    }) })
                            ] })
                    ] }) })
        ] });
}
const route14 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: SignIn,
    meta: meta$3
}, Symbol.toStringTag, { value: "Module" }));
const meta$2 = () => {
    return [
        { title: "Sign Up - Spot Canvas" },
        { name: "description", content: "Create your account" }
    ];
};
function SignUp() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        marketingConsent: false,
        termsAccepted: false
    });
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const fromPricing = searchParams.get("from") === "pricing";
    const redirectTo = searchParams.get("redirect") || "/";
    useEffect(() => {
        if (user && !isSubmitting) {
            console.log(`User already signed in, redirecting to ${redirectTo}`);
            navigate(redirectTo);
        }
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        if (!formData.termsAccepted) {
            setError("Please accept the Terms of Service and Privacy Policy to continue.");
            setIsSubmitting(false);
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setIsSubmitting(false);
            return;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            setIsSubmitting(false);
            return;
        }
        console.log("Client-side sign-up attempt with email:", formData.email);
        try {
            const newUser = await signUp({ email: formData.email, password: formData.password });
            console.log("Client-side sign-up successful");
            try {
                await saveUserPreferences(newUser.uid, formData.email, formData.marketingConsent);
                console.log("User preferences saved");
                if (formData.marketingConsent) {
                    try {
                        await customerIO.identify({
                            userId: newUser.uid,
                            email: formData.email,
                            marketingConsent: true,
                            emailVerified: false,
                            createdAt: Math.floor(Date.now() / 1e3)
                        });
                        await customerIO.track("user_signed_up", {
                            email: formData.email,
                            marketing_consent: true,
                            signup_method: "email",
                            email_verified: false
                        });
                        console.log("User identified in Customer.io with marketing consent");
                    }
                    catch (cioError) {
                        console.error("Failed to identify user in Customer.io:", cioError);
                    }
                }
            }
            catch (prefError) {
                console.error("Failed to save user preferences:", prefError);
            }
            navigate(`/verify-email?email=${encodeURIComponent(formData.email)}&marketing=${formData.marketingConsent}`);
        }
        catch (signUpError) {
            console.error("Client-side sign-up failed:", signUpError);
            setError(getErrorMessage(signUpError));
            setIsSubmitting(false);
        }
    };
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };
    const handleGoogleSignIn = async () => {
        if (!formData.termsAccepted) {
            setError("Please accept the Terms of Service and Privacy Policy to continue.");
            return;
        }
        setError(null);
        try {
            await signInWithGoogle();
            const auth2 = getAuth();
            const user2 = auth2.currentUser;
            if (user2) {
                try {
                    await saveUserPreferences(user2.uid, user2.email || "", formData.marketingConsent);
                    console.log("User preferences saved after Google sign-in");
                    if (formData.marketingConsent) {
                        try {
                            await customerIO.identify({
                                userId: user2.uid,
                                email: user2.email || "",
                                marketingConsent: true,
                                emailVerified: user2.emailVerified,
                                // Google users might be pre-verified
                                createdAt: Math.floor(Date.now() / 1e3)
                            });
                            await customerIO.track("user_signed_up", {
                                email: user2.email || "",
                                marketing_consent: true,
                                signup_method: "google",
                                email_verified: user2.emailVerified
                            });
                            console.log("User identified in Customer.io with marketing consent (Google)");
                        }
                        catch (cioError) {
                            console.error("Failed to identify user in Customer.io:", cioError);
                        }
                    }
                }
                catch (error2) {
                    console.error("Failed to save user preferences:", error2);
                }
                navigate(`/verify-email?email=${encodeURIComponent(user2.email || "")}&marketing=${formData.marketingConsent}`);
            }
        }
        catch (error2) {
            const errorMessage = error2.code === "auth/popup-closed-by-user" ? "Sign-in cancelled" : error2.message || "Failed to sign in with Google";
            setError(errorMessage);
        }
    };
    return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-primary-dark", children: [
            /* @__PURE__ */ jsx(Navigation, { showGetStarted: false }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md w-full space-y-8", children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                                /* @__PURE__ */ jsxs("h2", { className: "mt-6 text-center text-3xl font-extrabold text-white", children: [
                                        "Create your ",
                                        /* @__PURE__ */ jsx("span", { className: "text-accent-1", children: "account" })
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mt-2 text-center text-sm text-gray-300", children: [
                                        "Or",
                                        " ",
                                        /* @__PURE__ */ jsx("a", {
                                            href: `/signin${fromPricing ? "?from=pricing&redirect=" + encodeURIComponent(redirectTo) : ""}`,
                                            className: "font-medium text-accent-1 hover:text-accent-2 transition-colors",
                                            children: "sign in to your existing account"
                                        })
                                    ] }),
                                fromPricing && /* @__PURE__ */ jsx("div", { className: "mt-4 p-4 bg-accent-1/10 border border-accent-1/30 rounded-lg", children: /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-accent-1", children: [
                                            "Welcome! Create your account to get started with your 7-day free trial. Already have an account?",
                                            " ",
                                            /* @__PURE__ */ jsx("a", {
                                                href: `/signin?from=pricing&redirect=${encodeURIComponent(redirectTo)}`,
                                                className: "underline hover:text-white transition-colors",
                                                children: "Sign in"
                                            }),
                                            " ",
                                            "to continue."
                                        ] }) })
                            ] }),
                        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mt-8 space-y-6", children: [
                                error && /* @__PURE__ */ jsx("div", { className: "rounded-md bg-red-500/10 p-4 border border-red-500/20", children: /* @__PURE__ */ jsx("div", { className: "flex", children: /* @__PURE__ */ jsx("div", { className: "ml-3", children: /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium text-red-500", children: error }) }) }) }),
                                /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("button", {
                                        type: "button",
                                        onClick: handleGoogleSignIn,
                                        disabled: isSubmitting,
                                        className: "w-full flex justify-center items-center px-4 py-2 border border-gray-500 rounded-md text-sm font-medium text-white bg-transparent hover:bg-gray-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-dark focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed",
                                        children: [
                                            /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5 mr-2", viewBox: "0 0 24 24", children: [
                                                    /* @__PURE__ */ jsx("path", {
                                                        fill: "#4285f4",
                                                        d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    }),
                                                    /* @__PURE__ */ jsx("path", {
                                                        fill: "#34a853",
                                                        d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    }),
                                                    /* @__PURE__ */ jsx("path", {
                                                        fill: "#fbbc05",
                                                        d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    }),
                                                    /* @__PURE__ */ jsx("path", {
                                                        fill: "#ea4335",
                                                        d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    })
                                                ] }),
                                            isSubmitting ? "Signing in..." : "Continue with Google"
                                        ]
                                    }) }),
                                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                                        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("div", { className: "w-full border-t border-gray-500" }) }),
                                        /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-sm", children: /* @__PURE__ */ jsx("span", { className: "px-2 bg-primary-dark text-gray-300", children: "Or create account with email" }) })
                                    ] }),
                                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                                        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("input", {
                                                id: "email",
                                                name: "email",
                                                type: "email",
                                                autoComplete: "email",
                                                required: true,
                                                value: formData.email,
                                                onChange: handleInputChange,
                                                className: "appearance-none relative block w-full px-3 py-2 border border-gray-500 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-accent-1 focus:border-accent-1 focus:z-10 sm:text-sm",
                                                placeholder: "Enter your email",
                                                disabled: isSubmitting
                                            }) }),
                                        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("input", {
                                                id: "password",
                                                name: "password",
                                                type: "password",
                                                autoComplete: "new-password",
                                                required: true,
                                                value: formData.password,
                                                onChange: handleInputChange,
                                                className: "appearance-none relative block w-full px-3 py-2 border border-gray-500 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-accent-1 focus:border-accent-1 focus:z-10 sm:text-sm",
                                                placeholder: "Create a password (min 6 characters)",
                                                disabled: isSubmitting
                                            }) }),
                                        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("input", {
                                                id: "confirmPassword",
                                                name: "confirmPassword",
                                                type: "password",
                                                autoComplete: "new-password",
                                                required: true,
                                                value: formData.confirmPassword,
                                                onChange: handleInputChange,
                                                className: "appearance-none relative block w-full px-3 py-2 border border-gray-500 placeholder-gray-500 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-accent-1 focus:border-accent-1 focus:z-10 sm:text-sm",
                                                placeholder: "Confirm your password",
                                                disabled: isSubmitting
                                            }) })
                                    ] }),
                                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                                        /* @__PURE__ */ jsxs("div", { className: "flex items-start", children: [
                                                /* @__PURE__ */ jsx("input", {
                                                    id: "marketingConsent",
                                                    name: "marketingConsent",
                                                    type: "checkbox",
                                                    checked: formData.marketingConsent,
                                                    onChange: handleInputChange,
                                                    className: "mt-1 h-4 w-4 text-accent-1 border-gray-500 rounded focus:ring-accent-1",
                                                    disabled: isSubmitting
                                                }),
                                                /* @__PURE__ */ jsxs("label", { htmlFor: "marketingConsent", className: "ml-2 block text-sm text-gray-300", children: [
                                                        "I'd like to receive helpful tips, product updates, and exclusive offers",
                                                        /* @__PURE__ */ jsx("span", { className: "block text-xs text-gray-400 mt-1", children: "You can unsubscribe at any time" })
                                                    ] })
                                            ] }),
                                        /* @__PURE__ */ jsxs("div", { className: "flex items-start", children: [
                                                /* @__PURE__ */ jsx("input", {
                                                    id: "termsAccepted",
                                                    name: "termsAccepted",
                                                    type: "checkbox",
                                                    checked: formData.termsAccepted,
                                                    onChange: handleInputChange,
                                                    className: "mt-1 h-4 w-4 text-accent-1 border-gray-500 rounded focus:ring-accent-1",
                                                    disabled: isSubmitting,
                                                    required: true
                                                }),
                                                /* @__PURE__ */ jsxs("label", { htmlFor: "termsAccepted", className: "ml-2 block text-sm text-gray-300", children: [
                                                        "I agree to the",
                                                        " ",
                                                        /* @__PURE__ */ jsx("a", { href: "/terms", target: "_blank", className: "text-accent-1 hover:text-accent-2 underline", children: "Terms of Service" }),
                                                        " ",
                                                        "and",
                                                        " ",
                                                        /* @__PURE__ */ jsx("a", { href: "/privacy", target: "_blank", className: "text-accent-1 hover:text-accent-2 underline", children: "Privacy Policy" }),
                                                        /* @__PURE__ */ jsx("span", { className: "text-red-500 ml-1", children: "*" })
                                                    ] })
                                            ] })
                                    ] }),
                                /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Button, {
                                        type: "submit",
                                        variant: "primary",
                                        fullWidth: true,
                                        disabled: isSubmitting,
                                        children: isSubmitting ? "Creating account..." : "Sign up"
                                    }) })
                            ] })
                    ] }) })
        ] });
}
const route15 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: SignUp,
    meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
function SubscriptionNotification() {
    const { status, plan, trialEndsAt, isLoading, isPreviewExpired, previewStartTime } = useSubscription();
    const [isDismissed, setIsDismissed] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(null);
    useEffect(() => {
        if (status === "trialing" && trialEndsAt) {
            const now = /* @__PURE__ */ new Date();
            const trial = new Date(trialEndsAt);
            const diffTime = trial.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
            setDaysRemaining(diffDays);
        }
    }, [status, trialEndsAt]);
    if (isLoading) {
        return null;
    }
    if (status === "active" || isDismissed) {
        return null;
    }
    if (status === "trialing" && daysRemaining !== null) {
        if (daysRemaining <= 0) {
            return /* @__PURE__ */ jsxs("div", { className: "relative bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4", children: [
                    /* @__PURE__ */ jsx("button", {
                        onClick: () => setIsDismissed(true),
                        className: "absolute top-2 right-2 text-red-500/50 hover:text-red-500",
                        children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                    }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                            /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5 text-red-500 mt-0.5" }),
                            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                                    /* @__PURE__ */ jsx("h3", { className: "text-red-500 font-medium mb-1", children: "Your trial has ended" }),
                                    /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm mb-3", children: "Choose a plan to continue using Spot Canvas." }),
                                    /* @__PURE__ */ jsx(Button, { asLink: true, to: "/pricing", variant: "primary", size: "sm", children: "Choose Plan" })
                                ] })
                        ] })
                ] });
        }
        if (daysRemaining <= 3) {
            return /* @__PURE__ */ jsxs("div", { className: "relative bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4", children: [
                    /* @__PURE__ */ jsx("button", {
                        onClick: () => setIsDismissed(true),
                        className: "absolute top-2 right-2 text-yellow-500/50 hover:text-yellow-500",
                        children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                    }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                            /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5 text-yellow-500 mt-0.5" }),
                            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                                    /* @__PURE__ */ jsxs("h3", { className: "text-yellow-500 font-medium mb-1", children: [
                                            "Your ",
                                            plan,
                                            " trial ends in ",
                                            daysRemaining,
                                            " ",
                                            daysRemaining === 1 ? "day" : "days"
                                        ] }),
                                    /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm mb-3", children: "Choose your plan to continue using Spot Canvas after your trial ends." }),
                                    /* @__PURE__ */ jsx(Button, { asLink: true, to: "/pricing", variant: "primary", size: "sm", children: "Choose Plan" })
                                ] })
                        ] })
                ] });
        }
    }
    if (status === "none") {
        if (!isPreviewExpired && previewStartTime) {
            return /* @__PURE__ */ jsxs("div", { className: "relative bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4", children: [
                    /* @__PURE__ */ jsx("button", {
                        onClick: () => setIsDismissed(true),
                        className: "absolute top-2 right-2 text-blue-500/50 hover:text-blue-500",
                        children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                    }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                            /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5 text-blue-500 mt-0.5" }),
                            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                                    /* @__PURE__ */ jsx("h3", { className: "text-blue-500 font-medium mb-1", children: "Welcome to Spot Canvas!" }),
                                    /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm mb-3", children: "You're enjoying a 5-minute preview. Start your 7-day free trial to unlock unlimited access." }),
                                    /* @__PURE__ */ jsx(Button, { asLink: true, to: "/pricing", variant: "primary", size: "sm", children: "Start Free Trial" })
                                ] })
                        ] })
                ] });
        }
        return /* @__PURE__ */ jsxs("div", { className: "relative bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4", children: [
                /* @__PURE__ */ jsx("button", {
                    onClick: () => setIsDismissed(true),
                    className: "absolute top-2 right-2 text-red-500/50 hover:text-red-500",
                    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                        /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5 text-red-500 mt-0.5" }),
                        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                                /* @__PURE__ */ jsx("h3", { className: "text-red-500 font-medium mb-1", children: "Preview Ended" }),
                                /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm mb-3", children: "Your 5-minute preview has ended. Start your 7-day free trial to continue using Spot Canvas." }),
                                /* @__PURE__ */ jsx(Button, { asLink: true, to: "/pricing", variant: "primary", size: "sm", children: "Start Free Trial" })
                            ] })
                    ] })
            ] });
    }
    return null;
}
function SubscriptionLoader({ children, fallback }) {
    const { isLoading: subscriptionLoading, refreshSubscription } = useSubscription();
    const { loading: authLoading } = useAuth();
    const [hasInitialized, setHasInitialized] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(true);
    useEffect(() => {
        if (!authLoading) {
            setIsRefreshing(true);
            refreshSubscription().finally(() => {
                setHasInitialized(true);
                setIsRefreshing(false);
            });
        }
    }, [authLoading]);
    if (authLoading || !hasInitialized || subscriptionLoading || isRefreshing) {
        return fallback || /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-primary-dark", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" }),
                    /* @__PURE__ */ jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Loading..." })
                ] }) });
    }
    return /* @__PURE__ */ jsx(Fragment, { children });
}
const meta$1 = () => {
    return [
        { title: "Chart - Spot Canvas App" },
        { name: "description", content: "Financial chart view" },
        {
            name: "viewport",
            content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
            name: "apple-mobile-web-app-status-bar-style",
            content: "black-translucent"
        },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "theme-color", content: "#0F1117" }
    ];
};
async function loader({ request }) {
    return json({ ready: true });
}
function ChartContent() {
    useLoaderData();
    return /* @__PURE__ */ jsx(SubscriptionLoader, { children: /* @__PURE__ */ jsxs("div", {
            className: "flex flex-col bg-primary-dark",
            style: {
                minHeight: "calc(100vh + 1px)"
            },
            children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col", style: { height: "100vh" }, children: [
                        /* @__PURE__ */ jsx("div", { className: "px-6 pt-4", children: /* @__PURE__ */ jsx(SubscriptionNotification, {}) }),
                        /* @__PURE__ */ jsx(ChartApp, { className: "flex-1" })
                    ] }),
                /* @__PURE__ */ jsx("div", {
                    style: { height: "1px" },
                    className: "bg-transparent pointer-events-none",
                    "aria-hidden": "true"
                })
            ]
        }) });
}
function ChartRoute() {
    return /* @__PURE__ */ jsx(ProtectedRoute, {
        allowPreview: true,
        fallback: /* @__PURE__ */ jsx("div", { className: "min-h-screen-dvh flex items-center justify-center bg-primary-dark", children: /* @__PURE__ */ jsx("div", { className: "max-w-md w-full", children: /* @__PURE__ */ jsx(Login, {
                    title: "Preview Expired",
                    description: "Your 5-minute preview has ended. Please sign in to continue using the trading charts.",
                    showFeatures: false,
                    layout: "vertical",
                    className: "w-full"
                }) }) }),
        children: /* @__PURE__ */ jsx(ChartContent, {})
    });
}
const route16 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: ChartRoute,
    loader,
    meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
const meta = () => {
    return [
        { title: "Terms of Service - Spot Canvas" },
        {
            name: "description",
            content: "Terms of Service for Spot Canvas cryptocurrency charting platform"
        }
    ];
};
function Terms() {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-white text-black", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-6 py-12", children: [
                /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-block mb-8 text-blue-600 hover:text-blue-800 font-medium transition-colors", children: "← Back to Home" }),
                /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold mb-8 text-black", children: "Terms of Service" }),
                /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-8", children: "Last updated: January 22, 2025" }),
                /* @__PURE__ */ jsxs("div", { className: "prose prose-lg max-w-none prose-headings:text-black prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-black", children: [
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "1. Acceptance of Terms" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: 'By accessing or using Spot Canvas ("the Service"), provided by Northern Peaks Development ("we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.' }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "We reserve the right to update these Terms at any time. We will notify users of any material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "2. Description of Service" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "Spot Canvas is a cryptocurrency charting and technical analysis platform that provides:" }),
                                /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
                                        /* @__PURE__ */ jsx("li", { children: "Real-time cryptocurrency market data and charts" }),
                                        /* @__PURE__ */ jsx("li", { children: "Technical analysis tools and indicators" }),
                                        /* @__PURE__ */ jsx("li", { children: "Multi-chart layouts and workspace management" }),
                                        /* @__PURE__ */ jsx("li", { children: "Drawing tools for chart analysis" }),
                                        /* @__PURE__ */ jsx("li", { children: "Cloud storage for user settings and drawings" }),
                                        /* @__PURE__ */ jsx("li", { children: "Scriptable custom indicators (coming soon)" })
                                    ] }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "The Service is provided for informational and educational purposes only and does not constitute financial, investment, or trading advice." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "3. User Accounts" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "To access certain features of the Service, you must create an account. You agree to:" }),
                                /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
                                        /* @__PURE__ */ jsx("li", { children: "Provide accurate, current, and complete information during registration" }),
                                        /* @__PURE__ */ jsx("li", { children: "Maintain and promptly update your account information" }),
                                        /* @__PURE__ */ jsx("li", { children: "Keep your password secure and confidential" }),
                                        /* @__PURE__ */ jsx("li", { children: "Accept responsibility for all activities that occur under your account" }),
                                        /* @__PURE__ */ jsx("li", { children: "Notify us immediately of any unauthorized use of your account" })
                                    ] }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or illegal activities." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "4. Subscription and Payment" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "Access to premium features requires a paid subscription. By subscribing, you agree to:" }),
                                /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
                                        /* @__PURE__ */ jsx("li", { children: "Pay the subscription fees at the intervals you select (monthly or annually)" }),
                                        /* @__PURE__ */ jsx("li", { children: "Provide valid payment information" }),
                                        /* @__PURE__ */ jsx("li", { children: "Accept automatic renewal of your subscription unless you cancel" })
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Free Trial:" }),
                                        " We offer a 7-day free trial for new users. You may cancel at any time during the trial period without charge. If you do not cancel before the trial ends, your subscription will automatically begin."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Cancellation:" }),
                                        " You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of the current billing period. No refunds are provided for partial billing periods."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Price Changes:" }),
                                        " We reserve the right to modify subscription prices with 30 days' notice. Your current price is guaranteed for the remainder of your billing period."
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "5. Acceptable Use" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "You agree not to:" }),
                                /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
                                        /* @__PURE__ */ jsx("li", { children: "Use the Service for any illegal purpose or in violation of any laws" }),
                                        /* @__PURE__ */ jsx("li", { children: "Attempt to gain unauthorized access to any portion of the Service" }),
                                        /* @__PURE__ */ jsx("li", { children: "Interfere with or disrupt the Service or servers" }),
                                        /* @__PURE__ */ jsx("li", { children: "Reverse engineer, decompile, or disassemble any part of the Service" }),
                                        /* @__PURE__ */ jsx("li", { children: "Scrape, harvest, or extract data from the Service through automated means" }),
                                        /* @__PURE__ */ jsx("li", { children: "Resell, redistribute, or sublicense the Service or any data obtained from it" }),
                                        /* @__PURE__ */ jsx("li", { children: "Use the Service to transmit malware, viruses, or harmful code" }),
                                        /* @__PURE__ */ jsx("li", { children: "Impersonate any person or entity" }),
                                        /* @__PURE__ */ jsx("li", { children: "Share your account credentials with others" })
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "6. Intellectual Property" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "The Service and its original content, features, and functionality are owned by Northern Peaks Development and are protected by international copyright, trademark, and other intellectual property laws." }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Your Content:" }),
                                        " You retain ownership of any analysis, drawings, or custom indicators you create using the Service. By using the Service, you grant us a non-exclusive, worldwide, royalty-free license to store, display, and backup your content as necessary to provide the Service."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Market Data:" }),
                                        " Cryptocurrency market data displayed through the Service is obtained from third-party providers and may be subject to additional terms and restrictions."
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "7. Privacy and Data Protection" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "Your use of the Service is also governed by our Privacy Policy. We are committed to protecting your privacy and handling your data in accordance with applicable data protection laws, including GDPR for EU users and CCPA for California residents." }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "We collect and process only the data necessary to provide the Service, including:" }),
                                /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
                                        /* @__PURE__ */ jsx("li", { children: "Account information (email, name)" }),
                                        /* @__PURE__ */ jsx("li", { children: "Usage data and preferences" }),
                                        /* @__PURE__ */ jsx("li", { children: "Chart settings and saved layouts" }),
                                        /* @__PURE__ */ jsx("li", { children: "Payment information (processed securely through Stripe)" })
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Data Processing:" }),
                                        " We act as a data controller for personal data collected through the Service. We process data based on legitimate interests, contract fulfillment, and where required, explicit consent."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Data Retention:" }),
                                        " We retain personal data only for as long as necessary to provide the Service and comply with legal obligations. Account data is deleted within 90 days of account termination unless required by law."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Data Security:" }),
                                        " We implement industry-standard security measures including encryption in transit (TLS/SSL) and at rest, regular security audits, and access controls to protect your data."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "International Data Transfers:" }),
                                        " Data may be processed in countries outside your residence. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable laws."
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "8. API Usage and Integration" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "If you use our API or integrate the Service with third-party platforms:" }),
                                /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
                                        /* @__PURE__ */ jsx("li", { children: "You must comply with our API documentation and rate limits" }),
                                        /* @__PURE__ */ jsx("li", { children: "API keys must be kept secure and not shared publicly" }),
                                        /* @__PURE__ */ jsx("li", { children: "You are responsible for all activities under your API credentials" }),
                                        /* @__PURE__ */ jsx("li", { children: "We reserve the right to throttle or suspend API access for abuse" }),
                                        /* @__PURE__ */ jsx("li", { children: "Commercial use of the API requires a separate agreement" })
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Third-Party Integrations:" }),
                                        " When connecting third-party services (such as Customer.io for email communications), you authorize us to share necessary data with these services in accordance with their respective privacy policies and terms of service."
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "9. Disclaimer of Warranties" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.' }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "We do not warrant that:" }),
                                /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
                                        /* @__PURE__ */ jsx("li", { children: "The Service will be uninterrupted, secure, or error-free" }),
                                        /* @__PURE__ */ jsx("li", { children: "The results obtained from the Service will be accurate or reliable" }),
                                        /* @__PURE__ */ jsx("li", { children: "Any errors in the Service will be corrected" })
                                    ] }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4 font-semibold", children: "IMPORTANT: The Service provides market data and analysis tools for informational purposes only. We are not a financial advisor, and nothing in the Service constitutes financial, investment, legal, or tax advice. Always do your own research and consult with qualified professionals before making investment decisions." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "10. Limitation of Liability" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "TO THE MAXIMUM EXTENT PERMITTED BY LAW, NORTHERN PEAKS DEVELOPMENT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:" }),
                                /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
                                        /* @__PURE__ */ jsx("li", { children: "Your use or inability to use the Service" }),
                                        /* @__PURE__ */ jsx("li", { children: "Any unauthorized access to or use of our servers and/or any personal information stored therein" }),
                                        /* @__PURE__ */ jsx("li", { children: "Any interruption or cessation of transmission to or from the Service" }),
                                        /* @__PURE__ */ jsx("li", { children: "Any bugs, viruses, or harmful code transmitted through the Service" }),
                                        /* @__PURE__ */ jsx("li", { children: "Any errors or omissions in content or any loss or damage incurred from using content" }),
                                        /* @__PURE__ */ jsx("li", { children: "Trading or investment decisions made based on information from the Service" })
                                    ] }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "Our total liability to you for all claims arising from or related to these Terms or the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "11. Indemnification" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "You agree to indemnify, defend, and hold harmless Northern Peaks Development, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal fees, arising out of or related to your use of the Service, violation of these Terms, or violation of any rights of another." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "12. Termination" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms." }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "Upon termination:" }),
                                /* @__PURE__ */ jsxs("ul", { className: "list-disc pl-6 mb-4", children: [
                                        /* @__PURE__ */ jsx("li", { children: "Your right to use the Service will immediately cease" }),
                                        /* @__PURE__ */ jsx("li", { children: "We may delete your account and any content or information" }),
                                        /* @__PURE__ */ jsx("li", { children: "We are not obligated to provide any refund of fees paid" })
                                    ] }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "You may terminate your account at any time through your account settings or by contacting us at anssi@spotcanvas.com." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "13. Governing Law and Dispute Resolution" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "These Terms shall be governed by and construed in accordance with the laws of Finland, without regard to its conflict of law provisions." }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "Any disputes arising from these Terms or the Service shall be resolved through good-faith negotiation. If negotiation fails, disputes shall be submitted to the competent courts of Finland." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "14. Changes to the Service" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "15. Third-Party Services" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "The Service may contain links to third-party websites or services that are not owned or controlled by us. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services." }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "Our use of third-party services (such as payment processors, data providers) is governed by their respective terms and privacy policies." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "16. Compliance and Export Controls" }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Anti-Corruption:" }),
                                        " You represent and warrant that you have not and will not make any payment or provide anything of value to any government official or other person in violation of applicable anti-corruption laws, including the U.S. Foreign Corrupt Practices Act."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Export Compliance:" }),
                                        " The Service may be subject to export laws and regulations. You agree to comply with all applicable export and import laws and regulations, including those of the European Union and United States."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Sanctions:" }),
                                        " You represent that you are not located in, or a resident or national of, any country subject to comprehensive sanctions, and that you are not on any list of prohibited or restricted parties."
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "17. Service Level and Support" }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Availability:" }),
                                        " While we strive for high availability, we do not guarantee any specific uptime or service level. The Service may be unavailable due to maintenance, updates, or circumstances beyond our control."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Support:" }),
                                        " Support is provided via email at anssi@spotcanvas.com during regular business hours (Monday-Friday, 9:00 AM - 5:00 PM EET/EEST). Response times vary based on issue severity and subscription tier."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Data Backup:" }),
                                        " While we maintain regular backups, you are responsible for maintaining your own copies of any critical data or analysis you create using the Service."
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "18. Marketing Communications" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "By creating an account, you agree to receive transactional emails related to your account and use of the Service. You may opt-in to receive marketing communications, which you can unsubscribe from at any time." }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "We use Customer.io and other third-party services to manage email communications. Your email interactions may be tracked to improve our Service and communications." })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "19. General Provisions" }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Entire Agreement:" }),
                                        " These Terms constitute the entire agreement between you and Northern Peaks Development regarding the Service."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Severability:" }),
                                        " If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Waiver:" }),
                                        " Our failure to enforce any right or provision of these Terms shall not be considered a waiver of those rights."
                                    ] }),
                                /* @__PURE__ */ jsxs("p", { className: "mb-4", children: [
                                        /* @__PURE__ */ jsx("strong", { children: "Assignment:" }),
                                        " You may not assign or transfer your rights under these Terms without our prior written consent. We may assign our rights and obligations without restriction."
                                    ] })
                            ] }),
                        /* @__PURE__ */ jsxs("section", { className: "mb-8", children: [
                                /* @__PURE__ */ jsx("h2", { className: "text-2xl font-semibold mb-4", children: "20. Contact Information" }),
                                /* @__PURE__ */ jsx("p", { className: "mb-4", children: "If you have any questions about these Terms of Service, please contact us at:" }),
                                /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [
                                        /* @__PURE__ */ jsx("p", { className: "mb-2", children: /* @__PURE__ */ jsx("strong", { children: "Northern Peaks Development" }) }),
                                        /* @__PURE__ */ jsx("p", { className: "mb-2", children: "Espoo, Finland" }),
                                        /* @__PURE__ */ jsx("p", { className: "mb-2", children: "Email: anssi@spotcanvas.com" }),
                                        /* @__PURE__ */ jsx("p", { children: "Phone: +358 40 849 8385" })
                                    ] })
                            ] })
                    ] })
            ] }) });
}
const route17 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    default: Terms,
    meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-C4QJm4nW.js", "imports": ["/assets/components-BiZe2nZv.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-BkSwh_Pi.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/analytics-AjhUffs8.js"], "css": ["/assets/root-C7b7LSS_.css"] }, "routes/payment-method": { "id": "routes/payment-method", "parentId": "root", "path": "payment-method", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/payment-method-B9pStQeQ.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/AccountMenu-tssDskfK.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/analytics-AjhUffs8.js", "/assets/Footer-Ci1tMiGI.js", "/assets/ProtectedRoute-CG8pJKru.js"], "css": [] }, "routes/manual._index": { "id": "routes/manual._index", "parentId": "root", "path": "manual", "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/manual._index-B8UAksex.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/Navigation-bErHDolc.js", "/assets/Footer-Ci1tMiGI.js", "/assets/AccountMenu-tssDskfK.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/x-CQSHRsKK.js"], "css": [] }, "routes/manual.$slug": { "id": "routes/manual.$slug", "parentId": "root", "path": "manual/:slug", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/manual._slug-DO1SpQo7.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/Navigation-bErHDolc.js", "/assets/Footer-Ci1tMiGI.js", "/assets/AccountMenu-tssDskfK.js", "/assets/arrow-left-Dtd_BqeM.js", "/assets/x-CQSHRsKK.js", "/assets/SubscriptionContext-xmXRM7LU.js"], "css": [] }, "routes/verify-email": { "id": "routes/verify-email", "parentId": "root", "path": "verify-email", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/verify-email-5MAI9u9f.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/AccountMenu-tssDskfK.js", "/assets/Navigation-bErHDolc.js", "/assets/x-CQSHRsKK.js"], "css": [] }, "routes/blog._index": { "id": "routes/blog._index", "parentId": "root", "path": "blog", "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/blog._index-CY2yprzq.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/Navigation-bErHDolc.js", "/assets/Footer-Ci1tMiGI.js", "/assets/AccountMenu-tssDskfK.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/x-CQSHRsKK.js"], "css": [] }, "routes/blog.$slug": { "id": "routes/blog.$slug", "parentId": "root", "path": "blog/:slug", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/blog._slug-B-sReMXe.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/Navigation-bErHDolc.js", "/assets/Footer-Ci1tMiGI.js", "/assets/AccountMenu-tssDskfK.js", "/assets/arrow-left-Dtd_BqeM.js", "/assets/x-CQSHRsKK.js", "/assets/SubscriptionContext-xmXRM7LU.js"], "css": [] }, "routes/test-chart": { "id": "routes/test-chart", "parentId": "root", "path": "test-chart", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/test-chart-CY5BPohA.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/ProtectedRoute-CG8pJKru.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/ChartApp-BwKqTXaz.js", "/assets/AccountMenu-tssDskfK.js", "/assets/preload-helper-ckwbz45p.js", "/assets/x-CQSHRsKK.js", "/assets/loader-circle-DziU1CyS.js"], "css": [] }, "routes/thank-you": { "id": "routes/thank-you", "parentId": "root", "path": "thank-you", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/thank-you-DatFQohO.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/AccountMenu-tssDskfK.js", "/assets/Footer-Ci1tMiGI.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/analytics-AjhUffs8.js"], "css": [] }, "routes/features": { "id": "routes/features", "parentId": "root", "path": "features", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/features-C05sJdRe.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/Navigation-bErHDolc.js", "/assets/AccountMenu-tssDskfK.js", "/assets/Footer-Ci1tMiGI.js", "/assets/x-CQSHRsKK.js", "/assets/SubscriptionContext-xmXRM7LU.js"], "css": [] }, "routes/billing": { "id": "routes/billing", "parentId": "root", "path": "billing", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/billing-BYAz1fVH.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/ProtectedRoute-CG8pJKru.js", "/assets/AccountMenu-tssDskfK.js", "/assets/Navigation-bErHDolc.js", "/assets/loader-circle-DziU1CyS.js", "/assets/x-CQSHRsKK.js"], "css": [] }, "routes/pricing": { "id": "routes/pricing", "parentId": "root", "path": "pricing", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/pricing-D2xc4kuC.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/AccountMenu-tssDskfK.js", "/assets/Navigation-bErHDolc.js", "/assets/Footer-Ci1tMiGI.js", "/assets/Accordion-DIIZKofh.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/analytics-AjhUffs8.js", "/assets/x-CQSHRsKK.js"], "css": [] }, "routes/welcome": { "id": "routes/welcome", "parentId": "root", "path": "welcome", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/welcome-FhFPj812.js", "imports": ["/assets/SubscriptionContext-xmXRM7LU.js", "/assets/preload-helper-ckwbz45p.js", "/assets/components-BiZe2nZv.js", "/assets/customerio-BXdeG_fN.js", "/assets/AccountMenu-tssDskfK.js", "/assets/Navigation-bErHDolc.js", "/assets/x-CQSHRsKK.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-Do4UoK0T.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/AccountMenu-tssDskfK.js", "/assets/Navigation-bErHDolc.js", "/assets/Accordion-DIIZKofh.js", "/assets/Footer-Ci1tMiGI.js", "/assets/x-CQSHRsKK.js"], "css": [] }, "routes/signin": { "id": "routes/signin", "parentId": "root", "path": "signin", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/signin-BsnEB-dj.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/AccountMenu-tssDskfK.js", "/assets/Navigation-bErHDolc.js", "/assets/x-CQSHRsKK.js"], "css": [] }, "routes/signup": { "id": "routes/signup", "parentId": "root", "path": "signup", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/signup-nynfeoeh.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/customerio-BXdeG_fN.js", "/assets/AccountMenu-tssDskfK.js", "/assets/Navigation-bErHDolc.js", "/assets/x-CQSHRsKK.js"], "css": [] }, "routes/chart": { "id": "routes/chart", "parentId": "root", "path": "chart", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/chart-CnkKdhn3.js", "imports": ["/assets/components-BiZe2nZv.js", "/assets/ProtectedRoute-CG8pJKru.js", "/assets/ChartApp-BwKqTXaz.js", "/assets/SubscriptionContext-xmXRM7LU.js", "/assets/AccountMenu-tssDskfK.js", "/assets/x-CQSHRsKK.js", "/assets/preload-helper-ckwbz45p.js", "/assets/loader-circle-DziU1CyS.js"], "css": [] }, "routes/terms": { "id": "routes/terms", "parentId": "root", "path": "terms", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/terms-BbZty9mR.js", "imports": ["/assets/components-BiZe2nZv.js"], "css": [] } }, "url": "/assets/manifest-9955244a.js", "version": "9955244a" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
    "root": {
        id: "root",
        parentId: void 0,
        path: "",
        index: void 0,
        caseSensitive: void 0,
        module: route0
    },
    "routes/payment-method": {
        id: "routes/payment-method",
        parentId: "root",
        path: "payment-method",
        index: void 0,
        caseSensitive: void 0,
        module: route1
    },
    "routes/manual._index": {
        id: "routes/manual._index",
        parentId: "root",
        path: "manual",
        index: true,
        caseSensitive: void 0,
        module: route2
    },
    "routes/manual.$slug": {
        id: "routes/manual.$slug",
        parentId: "root",
        path: "manual/:slug",
        index: void 0,
        caseSensitive: void 0,
        module: route3
    },
    "routes/verify-email": {
        id: "routes/verify-email",
        parentId: "root",
        path: "verify-email",
        index: void 0,
        caseSensitive: void 0,
        module: route4
    },
    "routes/blog._index": {
        id: "routes/blog._index",
        parentId: "root",
        path: "blog",
        index: true,
        caseSensitive: void 0,
        module: route5
    },
    "routes/blog.$slug": {
        id: "routes/blog.$slug",
        parentId: "root",
        path: "blog/:slug",
        index: void 0,
        caseSensitive: void 0,
        module: route6
    },
    "routes/test-chart": {
        id: "routes/test-chart",
        parentId: "root",
        path: "test-chart",
        index: void 0,
        caseSensitive: void 0,
        module: route7
    },
    "routes/thank-you": {
        id: "routes/thank-you",
        parentId: "root",
        path: "thank-you",
        index: void 0,
        caseSensitive: void 0,
        module: route8
    },
    "routes/features": {
        id: "routes/features",
        parentId: "root",
        path: "features",
        index: void 0,
        caseSensitive: void 0,
        module: route9
    },
    "routes/billing": {
        id: "routes/billing",
        parentId: "root",
        path: "billing",
        index: void 0,
        caseSensitive: void 0,
        module: route10
    },
    "routes/pricing": {
        id: "routes/pricing",
        parentId: "root",
        path: "pricing",
        index: void 0,
        caseSensitive: void 0,
        module: route11
    },
    "routes/welcome": {
        id: "routes/welcome",
        parentId: "root",
        path: "welcome",
        index: void 0,
        caseSensitive: void 0,
        module: route12
    },
    "routes/_index": {
        id: "routes/_index",
        parentId: "root",
        path: void 0,
        index: true,
        caseSensitive: void 0,
        module: route13
    },
    "routes/signin": {
        id: "routes/signin",
        parentId: "root",
        path: "signin",
        index: void 0,
        caseSensitive: void 0,
        module: route14
    },
    "routes/signup": {
        id: "routes/signup",
        parentId: "root",
        path: "signup",
        index: void 0,
        caseSensitive: void 0,
        module: route15
    },
    "routes/chart": {
        id: "routes/chart",
        parentId: "root",
        path: "chart",
        index: void 0,
        caseSensitive: void 0,
        module: route16
    },
    "routes/terms": {
        id: "routes/terms",
        parentId: "root",
        path: "terms",
        index: void 0,
        caseSensitive: void 0,
        module: route17
    }
};
export { serverManifest as assets, assetsBuildDirectory, basename, entry, future, isSpaMode, mode, publicPath, routes };
//# sourceMappingURL=index.js.map
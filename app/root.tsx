import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { AuthProvider } from "~/lib/auth-context";
import { SubscriptionProvider } from "~/contexts/SubscriptionContext";
import { useEffect, useState } from "react";
import { initGA, logPageView } from "~/lib/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "~/lib/firebase";

import "./tailwind.css";

// Add styles for react-resizable-panels
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

export const links: LinksFunction = () => [
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
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Lexend:wght@100..900&display=swap",
  },
];

// Component to handle OAuth redirects using onAuthStateChanged
function OAuthRedirectHandler({ children }: { children: React.ReactNode }) {
  const [isProcessed, setIsProcessed] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      setIsProcessed(true);
      return;
    }

    // Check if we have RECENT OAuth state (means we're returning from OAuth)
    const sessionState = sessionStorage.getItem('googleAuthState');
    const localState = localStorage.getItem('googleAuthState');
    const stateTime = localStorage.getItem('googleAuthStateTime');

    // If we have sessionStorage state, it's fresh (same session)
    if (sessionState) {
      console.log("ROOT: Fresh OAuth state in sessionStorage, waiting for auth...");
    }
    // If we have localStorage state, check if it's recent (within 2 minutes)
    else if (localState && stateTime) {
      const age = Date.now() - parseInt(stateTime);
      if (age > 2 * 60 * 1000) {
        console.log("ROOT: OAuth state is stale (>2min), clearing and rendering normally");
        localStorage.removeItem('googleAuthState');
        localStorage.removeItem('googleAuthStateTime');
        setIsProcessed(true);
        return;
      }
      console.log("ROOT: Recent OAuth state in localStorage, waiting for auth...");
    }
    // No OAuth state or stale state
    else {
      setIsProcessed(true);
      return;
    }

    // Wait for Firebase to process the OAuth redirect
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("ROOT: User authenticated via OAuth:", user.email);

        // Get state from storage
        let marketingConsent = false;
        try {
          const sessionState = sessionStorage.getItem('googleAuthState');
          const localState = localStorage.getItem('googleAuthState');
          const storedState = sessionState || localState;
          if (storedState) {
            const stateData = JSON.parse(storedState);
            marketingConsent = stateData.marketingConsent || false;
          }
        } catch (e) {
          console.warn("Could not retrieve OAuth state");
        }

        // Clean up storage
        sessionStorage.removeItem('googleAuthState');
        localStorage.removeItem('googleAuthState');
        localStorage.removeItem('googleAuthStateTime');
        sessionStorage.removeItem('processedCallback');

        // Check if user exists in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const isNewUser = !userDoc.exists();

        console.log("ROOT: Saving user to Firestore, isNewUser:", isNewUser);

        // Save to Firestore
        await setDoc(userDocRef, {
          email: user.email,
          marketingConsent,
          consentTimestamp: serverTimestamp(),
          emailVerified: true,
          createdAt: isNewUser ? serverTimestamp() : (userDoc.data()?.createdAt || serverTimestamp()),
        }, { merge: true });

        console.log("ROOT: Redirecting to /welcome");
        sessionStorage.setItem('justCompletedSignup', 'true');
        window.location.href = "/welcome";
      } else {
        // No user yet, keep waiting
        console.log("ROOT: No user yet, waiting...");
      }
    });

    // Cleanup subscription after 10 seconds
    const timeout = setTimeout(() => {
      console.log("ROOT: Timeout waiting for OAuth, rendering normally");
      unsubscribe();
      setIsProcessed(true);
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // While waiting for OAuth processing, show nothing
  if (!isProcessed) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="text-white text-lg">Processing sign-in...</div>
      </div>
    );
  }

  return <>{children}</>;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <style dangerouslySetInnerHTML={{ __html: panelStyles }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    initGA();

    // Register service worker for offline support and caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available, reload for updates');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SUBSCRIPTION_UPDATED') {
          console.log('Subscription data updated via service worker');
          // The subscription context will automatically pick up the new data
        }
      });
    }
  }, []);

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  return (
    <OAuthRedirectHandler>
      <AuthProvider>
        <SubscriptionProvider>
          <Outlet />
        </SubscriptionProvider>
      </AuthProvider>
    </OAuthRedirectHandler>
  );
}

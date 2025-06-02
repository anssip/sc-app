import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { AuthProvider } from "~/lib/auth-context";

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
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

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
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

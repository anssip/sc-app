declare namespace serverManifest {
    namespace entry {
        let module: string;
        let imports: string[];
        let css: never[];
    }
    let routes: {
        root: {
            id: string;
            parentId: undefined;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: string[];
        };
        "routes/payment-method": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/manual._index": {
            id: string;
            parentId: string;
            path: string;
            index: boolean;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/manual.$slug": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/verify-email": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/blog._index": {
            id: string;
            parentId: string;
            path: string;
            index: boolean;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/blog.$slug": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/test-chart": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/thank-you": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/features": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/billing": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/pricing": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/welcome": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/_index": {
            id: string;
            parentId: string;
            path: undefined;
            index: boolean;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/signin": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/signup": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/chart": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
        "routes/terms": {
            id: string;
            parentId: string;
            path: string;
            index: undefined;
            caseSensitive: undefined;
            hasAction: boolean;
            hasLoader: boolean;
            hasClientAction: boolean;
            hasClientLoader: boolean;
            hasErrorBoundary: boolean;
            module: string;
            imports: string[];
            css: never[];
        };
    };
    let url: string;
    let version: string;
}
export const assetsBuildDirectory: "build/client";
export const basename: "/";
export namespace entry {
    export { entryServer as module };
}
export namespace future {
    let v3_fetcherPersist: boolean;
    let v3_relativeSplatPath: boolean;
    let v3_throwAbortReason: boolean;
    let v3_routeConfig: boolean;
    let v3_singleFetch: boolean;
    let v3_lazyRouteDiscovery: boolean;
    let unstable_optimizeDeps: boolean;
}
export const isSpaMode: false;
export const mode: "production";
export const publicPath: "/";
export const routes: {
    root: {
        id: string;
        parentId: undefined;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            Layout: typeof Layout;
            default: typeof App;
            links: () => ({
                rel: string;
                type: string;
                href: string;
                sizes?: undefined;
                crossOrigin?: undefined;
            } | {
                rel: string;
                type: string;
                sizes: string;
                href: string;
                crossOrigin?: undefined;
            } | {
                rel: string;
                sizes: string;
                href: string;
                type?: undefined;
                crossOrigin?: undefined;
            } | {
                rel: string;
                href: string;
                type?: undefined;
                sizes?: undefined;
                crossOrigin?: undefined;
            } | {
                rel: string;
                href: string;
                crossOrigin: string;
                type?: undefined;
                sizes?: undefined;
            })[];
        }>;
    };
    "routes/payment-method": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof PaymentMethodPage;
            loader: typeof loader$8;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/manual._index": {
        id: string;
        parentId: string;
        path: string;
        index: boolean;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof ManualIndex;
            loader: () => Promise<import("@remix-run/server-runtime").TypedResponse<{
                entries: {
                    slug: string;
                    title: any;
                    excerpt: any;
                    author: any;
                    publishDate: any;
                    category: any;
                    readingTime: string;
                    published: any;
                    featured: any;
                    order: any;
                }[];
            }>>;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
                property?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
                property?: undefined;
            } | {
                property: string;
                content: string;
                title?: undefined;
                name?: undefined;
            })[];
        }>;
    };
    "routes/manual.$slug": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof ManualEntryPage;
            loader: ({ params }: {
                params: any;
            }) => Promise<import("@remix-run/server-runtime").TypedResponse<{
                entry: {
                    slug: any;
                    title: any;
                    excerpt: any;
                    content: string | Promise<string>;
                    author: any;
                    publishDate: any;
                    category: any;
                    readingTime: string;
                    published: any;
                    featured: any;
                    order: any;
                };
            }>>;
            meta: ({ data }: {
                data: any;
            }) => ({
                title: string;
                name?: undefined;
                content?: undefined;
                property?: undefined;
            } | {
                name: string;
                content: any;
                title?: undefined;
                property?: undefined;
            } | {
                property: string;
                content: any;
                title?: undefined;
                name?: undefined;
            })[];
        }>;
    };
    "routes/verify-email": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof VerifyEmail;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/blog._index": {
        id: string;
        parentId: string;
        path: string;
        index: boolean;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof BlogIndex;
            loader: () => Promise<import("@remix-run/server-runtime").TypedResponse<{
                posts: {
                    slug: string;
                    title: any;
                    excerpt: any;
                    author: any;
                    publishDate: any;
                    category: any;
                    readingTime: string;
                    published: any;
                    featured: any;
                }[];
            }>>;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
                property?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
                property?: undefined;
            } | {
                property: string;
                content: string;
                title?: undefined;
                name?: undefined;
            })[];
        }>;
    };
    "routes/blog.$slug": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof BlogPostPage;
            loader: ({ params }: {
                params: any;
            }) => Promise<import("@remix-run/server-runtime").TypedResponse<{
                post: {
                    slug: any;
                    title: any;
                    excerpt: any;
                    content: string | Promise<string>;
                    author: any;
                    publishDate: any;
                    category: any;
                    readingTime: string;
                    published: any;
                    featured: any;
                };
            }>>;
            meta: ({ data }: {
                data: any;
            }) => ({
                title: string;
                name?: undefined;
                content?: undefined;
                property?: undefined;
            } | {
                name: string;
                content: any;
                title?: undefined;
                property?: undefined;
            } | {
                property: string;
                content: any;
                title?: undefined;
                name?: undefined;
            })[];
        }>;
    };
    "routes/test-chart": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof TestChartRoute;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/thank-you": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof ThankYouPage;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/features": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: () => React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
            loader: () => Promise<import("@remix-run/server-runtime").TypedResponse<{}>>;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/billing": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof BillingRoute;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/pricing": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof PricingPage;
            loader: typeof loader$2;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/welcome": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof Welcome;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/_index": {
        id: string;
        parentId: string;
        path: undefined;
        index: boolean;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof Index;
            loader: () => Promise<import("@remix-run/server-runtime").TypedResponse<{
                featuredPost: {
                    slug: string;
                    title: any;
                    excerpt: any;
                    author: any;
                    publishDate: any;
                    category: any;
                    readingTime: string;
                    published: any;
                    featured: any;
                } | null;
            }>>;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/signin": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof SignIn;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/signup": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof SignUp;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/chart": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof ChartRoute;
            loader: typeof loader;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
    "routes/terms": {
        id: string;
        parentId: string;
        path: string;
        index: undefined;
        caseSensitive: undefined;
        module: Readonly<{
            __proto__: null;
            default: typeof Terms;
            meta: () => ({
                title: string;
                name?: undefined;
                content?: undefined;
            } | {
                name: string;
                content: string;
                title?: undefined;
            })[];
        }>;
    };
};
declare const entryServer: Readonly<{
    __proto__: null;
    default: typeof handleRequest;
}>;
declare function Layout({ children }: {
    children: any;
}): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function App(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function PaymentMethodPage(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function loader$8({ request }: {
    request: any;
}): Promise<import("@remix-run/server-runtime").TypedResponse<{
    selectedPlan: string;
    priceId: any;
}>>;
declare function ManualIndex(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function ManualEntryPage(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function VerifyEmail(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function BlogIndex(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function BlogPostPage(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function TestChartRoute(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function ThankYouPage(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
import React from "react";
declare function BillingRoute(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function PricingPage(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function loader$2(): Promise<import("@remix-run/server-runtime").TypedResponse<{
    plans: ({
        name: string;
        price: string;
        period: string;
        features: string[];
        buttonText: string;
        popular?: undefined;
    } | {
        name: string;
        price: string;
        period: string;
        features: string[];
        buttonText: string;
        popular: boolean;
    })[];
}>>;
declare function Welcome(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function Index(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function SignIn(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function SignUp(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function ChartRoute(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function loader({ request }: {
    request: any;
}): Promise<import("@remix-run/server-runtime").TypedResponse<{
    ready: boolean;
}>>;
declare function Terms(): React.ReactElement<unknown, string | React.JSXElementConstructor<any>>;
declare function handleRequest(request: any, responseStatusCode: any, responseHeaders: any, remixContext: any, loadContext: any): Promise<any>;
export { serverManifest as assets };
//# sourceMappingURL=index.d.ts.map
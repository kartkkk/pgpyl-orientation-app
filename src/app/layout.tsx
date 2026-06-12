import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ServiceWorkerReset } from "@/components/service-worker-reset";
import { Providers } from "./providers";
// import { PWAGate } from "@/components/pwa-gate";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-sans",
});

export const metadata: Metadata = {
    title: "PGP YL O-Week",
    description: "Schedule, attendance, resources & more for PGP YL O-Week Co'28",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "PGP YL O-Week",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#003366",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={inter.variable}>
            <head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="mobile-web-app-capable" content="yes" />
            </head>
            <body className="min-h-dvh bg-background text-foreground antialiased" style={{ background: '#003366' }}>
                <ServiceWorkerReset />
                <Providers>
                    {/* <PWAGate>{children}</PWAGate> */}
                    {children}
                </Providers>
            </body>
        </html>
    );
}

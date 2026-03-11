import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "EventVista | B2B Event Scénography",
  description: "Professional 360° event design and presentation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable}`}>
      <body className="antialiased font-sans text-zinc-900 overflow-x-hidden" suppressHydrationWarning>
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="a9aee61c-ea98-4012-b67a-ab9af1e9dc3b"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "EventVista", "version": "1.0.0"}'
        />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),_transparent_50%),_radial-gradient(circle_at_bottom_left,_var(--tw-gradient-to),_transparent_50%)] from-coral-50/50 to-peach-50/50 dark:from-zinc-900/50 dark:to-zinc-800/50 opacity-60" />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <Navbar />
              <main className="pt-28 min-h-screen">
                {children}
              </main>
            </AuthProvider>
            <Toaster position="top-center" richColors />
          </ThemeProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}

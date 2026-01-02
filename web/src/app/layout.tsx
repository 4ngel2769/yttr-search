import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YTTR Search - YouTube Transcript Search Tool",
  description:
    "Search YouTube video transcripts for keywords across channels, playlists, single videos, or batch URLs. Find specific moments in videos instantly.",
  keywords: [
    "youtube",
    "transcript",
    "search",
    "video",
    "keywords",
    "captions",
    "subtitles",
  ],
  authors: [{ name: "angeldev0" }],
  openGraph: {
    title: "YTTR Search - YouTube Transcript Search Tool",
    description: "Search YouTube video transcripts for keywords instantly.",
    type: "website",
    url: "https://yttr-search.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

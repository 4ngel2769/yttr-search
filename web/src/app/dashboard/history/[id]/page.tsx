"use client";

import { use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { formatTimestamp } from "@/lib/utils";
import { 
  Search, 
  Loader2, 
  Clock,
  ExternalLink,
  Copy,
  ArrowLeft,
  Download,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

type SearchResult = {
  id: string;
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  timestamp: number;
  text: string;
  matchedKeywords: string[];
  videoUrl: string;
};

type SearchDetail = {
  search: {
    id: string;
    keywords: string[];
    sourceType: string;
    sourceValue: string;
    status: string;
    videosProcessed: number;
    matchCount: number;
    createdAt: string;
    completedAt: string | null;
  };
  results: SearchResult[];
};

export default function SearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<SearchDetail>({
    queryKey: ["searchDetail", id],
    queryFn: async () => {
      const res = await fetch(`/api/search/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Search not found");
        throw new Error("Failed to fetch search details");
      }
      return res.json();
    },
    enabled: sessionStatus === "authenticated",
  });

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  }

  function exportResults() {
    if (!data) return;
    
    const csvContent = [
      ["Video Title", "Channel", "Timestamp", "Text", "Keywords", "URL"].join(","),
      ...data.results.map((r) =>
        [
          `"${r.videoTitle.replace(/"/g, '""')}"`,
          `"${r.channelTitle.replace(/"/g, '""')}"`,
          formatTimestamp(r.timestamp),
          `"${r.text.replace(/"/g, '""')}"`,
          `"${r.matchedKeywords.join(", ")}"`,
          r.videoUrl,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yttr-search-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported!",
      description: "Results downloaded as CSV.",
    });
  }

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    router.push("/auth/login?callbackUrl=/dashboard/history");
    return null;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <div className="container py-8">
            <Card className="text-center py-12">
              <CardContent>
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Search Not Found</h2>
                <p className="text-muted-foreground mb-4">
                  This search may have been deleted or doesn&apos;t exist.
                </p>
                <Button asChild>
                  <Link href="/dashboard/history">Back to History</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          {/* Back Link */}
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/dashboard/history">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Link>
          </Button>

          {/* Search Info */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Search Results
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Keywords: {data.search.keywords.join(", ")}
                  </CardDescription>
                </div>
                <Button onClick={exportResults} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Source Type</p>
                  <p className="font-medium capitalize">{data.search.sourceType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Videos Processed</p>
                  <p className="font-medium">{data.search.videosProcessed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Matches</p>
                  <p className="font-medium">{data.search.matchCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(data.search.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Results ({data.results.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {data.results.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No matches were found for this search.
                  </p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {data.results.map((result) => (
                    <AccordionItem key={result.id} value={result.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-start gap-4 text-left w-full pr-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium line-clamp-1">{result.videoTitle}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(result.timestamp)}</span>
                              <span>•</span>
                              <span className="truncate">{result.channelTitle}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {result.matchedKeywords.slice(0, 2).map((keyword) => (
                              <Badge key={keyword} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {result.matchedKeywords.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.matchedKeywords.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <p className="text-sm bg-muted p-3 rounded-md">
                            &quot;...{result.text}...&quot;
                          </p>
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="default">
                              <a
                                href={result.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Watch at Timestamp
                              </a>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(result.videoUrl)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Link
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

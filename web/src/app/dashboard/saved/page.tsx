"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatTimestamp } from "@/lib/utils";
import { 
  Bookmark, 
  Loader2, 
  Clock,
  Trash2,
  ExternalLink,
  Copy,
  Search
} from "lucide-react";
import Link from "next/link";

type SavedItem = {
  id: string;
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  timestamp: number;
  text: string;
  keywords: string[];
  createdAt: string;
};

type SavedItemsResponse = {
  items: SavedItem[];
  total: number;
};

export default function SavedItemsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SavedItemsResponse>({
    queryKey: ["savedItems"],
    queryFn: async () => {
      const res = await fetch("/api/saved");
      if (!res.ok) throw new Error("Failed to fetch saved items");
      return res.json();
    },
    enabled: sessionStatus === "authenticated",
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`/api/saved/${itemId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedItems"] });
      toast({
        title: "Item removed",
        description: "The item has been removed from your saved items.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove item.",
      });
    },
  });

  function copyToClipboard(videoId: string, timestamp: number) {
    const url = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(timestamp)}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  }

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    router.push("/auth/login?callbackUrl=/dashboard/saved");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
              <span>/</span>
              <span>Saved Items</span>
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bookmark className="h-8 w-8" />
              Saved Items
            </h1>
            <p className="text-muted-foreground mt-2">
              Your bookmarked search results
            </p>
          </div>

          {/* Saved Items */}
          <Card>
            <CardHeader>
              <CardTitle>Bookmarks ({data?.total || 0})</CardTitle>
              <CardDescription>
                Quickly access your saved search results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : data?.items && data.items.length > 0 ? (
                <div className="space-y-4">
                  {data.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">{item.videoTitle}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(item.timestamp)}
                          </span>
                          <span>•</span>
                          <span className="truncate">{item.channelTitle}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 bg-muted p-2 rounded">
                          &quot;...{item.text}...&quot;
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.keywords.map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button asChild size="sm" variant="default">
                          <a
                            href={`https://www.youtube.com/watch?v=${item.videoId}&t=${Math.floor(item.timestamp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(item.videoId, item.timestamp)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No saved items yet
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Bookmark results from your searches to quickly access them later.
                  </p>
                  <Button asChild>
                    <Link href="/search">
                      <Search className="h-4 w-4 mr-2" />
                      Start Searching
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

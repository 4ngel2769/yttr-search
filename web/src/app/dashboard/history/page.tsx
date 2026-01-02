"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatTimestamp } from "@/lib/utils";
import { 
  Search, 
  Loader2, 
  Clock,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar
} from "lucide-react";
import Link from "next/link";

type SearchHistoryItem = {
  id: string;
  keywords: string[];
  sourceType: string;
  sourceValue: string;
  matchCount: number;
  videosProcessed: number;
  status: string;
  createdAt: string;
};

type HistoryResponse = {
  searches: SearchHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
};

export default function HistoryPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: history, isLoading } = useQuery<HistoryResponse>({
    queryKey: ["searchHistory", page, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      if (searchQuery) params.append("q", searchQuery);
      
      const res = await fetch(`/api/dashboard/history?${params}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: sessionStatus === "authenticated",
  });

  const deleteMutation = useMutation({
    mutationFn: async (searchId: string) => {
      const res = await fetch(`/api/search/${searchId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete search");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchHistory"] });
      toast({
        title: "Search deleted",
        description: "The search and its results have been removed.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete search.",
      });
    },
  });

  if (sessionStatus === "loading") {
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
              <span>History</span>
            </div>
            <h1 className="text-3xl font-bold">Search History</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your past searches
            </p>
          </div>

          {/* Search/Filter */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by keywords..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History List */}
          <Card>
            <CardHeader>
              <CardTitle>All Searches</CardTitle>
              <CardDescription>
                {history?.total || 0} total searches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : history?.searches && history.searches.length > 0 ? (
                <div className="space-y-4">
                  {history.searches.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium truncate">
                            {search.keywords.join(", ")}
                          </p>
                          <Badge
                            variant={search.status === "COMPLETED" ? "default" : 
                                    search.status === "FAILED" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {search.status.toLowerCase()}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {search.sourceType}
                            </Badge>
                          </span>
                          <span className="truncate max-w-xs" title={search.sourceValue}>
                            {search.sourceValue}
                          </span>
                          <span className="flex items-center gap-1">
                            <Search className="h-3 w-3" />
                            {search.matchCount} matches
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(search.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/history/${search.id}`}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(search.id)}
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

                  {/* Pagination */}
                  {history.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page} of {history.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(history.totalPages, p + 1))}
                        disabled={page === history.totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "No searches match your query" : "No search history yet"}
                  </p>
                  <Button asChild>
                    <Link href="/search">Start Searching</Link>
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

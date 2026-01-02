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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type VideoInfo = {
  videoId: string;
  videoTitle: string;
  thumbnailUrl: string;
};

type SearchHistoryItem = {
  id: string;
  keywords: string[];
  sourceType: string;
  sourceValue: string;
  matchCount: number;
  videosProcessed: number;
  status: string;
  createdAt: string;
  videos?: VideoInfo[];
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
  const [sourceType, setSourceType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: history, isLoading } = useQuery<HistoryResponse>({
    queryKey: ["searchHistory", page, searchQuery, sourceType, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sortBy,
        sortOrder,
      });
      if (searchQuery) params.append("q", searchQuery);
      if (sourceType && sourceType !== "all") params.append("sourceType", sourceType);
      
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
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by keywords or target..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={sourceType}
                      onValueChange={(value) => {
                        setSourceType(value);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="VIDEO">Video</SelectItem>
                        <SelectItem value="CHANNEL">Channel</SelectItem>
                        <SelectItem value="PLAYLIST">Playlist</SelectItem>
                        <SelectItem value="BATCH">Batch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={sortBy}
                      onValueChange={(value) => {
                        setSortBy(value);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Date</SelectItem>
                        <SelectItem value="matchCount">Matches</SelectItem>
                        <SelectItem value="videosProcessed">Videos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    title={sortOrder === "asc" ? "Ascending" : "Descending"}
                  >
                    {sortOrder === "asc" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
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
                      className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      {/* Video Thumbnails */}
                      <div className="flex -space-x-2 shrink-0">
                        {search.videos && search.videos.slice(0, 3).map((video, idx) => (
                          <div 
                            key={video.videoId} 
                            className="relative w-16 h-12 rounded border-2 border-background overflow-hidden shadow-sm"
                            style={{ zIndex: 3 - idx }}
                            title={video.videoTitle}
                          >
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.videoTitle}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {search.videos && search.videos.length > 3 && (
                          <div 
                            className="relative w-16 h-12 rounded border-2 border-background overflow-hidden bg-muted flex items-center justify-center text-xs font-medium"
                            style={{ zIndex: 0 }}
                          >
                            +{search.videos.length - 3}
                          </div>
                        )}
                        {(!search.videos || search.videos.length === 0) && (
                          <div className="w-16 h-12 rounded bg-muted flex items-center justify-center">
                            <Search className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">
                            {search.keywords.join(", ")}
                          </p>
                          <Badge
                            variant={search.status === "COMPLETED" ? "default" : 
                                    search.status === "FAILED" ? "destructive" : "secondary"}
                            className="text-xs shrink-0"
                          >
                            {search.status.toLowerCase()}
                          </Badge>
                        </div>
                        {search.videos && search.videos.length > 0 && (
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {search.videos[0].videoTitle}
                            {search.videos.length > 1 && ` and ${search.videos.length - 1} more`}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs capitalize">
                            {search.sourceType.toLowerCase()}
                          </Badge>
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
                      <div className="flex items-center gap-2 ml-4 shrink-0">
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

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { searchSchema, type SearchInput } from "@/lib/validations";
import { formatTimestamp, cn } from "@/lib/utils";
import { 
  Search, 
  Loader2, 
  Youtube, 
  ListVideo, 
  Link as LinkIcon, 
  List,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Copy,
  Bookmark,
  Trash2,
  History
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

type SearchResponse = {
  success: boolean;
  searchId: string;
  results: SearchResult[];
  totalVideosProcessed: number;
  totalMatches: number;
  remaining: number;
};

type SearchInfo = {
  remaining: number;
  tier: string;
  recentSearches: {
    id: string;
    keywords: string[];
    sourceType: string;
    sourceValue: string;
    matchCount: number;
    status: string;
    createdAt: string;
  }[];
};

export default function SearchPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchProgress, setSearchProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [lastSearchStats, setLastSearchStats] = useState<{
    totalVideos: number;
    totalMatches: number;
    searchId: string;
  } | null>(null);

  const form = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      mode: "channel",
      target: "",
      keywords: "",
      maxVideos: "50",
      sort: "newest",
      contextWindow: 1,
    },
  });

  const mode = form.watch("mode");

  // Fetch search info (remaining searches, recent history)
  const { data: searchInfo, isLoading: isLoadingInfo } = useQuery<SearchInfo>({
    queryKey: ["searchInfo"],
    queryFn: async () => {
      const res = await fetch("/api/search");
      if (!res.ok) throw new Error("Failed to fetch search info");
      return res.json();
    },
    enabled: sessionStatus === "authenticated",
    refetchInterval: 60000, // Refresh every minute
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (data: SearchInput) => {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Search failed");
      }
      
      return res.json() as Promise<SearchResponse>;
    },
    onSuccess: (data) => {
      setSearchResults(data.results);
      setLastSearchStats({
        totalVideos: data.totalVideosProcessed,
        totalMatches: data.totalMatches,
        searchId: data.searchId,
      });
      queryClient.invalidateQueries({ queryKey: ["searchInfo"] });
      toast({
        title: "Search complete!",
        description: `Found ${data.totalMatches} matches across ${data.totalVideosProcessed} videos.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Search failed",
        description: error.message,
      });
    },
    onSettled: () => {
      setIsSearching(false);
      setSearchProgress(100);
    },
  });

  async function onSubmit(data: SearchInput) {
    setIsSearching(true);
    setSearchProgress(10);
    setSearchResults([]);
    setLastSearchStats(null);

    // Simulate progress (actual progress would come from websocket/SSE in production)
    const progressInterval = setInterval(() => {
      setSearchProgress((prev) => Math.min(prev + 5, 90));
    }, 500);

    try {
      await searchMutation.mutateAsync(data);
    } finally {
      clearInterval(progressInterval);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  }

  // Redirect to login if not authenticated
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    router.push("/auth/login?callbackUrl=/search");
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Search Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search Transcripts
                  </CardTitle>
                  <CardDescription>
                    Search for keywords across YouTube video transcripts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Source Type Selection */}
                    <div className="space-y-3">
                      <Label>Source Type</Label>
                      <RadioGroup
                        value={mode}
                        onValueChange={(value) => form.setValue("mode", value as any)}
                        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
                      >
                        <Label
                          htmlFor="channel"
                          className={cn(
                            "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground",
                            mode === "channel" && "border-primary"
                          )}
                        >
                          <RadioGroupItem value="channel" id="channel" className="sr-only" />
                          <Youtube className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">Channel</span>
                        </Label>
                        <Label
                          htmlFor="playlist"
                          className={cn(
                            "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground",
                            mode === "playlist" && "border-primary"
                          )}
                        >
                          <RadioGroupItem value="playlist" id="playlist" className="sr-only" />
                          <ListVideo className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">Playlist</span>
                        </Label>
                        <Label
                          htmlFor="video"
                          className={cn(
                            "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground",
                            mode === "video" && "border-primary"
                          )}
                        >
                          <RadioGroupItem value="video" id="video" className="sr-only" />
                          <LinkIcon className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">Video</span>
                        </Label>
                        <Label
                          htmlFor="batch"
                          className={cn(
                            "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground",
                            mode === "batch" && "border-primary"
                          )}
                        >
                          <RadioGroupItem value="batch" id="batch" className="sr-only" />
                          <List className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">Batch URLs</span>
                        </Label>
                      </RadioGroup>
                    </div>

                    {/* Source Value Input */}
                    <div className="space-y-2">
                      <Label htmlFor="target">
                        {mode === "channel" && "Channel URL or @handle"}
                        {mode === "playlist" && "Playlist URL"}
                        {mode === "video" && "Video URL"}
                        {mode === "batch" && "Video URLs (one per line)"}
                      </Label>
                      {mode === "batch" ? (
                        <Textarea
                          id="target"
                          placeholder="https://www.youtube.com/watch?v=VIDEO_ID&#10;https://youtu.be/VIDEO_ID&#10;..."
                          rows={4}
                          disabled={isSearching}
                          {...form.register("target")}
                        />
                      ) : (
                        <Input
                          id="target"
                          placeholder={
                            mode === "channel"
                              ? "https://youtube.com/@ChannelHandle or @ChannelHandle"
                              : mode === "playlist"
                              ? "https://youtube.com/playlist?list=PLxxx..."
                              : "https://youtube.com/watch?v=VIDEO_ID"
                          }
                          disabled={isSearching}
                          {...form.register("target")}
                        />
                      )}
                      {form.formState.errors.target && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.target.message}
                        </p>
                      )}
                    </div>

                    {/* Keywords Input */}
                    <div className="space-y-2">
                      <Label htmlFor="keywords">Keywords</Label>
                      <Textarea
                        id="keywords"
                        placeholder="Enter keywords separated by commas or newlines&#10;e.g., javascript, react, typescript"
                        rows={3}
                        disabled={isSearching}
                        {...form.register("keywords")}
                      />
                      {form.formState.errors.keywords && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.keywords.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Separate multiple keywords with commas or new lines
                      </p>
                    </div>

                    {/* Max Videos Slider (for channel/playlist) */}
                    {(mode === "channel" || mode === "playlist") && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Max Videos to Search</Label>
                          <span className="text-sm text-muted-foreground">
                            {form.watch("maxVideos") || "50"} videos
                          </span>
                        </div>
                        <Slider
                          value={[parseInt(form.watch("maxVideos") || "50")]}
                          onValueChange={([value]) => form.setValue("maxVideos", value.toString())}
                          min={1}
                          max={500}
                          step={10}
                          disabled={isSearching}
                        />
                        <p className="text-xs text-muted-foreground">
                          Higher limits may take longer to process
                        </p>
                      </div>
                    )}

                    {/* Progress Bar */}
                    {isSearching && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Searching transcripts...</span>
                          <span>{searchProgress}%</span>
                        </div>
                        <Progress value={searchProgress} />
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button type="submit" className="w-full" disabled={isSearching}>
                      {isSearching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          Search Transcripts
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Search Results */}
              {(searchResults.length > 0 || lastSearchStats) && (
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          Search Results
                        </CardTitle>
                        {lastSearchStats && (
                          <CardDescription>
                            Found {lastSearchStats.totalMatches} matches across {lastSearchStats.totalVideos} videos
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {searchResults.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No matches found for your keywords.
                        </p>
                      </div>
                    ) : (
                      <Accordion type="single" collapsible className="w-full">
                        {searchResults.map((result, index) => (
                          <AccordionItem key={result.id} value={result.id}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-start gap-4 text-left">
                                <div className="flex-1">
                                  <p className="font-medium line-clamp-1">{result.videoTitle}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatTimestamp(result.timestamp)}</span>
                                    <span>•</span>
                                    <span>{result.channelTitle}</span>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {result.matchedKeywords.slice(0, 3).map((keyword) => (
                                    <Badge key={keyword} variant="secondary" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                  {result.matchedKeywords.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{result.matchedKeywords.length - 3}
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
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Usage Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoadingInfo ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : searchInfo ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Searches Remaining</span>
                        <Badge variant={searchInfo.remaining > 5 ? "default" : "destructive"}>
                          {searchInfo.remaining} today
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Plan</span>
                        <Badge variant="outline" className="capitalize">
                          {searchInfo.tier}
                        </Badge>
                      </div>
                      {searchInfo.tier === "FREE" && (
                        <Button asChild size="sm" className="w-full">
                          <Link href="/#pricing">Upgrade Plan</Link>
                        </Button>
                      )}
                    </>
                  ) : null}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Search Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>• Use specific keywords for better results</p>
                  <p>• Separate multiple keywords with commas</p>
                  <p>• Channel handles work with or without @</p>
                  <p>• Batch search supports up to 50 URLs</p>
                  <p>• Results link directly to the timestamp</p>
                </CardContent>
              </Card>

              {/* Recent Searches */}
              {searchInfo?.recentSearches && searchInfo.recentSearches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Recent Searches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {searchInfo.recentSearches.slice(0, 5).map((search) => (
                        <div
                          key={search.id}
                          className="flex items-start justify-between gap-2 text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {search.keywords.slice(0, 3).join(", ")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {search.matchCount} matches • {search.sourceType}
                            </p>
                          </div>
                          <Badge
                            variant={search.status === "COMPLETED" ? "default" : "secondary"}
                            className="text-xs shrink-0"
                          >
                            {search.status.toLowerCase()}
                          </Badge>
                        </div>
                      ))}
                      <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                        <Link href="/dashboard/history">View All History</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

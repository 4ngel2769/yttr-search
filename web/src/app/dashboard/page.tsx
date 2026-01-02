"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Clock, 
  TrendingUp, 
  CreditCard, 
  Settings, 
  Loader2,
  History,
  Bookmark,
  BarChart3,
  ArrowUpRight,
  Zap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type DashboardStats = {
  totalSearches: number;
  searchesToday: number;
  remainingSearches: number;
  dailyLimit: number;
  tier: string;
  savedItems: number;
  recentSearches: {
    id: string;
    keywords: string[];
    sourceType: string;
    sourceValue: string;
    matchCount: number;
    createdAt: string;
    videos: {
      videoId: string;
      videoTitle: string;
      thumbnailUrl: string;
    }[];
  }[];
};

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    enabled: sessionStatus === "authenticated",
  });

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    router.push("/auth/login?callbackUrl=/dashboard");
    return null;
  }

  const usagePercentage = stats 
    ? ((stats.dailyLimit - stats.remainingSearches) / stats.dailyLimit) * 100
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {session?.user?.name?.split(" ")[0] || "User"}!
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s an overview of your YTTR Search activity
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.totalSearches || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Searches Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.searchesToday || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.remainingSearches || 0} remaining
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Saved Items</CardTitle>
                <Bookmark className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stats?.savedItems || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Bookmarked results</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold capitalize">{stats?.tier?.toLowerCase() || "Free"}</span>
                    {stats?.tier === "FREE" && (
                      <Badge variant="secondary">
                        <Zap className="h-3 w-3 mr-1" />
                        Upgrade
                      </Badge>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.dailyLimit || 10} searches/day
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Daily Usage */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Daily Usage</CardTitle>
                <CardDescription>
                  Your search usage for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {stats?.dailyLimit! - stats?.remainingSearches!} of {stats?.dailyLimit} searches used
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(usagePercentage)}%
                      </span>
                    </div>
                    <Progress value={usagePercentage} className="h-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {stats?.remainingSearches} searches remaining today
                      </span>
                      {stats?.tier === "FREE" && (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/#pricing">
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                            Upgrade for more
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/search">
                    <Search className="h-4 w-4 mr-2" />
                    New Search
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/history">
                    <History className="h-4 w-4 mr-2" />
                    Search History
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/saved">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Saved Items
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Searches */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Searches</CardTitle>
                  <CardDescription>Your latest search queries</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/history">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : stats?.recentSearches && stats.recentSearches.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentSearches.map((search) => (
                      <div
                        key={search.id}
                        className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        {/* Video Thumbnails */}
                        <div className="flex -space-x-2 shrink-0">
                          {search.videos && search.videos.slice(0, 3).map((video, idx) => (
                            <div 
                              key={video.videoId} 
                              className="relative w-12 h-9 rounded border-2 border-background overflow-hidden"
                              style={{ zIndex: 3 - idx }}
                            >
                              <Image
                                src={video.thumbnailUrl}
                                alt={video.videoTitle}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                          {(!search.videos || search.videos.length === 0) && (
                            <div className="w-12 h-9 rounded bg-muted flex items-center justify-center">
                              <Search className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {search.keywords.slice(0, 3).join(", ")}
                            {search.keywords.length > 3 && ` +${search.keywords.length - 3}`}
                          </p>
                          {search.videos && search.videos.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate mb-1">
                              {search.videos[0].videoTitle}
                              {search.videos.length > 1 && ` +${search.videos.length - 1} more`}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs capitalize">
                              {search.sourceType.toLowerCase()}
                            </Badge>
                            <span>{search.matchCount} matches</span>
                            <span>•</span>
                            <span>
                              {new Date(search.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/dashboard/history/${search.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No searches yet</p>
                    <Button asChild>
                      <Link href="/search">Start Your First Search</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Plan Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Daily Searches</span>
                      <span className="font-medium">{stats?.dailyLimit || 10}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Max Videos/Search</span>
                      <span className="font-medium">
                        {stats?.tier === "FREE" ? "50" : 
                         stats?.tier === "STARTER" ? "200" :
                         stats?.tier === "PRO" ? "500" : "Unlimited"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>History Retention</span>
                      <span className="font-medium">
                        {stats?.tier === "FREE" ? "7 days" : 
                         stats?.tier === "STARTER" ? "30 days" :
                         "Unlimited"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Export Results</span>
                      <span className="font-medium">
                        {stats?.tier === "FREE" ? "❌" : "✅"}
                      </span>
                    </div>
                    {stats?.tier === "FREE" && (
                      <Button asChild className="w-full mt-4">
                        <Link href="/#pricing">
                          Upgrade Your Plan
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

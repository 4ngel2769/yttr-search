import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Zap,
  Clock,
  FileText,
  Play,
  ChevronRight,
  Check,
  Youtube,
  Star,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/30">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container relative px-4 py-24 md:py-32 lg:py-40">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                <Star className="mr-1 h-3 w-3" />
                Open Source
              </Badge>
              <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
                Search YouTube Transcripts
                <span className="text-primary"> Instantly</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                Find specific moments in any YouTube video. Search across entire
                channels, playlists, or batch URLs for keywords and phrases.
                Get timestamped jump-links to exact moments.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/search">
                    <Search className="h-5 w-5" />
                    Start Searching
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/auth/register">
                    Create Free Account
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-b py-20">
          <div className="container px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold">Powerful Features</h2>
              <p className="text-muted-foreground">
                Everything you need to search YouTube transcripts efficiently
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Youtube className="h-6 w-6" />}
                title="Channel Search"
                description="Scan entire YouTube channels for keywords. Search by URL, handle, or channel ID."
              />
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Batch Processing"
                description="Upload a file with multiple video URLs and search them all at once."
              />
              <FeatureCard
                icon={<Clock className="h-6 w-6" />}
                title="Timestamped Links"
                description="Get direct jump-links to the exact moments where keywords appear."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="Advanced Filters"
                description="Filter by video duration, sort order, and limit results for precise searches."
              />
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="border-b bg-muted/30 py-20">
          <div className="container px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold">See It In Action</h2>
              <p className="text-muted-foreground">
                Search results are highlighted with context
              </p>
            </div>
            <div className="mx-auto max-w-3xl">
              <div className="rounded-lg border bg-card p-6 shadow-lg">
                <div className="mb-4 text-lg font-semibold text-blue-500">
                  How to Build a REST API in Node.js
                </div>
                <div className="space-y-4">
                  <ResultPreview
                    timestamp="02:34"
                    link="https://youtube.com/watch?v=xyz&t=154s"
                    text="...and that's how you create an <mark>API</mark> endpoint using Express..."
                  />
                  <ResultPreview
                    timestamp="05:12"
                    link="https://youtube.com/watch?v=xyz&t=312s"
                    text="...for authentication, we'll use <mark>API</mark> keys stored in environment variables..."
                  />
                  <ResultPreview
                    timestamp="08:45"
                    link="https://youtube.com/watch?v=xyz&t=525s"
                    text="...testing your <mark>API</mark> with Postman is straightforward..."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20" id="pricing">
          <div className="container px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold">Simple Pricing</h2>
              <p className="text-muted-foreground">
                Start free, upgrade when you need more
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <PricingCard
                name="Free"
                price={0}
                features={[
                  "30 searches per day",
                  "50 videos per channel",
                  "50 URLs per batch",
                  "Basic support",
                ]}
              />
              <PricingCard
                name="Starter"
                price={9.99}
                features={[
                  "120 searches per day",
                  "100 videos per channel",
                  "100 URLs per batch",
                  "Priority support",
                  "Search history",
                ]}
              />
              <PricingCard
                name="Pro"
                price={24.99}
                popular
                features={[
                  "340 searches per day",
                  "250 videos per channel",
                  "500 URLs per batch",
                  "Priority support",
                  "Advanced analytics",
                  "API access",
                ]}
              />
              <PricingCard
                name="Enterprise"
                price={49.99}
                features={[
                  "500 searches per day",
                  "500 videos per channel",
                  "1000 URLs per batch",
                  "Dedicated support",
                  "Full API access",
                  "Custom integrations",
                ]}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-primary py-16 text-primary-foreground">
          <div className="container px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to Find What You're Looking For?
            </h2>
            <p className="mb-8 text-primary-foreground/80">
              Start searching YouTube transcripts for free today.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/search">
                <Play className="mr-2 h-5 w-5" />
                Get Started
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ResultPreview({
  timestamp,
  link,
  text,
}: {
  timestamp: string;
  link: string;
  text: string;
}) {
  return (
    <div className="rounded border bg-muted/50 p-3">
      <a
        href={link}
        className="mb-1 block text-sm text-blue-500 hover:underline"
      >
        {link}
      </a>
      <span className="mr-2 inline-block rounded bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-700 dark:text-yellow-400">
        {timestamp}
      </span>
      <span
        className="text-sm"
        dangerouslySetInnerHTML={{
          __html: text.replace(
            /<mark>/g,
            '<mark class="bg-cyan-500 text-black px-1 rounded">'
          ),
        }}
      />
    </div>
  );
}

function PricingCard({
  name,
  price,
  features,
  popular,
}: {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg border bg-card p-6 ${
        popular ? "border-primary shadow-lg" : ""
      }`}
    >
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold">
            ${price === 0 ? "0" : price}
          </span>
          {price > 0 && (
            <span className="text-muted-foreground">/month</span>
          )}
        </div>
      </div>
      <ul className="mb-6 space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>
      <Button asChild className="w-full" variant={popular ? "default" : "outline"}>
        <Link href={price === 0 ? "/search" : "/auth/register"}>
          {price === 0 ? "Start Free" : "Get Started"}
        </Link>
      </Button>
    </div>
  );
}

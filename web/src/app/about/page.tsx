import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Youtube, Zap, Shield, Users, Code } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-12 md:py-20">
          {/* Hero Section */}
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              About YTTR Search
            </h1>
            <p className="text-xl text-muted-foreground">
              The most powerful tool for searching YouTube video transcripts. 
              Find exactly what you're looking for across millions of videos.
            </p>
          </div>

          {/* Mission */}
          <div className="mx-auto max-w-4xl mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-4">
                <p>
                  YTTR Search was built to solve a simple problem: finding specific information 
                  within YouTube videos is incredibly difficult. With millions of hours of content 
                  uploaded every day, valuable information is often buried deep within long videos.
                </p>
                <p>
                  Our platform indexes video transcripts and provides lightning-fast search capabilities, 
                  allowing you to find the exact moment when a topic is mentioned. Whether you're a 
                  researcher, student, content creator, or just someone looking for specific information, 
                  YTTR Search saves you hours of manual searching.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="mx-auto max-w-6xl mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">What Makes Us Different</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <Search className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Powerful Search</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Search across entire channels, playlists, or individual videos with 
                  advanced filtering and context windows.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Youtube className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Direct Links</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Every result includes a timestamped link that takes you directly 
                  to the moment in the video where your keywords appear.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Lightning Fast</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Our optimized search engine processes thousands of videos in seconds, 
                  delivering results almost instantly.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Privacy First</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  We don't track your searches or sell your data. Your privacy 
                  is our priority.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>User Friendly</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Clean, intuitive interface designed for both casual users and 
                  power users with advanced features.
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Code className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle>Open Development</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Built with modern technologies and best practices. We're constantly 
                  improving based on user feedback.
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Built With Modern Tech</CardTitle>
                <CardDescription>
                  YTTR Search is powered by cutting-edge technologies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Frontend</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Next.js 14 with App Router</li>
                      <li>• TypeScript for type safety</li>
                      <li>• Tailwind CSS for styling</li>
                      <li>• Radix UI components</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Backend</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• PostgreSQL database</li>
                      <li>• Prisma ORM</li>
                      <li>• NextAuth for authentication</li>
                      <li>• Redis for caching</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

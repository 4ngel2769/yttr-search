import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>1. Acceptance of Terms</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    By accessing or using YTTR Search, you agree to be bound by these Terms of Service 
                    and all applicable laws and regulations. If you do not agree with any of these terms, 
                    you are prohibited from using this service.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Use License and Restrictions</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    We grant you a limited, non-exclusive, non-transferable license to use YTTR Search 
                    for personal or commercial purposes, subject to these terms.
                  </p>
                  <p>You agree NOT to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Abuse or overload our systems with automated requests</li>
                    <li>Attempt to circumvent rate limits or access restrictions</li>
                    <li>Scrape or copy content for unauthorized purposes</li>
                    <li>Use the service for illegal activities</li>
                    <li>Reverse engineer or compromise our security</li>
                    <li>Impersonate others or provide false information</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. User Accounts</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    You are responsible for maintaining the confidentiality of your account credentials 
                    and for all activities that occur under your account. You must:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide accurate and complete information</li>
                    <li>Keep your password secure</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>Be at least 13 years old to create an account</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. YouTube Content and Compliance</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    YTTR Search provides search functionality for publicly available YouTube video transcripts. 
                    You acknowledge that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All YouTube content is subject to YouTube's Terms of Service</li>
                    <li>We do not host, own, or control YouTube content</li>
                    <li>You must respect YouTube's rate limits and policies</li>
                    <li>Content availability depends on YouTube's API and services</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Subscription and Payments</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    Paid subscriptions are billed in advance on a recurring basis. You agree that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Subscription fees are non-refundable except as required by law</li>
                    <li>You authorize automatic recurring charges</li>
                    <li>We may change pricing with 30 days' notice</li>
                    <li>You can cancel your subscription at any time</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Service Availability</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    We strive to maintain high availability but do not guarantee uninterrupted access. 
                    We reserve the right to:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Modify or discontinue features</li>
                    <li>Perform maintenance and updates</li>
                    <li>Limit usage based on your subscription tier</li>
                    <li>Suspend accounts for violations</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Intellectual Property</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    The YTTR Search platform, including its design, code, and features, is owned by us 
                    and protected by intellectual property laws. You may not copy, modify, or distribute 
                    our platform without permission.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Disclaimer of Warranties</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    YTTR Search is provided "as is" without warranties of any kind. We do not guarantee:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Accuracy or completeness of search results</li>
                    <li>Uninterrupted or error-free service</li>
                    <li>Freedom from viruses or harmful components</li>
                    <li>Specific outcomes from using our service</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. Limitation of Liability</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    To the maximum extent permitted by law, we shall not be liable for any indirect, 
                    incidental, special, consequential, or punitive damages, including loss of profits, 
                    data, or use, arising from your use of our service.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>10. Termination</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    We may terminate or suspend your account immediately, without notice, for violations 
                    of these terms. Upon termination, your right to use the service ceases immediately.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>11. Changes to Terms</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    We reserve the right to modify these terms at any time. Continued use of the service 
                    after changes constitutes acceptance of the new terms.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>12. Governing Law</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    These terms are governed by and construed in accordance with applicable laws. 
                    Any disputes shall be resolved in the appropriate courts.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>13. Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>
                    For questions about these terms, please contact us at:
                  </p>
                  <p className="mt-4">
                    Email: contact-yttr@angellabs.xyz
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container py-12 md:py-20">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>1. Information We Collect</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                  <h3 className="text-base font-semibold mt-4">Account Information</h3>
                  <p className="text-muted-foreground">
                    When you create an account, we collect your email address, name (optional), 
                    and password (securely hashed). If you sign up with OAuth providers (Google, GitHub), 
                    we collect basic profile information they provide.
                  </p>

                  <h3 className="text-base font-semibold mt-4">Usage Data</h3>
                  <p className="text-muted-foreground">
                    We collect information about your searches, including search queries, timestamps, 
                    and results. This helps us improve our service and provide you with search history.
                  </p>

                  <h3 className="text-base font-semibold mt-4">Technical Data</h3>
                  <p className="text-muted-foreground">
                    We automatically collect IP addresses, browser type, device information, 
                    and usage statistics to maintain and improve our service.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. How We Use Your Information</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>We use your information to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Provide and maintain our search services</li>
                    <li>Authenticate your account and prevent fraud</li>
                    <li>Send you important service updates and notifications</li>
                    <li>Improve and optimize our platform</li>
                    <li>Provide customer support</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Data Sharing and Disclosure</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    We do not sell your personal information. We may share your information only in 
                    the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Service Providers:</strong> With trusted third-party services that help us operate (e.g., payment processors, hosting providers)</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                    <li><strong>Business Transfers:</strong> In connection with a merger, sale, or acquisition</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Data Security</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    We implement industry-standard security measures to protect your data, including:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Encrypted data transmission (HTTPS)</li>
                    <li>Secure password hashing (bcrypt)</li>
                    <li>Regular security audits and updates</li>
                    <li>Access controls and authentication</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Your Rights and Choices</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>You have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and data</li>
                    <li>Export your data</li>
                    <li>Opt-out of marketing communications</li>
                  </ul>
                  <p className="mt-4">
                    To exercise these rights, please contact us or use the settings in your account dashboard.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Cookies and Tracking</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-4">
                  <p>
                    We use essential cookies for authentication and session management. We do not use 
                    third-party tracking cookies or advertising cookies.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Children's Privacy</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>
                    Our service is not intended for children under 13. We do not knowingly collect 
                    information from children under 13. If you believe we have collected such information, 
                    please contact us immediately.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Changes to This Policy</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>
                    We may update this privacy policy from time to time. We will notify you of any 
                    significant changes by email or through a notice on our platform.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. Contact Us</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>
                    If you have questions about this privacy policy or our data practices, please contact us at:
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

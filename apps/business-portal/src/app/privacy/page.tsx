import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — Local First Rewards™',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-green-700 text-white py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-brand-gold-400 flex items-center justify-center">
              <span className="text-brand-green-900 font-black text-base leading-none">LF</span>
            </div>
            <Link href="/" className="text-white font-bold hover:text-brand-gold-400 transition-colors">
              Local First Rewards™
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-brand-green-200 text-sm">Last updated: May 30, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        <section>
          <p className="text-gray-600 leading-relaxed">
            Local First Rewards™ (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This
            Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
            Business Portal and related services. Please read this policy carefully.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We collect information you provide directly to us and information generated through your use of the Platform:
          </p>
          <h3 className="font-semibold text-gray-800 mb-2">Information you provide:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed mb-4">
            <li>Business name, address, contact information, and category</li>
            <li>Account credentials (email address and password)</li>
            <li>Business owner identity and verification documents</li>
            <li>Payment and billing information (processed securely via Stripe)</li>
            <li>Communications and support requests submitted to us</li>
          </ul>
          <h3 className="font-semibold text-gray-800 mb-2">Information collected automatically:</h3>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li>Log data including IP address, browser type, pages visited, and timestamps</li>
            <li>Device information including operating system and unique device identifiers</li>
            <li>Usage data including features accessed and actions taken on the Platform</li>
            <li>Analytics data to understand how the Platform is used (via PostHog)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li>Create and manage your business account and provide our services</li>
            <li>Process payments and manage Greenwood Check™ verification subscriptions</li>
            <li>Administer loyalty points, rewards programs, and referral commissions</li>
            <li>Send administrative emails, service updates, and promotional communications</li>
            <li>Detect, prevent, and investigate fraudulent activity and abuse</li>
            <li>Analyze usage patterns to improve the Platform and develop new features</li>
            <li>Comply with legal obligations and enforce our Terms of Service</li>
            <li>Respond to your comments, questions, and customer support requests</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Information Sharing</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We do not sell, trade, or rent your personal information to third parties. We may share your information
            only in the following limited circumstances:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li><strong>Service providers:</strong> Third-party vendors who assist us in operating the Platform (Supabase, Stripe, Google Cloud, Firebase, Vercel), each bound by confidentiality obligations</li>
            <li><strong>Business listing information:</strong> Your business name, address, category, and description are publicly visible to consumers using the Local First Rewards™ mobile app</li>
            <li><strong>Legal requirements:</strong> When required by law, subpoena, or other legal process, or to protect the rights, property, or safety of Local First Rewards™, our users, or the public</li>
            <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of all or a portion of our assets, with advance notice to you</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We implement industry-standard security measures to protect your information:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li>All data is encrypted in transit using TLS/SSL</li>
            <li>Database access is governed by Row Level Security (RLS) policies</li>
            <li>Payment information is handled exclusively by Stripe and never stored on our servers</li>
            <li>Authentication is managed through Supabase Auth with industry-standard practices</li>
            <li>Access to sensitive admin functions is restricted by role-based access controls</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            While we strive to protect your information, no method of transmission over the internet or electronic
            storage is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Cookies</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We use cookies and similar tracking technologies to enhance your experience on the Platform:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li><strong>Essential cookies:</strong> Required for authentication and core Platform functionality</li>
            <li><strong>Analytics cookies:</strong> Help us understand how you use the Platform (PostHog)</li>
            <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            You can control cookie settings through your browser. Disabling essential cookies may affect Platform
            functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Depending on your location, you may have the following rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information, subject to legal obligations</li>
            <li><strong>Portability:</strong> Request a portable copy of your data in a machine-readable format</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
            <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            To exercise any of these rights, please contact us using the information below. We will respond to
            your request within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
            please contact us at:
          </p>
          <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 text-gray-700 text-sm space-y-1">
            <p className="font-semibold">Local First Rewards™ — Privacy Team</p>
            <p>Email: <a href="mailto:privacy@localfirstrewards.com" className="text-brand-green-700 hover:underline">privacy@localfirstrewards.com</a></p>
          </div>
        </section>

        <div className="pt-6 border-t border-gray-200 flex gap-6 text-sm">
          <Link href="/terms" className="text-brand-green-700 hover:underline">Terms of Service</Link>
          <Link href="/login" className="text-brand-green-700 hover:underline">Back to login</Link>
        </div>
      </main>
    </div>
  );
}

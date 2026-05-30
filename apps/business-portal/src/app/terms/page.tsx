import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — Local First Rewards™',
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="mt-2 text-brand-green-200 text-sm">Last updated: May 30, 2026</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Agreement to Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using the Local First Rewards™ Business Portal (&quot;Platform&quot;), you agree to be bound
            by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these
            terms, you are prohibited from using or accessing this Platform. These terms apply to all businesses,
            users, and other visitors who access or use the Platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Services</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Local First Rewards™ provides a community-focused loyalty and rewards platform designed to support
            local and Black-owned businesses. Our services include, but are not limited to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li>Business listing management and discovery features</li>
            <li>Customer loyalty points tracking and rewards administration</li>
            <li>Greenwood Check™ business verification services</li>
            <li>Receipt OCR processing and fraud detection</li>
            <li>Advertising and sponsored listing campaigns</li>
            <li>Referral program management and analytics</li>
            <li>Community engagement tools including events and job postings</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            We reserve the right to modify, suspend, or discontinue any aspect of our services at any time with
            reasonable notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. User Obligations</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            As a registered business on our Platform, you agree to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li>Provide accurate, current, and complete information about your business</li>
            <li>Maintain and promptly update your account information</li>
            <li>Keep your login credentials confidential and secure</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Comply with all applicable local, state, and federal laws and regulations</li>
            <li>Honor all rewards and loyalty commitments made to customers through the Platform</li>
            <li>Respond to customer disputes and inquiries in good faith and in a timely manner</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Prohibited Uses</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            You may not use the Platform for any unlawful purpose or in any way that could harm the Platform,
            its users, or third parties. Prohibited uses include:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li>Submitting false, fraudulent, or misleading information or receipts</li>
            <li>Manipulating the rewards system or points balances through fraudulent means</li>
            <li>Attempting to gain unauthorized access to any portion of the Platform</li>
            <li>Harvesting or collecting user data without express consent</li>
            <li>Transmitting any malicious code, viruses, or disruptive software</li>
            <li>Engaging in any conduct that restricts or inhibits any other user&apos;s use of the Platform</li>
            <li>Impersonating another business, person, or entity</li>
            <li>Using the Platform to facilitate any illegal transaction or activity</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            Violation of these prohibitions may result in immediate suspension or termination of your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            The Platform and its original content, features, and functionality are and will remain the exclusive
            property of Local First Rewards™ and its licensors. The Platform is protected by copyright, trademark,
            and other laws of the United States and foreign countries.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our trademarks and trade dress may not be used in connection with any product or service without the
            prior written consent of Local First Rewards™. You retain ownership of any content you submit to the
            Platform, but grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and display
            such content in connection with providing the services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            To the maximum extent permitted by applicable law, Local First Rewards™ and its affiliates, officers,
            employees, agents, partners, and licensors shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages, including without limitation loss of profits, data, use, goodwill,
            or other intangible losses, resulting from:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1 leading-relaxed">
            <li>Your use or inability to use the Platform</li>
            <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
            <li>Any interruption or cessation of transmission to or from the Platform</li>
            <li>Any bugs, viruses, or other harmful code transmitted through the Platform by any third party</li>
            <li>Any errors or omissions in any content or for any loss or damage incurred through the use of content</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            In no event shall our total liability to you for all damages exceed the amount paid by you, if any,
            for accessing the Platform during the twelve (12) months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Governing Law</h2>
          <p className="text-gray-600 leading-relaxed">
            These Terms shall be governed and construed in accordance with the laws of the United States, without
            regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to
            the exclusive jurisdiction of the courts located within the United States. Our failure to enforce any
            right or provision of these Terms will not be considered a waiver of those rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 text-gray-700 text-sm space-y-1">
            <p className="font-semibold">Local First Rewards™</p>
            <p>Email: <a href="mailto:legal@localfirstrewards.com" className="text-brand-green-700 hover:underline">legal@localfirstrewards.com</a></p>
          </div>
        </section>

        <div className="pt-6 border-t border-gray-200 flex gap-6 text-sm">
          <Link href="/privacy" className="text-brand-green-700 hover:underline">Privacy Policy</Link>
          <Link href="/login" className="text-brand-green-700 hover:underline">Back to login</Link>
        </div>
      </main>
    </div>
  );
}

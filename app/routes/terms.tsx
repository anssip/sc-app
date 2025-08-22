import type { MetaFunction } from '@remix-run/node'
import { Link } from '@remix-run/react'

export const meta: MetaFunction = () => {
  return [
    { title: 'Terms of Service - Spot Canvas' },
    {
      name: 'description',
      content: 'Terms of Service for Spot Canvas cryptocurrency charting platform',
    },
  ]
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-block mb-8 text-blue-600 hover:text-blue-800 font-medium transition-colors">
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8 text-black">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: January 22, 2025</p>

        <div className="prose prose-lg max-w-none prose-headings:text-black prose-p:text-gray-800 prose-li:text-gray-800 prose-strong:text-black">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using Spot Canvas ("the Service"), provided by Northern Peaks Development ("we," "us," or "our"),
              you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use
              the Service.
            </p>
            <p className="mb-4">
              We reserve the right to update these Terms at any time. We will notify users of any material changes via email or
              through the Service. Your continued use of the Service after such modifications constitutes acceptance of the
              updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Spot Canvas is a cryptocurrency charting and technical analysis platform that provides:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Real-time cryptocurrency market data and charts</li>
              <li>Technical analysis tools and indicators</li>
              <li>Multi-chart layouts and workspace management</li>
              <li>Drawing tools for chart analysis</li>
              <li>Cloud storage for user settings and drawings</li>
              <li>Scriptable custom indicators (coming soon)</li>
            </ul>
            <p className="mb-4">
              The Service is provided for informational and educational purposes only and does not constitute financial,
              investment, or trading advice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To access certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p className="mb-4">
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or illegal
              activities.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription and Payment</h2>
            <p className="mb-4">
              Access to premium features requires a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Pay the subscription fees at the intervals you select (monthly or annually)</li>
              <li>Provide valid payment information</li>
              <li>Accept automatic renewal of your subscription unless you cancel</li>
            </ul>
            <p className="mb-4">
              <strong>Free Trial:</strong> We offer a 7-day free trial for new users. You may cancel at any time during the
              trial period without charge. If you do not cancel before the trial ends, your subscription will automatically
              begin.
            </p>
            <p className="mb-4">
              <strong>Cancellation:</strong> You may cancel your subscription at any time through your account settings. 
              Cancellation takes effect at the end of the current billing period. No refunds are provided for partial billing
              periods.
            </p>
            <p className="mb-4">
              <strong>Price Changes:</strong> We reserve the right to modify subscription prices with 30 days' notice. Your
              current price is guaranteed for the remainder of your billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to any portion of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Scrape, harvest, or extract data from the Service through automated means</li>
              <li>Resell, redistribute, or sublicense the Service or any data obtained from it</li>
              <li>Use the Service to transmit malware, viruses, or harmful code</li>
              <li>Impersonate any person or entity</li>
              <li>Share your account credentials with others</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are owned by Northern Peaks Development and are
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="mb-4">
              <strong>Your Content:</strong> You retain ownership of any analysis, drawings, or custom indicators you create
              using the Service. By using the Service, you grant us a non-exclusive, worldwide, royalty-free license to store,
              display, and backup your content as necessary to provide the Service.
            </p>
            <p className="mb-4">
              <strong>Market Data:</strong> Cryptocurrency market data displayed through the Service is obtained from third-party
              providers and may be subject to additional terms and restrictions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your use of the Service is also governed by our Privacy Policy. We are committed to protecting your privacy and
              handling your data in accordance with applicable data protection laws, including GDPR for EU users and CCPA for
              California residents.
            </p>
            <p className="mb-4">We collect and process only the data necessary to provide the Service, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Account information (email, name)</li>
              <li>Usage data and preferences</li>
              <li>Chart settings and saved layouts</li>
              <li>Payment information (processed securely through Stripe)</li>
            </ul>
            <p className="mb-4">
              <strong>Data Processing:</strong> We act as a data controller for personal data collected through the Service. We
              process data based on legitimate interests, contract fulfillment, and where required, explicit consent.
            </p>
            <p className="mb-4">
              <strong>Data Retention:</strong> We retain personal data only for as long as necessary to provide the Service and
              comply with legal obligations. Account data is deleted within 90 days of account termination unless required by law.
            </p>
            <p className="mb-4">
              <strong>Data Security:</strong> We implement industry-standard security measures including encryption in transit
              (TLS/SSL) and at rest, regular security audits, and access controls to protect your data.
            </p>
            <p className="mb-4">
              <strong>International Data Transfers:</strong> Data may be processed in countries outside your residence. We ensure
              appropriate safeguards are in place for international data transfers in compliance with applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. API Usage and Integration</h2>
            <p className="mb-4">
              If you use our API or integrate the Service with third-party platforms:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You must comply with our API documentation and rate limits</li>
              <li>API keys must be kept secure and not shared publicly</li>
              <li>You are responsible for all activities under your API credentials</li>
              <li>We reserve the right to throttle or suspend API access for abuse</li>
              <li>Commercial use of the API requires a separate agreement</li>
            </ul>
            <p className="mb-4">
              <strong>Third-Party Integrations:</strong> When connecting third-party services (such as Customer.io for email
              communications), you authorize us to share necessary data with these services in accordance with their respective
              privacy policies and terms of service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
              BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mb-4">We do not warrant that:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>The results obtained from the Service will be accurate or reliable</li>
              <li>Any errors in the Service will be corrected</li>
            </ul>
            <p className="mb-4 font-semibold">
              IMPORTANT: The Service provides market data and analysis tools for informational purposes only. We are not a
              financial advisor, and nothing in the Service constitutes financial, investment, legal, or tax advice. Always do
              your own research and consult with qualified professionals before making investment decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, NORTHERN PEAKS DEVELOPMENT SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
              DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Your use or inability to use the Service</li>
              <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
              <li>Any interruption or cessation of transmission to or from the Service</li>
              <li>Any bugs, viruses, or harmful code transmitted through the Service</li>
              <li>Any errors or omissions in content or any loss or damage incurred from using content</li>
              <li>Trading or investment decisions made based on information from the Service</li>
            </ul>
            <p className="mb-4">
              Our total liability to you for all claims arising from or related to these Terms or the Service shall not exceed
              the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless Northern Peaks Development, its officers, directors, employees,
              and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable legal
              fees, arising out of or related to your use of the Service, violation of these Terms, or violation of any rights
              of another.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability,
              for any reason, including if you breach these Terms.
            </p>
            <p className="mb-4">Upon termination:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Your right to use the Service will immediately cease</li>
              <li>We may delete your account and any content or information</li>
              <li>We are not obligated to provide any refund of fees paid</li>
            </ul>
            <p className="mb-4">
              You may terminate your account at any time through your account settings or by contacting us at
              anssi@spotcanvas.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Governing Law and Dispute Resolution</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of Finland, without regard to its
              conflict of law provisions.
            </p>
            <p className="mb-4">
              Any disputes arising from these Terms or the Service shall be resolved through good-faith negotiation. If
              negotiation fails, disputes shall be submitted to the competent courts of Finland.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Changes to the Service</h2>
            <p className="mb-4">
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without
              notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of
              the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Third-Party Services</h2>
            <p className="mb-4">
              The Service may contain links to third-party websites or services that are not owned or controlled by us. We have
              no control over and assume no responsibility for the content, privacy policies, or practices of any third-party
              websites or services.
            </p>
            <p className="mb-4">
              Our use of third-party services (such as payment processors, data providers) is governed by their respective terms
              and privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Compliance and Export Controls</h2>
            <p className="mb-4">
              <strong>Anti-Corruption:</strong> You represent and warrant that you have not and will not make any payment or
              provide anything of value to any government official or other person in violation of applicable anti-corruption
              laws, including the U.S. Foreign Corrupt Practices Act.
            </p>
            <p className="mb-4">
              <strong>Export Compliance:</strong> The Service may be subject to export laws and regulations. You agree to comply
              with all applicable export and import laws and regulations, including those of the European Union and United States.
            </p>
            <p className="mb-4">
              <strong>Sanctions:</strong> You represent that you are not located in, or a resident or national of, any country
              subject to comprehensive sanctions, and that you are not on any list of prohibited or restricted parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Service Level and Support</h2>
            <p className="mb-4">
              <strong>Availability:</strong> While we strive for high availability, we do not guarantee any specific uptime or
              service level. The Service may be unavailable due to maintenance, updates, or circumstances beyond our control.
            </p>
            <p className="mb-4">
              <strong>Support:</strong> Support is provided via email at anssi@spotcanvas.com during regular business hours
              (Monday-Friday, 9:00 AM - 5:00 PM EET/EEST). Response times vary based on issue severity and subscription tier.
            </p>
            <p className="mb-4">
              <strong>Data Backup:</strong> While we maintain regular backups, you are responsible for maintaining your own
              copies of any critical data or analysis you create using the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">18. Marketing Communications</h2>
            <p className="mb-4">
              By creating an account, you agree to receive transactional emails related to your account and use of the Service.
              You may opt-in to receive marketing communications, which you can unsubscribe from at any time.
            </p>
            <p className="mb-4">
              We use Customer.io and other third-party services to manage email communications. Your email interactions may be
              tracked to improve our Service and communications.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">19. General Provisions</h2>
            <p className="mb-4">
              <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and Northern Peaks
              Development regarding the Service.
            </p>
            <p className="mb-4">
              <strong>Severability:</strong> If any provision of these Terms is found to be invalid or unenforceable, the
              remaining provisions shall continue in full force and effect.
            </p>
            <p className="mb-4">
              <strong>Waiver:</strong> Our failure to enforce any right or provision of these Terms shall not be considered a
              waiver of those rights.
            </p>
            <p className="mb-4">
              <strong>Assignment:</strong> You may not assign or transfer your rights under these Terms without our prior written
              consent. We may assign our rights and obligations without restriction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">20. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2">
                <strong>Northern Peaks Development</strong>
              </p>
              <p className="mb-2">Espoo, Finland</p>
              <p className="mb-2">Email: anssi@spotcanvas.com</p>
              <p>Phone: +358 40 849 8385</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
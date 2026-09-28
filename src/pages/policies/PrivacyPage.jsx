import PolicyLayout from '../../components/PolicyLayout';

const Section = ({ title, children }) => (
  <section className="po-section">
    <h2>{title}</h2>
    {children}
  </section>
);

export default function PrivacyPage() {
  return (
    <PolicyLayout
      eyebrow="Legal"
      title="Privacy Policy"
      lead="How Luviio collects, uses, and protects your personal information when you shop with us in India."
      updated="2026-09-17"
    >
      <Section title="1. Scope and applicability">
        <p>
          This policy applies to Luviio.in and our India-focused online store. It is intended to be read
          with our <a href="/privacy/dpdp">DPDP Privacy Notice</a>. We process personal data in accordance
          with applicable Indian privacy and data protection requirements, including the Digital Personal
          Data Protection Act, 2023 and rules made under it as applicable to the relevant processing.
        </p>
      </Section>

      <Section title="2. Personal data we collect">
        <p>
          We collect information you provide directly — your name, email address, phone number,
          shipping/billing address, account information, and information needed to process an order. When
          you place an order we also record the products purchased, amounts charged, delivery details,
          returns/refunds, and payment references.
        </p>
        <p>
          We also collect limited technical data automatically, such as browser type, device and
          operating system information, pages visited, and basic network/security information, where
          needed to operate, secure, and improve the service.
        </p>
      </Section>

      <Section title="3. Why we use personal data">
        <ul>
          <li>Processing and fulfilling orders, including payment, dispatch, delivery, returns, and refunds.</li>
          <li>Managing accounts, orders, addresses, and customer support.</li>
          <li>Sending transactional and service communications.</li>
          <li>Preventing fraud, abuse, unauthorised access, and other security incidents.</li>
          <li>Meeting tax, accounting, legal, regulatory, and record-keeping obligations.</li>
          <li>Maintaining and improving the security, reliability, and performance of Luviio.</li>
        </ul>
      </Section>

      <Section title="4. Notice, consent, and withdrawal">
        <p>
          Where consent is required, we will provide clear information about the personal data involved
          and the specified purpose before requesting consent. Where processing is based on consent, you
          may withdraw that consent through the applicable mechanism or by contacting us. Withdrawal does
          not invalidate processing already carried out lawfully and does not require us to stop processing
          where another lawful basis or legal obligation permits or requires continued processing.
        </p>
        <p>
          Our notice is designed to identify the categories of data and purposes in plain language. The
          separate DPDP Privacy Notice provides the detailed data categories, purposes, rights-request
          route, and grievance contact.
        </p>
      </Section>

      <Section title="5. Your privacy rights">
        <p>
          Subject to applicable Indian law and its conditions, you may have rights relating to access to
          information about your personal data, correction and updating of inaccurate data, erasure where
          permitted, and grievance redressal. Send a request to <strong>official@luviio.in</strong> and
          include enough information for us to identify and securely process it. We may verify identity
          before acting on a request.
        </p>
      </Section>

      <Section title="6. Payments and service providers">
        <p>
          Payments are processed through our payment provider, Stripe. Card payment credentials are
          handled by the payment provider and are not stored on Luviio servers. We may share the minimum
          information necessary with service providers such as payment processors, delivery partners,
          communications providers, and infrastructure providers to operate the store.
        </p>
      </Section>

      <Section title="7. Data retention and deletion">
        <p>
          We retain personal data only for as long as reasonably necessary for the stated purposes and
          applicable legal, tax, accounting, fraud-prevention, dispute-resolution, and record-keeping
          requirements. Where data is no longer required and no legal retention obligation applies, we
          will delete or anonymise it as appropriate.
        </p>
      </Section>

      <Section title="8. Cookies and analytics">
        <p>
          Luviio uses necessary cookies and similar technologies for authentication, security, and
          cart/session operation. Where non-essential analytics or similar technologies are used and
          consent is required, we will provide the applicable consent controls. You can also manage
          cookies through your browser settings, although disabling necessary cookies may affect site
          functionality.
        </p>
      </Section>

      <Section title="9. Security and personal data breaches">
        <p>
          We maintain reasonable technical and organisational safeguards designed to protect personal data
          against unauthorised access, misuse, loss, alteration, and disclosure. If a personal data breach
          requires notification under applicable law, Luviio will follow the applicable notification and
          response requirements.
        </p>
      </Section>

      <Section title="10. Privacy and consumer grievance contact">
        <p>
          <strong>Grievance Officer &amp; Proprietor: Kyro</strong><br />
          Email: <strong>official@luviio.in</strong><br />
          Address: Palam, New Delhi, Delhi, India
        </p>
        <p>
          For privacy requests, consumer complaints, or grievances, contact us using the details above.
          Luviio will process applicable complaints through its designated grievance mechanism and
          applicable Indian law.
        </p>
      </Section>
    </PolicyLayout>
  );
}

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
          This policy applies to Luviio.in and our India-focused online store. We process personal data
          for the purposes described below and in accordance with applicable Indian privacy and data
          protection requirements, including the Digital Personal Data Protection Act, 2023 and rules
          made under applicable law, as and when applicable to the relevant processing.
        </p>
      </Section>

      <Section title="2. Personal data we collect">
        <p>
          We collect information you provide directly — your name, email address, phone number,
          shipping address, and information needed to process an order. When you place an order we also
          record the products you purchased, the amounts charged, delivery details, and payment
          references.
        </p>
        <p>
          We also collect limited technical data automatically, such as browser type, device and
          operating system information, pages visited, and basic network information, for security,
          reliability, and service improvement.
        </p>
      </Section>

      <Section title="3. Why we use personal data">
        <p>We use personal data for specific purposes including:</p>
        <ul>
          <li>Processing and fulfilling orders, including payment, dispatch, delivery, returns, and refunds.</li>
          <li>Managing accounts, orders, addresses, and customer support.</li>
          <li>Sending transactional and service communications.</li>
          <li>Preventing fraud, abuse, unauthorised access, and other security incidents.</li>
          <li>Meeting tax, accounting, legal, regulatory, and record-keeping obligations.</li>
          <li>Improving the security, reliability, and performance of Luviio.</li>
        </ul>
      </Section>

      <Section title="4. Consent and other lawful processing">
        <p>
          Where applicable law requires consent, we will seek consent in a clear manner and use the
          personal data only for the specified purpose. Where processing is permitted or required under
          another lawful basis under applicable Indian law, we may process the data for that purpose.
        </p>
      </Section>

      <Section title="5. Payments and service providers">
        <p>
          Payments are processed through our payment provider, Stripe. Card payment credentials are
          handled by the payment provider and are not stored on Luviio servers. We may share the minimum
          information necessary with service providers such as payment processors, delivery partners,
          communications providers, and infrastructure providers to operate the store.
        </p>
      </Section>

      <Section title="6. Data retention and deletion">
        <p>
          We retain personal data only for as long as reasonably necessary for the stated purposes and
          applicable legal, tax, accounting, fraud-prevention, dispute-resolution, and record-keeping
          requirements. Where data is no longer required and no legal retention obligation applies, we
          will delete or anonymise it as appropriate.
        </p>
      </Section>

      <Section title="7. Your privacy rights">
        <p>
          Subject to applicable Indian law and its conditions, you may have rights relating to access to
          information about your personal data, correction and updating of inaccurate data, erasure where
          permitted, and grievance redressal. You may contact us using the details below to exercise an
          applicable right or raise a privacy concern. We may need to verify your request before acting
          on it.
        </p>
      </Section>

      <Section title="8. Cookies and analytics">
        <p>
          Luviio uses necessary cookies and similar technologies for functions such as authentication,
          security, and cart/session operation. Where non-essential analytics or similar technologies are
          used and consent is required, we will provide the applicable consent controls. You can also
          manage cookies through your browser settings, although disabling necessary cookies may affect
          site functionality.
        </p>
      </Section>

      <Section title="9. Security">
        <p>
          We maintain reasonable technical and organisational safeguards designed to protect personal
          data against unauthorised access, misuse, loss, alteration, and disclosure. No internet
          transmission or storage system can be guaranteed to be completely secure.
        </p>
      </Section>

      <Section title="10. Privacy and grievance contact">
        <p>
          For privacy questions, requests, or complaints, contact Luviio at <strong>official@luviio.in</strong>
          and include enough information for us to identify and address your request. Luviio will handle
          applicable grievances through its designated grievance process and applicable Indian law.
        </p>
      </Section>
    </PolicyLayout>
  );
}

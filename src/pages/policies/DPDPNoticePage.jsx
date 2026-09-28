import PolicyLayout from '../../components/PolicyLayout';

const Section = ({ title, children }) => (
  <section className="po-section">
    <h2>{title}</h2>
    {children}
  </section>
);

export default function DPDPNoticePage() {
  return (
    <PolicyLayout
      eyebrow="Legal"
      title="DPDP Privacy Notice"
      lead="A clear notice about the personal data Luviio uses to provide its India-focused online store."
      updated="2026-09-17"
    >
      <Section title="1. Who is responsible for your data">
        <p>
          Luviio is responsible for processing the personal data described in this notice for the
          purposes of operating the Luviio.in store. For privacy requests and complaints, contact our
          designated contact at <strong>official@luviio.in</strong>.
        </p>
      </Section>

      <Section title="2. Personal data we may collect">
        <ul>
          <li>Name and contact details such as email address and phone number.</li>
          <li>Billing and delivery address information.</li>
          <li>Account, order, cart, return, refund, and support information.</li>
          <li>Payment and transaction references required for reconciliation and support; payment credentials are handled by the payment provider.</li>
          <li>Limited technical, device, security, and usage information needed to operate and protect the service.</li>
        </ul>
      </Section>

      <Section title="3. Why we process it">
        <p>
          We process personal data to provide products and services, process and deliver orders, take and
          reconcile payments, manage returns and refunds, provide customer support, prevent fraud and
          unauthorised access, maintain security and reliability, and comply with applicable legal,
          tax, accounting, and record-keeping requirements.
        </p>
      </Section>

      <Section title="4. Notice, consent, and withdrawal">
        <p>
          Where consent is required, Luviio will request it using clear information about the personal
          data and purpose involved. Consent can be withdrawn where processing is based on consent. A
          withdrawal request does not invalidate processing that was lawful before withdrawal and does not
          require Luviio to stop processing where another lawful basis or legal obligation permits or
          requires continued processing.
        </p>
      </Section>

      <Section title="5. Your rights and requests">
        <p>
          Subject to applicable law, you may request access to information about your personal data,
          correction or updating of inaccurate data, erasure where permitted, and grievance redressal.
          Send requests to <strong>official@luviio.in</strong>. We may verify identity and request enough
          information to process the request securely.
        </p>
      </Section>

      <Section title="6. Data sharing and processors">
        <p>
          Luviio may use service providers such as payment processors, delivery partners, communications
          providers, and infrastructure providers. We share only information reasonably required for the
          relevant service, security, support, or legal purpose and expect applicable processors to protect
          personal data appropriately.
        </p>
      </Section>

      <Section title="7. Retention and deletion">
        <p>
          Personal data is retained only for the period reasonably necessary for the relevant purpose and
          applicable legal, tax, accounting, fraud-prevention, dispute-resolution, and record-keeping
          obligations. When retention is no longer required, data will be deleted or anonymised as
          appropriate.
        </p>
      </Section>

      <Section title="8. Security and data incidents">
        <p>
          Luviio maintains reasonable technical and organisational safeguards for personal data. If a
          personal data breach requires notification under applicable law, Luviio will follow the required
          notification and response process.
        </p>
      </Section>

      <Section title="9. Contact and grievance">
        <p>
          <strong>Grievance Officer &amp; Proprietor: Kyro</strong><br />
          Email: <strong>official@luviio.in</strong><br />
          Address: Palam, New Delhi, Delhi, India
        </p>
        <p>
          You may use the same contact for privacy questions, rights requests, and complaints concerning
          processing of personal data.
        </p>
      </Section>
    </PolicyLayout>
  );
}

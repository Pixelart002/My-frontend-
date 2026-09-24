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
      lead="This notice explains what personal data Luviio may process, why it is used, how it is protected, and how you can make privacy requests."
      updated="2026-09-17"
    >
      <Section title="1. Who is responsible for your personal data">
        <p>
          Luviio is responsible for the processing of personal data described
          in this notice in connection with the Luviio.in website, accounts,
          orders, customer support, and related services.
        </p>

        <p>
          For privacy requests, questions, or grievances, contact us at{' '}
          <strong>official@luviio.in</strong>.
        </p>
      </Section>

      <Section title="2. Personal data we may process">
        <p>
          Depending on how you use Luviio, we may process the following
          categories of personal data:
        </p>

        <ul>
          <li>
            <strong>Identity and contact information:</strong> name, email
            address, phone number, and similar contact details.
          </li>

          <li>
            <strong>Delivery and billing information:</strong> billing,
            shipping, and delivery address details.
          </li>

          <li>
            <strong>Account information:</strong> account credentials,
            profile information, account activity, and authentication-related
            information.
          </li>

          <li>
            <strong>Order information:</strong> products purchased, order
            history, cart information, returns, refunds, invoices, and
            customer-support records.
          </li>

          <li>
            <strong>Payment information:</strong> payment status,
            transaction identifiers, payment method information, and
            reconciliation references. Payment credentials such as card
            details are handled by the applicable payment provider and are
            not intended to be stored by Luviio as raw payment credentials.
          </li>

          <li>
            <strong>Technical and security information:</strong> limited
            device, browser, network, log, security, and usage information
            necessary to operate, secure, troubleshoot, and improve the
            service.
          </li>
        </ul>
      </Section>

      <Section title="3. Why we use personal data">
        <p>
          Luviio may process personal data for specific purposes including:
        </p>

        <ul>
          <li>creating and managing customer accounts;</li>
          <li>processing and fulfilling orders;</li>
          <li>arranging delivery and communicating order updates;</li>
          <li>processing refunds, returns, and related support requests;</li>
          <li>processing and reconciling payments;</li>
          <li>providing customer and technical support;</li>
          <li>maintaining account, platform, and transaction security;</li>
          <li>detecting and preventing fraud, abuse, and unauthorised access;</li>
          <li>maintaining operational records and service reliability; and</li>
          <li>
            meeting applicable legal, tax, accounting, regulatory, and
            record-keeping requirements.
          </li>
        </ul>
      </Section>

      <Section title="4. Notice and consent">
        <p>
          Where processing is based on consent, Luviio will provide information
          about the personal data involved and the purpose for which it is
          processed before or when consent is requested, as applicable.
        </p>

        <p>
          Where applicable, you may withdraw consent through the mechanism
          provided by Luviio or by contacting{' '}
          <strong>official@luviio.in</strong>. Withdrawal does not affect
          processing that was lawful before withdrawal and does not prevent
          processing that may continue under another applicable lawful ground
          or legal requirement.
        </p>

        <p>
          Luviio will not treat consent for unrelated purposes as necessary
          merely because it is required for a separate service, except where
          the processing is necessary for providing that service or otherwise
          permitted by applicable law.
        </p>
      </Section>

      <Section title="5. Your privacy rights">
        <p>
          Subject to applicable law and any conditions or limitations that
          apply, you may have rights concerning your personal data, including
          rights to:
        </p>

        <ul>
          <li>obtain information about your personal data and its processing;</li>
          <li>request correction or updating of inaccurate personal data;</li>
          <li>request erasure where the applicable requirements are satisfied;</li>
          <li>
            withdraw consent where processing is based on consent; and
          </li>
          <li>
            raise a grievance concerning the processing of your personal data.
          </li>
        </ul>

        <p>
          Requests can be submitted to{' '}
          <strong>official@luviio.in</strong>. We may request reasonable
          information to verify the requester and protect against
          unauthorised disclosure or account changes.
        </p>
      </Section>

      <Section title="6. Sharing with service providers">
        <p>
          Luviio may use third-party service providers where necessary to
          operate the store and provide requested services. These may include
          payment processors, logistics and delivery partners, communications
          providers, hosting and infrastructure providers, security providers,
          and other operational service providers.
        </p>

        <p>
          Information is shared according to the relevant purpose and only to
          the extent reasonably required for providing the service, protecting
          the platform, supporting customers, or meeting applicable legal
          obligations.
        </p>
      </Section>

      <Section title="7. Data retention and deletion">
        <p>
          Luviio retains personal data only for as long as reasonably necessary
          for the relevant purpose and for applicable legal, tax, accounting,
          fraud-prevention, dispute-resolution, security, and record-keeping
          requirements.
        </p>

        <p>
          When personal data is no longer required and there is no applicable
          requirement to retain it, Luviio will take appropriate steps to
          delete it or otherwise dispose of it in accordance with applicable
          law and operational requirements.
        </p>
      </Section>

      <Section title="8. Security and personal data breaches">
        <p>
          Luviio uses reasonable technical and organisational measures designed
          to protect personal data against unauthorised access, misuse, loss,
          alteration, or disclosure.
        </p>

        <p>
          Where a personal data breach is required to be notified under
          applicable law, Luviio will follow the applicable incident response
          and notification requirements.
        </p>
      </Section>

      <Section title="9. Children">
        <p>
          Luviio's services are intended to be used by persons who are legally
          able to enter into the relevant transactions. Where applicable law
          imposes additional requirements concerning children's personal data,
          Luviio will follow those requirements.
        </p>
      </Section>

      <Section title="10. Privacy requests and grievance redressal">
        <p>
          <strong>Grievance Officer &amp; Proprietor: Kyro</strong>
          <br />
          Email: <strong>official@luviio.in</strong>
          <br />
          Address: Palam, New Delhi, Delhi, India
        </p>

        <p>
          Use the same contact details for privacy questions, rights requests,
          consent-related requests, and complaints concerning the processing
          of personal data.
        </p>

        <p>
          Luviio will handle grievances in accordance with applicable law and
          the grievance process applicable to the relevant request.
        </p>
      </Section>

      <Section title="11. Changes to this notice">
        <p>
          Luviio may update this notice when its services, data practices,
          applicable law, or regulatory requirements change. The latest version
          published on Luviio.in will identify the applicable update date.
        </p>
      </Section>
    </PolicyLayout>
  );
}
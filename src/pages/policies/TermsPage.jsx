import PolicyLayout from '../../components/PolicyLayout';

const Section = ({ title, children }) => (
  <section className="po-section">
    <h2>{title}</h2>
    {children}
  </section>
);

export default function TermsPage() {
  return (
    <PolicyLayout
      eyebrow="Legal"
      title="Terms & Conditions"
      lead="The terms that govern your use of the Luviio India store and purchase of our products."
      updated="2026-09-17"
    >
      <Section title="1. Acceptance of terms">
        <p>
          By accessing or using Luviio.in and placing an order, you agree to these terms and the related
          policies published on the website. These terms are intended to operate subject to applicable
          Indian law and do not exclude any consumer right that cannot lawfully be excluded.
        </p>
      </Section>

      <Section title="2. Account information">
        <p>
          You are responsible for keeping your account credentials secure and for providing accurate,
          current information. Please notify us if information needed to fulfil an order changes.
        </p>
      </Section>

      <Section title="3. Products, orders, and pricing">
        <p>
          Product descriptions, availability, prices, applicable taxes, shipping charges, and other
          material order information will be shown through the store and checkout flow. Prices are shown
          in Indian Rupees (INR). Product-specific GST information is applied according to the applicable
          product configuration and law.
        </p>
        <p>
          An order may be declined where an item is unavailable, payment cannot be verified, required
          information is materially incomplete, or there is a genuine error or suspected fraud. If a
          paid order cannot be fulfilled, the applicable refund will be processed.
        </p>
      </Section>

      <Section title="4. Product information and consumer rights">
        <p>
          We take reasonable care to keep product information accurate. Colours can vary between screens
          and physical products. Nothing in these terms limits rights or remedies available to consumers
          under applicable Indian consumer protection law.
        </p>
      </Section>

      <Section title="5. Payments">
        <p>
          Payments are processed through the payment methods presented at checkout. Payment credentials
          are handled by the relevant payment provider. Luviio retains transaction references and order
          information needed to reconcile and support payments.
        </p>
      </Section>

      <Section title="6. Cancellation, returns, and refunds">
        <p>
          Order cancellation, returns, exchanges, and refunds are governed by the applicable Luviio
          policies published on the website and by applicable law. Where a consumer right cannot lawfully
          be excluded, these terms do not exclude it.
        </p>
      </Section>

      <Section title="7. Intellectual property">
        <p>
          The Luviio name, branding, website design, original content, and other protected material may
          not be copied, reproduced, or commercially exploited without permission, except to the extent
          permitted by applicable law.
        </p>
      </Section>

      <Section title="8. Limitation of liability">
        <p>
          Nothing in these terms excludes or limits liability or consumer remedies where doing so would be
          unlawful. Subject to that limitation, Luviio will be responsible only to the extent provided by
          applicable law and the circumstances of the relevant order.
        </p>
      </Section>

      <Section title="9. Changes to these terms">
        <p>
          We may update these terms from time to time. The current version will be published on this page
          with its effective/update date. Changes will not retrospectively remove rights that have already
          accrued under applicable law.
        </p>
      </Section>

      <Section title="10. Grievance and support">
        <p>
          For order, consumer, or policy complaints, contact Luviio at <strong>official@luviio.in</strong>
          and include your order number where relevant. Luviio will process applicable complaints through
          its designated grievance mechanism and applicable Indian law.
        </p>
      </Section>
    </PolicyLayout>
  );
}

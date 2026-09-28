import PolicyLayout from '../../components/PolicyLayout';

const Section = ({ title, children }) => (
  <section className="po-section">
    <h2>{title}</h2>
    {children}
  </section>
);

export default function RefundPage() {
  return (
    <PolicyLayout
      eyebrow="Policies"
      title="Refund Policy"
      lead="What to expect when a refund applies to your Luviio order in India."
      updated="2026-09-17"
    >
      <Section title="1. When a refund applies">
        <p>
          A refund may apply when an order is cancelled before dispatch, an eligible return is approved,
          a product arrives damaged or defective, an order cannot be fulfilled, or another refund is
          required under applicable law or the relevant order terms.
        </p>
      </Section>

      <Section title="2. Refund method and timing">
        <p>
          Refunds for online payments are normally sent through the original payment route used at
          checkout. Once a refund is approved, Luviio will initiate it within the applicable processing
          period. The time taken for the amount to appear in your bank or payment account can depend on
          the payment provider or bank.
        </p>
        <p>
          Store credit or another refund method will be used only where appropriate and, where consent or
          agreement is required, with the customer's agreement.
        </p>
      </Section>

      <Section title="3. Partial refunds">
        <p>
          Where only part of an order is eligible for refund, we may issue a partial refund for the
          affected item or amount. Any lawful deductions or return-related charges will be communicated
          with the applicable resolution and will not be used to remove a consumer right that cannot be
          excluded by law.
        </p>
      </Section>

      <Section title="4. How to request a refund">
        <p>
          Contact support with your order number and the reason for the request. For damaged or defective
          products, include relevant photographs or other information so that the claim can be assessed.
        </p>
      </Section>

      <Section title="5. Non-refundable or restricted items">
        <p>
          Certain products may have lawful refund restrictions because of their condition, use,
          customisation, hygiene or safety characteristics, or because a product-specific exception
          applies. Any restriction will be communicated where applicable and will not override a right
          that cannot lawfully be excluded.
        </p>
      </Section>
    </PolicyLayout>
  );
}

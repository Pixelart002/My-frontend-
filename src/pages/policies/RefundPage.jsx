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
      lead="What to expect when a refund applies to your order, and how quickly the money comes back."
      updated="2026-01-05"
    >
      <Section title="1. When a refund applies">
        <p>
          A refund may be issued when an order is cancelled before dispatch, when a product is returned
          under our return policy and approved, when an item arrives damaged or defective, or when an
          order cannot be fulfilled.
        </p>
      </Section>

      <Section title="2. Refund method and timing">
        <p>
          Refunds are issued to the original payment method used at checkout. Once a refund is approved,
          it is usually processed within 3–7 business days. The time taken for the amount to appear in
          your account depends on your bank or card issuer.
        </p>
        <p>
          In some cases we may issue the refund to your store credit or wallet balance instead, but only
          where this has been communicated and agreed with you.
        </p>
      </Section>

      <Section title="3. Partial refunds">
        <p>
          Where only part of an order is returned, or where an item is returned in a used or damaged
          condition, a partial refund may apply. Any return shipping or restocking charges will be
          clearly explained before we proceed.
        </p>
      </Section>

      <Section title="4. How to claim a refund">
        <p>
          To request a refund for an eligible order, contact our support team with your order number and
          the reason for your request. Include relevant details or photos for damaged or defective items
          so we can assess your claim quickly.
        </p>
      </Section>

      <Section title="5. Non-refundable items">
        <p>
          Certain items may not be eligible for refund, for example products that have been used,
          altered, or are not in their original condition, and items from final-sale promotions where
          stated at the time of purchase.
        </p>
      </Section>
    </PolicyLayout>
  );
}

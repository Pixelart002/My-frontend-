import PolicyLayout from '../../components/PolicyLayout';

const Section = ({ title, children }) => (
  <section className="po-section">
    <h2>{title}</h2>
    {children}
  </section>
);

export default function ReturnCancelPage() {
  return (
    <PolicyLayout
      eyebrow="Policies"
      title="Returns & Cancellation"
      lead="How to return an item you're not happy with, and when you can cancel an order."
      updated="2026-01-05"
    >
      <Section title="1. Return window">
        <p>
          You can return most items within a set period of receiving your order. To be eligible, the
          item must be unused, in its original condition, and in its original packaging where
          applicable. Please check your order details or contact us for the specific window that applies.
        </p>
      </Section>

      <Section title="2. How to request a return">
        <p>
          To start a return, contact our support team with your order number and the item(s) you wish to
          return. We will confirm eligibility and provide the return instructions. Items should be
          packed securely and shipped back using the method we recommend so the parcel can be tracked.
        </p>
      </Section>

      <Section title="3. Condition of returned items">
        <p>
          Items are inspected when they arrive back with us. Products that are returned used, damaged,
          or missing components may be rejected or subject to a reduced refund, and we will explain the
          outcome to you.
        </p>
      </Section>

      <Section title="4. Cancelling an order">
        <p>
          You may cancel an order before it is dispatched. Once an order has been shipped, it can no
          longer be cancelled, but it may still be eligible for return once it arrives. Where an order
          is cancelled before dispatch, any payment made is refunded to your original payment method.
        </p>
      </Section>

      <Section title="5. Exchanges">
        <p>
          If you would like a different size, colour, or variant, the easiest option is generally to
          return the original item and place a new order. This helps us get your replacement out as
          quickly as possible.
        </p>
      </Section>

      <Section title="6. Non-returnable items">
        <p>
          Certain categories may not be returnable for hygiene or safety reasons, and final-sale items
          are clearly marked as such at the time of purchase.
        </p>
      </Section>
    </PolicyLayout>
  );
}

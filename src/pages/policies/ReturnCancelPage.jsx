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
      lead="How returns, cancellations, and exchanges work for Luviio orders in India."
      updated="2026-09-17"
    >
      <Section title="1. Return eligibility">
        <p>
          Eligible products may be returned within the return period communicated for the order or
          product. Unless a product-specific exception applies, returned goods should be unused, in
          original condition, and accompanied by original packaging and components where applicable.
          Nothing in this policy limits any non-excludable consumer right available under applicable law.
        </p>
      </Section>

      <Section title="2. How to request a return">
        <p>
          Contact support with your order number, the item you want to return, and the reason for the
          request. We will confirm the applicable eligibility and provide return instructions. Keep the
          shipment securely packed and retain the return tracking information where available.
        </p>
      </Section>

      <Section title="3. Damaged or defective products">
        <p>
          If an item arrives damaged, defective, incorrect, or materially different from the order,
          contact us promptly with the order number and relevant photographs or other evidence. We will
          assess the issue and provide the applicable replacement, repair, refund, or other resolution.
        </p>
      </Section>

      <Section title="4. Cancellation">
        <p>
          You may request cancellation before dispatch through the available support channel. If an
          order has already been dispatched, cancellation may no longer be technically possible and the
          applicable return process may instead apply. Any refund will be handled under the Refund Policy
          and applicable law.
        </p>
      </Section>

      <Section title="5. Exchanges">
        <p>
          Where an exchange is available for the particular product, support will confirm the available
          options. Otherwise, the original item may need to be returned and a new order placed.
        </p>
      </Section>

      <Section title="6. Non-returnable or restricted items">
        <p>
          Certain products may have lawful return restrictions because of hygiene, safety, customisation,
          installation, use, or other product-specific characteristics. Any such restriction will be
          communicated where applicable and will not override rights that cannot lawfully be excluded.
        </p>
      </Section>

      <Section title="7. Refunds">
        <p>
          Approved refunds are handled according to the Refund Policy. Where a payment has already been
          captured, the refund is normally returned through the original payment route, subject to the
          payment provider and applicable banking timelines.
        </p>
      </Section>
    </PolicyLayout>
  );
}

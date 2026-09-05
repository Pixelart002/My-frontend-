import PolicyLayout from '../../components/PolicyLayout';

const Section = ({ title, children }) => (
  <section className="po-section">
    <h2>{title}</h2>
    {children}
  </section>
);

export default function ShippingPage() {
  return (
    <PolicyLayout
      eyebrow="Policies"
      title="Shipping Policy"
      lead="How we package, dispatch, and deliver your orders, and what to expect along the way."
      updated="2026-01-05"
    >
      <Section title="1. Processing time">
        <p>
          Orders are typically packed and dispatched within 1–2 business days after payment is
          confirmed. During high-volume periods (sales, festive seasons) processing may take a little
          longer; we will keep you updated by email at each stage.
        </p>
      </Section>

      <Section title="2. Delivery timelines">
        <p>
          Delivery times vary by destination. Within India, most orders arrive within 3–7 business days
          of dispatch, and metro locations tend to be faster. International orders can take longer
          depending on customs and the destination country.
        </p>
        <p>
          Please note that delivery timelines are estimates, not guarantees, and are subject to courier
          availability and remote-location conditions.
        </p>
      </Section>

      <Section title="3. Shipping charges">
        <p>
          Shipping costs are calculated at checkout based on the delivery address and are shown clearly
          before you complete your order. We may offer free shipping on qualifying orders or during
          promotional periods.
        </p>
      </Section>

      <Section title="4. Order tracking">
        <p>
          Once your order is dispatched you will receive a dispatch notification with tracking details
          where available. You can also view the status of any order at any time from your account's
          Orders page.
        </p>
      </Section>

      <Section title="5. Delivery address">
        <p>
          Please make sure your shipping address is complete and correct at checkout. We are not
          responsible for delays or non-delivery caused by an incorrect or incomplete address,
          unsuccessful delivery attempts, or absence at the delivery location.
        </p>
      </Section>

      <Section title="6. Damaged or lost parcels">
        <p>
          If your parcel arrives damaged or does not arrive within a reasonable period after dispatch,
          please contact us with your order number and we will investigate with the courier and arrange
          a resolution.
        </p>
      </Section>
    </PolicyLayout>
  );
}

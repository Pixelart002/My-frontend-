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
      lead="How we package, dispatch, and deliver your orders across India."
      updated="2026-09-17"
    >
      <Section title="1. Processing time">
        <p>
          Orders are typically packed and dispatched within 1–2 business days after payment is
          confirmed. During high-volume periods, processing may take a little longer; we will keep you
          updated through the service channels available for your order.
        </p>
      </Section>

      <Section title="2. Delivery timelines">
        <p>
          Within India, most orders arrive within 3–7 business days of dispatch. Metro locations may be
          faster, while remote locations can take longer depending on courier availability and local
          delivery conditions.
        </p>
        <p>
          Delivery timelines are estimates rather than guarantees and may be affected by courier
          capacity, weather, public holidays, or other circumstances outside our reasonable control.
        </p>
      </Section>

      <Section title="3. Shipping charges">
        <p>
          Shipping charges are calculated using the applicable Luviio shipping rules and are shown before
          you complete your order. Where free shipping applies, the qualifying conditions will be shown
          at checkout or in the relevant offer.
        </p>
      </Section>

      <Section title="4. Order tracking">
        <p>
          After dispatch, we will provide tracking information where the selected delivery service
          supports tracking. You can also view the status of your order from your account where available.
        </p>
      </Section>

      <Section title="5. Delivery address">
        <p>
          Please provide a complete and accurate delivery address, including the correct PIN code and
          contact details. Delays or failed delivery caused by an incorrect or incomplete address may
          require additional courier arrangements.
        </p>
      </Section>

      <Section title="6. Damaged, delayed, or lost parcels">
        <p>
          If a parcel arrives damaged or does not arrive within a reasonable period after dispatch,
          contact support with your order number and relevant details. We will investigate with the
          delivery partner and provide the applicable resolution under our policies and applicable law.
        </p>
      </Section>

      <Section title="7. Delivery area">
        <p>
          Luviio currently operates as an India-focused store and this shipping policy applies to
          deliveries within India. International delivery is not currently offered unless expressly
          stated for a particular order or service.
        </p>
      </Section>
    </PolicyLayout>
  );
}

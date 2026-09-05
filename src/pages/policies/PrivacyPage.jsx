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
      lead="How Luviio collects, uses, and protects your personal information when you shop with us."
      updated="2026-01-05"
    >
      <Section title="1. Information we collect">
        <p>
          We collect information you provide directly — your name, email address, phone number,
          shipping address, and payment details. When you place an order we also record the products
          you purchased, the amounts charged, and the delivery address you chose.
        </p>
        <p>
          We also collect limited technical data automatically: your browser type, device, operating
          system, the pages you visit, and basic network information, so that we can keep the store
          secure and improve performance.
        </p>
      </Section>

      <Section title="2. How we use your information">
        <p>We use the personal data we collect to:</p>
        <ul>
          <li>Process and fulfil your orders, including payments, dispatch, and delivery.</li>
          <li>Manage your account, orders, and address book.</li>
          <li>Send order confirmations, shipping updates, and service messages.</li>
          <li>Prevent fraud, abuse, and unauthorised access to accounts.</li>
          <li>Improve our website, products, and customer experience.</li>
        </ul>
        <p>
          We do not sell your personal information to third parties. We never share your data with
          advertisers for their own independent use.
        </p>
      </Section>

      <Section title="3. Payment processing">
        <p>
          Payments are processed through our secure payment provider, Stripe. Your card details are
          handled by Stripe under their own security standards and are never stored on our servers.
          We store only a payment reference so we can match a transaction to your order.
        </p>
      </Section>

      <Section title="4. Data sharing">
        <p>
          We share personal data only with service providers who help us operate the store — for
          example payment processing, order fulfilment, and delivery partners — and only to the extent
          needed to provide their service. Where required by law, we may disclose information to
          regulators or law enforcement.
        </p>
      </Section>

      <Section title="5. Data retention">
        <p>
          We retain your account and order information for as long as your account is active and for
          the periods required by our tax and legal obligations. Data that is no longer needed is
          deleted or anonymised.
        </p>
      </Section>

      <Section title="6. Cookies and analytics">
        <p>
          We use cookies and similar technologies to keep you signed in, remember your cart across
          sessions, and understand how the store is used so we can improve it. You can control or
          delete cookies through your browser settings; disabling some cookies may affect parts of the
          site.
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, or delete your
          personal information, or to object to or restrict certain processing. You can update much of
          your information directly from your account, or contact us to make a request.
        </p>
      </Section>

      <Section title="8. Security">
        <p>
          We take reasonable technical and organisational measures to protect your personal information
          against loss, misuse, and unauthorised access. No method of transmission over the internet is
          completely secure, but we work to safeguard your data at all times.
        </p>
      </Section>

      <Section title="9. Contact us">
        <p>
          If you have any questions about this privacy policy or how your data is handled, please reach
          out through the contact page or email our support team. We are happy to help.
        </p>
      </Section>
    </PolicyLayout>
  );
}

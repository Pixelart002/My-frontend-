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
      lead="The terms that govern your use of the Luviio store and the purchase of our products."
      updated="2026-01-05"
    >
      <Section title="1. Acceptance of terms">
        <p>
          By accessing or using the Luviio website and placing an order, you agree to be bound by these
          terms and our related policies. If you do not agree, please do not use the site or place an
          order.
        </p>
      </Section>

      <Section title="2. Your account">
        <p>
          You are responsible for keeping your account credentials confidential and for all activity
          that takes place under your account. You agree to provide accurate, current information and
          to keep it up to date.
        </p>
      </Section>

      <Section title="3. Orders and pricing">
        <p>
          All prices are shown in Indian Rupees (INR) and include applicable taxes unless stated
          otherwise. We take reasonable care to ensure prices and product details are accurate, but
          errors may occasionally occur. If we discover an obvious pricing error after you order, we
          will contact you before processing it.
        </p>
        <p>
          Placing an order constitutes an offer to purchase. We may accept or decline an order at any
          time, for example where an item is out of stock, we cannot verify your details, or we suspect
          fraud. Where an order is declined after payment, we will refund the amount paid.
        </p>
      </Section>

      <Section title="4. Product descriptions">
        <p>
          We work hard to describe and photograph our products accurately. However, colours may vary
          slightly due to screen settings, and images are illustrative. We do not warrant that every
          description is completely free of error.
        </p>
      </Section>

      <Section title="5. Payment">
        <p>
          Payment is taken securely at the time you place an order through our payment provider. By
          providing payment details you confirm you are authorised to use the payment method selected.
        </p>
      </Section>

      <Section title="6. Ownership and use of the site">
        <p>
          The content, design, and branding of the Luviio site are protected by applicable intellectual
          property laws. You may use the site for personal, non-commercial purposes only and may not
          copy, reproduce, or exploit its content without permission.
        </p>
      </Section>

      <Section title="7. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Luviio is not liable for indirect or consequential
          losses arising from your use of the site or products, and our total liability is limited to
          the amount you paid for the order in question.
        </p>
      </Section>

      <Section title="8. Changes to these terms">
        <p>
          We may update these terms from time to time. The latest version will always be available on
          this page, and continued use of the store after changes means you accept the updated terms.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          For questions about these terms, please reach out through the contact page and our team will
          be glad to help.
        </p>
      </Section>
    </PolicyLayout>
  );
}

const clean = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const result = String(value).trim();
    if (result) return result;
  }
  return '';
};

function firstObject(...values) {
  return values.find((value) => value && typeof value === 'object' && !Array.isArray(value)) || {};
}

/**
 * Normalize the saved shipping snapshot returned by the orders API.
 * Older/current API responses may expose address fields nested or as
 * shipping_* columns on the order itself.
 */
export function getShippingAddress(order) {
  if (!order || typeof order !== 'object') return null;

  const nested = firstObject(order.shipping_address);
  const address = {
    full_name: clean(nested.full_name, nested.fullName, nested.name, order.shipping_name, order.shipping_full_name),
    company_name: clean(nested.company_name, nested.company, order.shipping_company_name),
    phone: clean(nested.phone, nested.phone_number, order.shipping_phone),
    email: clean(nested.email, order.shipping_email),
    line1: clean(
      nested.line1, nested.line_1, nested.address_line1, nested.address_line_1,
      nested.street_address, nested.address, order.shipping_line1, order.shipping_line_1,
      order.shipping_address_line1, order.shipping_address_line_1,
    ),
    line2: clean(
      nested.line2, nested.line_2, nested.address_line2, nested.address_line_2,
      nested.apartment, nested.locality, order.shipping_line2, order.shipping_line_2,
      order.shipping_address_line2, order.shipping_address_line_2,
    ),
    landmark: clean(nested.landmark, order.shipping_landmark),
    city: clean(nested.city, order.shipping_city),
    state: clean(nested.state, nested.region, order.shipping_state),
    postal_code: clean(
      nested.postal_code, nested.postalCode, nested.zip, nested.zip_code,
      nested.pincode, order.shipping_postal_code, order.shipping_zip_code,
      order.shipping_pincode,
    ),
    country: clean(nested.country, order.shipping_country),
  };

  // A name alone is not a usable delivery address.
  const hasLocation = [
    address.line1,
    address.line2,
    address.landmark,
    address.city,
    address.state,
    address.postal_code,
  ].some(Boolean);

  return hasLocation ? address : null;
}

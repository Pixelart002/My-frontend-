import { describe, expect, it } from 'vitest';
import { getShippingAddress } from './orderAddress';

describe('getShippingAddress', () => {
  it('normalizes shipping snapshot columns returned at the top level', () => {
    expect(getShippingAddress({
      shipping_name: 'A Customer',
      shipping_phone: '9876543210',
      shipping_line1: 'House 12, Main Road',
      shipping_line2: 'Near Market',
      shipping_city: 'Delhi',
      shipping_state: 'Delhi',
      shipping_postal_code: '110059',
      shipping_country: 'India',
    })).toEqual({
      full_name: 'A Customer',
      company_name: '',
      phone: '9876543210',
      email: '',
      line1: 'House 12, Main Road',
      line2: 'Near Market',
      landmark: '',
      city: 'Delhi',
      state: 'Delhi',
      postal_code: '110059',
      country: 'India',
    });
  });

  it('normalizes nested addresses and common field aliases', () => {
    expect(getShippingAddress({
      shipping_address: {
        full_name: 'Nested Customer',
        address_line_1: 'Block B, Street 4',
        address_line_2: 'Floor 2',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        phone_number: '9999999999',
      },
    })).toMatchObject({
      full_name: 'Nested Customer',
      line1: 'Block B, Street 4',
      line2: 'Floor 2',
      city: 'Delhi',
      state: 'Delhi',
      postal_code: '110001',
      phone: '9999999999',
    });
  });

  it('prefers populated nested fields and fills missing fields from the order snapshot', () => {
    expect(getShippingAddress({
      shipping_name: 'Snapshot Name',
      shipping_line1: 'Snapshot Street',
      shipping_city: 'Delhi',
      shipping_address: {
        full_name: 'Nested Name',
        line1: 'Nested Street',
      },
    })).toMatchObject({
      full_name: 'Nested Name',
      line1: 'Nested Street',
      city: 'Delhi',
    });
  });

  it('returns null when no actual delivery location exists', () => {
    expect(getShippingAddress({ shipping_name: 'Customer' })).toBeNull();
    expect(getShippingAddress(null)).toBeNull();
  });
});

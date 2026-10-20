import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  sendPush: vi.fn(),
  uploadNotificationImage: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('../../services/admin', () => ({
  adminService: {
    reports: vi.fn(),
    sendPush: mocks.sendPush,
    uploadNotificationImage: mocks.uploadNotificationImage,
  },
  itemsOfList: vi.fn((value) => (Array.isArray(value) ? value : [])),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    toast: {
      error: mocks.toastError,
      success: mocks.toastSuccess,
      info: vi.fn(),
    },
  }),
}));

import OperationsPanel from './OperationsPanel';

describe('Notifications panel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.sendPush.mockResolvedValue({
      audience: 2,
      success: 2,
      failed: 0,
      details: [
        { user_id: 'user-00001', status: 'sent' },
        { user_id: 'user-00002', status: 'sent' },
      ],
    });
  });

  it('shows only the required fields until an optional setting is selected', () => {
    render(<OperationsPanel section="notifications" />);

    expect(screen.getByPlaceholderText('e.g. New Luviio offer')).toBeTruthy();
    expect(screen.getByPlaceholderText('Tell customers what is new or on offer…')).toBeTruthy();
    expect(screen.getByRole('button', { name: /add options/i })).toBeTruthy();
    expect(screen.queryByText('Keep visible until interaction')).toBeNull();
    expect(screen.queryByText('Badge image')).toBeNull();
    expect(screen.queryByText('Specific subscriber IDs')).toBeNull();
    expect(screen.queryByText('Action button 1')).toBeNull();
  });

  it('sends only selected optional fields and correctly parses explicit audience IDs', async () => {
    render(<OperationsPanel section="notifications" />);

    fireEvent.change(screen.getByPlaceholderText('e.g. New Luviio offer'), {
      target: { value: 'Test campaign' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tell customers what is new or on offer…'), {
      target: { value: 'Test body' },
    });

    fireEvent.click(screen.getByRole('button', { name: /add options/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /specific audience/i }));
    fireEvent.change(screen.getByPlaceholderText('Paste IDs separated by commas, spaces or new lines'), {
      target: { value: 'user-00001, user-00002' },
    });

    fireEvent.click(screen.getByRole('button', { name: /send notification/i }));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText(/2 selected subscriber/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Send now' }));

    await waitFor(() => {
      expect(mocks.sendPush).toHaveBeenCalledTimes(1);
    });

    const payload = mocks.sendPush.mock.calls[0][0];
    expect(payload.user_ids).toEqual(['user-00001', 'user-00002']);
    expect(payload.title).toBe('Test campaign');
    expect(payload.body).toBe('Test body');
    expect(payload).not.toHaveProperty('icon');
    expect(payload).not.toHaveProperty('badge');
    expect(payload).not.toHaveProperty('image');
    expect(payload).not.toHaveProperty('url');
    expect(payload).not.toHaveProperty('tag');
    expect(payload).not.toHaveProperty('actions');
    expect(payload).not.toHaveProperty('require_interaction');
    expect(payload).not.toHaveProperty('renotify');

    await waitFor(() => {
      expect(screen.getByText('Notification dispatch report')).toBeTruthy();
    });
    expect(screen.getByText('Delivered responses')).toBeTruthy();
  });

  it('requires an explicit campaign tag before requesting re-alert behaviour', () => {
    render(<OperationsPanel section="notifications" />);

    fireEvent.change(screen.getByPlaceholderText('e.g. New Luviio offer'), {
      target: { value: 'Test campaign' },
    });
    fireEvent.change(screen.getByPlaceholderText('Tell customers what is new or on offer…'), {
      target: { value: 'Test body' },
    });

    fireEvent.click(screen.getByRole('button', { name: /add options/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /delivery behaviour/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /re-alert when replacing the same campaign/i }));
    fireEvent.click(screen.getByRole('button', { name: /send notification/i }));

    expect(mocks.toastError).toHaveBeenCalledWith(
      'To re-alert on a replaced notification, enable Campaign tag and enter the same tag you will reuse.',
    );
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(mocks.sendPush).not.toHaveBeenCalled();
  });
});

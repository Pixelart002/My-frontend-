import { useState } from 'react';
import { request } from '../../api/client';

export default function PushTestButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendTest = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await request('POST', '/push/test', {});
      setMessage(response?.message || response?.data?.message || 'Test notification sent.');
    } catch (error) {
      setMessage(error?.message || 'Unable to send test notification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="push-test-action">
      <button type="button" className="btn" onClick={sendTest} disabled={loading}>
        {loading ? 'Sending…' : 'Send test notification'}
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}

import { useState } from 'react';
import { request } from '../../api/client';
import {
  RiLoader4Line,
  RiSendPlaneLine,
  RiCheckLine,
  RiErrorWarningLine,
} from '@remixicon/react';

export default function PushTestButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  
  const sendTest = async () => {
    if (loading) return;
    
    setLoading(true);
    setMessage('');
    setSuccess(false);
    
    try {
      const response = await request('POST', '/push/test', {});
      
      setMessage(
        response?.message ||
        response?.data?.message ||
        'Test notification sent successfully.'
      );
      setSuccess(true);
    } catch (error) {
      setMessage(
        error?.message || 'Unable to send test notification.'
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={sendTest}
        disabled={loading}
        className="
          inline-flex min-h-10 w-full sm:w-auto
          items-center justify-center gap-2
          rounded-lg
          bg-gray-900
          px-4
          text-sm font-medium text-white
          shadow-sm
          transition-all duration-200
          hover:bg-gray-800 hover:shadow-md
          focus:outline-none
          focus:ring-2 focus:ring-gray-900 focus:ring-offset-2
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {loading ? (
          <>
            <RiLoader4Line
              size={17}
              className="animate-spin"
              aria-hidden="true"
            />
            Sending...
          </>
        ) : (
          <>
            <RiSendPlaneLine
              size={17}
              aria-hidden="true"
            />
            Send test notification
          </>
        )}
      </button>

      {message && (
        <div
          role={success ? 'status' : 'alert'}
          className={`
            mt-3 flex items-start gap-2.5
            rounded-lg
            border
            px-3 py-2.5
            text-xs leading-5
            ${
              success
                ? 'border-green-100 bg-green-50 text-green-700'
                : 'border-red-100 bg-red-50 text-red-700'
            }
          `}
        >
          {success ? (
            <RiCheckLine
              size={17}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <RiErrorWarningLine
              size={17}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
          )}

          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
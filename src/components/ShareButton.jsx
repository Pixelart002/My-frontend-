import { useEffect, useState } from 'react';
import { RiCheckLine, RiLinkM, RiShareLine } from '@remixicon/react';
import { useToast } from '../context/ToastContext';

export default function ShareButton({ title = 'Luviio', text = '', url }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : 'https://www.luviio.in/');
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => () => {
    // Keep the component lifecycle clean if a share toast is followed by navigation.
  }, []);

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = shareUrl;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      setCopied(true);
      toast.success('Product link copied.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Unable to copy this link.');
    }
  };

  const share = async () => {
    if (canNativeShare) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    await copyLink();
  };

  return (
    <button type="button" className="share-button btn btn-quiet" onClick={share} aria-label={canNativeShare ? 'Share product' : 'Copy product link'}>
      {copied ? <RiCheckLine size={16} /> : canNativeShare ? <RiShareLine size={16} /> : <RiLinkM size={16} />}
      {copied ? 'Link copied' : canNativeShare ? 'Share' : 'Copy link'}
    </button>
  );
}

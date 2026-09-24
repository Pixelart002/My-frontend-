import { useState } from 'react';
import { RiCheckLine, RiLinkM, RiShareLine } from '@remixicon/react';
import { useToast } from '../context/ToastContext';

export default function ShareButton({ title = 'Luviio', text = '', url }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const share = async () => {
    if (!shareUrl) {
      toast.error('Nothing to share yet.');
      return;
    }

    const shareData = { title, text, url: shareUrl };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Product link copied.');
        window.setTimeout(() => setCopied(false), 1800);
        return;
      }

      throw new Error('Clipboard unavailable');
    } catch (error) {
      if (error?.name === 'AbortError') return;

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          toast.success('Product link copied.');
          window.setTimeout(() => setCopied(false), 1800);
          return;
        }
      } catch {
        // fallback empty
      }

      toast.error('Unable to share this link.');
    }
  };

  return (
    <button type="button" className="share-button btn btn-quiet" onClick={share} aria-label="Share product">
      {copied ? <RiCheckLine size={16} /> : navigator.share ? <RiShareLine size={16} /> : <RiLinkM size={16} />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}

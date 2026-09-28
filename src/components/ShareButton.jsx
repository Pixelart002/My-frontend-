import { useState } from 'react';
import { RiCheckLine, RiLinkM, RiShareLine } from '@remixicon/react';
import { useToast } from '../context/ToastContext';

export default function ShareButton({ title = 'Luviio', text = '', url = window.location.href }) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const shareData = { title, text, url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Product link copied.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Product link copied.');
        window.setTimeout(() => setCopied(false), 1800);
      } catch {
        toast.error('Unable to share this link.');
      }
    }
  };

  return (
    <button type="button" className="share-button btn btn-quiet" onClick={share} aria-label="Share product">
      {copied ? <RiCheckLine size={16} /> : navigator.share ? <RiShareLine size={16} /> : <RiLinkM size={16} />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}

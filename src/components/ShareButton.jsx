import { useEffect, useRef, useState } from 'react';
import { RiCheckLine, RiCloseLine, RiLinkM, RiShareForwardLine, RiShareLine, RiTelegramLine, RiTwitterXLine, RiWhatsappLine } from '@remixicon/react';
import { useToast } from '../context/ToastContext';

export default function ShareButton({ title = 'Luviio', text = '', url = window.location.href }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  const shareText = text || `Check out ${title} on Luviio.`;

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const markCopied = () => {
    setCopied(true);
    toast.success('Product link copied.');
    window.setTimeout(() => setCopied(false), 1800);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      markCopied();
      setOpen(false);
    } catch {
      toast.error('Unable to copy this link.');
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title, text: shareText, url });
      setOpen(false);
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Unable to share this link.');
    }
  };

  const openShareUrl = (shareUrl) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const whatsapp = () => openShareUrl(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${url}`)}`);
  const telegram = () => openShareUrl(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`);
  const facebook = () => openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  const x = () => openShareUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`);

  return (
    <div className="share-wrap" ref={ref}>
      <button
        type="button"
        className="share-button btn btn-quiet"
        onClick={() => setOpen((value) => !value)}
        aria-label="Share product"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {copied ? <RiCheckLine size={16} /> : open ? <RiCloseLine size={16} /> : <RiShareLine size={16} />}
        {copied ? 'Link copied' : 'Share'}
      </button>

      {open && (
        <div className="share-menu" role="menu" aria-label="Share options">
          {navigator.share && (
            <button type="button" role="menuitem" onClick={nativeShare}>
              <RiShareForwardLine size={17} /> Share on device
            </button>
          )}
          <button type="button" role="menuitem" onClick={whatsapp}>
            <RiWhatsappLine size={17} /> WhatsApp
          </button>
          <button type="button" role="menuitem" onClick={copyLink}>
            <RiLinkM size={17} /> Copy link
          </button>
          <button type="button" role="menuitem" onClick={telegram}>
            <RiTelegramLine size={17} /> Telegram
          </button>
          <button type="button" role="menuitem" onClick={facebook}>
            <RiShareForwardLine size={17} /> Facebook
          </button>
          <button type="button" role="menuitem" onClick={x}>
            <RiTwitterXLine size={17} /> X
          </button>
        </div>
      )}
    </div>
  );
}

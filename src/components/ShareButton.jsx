import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RiCheckLine,
  RiLinkM,
  RiShareLine,
} from '@remixicon/react';

import { useToast } from '../context/ToastContext';

export default function ShareButton({
  title = 'Luviio',
  text = '',
  url,
}) {
  const { toast } = useToast();
  
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  
  const copiedTimer = useRef(null);
  
  const shareUrl =
    typeof url === 'string' && url.trim() ?
    url :
    typeof window !== 'undefined' ?
    window.location.href :
    '';
  
  const canNativeShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function';
  
  useEffect(() => {
    return () => {
      if (copiedTimer.current) {
        window.clearTimeout(copiedTimer.current);
      }
    };
  }, []);
  
  const markCopied = useCallback(() => {
    setCopied(true);
    
    if (copiedTimer.current) {
      window.clearTimeout(copiedTimer.current);
    }
    
    copiedTimer.current = window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }, []);
  
  const copyLink = useCallback(async () => {
    if (!shareUrl) {
      toast.error('Unable to find the product link.');
      return false;
    }
    
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        throw new Error('Clipboard API unavailable.');
      }
      
      markCopied();
      toast.success('Product link copied.');
      
      return true;
    } catch {
      toast.error('Unable to copy this link.');
      return false;
    }
  }, [markCopied, shareUrl, toast]);
  
  const share = useCallback(async () => {
    if (sharing) return;
    
    setSharing(true);
    
    try {
      if (canNativeShare && shareUrl) {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
        
        return;
      }
      
      await copyLink();
    } catch (error) {
      if (error?.name === 'AbortError') {
        return;
      }
      
      await copyLink();
    } finally {
      setSharing(false);
    }
  }, [
    canNativeShare,
    copyLink,
    shareUrl,
    sharing,
    text,
    title,
  ]);
  
  const icon = copied ? (
    <RiCheckLine size={16} aria-hidden="true" />
  ) : canNativeShare ? (
    <RiShareLine size={16} aria-hidden="true" />
  ) : (
    <RiLinkM size={16} aria-hidden="true" />
  );
  
  const label = copied ?
    'Link copied' :
    sharing ?
    'Sharing…' :
    canNativeShare ?
    'Share' :
    'Copy link';
  
  return (
    <button
      type="button"
      className={`share-button btn btn-quiet ${
        copied ? 'is-copied' : ''
      }`}
      onClick={share}
      disabled={sharing || !shareUrl}
      aria-label={
        copied
          ? 'Product link copied'
          : canNativeShare
            ? 'Share product'
            : 'Copy product link'
      }
      aria-live="polite"
      aria-busy={sharing}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const isFocusable = (element) => {
  if (!element) return false;
  
  if (
    element.getAttribute('aria-hidden') === 'true'
  ) {
    return false;
  }
  
  if (
    element.hasAttribute('disabled') ||
    element.getAttribute('tabindex') === '-1'
  ) {
    return false;
  }
  
  const style =
    window.getComputedStyle(element);
  
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.pointerEvents === 'none'
  ) {
    return false;
  }
  
  return element.getClientRects().length > 0;
};

const focusElement = (element) => {
  if (!element?.focus) return;
  
  try {
    element.focus({
      preventScroll: true,
    });
  } catch {
    element.focus();
  }
};

export function useFocusTrap({
  enabled = true,
  containerRef,
  initialFocusRef,
  onEscape,
}) {
  const previousFocusRef = useRef(null);
  const onEscapeRef = useRef(onEscape);
  
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);
  
  useEffect(() => {
    if (
      !enabled ||
      !containerRef?.current
    ) {
      return undefined;
    }
    
    const container =
      containerRef.current;
    
    /*
     * Remember exactly where focus was before
     * the trap became active.
     */
    const previousFocus =
      document.activeElement;
    
    previousFocusRef.current =
      previousFocus instanceof HTMLElement ?
      previousFocus :
      null;
    
    const getFocusable = () => {
      return Array.from(
        container.querySelectorAll(
          FOCUSABLE,
        ),
      ).filter(isFocusable);
    };
    
    /*
     * Prefer explicitly requested focus,
     * but only if it is actually usable.
     */
    const requestedInitial =
      initialFocusRef?.current;
    
    const focusable =
      getFocusable();
    
    const initial =
      isFocusable(requestedInitial) ?
      requestedInitial :
      focusable[0];
    
    if (initial) {
      focusElement(initial);
    } else if (
      isFocusable(container)
    ) {
      focusElement(container);
    }
    
    const handleKeyDown = (event) => {
      /*
       * Ignore events that another component
       * has already handled.
       */
      if (event.defaultPrevented) {
        return;
      }
      
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscapeRef.current?.();
        return;
      }
      
      if (event.key !== 'Tab') {
        return;
      }
      
      /*
       * Recalculate every time because dialogs can
       * dynamically add/remove buttons or fields.
       */
      const elements =
        getFocusable();
      
      /*
       * Nothing focusable inside the dialog.
       * Keep keyboard focus inside the container.
       */
      if (elements.length === 0) {
        event.preventDefault();
        focusElement(container);
        return;
      }
      
      const first = elements[0];
      const last =
        elements[elements.length - 1];
      
      const active =
        document.activeElement;
      
      /*
       * If focus somehow escaped the dialog,
       * bring it back into the trap.
       */
      if (!container.contains(active)) {
        event.preventDefault();
        focusElement(
          event.shiftKey ?
          last :
          first,
        );
        return;
      }
      
      /*
       * Shift + Tab from first → last.
       */
      if (
        event.shiftKey &&
        active === first
      ) {
        event.preventDefault();
        focusElement(last);
        return;
      }
      
      /*
       * Tab from last → first.
       */
      if (
        !event.shiftKey &&
        active === last
      ) {
        event.preventDefault();
        focusElement(first);
      }
    };
    
    document.addEventListener(
      'keydown',
      handleKeyDown,
    );
    
    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
      
      const previous =
        previousFocusRef.current;
      
      previousFocusRef.current =
        null;
      
      /*
       * Don't attempt to focus a node that has
       * already disappeared or become unusable.
       */
      if (
        previous &&
        previous.isConnected &&
        isFocusable(previous)
      ) {
        focusElement(previous);
      }
    };
  }, [
    enabled,
    containerRef,
    initialFocusRef,
  ]);
}
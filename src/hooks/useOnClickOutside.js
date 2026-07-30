import { useEffect } from 'react';

export function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // Handle blur event (e.g. clicking iframe) where target is window
      if (event.type === 'blur') {
        handler(event);
        return;
      }
      
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || (event.target instanceof Node && ref.current.contains(event.target))) {
        return;
      }
      handler(event);
    };

    document.addEventListener('click', listener, { capture: true });
    window.addEventListener('blur', listener);

    return () => {
      document.removeEventListener('click', listener, { capture: true });
      window.removeEventListener('blur', listener);
    };
  }, [ref, handler]);
}

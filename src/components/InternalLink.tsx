import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { navigate, normalizePath } from '../lib/publicPages';

interface InternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

export function InternalLink({ href, children, onClick, ...props }: InternalLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (props.target && props.target !== '_self') return;
    event.preventDefault();
    navigate(href);
  };

  const isCurrent =
    typeof window !== 'undefined' &&
    normalizePath(window.location.pathname) === normalizePath(href);

  return (
    <a href={href} onClick={handleClick} aria-current={isCurrent ? 'page' : undefined} {...props}>
      {children}
    </a>
  );
}

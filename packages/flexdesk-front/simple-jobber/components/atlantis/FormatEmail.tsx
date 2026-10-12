import { useRef, useState, useEffect } from 'react';
import { Tooltip } from './Tooltip';

/**
 * FormatEmail - Atlantis-style email formatting component
 *
 * Displays a formatted, clickable email address (mailto: link).
 * Truncates long emails with an ellipsis and shows the full address in a tooltip on hover.
 *
 * @example
 * <FormatEmail email="hello@example.com" />
 * <FormatEmail email="very.long.email.address@subdomain.example.com" />
 */

export interface FormatEmailProps {
  /** The email address to display */
  email: string;
  /** Optional className for the wrapper */
  className?: string;
}

export const FormatEmail = ({ email, className }: FormatEmailProps) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = linkRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [email]);

  const link = (
    <a
      ref={linkRef}
      href={`mailto:${email}`}
      className={className}
      style={{
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: 'var(--color-interactive, hsl(195, 91%, 34%))',
        textDecoration: 'none',
        fontSize: 'inherit',
        lineHeight: 'inherit',
        maxWidth: '100%',
      }}
    >
      {email}
    </a>
  );

  if (isTruncated) {
    return (
      <Tooltip message={email} placement="top">
        {link}
      </Tooltip>
    );
  }

  return link;
};

export default FormatEmail;

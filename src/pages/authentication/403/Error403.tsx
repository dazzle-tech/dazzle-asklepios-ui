import React from 'react';
import ErrorPage from '@/components/ErrorPage';
import { IconButton } from 'rsuite';
import ArrowLeftLine from '@rsuite/icons/ArrowLeftLine';

export default function Error403() {
  return (
    <ErrorPage code={403}>
      <p
        className="error-page-title"
        style={{
          fontWeight: 800,
          fontSize: 38,
          margin: '8px 0 6px',
          letterSpacing: 0.2
        }}
      >
        Access Denied
      </p>

      <p
        className="error-page-subtitle text-muted"
        style={{
          fontSize: 20,
          lineHeight: 1.6,
          margin: '0 0 18px'
        }}
      >
        The current page is unavailable or you do not have permission to access.
      </p>

      <IconButton icon={<ArrowLeftLine />} appearance="primary" href="/">
        Take me home
      </IconButton>
    </ErrorPage>
  );
}

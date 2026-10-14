import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import TestTypeSections from './test-type-sections';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  favoriteTests: any[];
  loading?: boolean;
  onRecall: (tests: any[]) => void;
};

const RecallFavoriteDiagnosticOrdersModal = ({
  open,
  setOpen,
  favoriteTests = [],
  loading,
  onRecall
}: Props) => {
  const [selectedTests, setSelectedTests] = useState<any[]>([]);

  /* ================= effects ================= */

  // Start with nothing selected every time the popup opens
  useEffect(() => {
    if (!open) return;
    setSelectedTests([]);
  }, [open]);

  /* ================= handlers ================= */

  const handleRecall = () => {
    if (!selectedTests.length) return;

    onRecall(selectedTests);
    setOpen(false);
  };

  /* ================= render ================= */

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
  <div dir={dir}>
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Recall from Favorites"
      size="60vw"
      actionButtonFunction={handleRecall}
      content={
        <TestTypeSections
          open={open}
          items={favoriteTests}
          loading={loading}
          selectedTests={selectedTests}
          setSelectedTests={setSelectedTests}
        />
      }
    />
  </div>
  );
};

export default RecallFavoriteDiagnosticOrdersModal;

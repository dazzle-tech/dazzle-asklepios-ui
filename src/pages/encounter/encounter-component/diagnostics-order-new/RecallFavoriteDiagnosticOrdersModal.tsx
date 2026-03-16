import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import TransferTestList from './TransferTestList';

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
  const [leftItems, setLeftItems] = useState<any[]>([]);
  const [rightItems, setRightItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<any>({});

  /* ================= effects ================= */

  useEffect(() => {
    if (!open) return;
    setLeftItems(favoriteTests);
    setRightItems([]);
    setSearchTerm('');
    setSearchType({});
  }, [open, favoriteTests]);

  /* ================= handlers ================= */

  const handleRecall = () => {
    if (!rightItems.length) return;

    onRecall(rightItems);
    setOpen(false);
  };

  /* ================= render ================= */

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Recall from Favorites"
      size="45vw"
      actionButtonFunction={handleRecall}
      content={
        <TransferTestList
          open={open}
          leftItems={leftItems}
          rightItems={rightItems}
          setLeftItems={setLeftItems}
          setRightItems={setRightItems}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          searchType={searchType}
          setSearchType={setSearchType}
          isFetching={loading}
        />
      }
    />
  );
};

export default RecallFavoriteDiagnosticOrdersModal;

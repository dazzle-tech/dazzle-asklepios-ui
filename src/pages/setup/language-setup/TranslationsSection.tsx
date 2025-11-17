import React from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { LanguageTranslation } from '@/types/model-types-new';

interface TranslationsSectionProps {
  filters: React.ReactNode;
  rows: LanguageTranslation[];
  loading: boolean;
  sortBy: string;
  sortType: 'asc' | 'desc';
  onSortChange: (column: string, type: 'asc' | 'desc') => void;
  pageIndex: number;
  rowsPerPage: number;
  totalCount: number;
  onPageChange: (_: unknown, newPage: number) => void;
  onRowsPerPageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedTranslation: LanguageTranslation;
  onRowClick: (row: LanguageTranslation) => void;
  onAdd: () => void;
  onEdit: () => void;
  languageSelected: boolean;
}

export const TranslationsSection: React.FC<TranslationsSectionProps> = ({
  filters,
  rows,
  loading,
  sortBy,
  sortType,
  onSortChange,
  pageIndex,
  rowsPerPage,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  selectedTranslation,
  onRowClick,
  onAdd,
  onEdit,
  languageSelected
}) => {
  const buttons = (
    <div className="flex-10">
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
        onClick={onAdd}
        disabled={!languageSelected}
      >
        New
      </MyButton>
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faEdit} />}
        onClick={onEdit}
        disabled={!selectedTranslation?.id}
      >
        Edit
      </MyButton>
    </div>
  );

  return (
    <SectionContainer
      title={
        <>
          <Translate>Language Values</Translate>
          {buttons}
        </>
      }
      content={
        <MyTable
          filters={filters}
          data={rows}
          height={400}
          loading={loading}
          sortColumn={sortBy}
          sortType={sortType}
          onSortChange={onSortChange}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          columns={[
            {
              key: 'translationKey',
              title: 'Key',
              dataKey: 'translationKey',
              width: 200
            },
            {
              key: 'translationText',
              title: 'Value',
              dataKey: 'translationText',
              width: 200
            },
            {
              key: 'verified',
              title: 'Verify',
              dataKey: 'verified',
              width: 80
            },
            {
              key: 'translated',
              title: 'Translate',
              dataKey: 'translated',
              width: 80
            }
          ]}
          onRowClick={onRowClick}
          rowClassName={(rowData: LanguageTranslation) =>
            selectedTranslation?.id === rowData.id ? 'selected-row' : ''
          }
        />
      }
    />
  );
};

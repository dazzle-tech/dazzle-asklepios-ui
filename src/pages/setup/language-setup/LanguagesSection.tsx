import React from 'react';
import SectionContainer from '@/components/SectionsoContainer';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Language } from '@/types/model-types-new';

interface LanguagesSectionProps {
  languages: Language[];
  selectedLanguage: Language;
  loading: boolean;
  onRowClick: (row: Language) => void;
  onAdd: () => void;
  onEdit: () => void;
}

export const LanguagesSection: React.FC<LanguagesSectionProps> = ({
  languages,
  selectedLanguage,
  loading,
  onRowClick,
  onAdd,
  onEdit
}) => {
  const buttons = (
    <div className="flex-10">
      <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} onClick={onAdd}>
        New
      </MyButton>
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faEdit} />}
        onClick={onEdit}
        disabled={!selectedLanguage?.id}
      >
        Edit
      </MyButton>
    </div>
  );

  return (
    <SectionContainer
      title={
        <>
          <Translate>Languages</Translate>
          {buttons}
        </>
      }
      content={
        <MyTable
          data={languages ?? []}
          columns={[
            {
              key: 'langName',
              title: 'Language Name',
              dataKey: 'langName',
              width: 150
            },
            {
              key: 'langKey',
              title: 'Language Code',
              dataKey: 'langKey',
              width: 150
            },
            {
              key: 'direction',
              title: 'Direction',
              dataKey: 'direction',
              width: 100
            }
          ]}
          height={400}
          loading={loading}
          onRowClick={onRowClick}
          rowClassName={(rowData: Language) =>
            selectedLanguage?.id === rowData.id ? 'selected-row' : ''
          }
        />
      }
    />
  );
};

import MyInput from '@/components/MyInput';
import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import {
  useAddLanguageMutation,
  useGetAllLanguagesQuery,
  useUpdateLanguageMutation
} from '@/services/setup/languageService';

import {
  useAddTranslationMutation,
  useGetTranslationsByLangQuery,
  useGetTranslationsQuery,
  useUpdateTranslationMutation
} from '@/services/setup/translationService';
import { useAppDispatch } from '@/hooks';
import { useEnumCapitalized } from '@/services/enumsApi';
import { newLanguage, newLanguageTranslation } from '@/types/model-types-constructor-new';
import { Language, LanguageTranslation } from '@/types/model-types-new';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { LanguageModal } from './LanguageModal';
import { LanguagesSection } from './LanguagesSection';
import { TranslationModal } from './TranslationModal';
import { TranslationsSection } from './TranslationsSection';

const LanguagesSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  // ------------------ State: Languages (left table) ------------------
  const [languages, setLanguages] = useState<Language>({ ...newLanguage });
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [languageModalMode, setLanguageModalMode] = useState<'add' | 'edit'>('add');

  // ------------------ State: Translations (right table) ------------------
  const [valueForm, setValueForm] = useState<LanguageTranslation>({
    ...newLanguageTranslation
  });
  const [valueModalOpen, setValueModalOpen] = useState(false);

  // Search + debounce
  const [searchTerm, setSearchTerm] = useState({ search: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(searchTerm.search.trim()), 300);
    return () => clearTimeout(h);
  }, [searchTerm.search]);

  // Paging/sorting
  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('translationKey');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // ------------------ Queries: Languages ------------------
  const {
    data: langData = [],
    isFetching: langsFetching,
    isLoading: langsLoading,
    refetch: refetchLangs
  } = useGetAllLanguagesQuery({});

  const directionOptions = useEnumCapitalized('Direction');

  // ------------------ Mutations ------------------
  const [addLanguage, addLanguageState] = useAddLanguageMutation();
  const [updateLanguage, updateLanguageState] = useUpdateLanguageMutation();
  const [addTranslation, addTranslationState] = useAddTranslationMutation();
  const [updateTranslation, updateTranslationState] = useUpdateTranslationMutation();

  // Global loader integration for language mutations
  useEffect(() => {
    const busy = addLanguageState.isLoading || updateLanguageState.isLoading;
    if (busy) dispatch(showSystemLoader());
    else dispatch(hideSystemLoader());
  }, [addLanguageState.isLoading, updateLanguageState.isLoading, dispatch]);

  // ------------------ Decide which translation query to use ------------------
  const langKey = languages?.langKey ?? '';
  const usePaged = Boolean(langKey) && debouncedSearch.length > 0;

  // Server-side: paged + filtered + sorted
  const {
    data: pagedData,
    isFetching: pagedFetching,
    refetch: refetchPaged
  } = useGetTranslationsQuery(
    usePaged
      ? {
          lang: langKey,
          value: debouncedSearch,
          page: pageIndex,
          size: rowsPerPage,
          sort: `${sortBy},${sortType}`
        }
      : undefined,
    { skip: !usePaged }
  );

  // Unpaged fallback by language
  const {
    data: transData = [],
    isFetching: unpagedFetching,
    refetch: refetchTrans
  } = useGetTranslationsByLangQuery(langKey, {
    skip: !langKey || usePaged
  });

  // Loading flag for right table
  const translationsLoading = usePaged ? pagedFetching : unpagedFetching;

  // ------------------ Local sorting/pagination (only for unpaged mode) ------------------
  const locallySorted = useMemo(() => {
    if (usePaged) return []; 
    const arr = [...(transData ?? [])];
    if (!sortBy) return arr;
    return arr.sort((a: any, b: any) => {
      const va = a?.[sortBy];
      const vb = b?.[sortBy];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortType === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortType === 'asc' ? (va as any) - (vb as any) : (vb as any) - (va as any);
    });
  }, [usePaged, transData, sortBy, sortType]);

  const locallyPaged = useMemo(() => {
    if (usePaged) return [];
    const start = pageIndex * rowsPerPage;
    return locallySorted.slice(start, start + rowsPerPage);
  }, [usePaged, locallySorted, pageIndex, rowsPerPage]);

  // ------------------ Rows + total for table ------------------
  const rows: LanguageTranslation[] = usePaged ? pagedData?.data ?? [] : locallyPaged;
  const totalCount: number = usePaged ? pagedData?.totalCount ?? 0 : transData?.length ?? 0;

  // ------------------ Handlers ------------------
  const handleAddLanguage = () => {
    setLanguageModalMode('add');
    setLanguages({ ...newLanguage });
    setLanguageModalOpen(true);
  };

  const handleEditLanguage = () => {
    if (!languages?.id) return;
    setLanguageModalMode('edit');
    setLanguageModalOpen(true);
  };

  const handleLanguageRowClick = (rowData: Language) => {
    setLanguages(rowData);
    setValueForm({ ...newLanguageTranslation, langKey: rowData.langKey });
    setPageIndex(0);
  };

  const handleAddValue = () => {
    if (!languages?.langKey) return;
    setValueForm({ ...newLanguageTranslation, langKey });
    setValueModalOpen(true);
  };

  const handleEditLanguageTranslation = () => {
    if (!valueForm?.id) return;
    setValueModalOpen(true);
  };

  const handleLanguageTranslationRowClick = (rowData: LanguageTranslation) => {
    setValueForm(rowData);
  };

  // Save language
  const handleSaveLanguage = async () => {
    try {
      setLanguageModalOpen(false);
      if (languages?.id) {
        await updateLanguage({ ...languages }).unwrap();
        dispatch(
          notify({
            msg: 'The language has been updated successfully',
            sev: 'success'
          })
        );
      } else {
        await addLanguage({ ...languages }).unwrap();
        dispatch(
          notify({
            msg: 'The language has been saved successfully',
            sev: 'success'
          })
        );
      }
      refetchLangs();
    } catch {
      dispatch(
        notify({
          msg: 'Failed to save this language',
          sev: 'error'
        })
      );
    }
  };

  // Save translation
  const handleSaveTranslation = async () => {
    try {
      setValueModalOpen(false);
      if (valueForm?.id) {
        await updateTranslation({ ...valueForm }).unwrap();
        dispatch(
          notify({
            msg: 'The Translation has been updated successfully',
            sev: 'success'
          })
        );
      } else {
        await addTranslation({
          ...valueForm,
          originalText: valueForm.translationKey
        }).unwrap();
        dispatch(
          notify({
            msg: 'The Translation has been saved successfully',
            sev: 'success'
          })
        );
      }
      if (usePaged) refetchPaged();
      else refetchTrans();
    } catch {
      dispatch(
        notify({
          msg: 'Failed to save this translation',
          sev: 'error'
        })
      );
    }
  };

  // table controls
  const handlePageChange = (_: unknown, newPage: number) => setPageIndex(newPage);
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPageIndex(0);
  };
  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortBy(column);
    setSortType(type);
    setPageIndex(0);
  };

  // Global loader (queries + translations)
  useEffect(() => {
    const busy = langsLoading || langsFetching || translationsLoading;

    if (busy) {
      dispatch(showSystemLoader());
    } else {
      dispatch(hideSystemLoader());
    }

    return () => {
      dispatch(hideSystemLoader());
    };
  }, [langsLoading, langsFetching, translationsLoading, dispatch]);

  // ------------------ Filters UI (search box) ------------------
  const filters = (
    <Form layout="inline" fluid className="date-filter-form">
      <MyInput
        column
        width="14vw"
        showLabel={false}
        fieldName="search"
        record={searchTerm}
        setRecord={setSearchTerm}
        placeholder="Search by Value"
      />
    </Form>
  );

  return (
    <div className="padding-header-20">
      <div className="flex-center-between">
        <h5>Languages</h5>
      </div>

      <div className="grid-20">
        {/* Languages Section */}
        <LanguagesSection
          selectedLanguage={languages}
          languages={langData ?? []}
          loading={langsFetching || langsLoading}
          onRowClick={handleLanguageRowClick}
          onAdd={handleAddLanguage}
          onEdit={handleEditLanguage}
        />

        {/* Translations Section */}
        <TranslationsSection
          filters={filters}
          rows={rows}
          loading={translationsLoading}
          sortBy={sortBy}
          sortType={sortType}
          onSortChange={handleSortChange}
          pageIndex={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          selectedTranslation={valueForm}
          onRowClick={handleLanguageTranslationRowClick}
          onAdd={handleAddValue}
          onEdit={handleEditLanguageTranslation}
          languageSelected={Boolean(languages?.id)}
        />
      </div>

      {/* Language Modal */}
      <LanguageModal
        open={languageModalOpen}
        setOpen={setLanguageModalOpen}
        mode={languageModalMode}
        languages={languages}
        setLanguages={setLanguages}
        directionOptions={directionOptions ?? []}
        onSave={handleSaveLanguage}
      />

      {/* Translation Modal */}
      <TranslationModal
        open={valueModalOpen}
        setOpen={setValueModalOpen}
        valueForm={valueForm}
        setValueForm={setValueForm}
        onSave={handleSaveTranslation}
      />
    </div>
  );
};

export default LanguagesSetup;

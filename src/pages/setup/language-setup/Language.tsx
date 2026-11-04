import MyInput from '@/components/MyInput';
import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import {
  useAddLanguageMutation,
  useGetAllLanguagesQuery,
  useLazyGetLanguagesByNameQuery,
  useLazyGetLanguagesByCodeQuery,
  useLazyGetLanguagesByDirectionQuery,
  useUpdateLanguageMutation
} from '@/services/setup/languageService';

import {
  useAddTranslationMutation,
  useGetTranslationsByLangQuery,
  useLazyGetTranslationsQuery,
  useLazyGetTranslationsByKeyQuery,
  useLazyGetTranslationsByVerifiedQuery,
  useLazyGetTranslationsByTranslatedQuery,
  useLazyGetDictionaryQuery,
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
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import { setTranslations } from '@/reducers/uiSlice';
import { extractErrorMessage } from '@/utils';
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

  // ------------------ State: Filters ------------------
  const [recordOfLanguageFilter, setRecordOfLanguageFilter] = useState({
    filter: '',
    value: ''
  });
  const [isLanguageFiltered, setIsLanguageFiltered] = useState(false);
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>([]);

  const [recordOfFilter, setRecordOfFilter] = useState({
    filter: '',
    value: ''
  });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<LanguageTranslation[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);

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

  const [getLanguagesByName] = useLazyGetLanguagesByNameQuery();
  const [getLanguagesByCode] = useLazyGetLanguagesByCodeQuery();
  const [getLanguagesByDirection] = useLazyGetLanguagesByDirectionQuery();

  const [getTranslationsByKey] = useLazyGetTranslationsByKeyQuery();
  const [getTranslationsByValue] = useLazyGetTranslationsQuery();
  const [getTranslationsByVerified] = useLazyGetTranslationsByVerifiedQuery();
  const [getTranslationsByTranslated] = useLazyGetTranslationsByTranslatedQuery();

  // ------------------ Mutations ------------------
  const [addLanguage, addLanguageState] = useAddLanguageMutation();
  const [updateLanguage, updateLanguageState] = useUpdateLanguageMutation();
  const [addTranslation, addTranslationState] = useAddTranslationMutation();
  const [updateTranslation, updateTranslationState] = useUpdateTranslationMutation();

  const [getDictionary] = useLazyGetDictionaryQuery();
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);

  // Global loader integration for language mutations
  useEffect(() => {
    const busy = addLanguageState.isLoading || updateLanguageState.isLoading;
    if (busy) dispatch(showSystemLoader());
    else dispatch(hideSystemLoader());
  }, [addLanguageState.isLoading, updateLanguageState.isLoading, dispatch]);

  // ------------------ Translations of the selected language ------------------
  const langKey = languages?.langKey ?? '';

  const {
    data: transData = [],
    isFetching: unpagedFetching,
    refetch: refetchTrans
  } = useGetTranslationsByLangQuery(langKey, {
    skip: !langKey || isFiltered
  });

  // Loading flag for right table
  const translationsLoading = unpagedFetching;

  // ------------------ Local sorting/pagination (only when not filtered) ------------------
  const locallySorted = useMemo(() => {
    if (isFiltered) return [];
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
  }, [isFiltered, transData, sortBy, sortType]);

  const locallyPaged = useMemo(() => {
    if (isFiltered) return [];
    const start = pageIndex * rowsPerPage;
    return locallySorted.slice(start, start + rowsPerPage);
  }, [isFiltered, locallySorted, pageIndex, rowsPerPage]);

  // ------------------ Rows + total for table ------------------
  const rows: LanguageTranslation[] = isFiltered ? filteredList : locallyPaged;
  const totalCount: number = isFiltered ? filteredTotal : transData?.length ?? 0;

  // ------------------ Filter logic: Languages ------------------
  const languageFilterFields = [
    { label: 'Language Name', value: 'name' },
    { label: 'Language Code', value: 'code' },
    { label: 'Direction', value: 'direction' }
  ];

  const handleLanguageFilterChange = async (field: string, value: string) => {
    try {
      if (!field || !value) {
        setIsLanguageFiltered(false);
        setFilteredLanguages([]);
        return;
      }

      let response;

      if (field === 'name') {
        response = await getLanguagesByName(value).unwrap();
      } else if (field === 'code') {
        response = await getLanguagesByCode(value).unwrap();
      } else if (field === 'direction') {
        response = await getLanguagesByDirection(value).unwrap();
      }

      setFilteredLanguages(response ?? []);
      setIsLanguageFiltered(true);
    } catch (error) {
      console.error('Error filtering languages:', error);
      dispatch(notify({ msg: 'Failed to filter languages', sev: 'error' }));
      setIsLanguageFiltered(false);
    }
  };

  // ------------------ Filter logic: Translations ------------------
  const filterFields = [
    { label: 'Key', value: 'key' },
    { label: 'Value', value: 'value' },
    { label: 'Verify', value: 'verified' },
    { label: 'Translate', value: 'translated' }
  ];

  const handleFilterChange = async (
    field: string,
    value: string,
    page = 0,
    size?: number,
    sort?: string
  ) => {
    try {
      if (!langKey || !field || !value) {
        setIsFiltered(false);
        setFilteredList([]);
        return;
      }

      const currentSize = size ?? rowsPerPage;

      let response;
      const params = {
        lang: langKey,
        page,
        size: currentSize,
        sort: sort ?? `${sortBy},${sortType}`
      };

      if (field === 'key') {
        response = await getTranslationsByKey({ key: value, ...params }).unwrap();
      } else if (field === 'value') {
        response = await getTranslationsByValue({ value, ...params }).unwrap();
      } else if (field === 'verified') {
        response = await getTranslationsByVerified({ verified: value, ...params }).unwrap();
      } else if (field === 'translated') {
        response = await getTranslationsByTranslated({ translated: value, ...params }).unwrap();
      }

      setFilteredList(response?.data ?? []);
      setFilteredTotal(response?.totalCount ?? 0);
      setIsFiltered(true);
      setPageIndex(page);
      setRowsPerPage(currentSize);
    } catch (error) {
      console.error('Error filtering translations:', error);
      dispatch(notify({ msg: 'Failed to filter translations', sev: 'error' }));
      setIsFiltered(false);
    }
  };

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
    // The translation filter belongs to the previous language
    setRecordOfFilter({ filter: '', value: '' });
    setIsFiltered(false);
    setFilteredList([]);
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
      if (isLanguageFiltered) {
        handleLanguageFilterChange(recordOfLanguageFilter.filter, recordOfLanguageFilter.value);
      }
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
          ...valueForm
        }).unwrap();
        dispatch(
          notify({
            msg: 'The Translation has been saved successfully',
            sev: 'success'
          })
        );
      }
      if (isFiltered) handleFilterChange(recordOfFilter.filter, recordOfFilter.value, pageIndex);
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
  const handlePageChange = (_: unknown, newPage: number) => {
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
    } else {
      setPageIndex(newPage);
    }
  };
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value, 10);
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
    } else {
      setRowsPerPage(newSize);
      setPageIndex(0);
    }
  };
  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortBy(column);
    setSortType(type);
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, rowsPerPage, `${column},${type}`);
    } else {
      setPageIndex(0);
    }
  };

  const handleRefreshCache = async () => {
  const language = localStorage.getItem('language');

  if (!language) {
    return;
  }

  try {
    setIsRefreshingCache(true);

    const dict = await getDictionary(language).unwrap();

    localStorage.setItem('dict', JSON.stringify(dict));
    dispatch(setTranslations(dict));
    dispatch(
      notify({
        msg: 'Translation cache refreshed successfully',
        sev: 'success'
      })
    );
  } catch (error) {
     dispatch(
        notify({
          msg: extractErrorMessage(error) || 'Failed to Refresh Cache',
          sev: 'warning'
        })
      );
  } finally {
    setIsRefreshingCache(false);
  }
};

  // Global loader (queries + translations)
  useEffect(() => {
  const busy =
    langsLoading ||
    langsFetching ||
    translationsLoading ||
    isRefreshingCache;

  if (busy) {
    dispatch(showSystemLoader());
  } else {
    dispatch(hideSystemLoader());
  }

  return () => {
    dispatch(hideSystemLoader());
  };
}, [
  langsLoading,
  langsFetching,
  translationsLoading,
  isRefreshingCache,
  dispatch
]);

  // ------------------ Filters UI: Languages ------------------
  const languageFilters = (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        fieldName="filter"
        fieldType="select"
        selectData={languageFilterFields}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfLanguageFilter}
        setRecord={u => setRecordOfLanguageFilter({ filter: u.filter, value: '' })}
        placeholder="Select Filter"
        showLabel={false}
        width="180px"
      />

      {recordOfLanguageFilter.filter === 'direction' ? (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={directionOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfLanguageFilter}
          setRecord={u => setRecordOfLanguageFilter({ ...recordOfLanguageFilter, value: u.value })}
          showLabel={false}
          placeholder="Select Direction"
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfLanguageFilter}
          setRecord={setRecordOfLanguageFilter}
          placeholder="Enter Value"
          showLabel={false}
        />
      )}

      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() =>
          handleLanguageFilterChange(recordOfLanguageFilter.filter, recordOfLanguageFilter.value)
        }
      >
        Search
      </MyButton>
    </Form>
  );

  // ------------------ Filters UI: Translations ------------------
  const filters = (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        fieldName="filter"
        fieldType="select"
        selectData={filterFields}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={u => setRecordOfFilter({ filter: u.filter, value: '' })}
        placeholder="Select Filter"
        showLabel={false}
        width="180px"
      />

      {recordOfFilter.filter === 'verified' || recordOfFilter.filter === 'translated' ? (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={[
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
          placeholder={recordOfFilter.filter === 'verified' ? 'Select Verify' : 'Select Translate'}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          placeholder="Enter Value"
          showLabel={false}
        />
      )}

      <MyButton
        color="var(--deep-blue)"
        width="80px"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
      >
        Search
      </MyButton>
    </Form>
  );

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className="padding-header-20" dir={dir}>
      <div className="flex-center-between">
        <h5>Languages</h5>
      </div>
      <div className="grid-20">
        <div>
        <MyButton
          prefixIcon={() => <FontAwesomeIcon icon={faRefresh} />}
          onClick={handleRefreshCache}
          loading={isRefreshingCache}>
          Refresh Cache
        </MyButton>
        </div>
        {/* Languages Section */}
        <LanguagesSection
          filters={languageFilters}
          selectedLanguage={languages}
          languages={isLanguageFiltered ? filteredLanguages : langData ?? []}
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

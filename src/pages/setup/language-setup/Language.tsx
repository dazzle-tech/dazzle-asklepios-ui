import React, { useEffect, useMemo, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Radio, RadioGroup } from 'rsuite';
import './styles.less';

import {
  useGetAllLanguagesQuery,
  useAddLanguageMutation,
  useUpdateLanguageMutation,
} from '@/services/setup/languageService';

import {
  useAddTranslationMutation,
  useUpdateTranslationMutation,
  useGetTranslationsByLangQuery,
  // IMPORTANT: this is the unified paged endpoint
  useGetTranslationQuery,
  useGetTranslationsQuery
} from '@/services/setup/translationService';

import { newLanguage, newLanguageTranslation } from '@/types/model-types-constructor-new';
import { Language, LanguageTranslation } from '@/types/model-types-new';
import { notify, showSystemLoader, hideSystemLoader } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { useEnumCapitalized } from '@/services/enumsApi';

/**
 * LanguagesSetup – with server-side search + pagination + sorting for translations.
 *
 * Behavior:
 * - Select a language in the left table.
 * - Type in the "Search by Value" box:
 *    • If search is non-empty → server calls /api/setup/translations?lang=&value=&page=&size=&sort=
 *      using useGetTranslationsQuery (paged + proper totals).
 *    • If search is empty → falls back to /api/setup/translations/by-lang/{langKey} (unpaged).
 * - Table’s page/sort controls drive query params in paged mode; in unpaged mode we sort/paginate locally.
 */

const LanguagesSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  // ------------------ State: Languages (left table) ------------------
  const [languages, setLanguages] = useState<Language>({ ...newLanguage });
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [languageModalMode, setLanguageModalMode] = useState<'add' | 'edit'>('add');

  // ------------------ State: Translations (right table) ------------------
  const [valueForm, setValueForm] = useState<LanguageTranslation>({ ...newLanguageTranslation });
  const [valueModalOpen, setValueModalOpen] = useState(false);

  // Search + debounce
  const [searchTerm, setSearchTerm] = useState({ search: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(searchTerm.search.trim()), 300);
    return () => clearTimeout(h);
  }, [searchTerm.search]);

  // Paging/sorting (server-driven in paged mode)
  const [pageIndex, setPageIndex] = useState(0);              // 0-based
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('translationKey');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  // ------------------ Queries: Languages ------------------
  const {
    data: langData = [],
    isFetching: langsFetching,
    isLoading: langsLoading,
    refetch: refetchLangs,
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
    refetch: refetchPaged,
  } = useGetTranslationsQuery
  (
    usePaged
      ? {
          lang: langKey,
          value: debouncedSearch,
          page: pageIndex,
          size: rowsPerPage,
          sort: `${sortBy},${sortType}`,
        }
      : undefined,
    { skip: !usePaged }
  );

  // Unpaged fallback by language
  const {
    data: transData = [],
    isFetching: unpagedFetching,
    refetch: refetchTrans,
  } = useGetTranslationsByLangQuery(langKey, {
    skip: !langKey || usePaged,
  });

  // Loading flag for right table
  const translationsLoading = usePaged ? pagedFetching : unpagedFetching;

  // ------------------ Local sorting/pagination (only for unpaged mode) ------------------
  const locallySorted = useMemo(() => {
    if (usePaged) return []; // unused in paged mode
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
    if (usePaged) return []; // unused in paged mode
    const start = pageIndex * rowsPerPage;
    return locallySorted.slice(start, start + rowsPerPage);
  }, [usePaged, locallySorted, pageIndex, rowsPerPage]);

  // ------------------ Rows + total for table ------------------
  const rows: LanguageTranslation[] = usePaged ? (pagedData?.data ?? []) : locallyPaged;
  const totalCount: number = usePaged ? (pagedData?.totalCount ?? 0) : (transData?.length ?? 0);

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
    // reset paging when switching language
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
        dispatch(notify({ msg: 'The language has been updated successfully', sev: 'success' }));
      } else {
        await addLanguage({ ...languages }).unwrap();
        dispatch(notify({ msg: 'The language has been saved successfully', sev: 'success' }));
      }
      refetchLangs();
    } catch {
      dispatch(notify({ msg: 'Failed to save this language', sev: 'error' }));
    }
  };

  // Save translation
  const handleSaveTranslation = async () => {
    try {
      setValueModalOpen(false);
      if (valueForm?.id) {
        await updateTranslation({ ...valueForm }).unwrap();
        dispatch(notify({ msg: 'The Translation has been updated successfully', sev: 'success' }));
      } else {
        await addTranslation({ ...valueForm, originalText: valueForm.translationKey }).unwrap();
        dispatch(notify({ msg: 'The Translation has been saved successfully', sev: 'success' }));
      }
      if (usePaged) refetchPaged();
      else refetchTrans();
    } catch {
      dispatch(notify({ msg: 'Failed to save this translation', sev: 'error' }));
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

  useEffect(() => {
  const busy = langsLoading || langsFetching || translationsLoading;

  if (busy) {
    dispatch(showSystemLoader());
  } else {
    dispatch(hideSystemLoader());
  }

  // cleanup must return void
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

  // ------------------ Buttons ------------------
  const languageTableButtons = (
    <div className="flex-10">
      <MyButton prefixIcon={() => <FontAwesomeIcon icon={faPlus} />} onClick={handleAddLanguage}>
        New
      </MyButton>
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faEdit} />}
        onClick={handleEditLanguage}
        disabled={!languages?.id}
      >
        Edit
      </MyButton>
    </div>
  );

  const valueTableButtons = (
    <div className="flex-10">
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
        onClick={handleAddValue}
        disabled={!languages?.id}
      >
        New
      </MyButton>
      <MyButton
        prefixIcon={() => <FontAwesomeIcon icon={faEdit} />}
        onClick={handleEditLanguageTranslation}
        disabled={!valueForm?.id}
      >
        Edit
      </MyButton>
    </div>
  );

  return (
    <div className="padding-header-20">
      <div className="flex-center-between">
        <h5>Languages</h5>
      </div>

      <div className="grid-20">
        {/* Languages Table */}
        <SectionContainer
          title={
            <>
              <Translate>Languages</Translate>
              {languageTableButtons}
            </>
          }
          content={
            <MyTable
              data={langData ?? []}
              columns={[
                { key: 'langName', title: 'Language Name', dataKey: 'langName', width: 150 },
                { key: 'langKey', title: 'Language Code', dataKey: 'langKey', width: 150 },
                { key: 'direction', title: 'Direction', dataKey: 'direction', width: 100 },
              ]}
              height={400}
              loading={langsFetching || langsLoading}
              onRowClick={handleLanguageRowClick}
              rowClassName={(rowData: Language) => (languages?.id === rowData.id ? 'selected-row' : '')}
            />
          }
        />

        {/* Language Values Table */}
        <SectionContainer
          title={
            <>
              <Translate>Language Values</Translate>
              {valueTableButtons}
            </>
          }
          content={
            <MyTable
              filters={filters}
              data={rows}
              height={400}
              loading={translationsLoading}
              // server-side sort in paged mode; local sort in unpaged mode (we already applied)
              sortColumn={sortBy}
              sortType={sortType}
              onSortChange={(column, type) => handleSortChange(column, type)}
              // paging
              page={pageIndex}
              rowsPerPage={rowsPerPage}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              columns={[
                { key: 'translationKey', title: 'Key', dataKey: 'translationKey', width: 200 },
                { key: 'translationText', title: 'Value', dataKey: 'translationText', width: 200 },
                { key: 'verified', title: 'Verify', dataKey: 'verified', width: 80 },
                { key: 'translated', title: 'Translate', dataKey: 'translated', width: 80 },
              ]}
              onRowClick={handleLanguageTranslationRowClick}
              rowClassName={(rowData: LanguageTranslation) => (valueForm?.id === rowData.id ? 'selected-row' : '')}
            />
          }
        />
      </div>

      {/* Language Modal */}
      <MyModal
        open={languageModalOpen}
        setOpen={setLanguageModalOpen}
        title={languageModalMode === 'add' ? 'Add New Language' : 'Edit Language'}
        actionButtonFunction={handleSaveLanguage}
        size="22vw"
        bodyheight="38vh"
        content={
          <Form fluid>
            <MyInput
              fieldLabel="Language Name"
              fieldName="langName"
              fieldType="text"
              record={languages}
              setRecord={setLanguages}
              required
              width={300}
            />
            <MyInput
              fieldLabel="Language Code"
              fieldName="langKey"
              fieldType="text"
              disabled={Boolean(languages?.id)}
              record={languages}
              setRecord={setLanguages}
              required
              width={300}
            />
            <MyInput
              required
              column
              fieldLabel="Direction"
              fieldType="select"
              fieldName="direction"
              selectData={directionOptions ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              record={languages}
              setRecord={setLanguages}
              width={300}
              searchable={false}
            />
          </Form>
        }
      />

      {/* Translation Modal */}
      <MyModal
        open={valueModalOpen}
        setOpen={setValueModalOpen}
        title={valueForm?.id ? 'Edit Translation Value' : 'Add Translation Value'}
        size="24vw"
        bodyheight="52vh"
        content={
          <Form fluid>
            <MyInput
              fieldLabel="Key"
              fieldName="translationKey"
              fieldType="text"
              disabled={Boolean(valueForm?.id)}
              record={valueForm}
              setRecord={setValueForm}
              width="100%"
            />
            <MyInput
              fieldLabel="Value"
              fieldName="translationText"
              fieldType="textarea"
              record={valueForm}
              setRecord={setValueForm}
              width="100%"
            />
            <Form.Group>
              <Form.ControlLabel>Verify</Form.ControlLabel>
              <RadioGroup
                inline
                value={valueForm.verified ? 'Y' : 'N'}
                onChange={(val) => setValueForm((prev) => ({ ...prev, verified: val === 'Y' }))}
              >
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </RadioGroup>
            </Form.Group>
            <Form.Group>
              <Form.ControlLabel>Translate</Form.ControlLabel>
              <RadioGroup
                inline
                value={valueForm.translated ? 'Y' : 'N'}
                onChange={(val) => setValueForm((prev) => ({ ...prev, translated: val === 'Y' }))}
              >
                <Radio value="Y">Yes</Radio>
                <Radio value="N">No</Radio>
              </RadioGroup>
            </Form.Group>
          </Form>
        }
        actionButtonFunction={handleSaveTranslation}
      />
    </div>
  );
};

export default LanguagesSetup;

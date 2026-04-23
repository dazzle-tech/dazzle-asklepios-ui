import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetCatalogsByDepartmentAndNotQuery, useGetCatalogTestsQuery } from '@/services/setup/catalog/catalogTestService';
import {
  Checkbox,
  CircularProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';
import SearchIcon from '@rsuite/icons/Search';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Col, Form, Row } from 'rsuite';
import './styles.less';

const TransferTestList = ({
  open,
  leftItems = [],
  rightItems = [],
  setLeftItems,
  setRightItems,
  searchTerm,
  setSearchTerm,
  searchType,
  setSearchType,
  onLoadMore,
  isFetching
}) => {
  const mode = useSelector((state: any) => state.ui.mode);
  const [checked, setChecked] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const selectedDepartmentId = useSelector(
    (state: any) => state.auth?.selectedDepartment?.departmentId
  );

  const diagTypeResponse = useEnumOptions("TestType");

  const getItemType = (item: any) =>
    item?.type;

  /* ================= helpers ================= */

  const getItemKey = (item: any) => item?.id ?? item?.key;
  const getItemName = (item: any) => item?.testName ?? item?.name ?? '';

  const intersection = (a: any[], b: any[]) =>
    a.filter(v => b.includes(v));

  /* ================= computed ================= */

  const { data: catalogsResponse } =
    useGetCatalogsByDepartmentAndNotQuery(
      selectedDepartmentId
        ? {
          departmentId: selectedDepartmentId,
          page: 0,
          size: 1000,
        }
        : skipToken
    );


  const catalogs = catalogsResponse?.data ?? [];

  const { data: catalogTestsResponse } = useGetCatalogTestsQuery(
    searchType?.catalogId
      ? { catalogId: searchType.catalogId, page: 0, size: 1000 }
      : skipToken
  );

  const catalogTests = catalogTestsResponse?.data?.tests ?? [];


  const leftChecked = intersection(
    checked,
    leftItems.map(getItemKey)
  );

  const rightChecked = intersection(
    checked,
    rightItems.map(getItemKey)
  );


  const filteredLeft = useMemo(() => {
    return leftItems.filter(item => {
      const testId = getItemKey(item);

      // 🔹 name search
      const matchesName = getItemName(item)
        .toLowerCase()
        .includes((searchTerm ?? '').toLowerCase());

      // 🔹 type filter
      const selectedType = searchType?.type;
      const matchesType =
        !selectedType || getItemType(item) === selectedType;

      // 🔥 catalog filter (REAL SOURCE)
      const matchesCatalog =
        !searchType?.catalogId ||
        catalogTests.some(
          t => String(t.id) === String(testId)
        );

      return matchesName && matchesType && matchesCatalog;
    });
  }, [
    leftItems,
    searchTerm,
    searchType?.type,
    searchType?.catalogId,
    catalogTests
  ]);

  /* ================= handlers ================= */

  const handleToggle = (item: any) => () => {
    const key = getItemKey(item);
    setChecked(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleCheckedRight = () => {
    const selected = leftItems.filter(i =>
      leftChecked.includes(getItemKey(i))
    );

    setRightItems([...rightItems, ...selected]);
    setLeftItems(
      leftItems.filter(i => !leftChecked.includes(getItemKey(i)))
    );
    setChecked([]);
  };

  const handleCheckedLeft = () => {
    const selected = rightItems.filter(i =>
      rightChecked.includes(getItemKey(i))
    );

    setLeftItems([...leftItems, ...selected]);
    setRightItems(
      rightItems.filter(i => !rightChecked.includes(getItemKey(i)))
    );
    setChecked([]);
  };

  const handleAllRight = () => {
    setRightItems([...rightItems, ...leftItems]);
    setLeftItems([]);
    setChecked([]);
  };

  const handleAllLeft = () => {
    setLeftItems([...leftItems, ...rightItems]);
    setRightItems([]);
    setChecked([]);
  };

  /* ================= effects ================= */

  useEffect(() => {
    if (!open) return;
    setChecked([]);
    setSearchTerm('');
    setSearchType({});
  }, [open]);

  /* ================= render ================= */

  const renderList = (items: any[]) => (
    <Paper sx={{ height: '60vh', overflow: 'auto' }}>
      <List dense>
        {items.map(item => {
          const key = getItemKey(item);
          return (
            <ListItemButton
              key={key}
              onClick={handleToggle(item)}
              disabled={!!isFetching}
            >
              <ListItemIcon>
                <Checkbox checked={checked.includes(key)} />
              </ListItemIcon>
              <ListItemText primary={getItemName(item)} />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );

  const filteredCatalogs = useMemo(() => {
    if (!searchType?.type) return catalogs;

    return catalogs.filter(
      (catalog: any) => catalog.type === searchType.type
    );
  }, [catalogs, searchType?.type]);


  useEffect(() => {
    setSearchType(prev => ({
      ...prev,
      catalogId: undefined
    }));
  }, [searchType?.type]);


  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <Row>
        <Row>
          <Form fluid>
            <div className='transfer-test-list-inputs-handle'>
              <MyInput
                fieldName="type"
                fieldType="select"
                selectData={diagTypeResponse ?? []}
                selectDataLabel="label"
                selectDataValue="value"
                width={"20vw"}
                record={searchType}
                setRecord={setSearchType}
                disabled={!!isFetching}
              />

              <MyInput
                fieldName="catalogId"
                fieldType="select"
                fieldLabel="Catalog"
                selectData={filteredCatalogs ?? []}
                selectDataLabel="name"
                selectDataValue="id"
                width="20vw"
                record={searchType}
                setRecord={setSearchType}
                disabled={!!isFetching}
              />

            </div>
          </Form>
          <Form>
            <div className='test-name-field-main-container'>
              <MyInput
                fieldName="testName"
                fieldType="text"
                placeholder="Search Test"
                record={{ testName: searchInput }}
                setRecord={(r: any) => setSearchInput(r.testName)}
                width="100%"
                disabled={!!isFetching}
                showLabel={false}
                rightAddon={<SearchIcon className='search-icon-test-name-icon' onClick={() => setSearchTerm(searchInput)} />}
                enterClick={() => {
                  setSearchTerm(searchInput);
                }}
              />
            </div>

          </Form>
        </Row>

        <Row
          style={{
            position: 'relative',
            padding: 10,
            borderRadius: 5,
            background:
              mode === 'light' ? '#F8FAFE' : 'var(--extra-dark-black)'
          }}
        >
          {isFetching && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.25)',
                zIndex: 10
              }}
            >
              <CircularProgress size={32} />

            </div>
          )}

          <Col md={10}>
            <Paper sx={{ height: '60vh', display: 'flex', flexDirection: 'column' }}>

              <div style={{ flex: 1, overflow: 'auto' }}>
                {renderList(filteredLeft)}
              </div>
              <div style={{ textAlign: 'center', padding: 10 }}>
                <MyButton
                  appearance="ghost"
                  onClick={() => {
                    console.log("CLICKED BUTTON 🔥");
                    onLoadMore?.();
                  }}
                  disabled={isFetching}
                >
                  Load More
                </MyButton>
              </div>

            </Paper>
          </Col>


          <Col md={4} style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'stretch',
                height: '100%'
              }}
            >
              <div style={{ flex: 1 }}>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px',
                  minWidth: '50px'
                }}
              >
                <MyButton appearance='ghost' onClick={handleAllRight} disabled={!leftItems.length}>≫</MyButton>
                <MyButton appearance='ghost' onClick={handleCheckedRight} disabled={!leftChecked.length}>&gt;</MyButton>
                <MyButton appearance='ghost' onClick={handleCheckedLeft} disabled={!rightChecked.length}>&lt;</MyButton>
                <MyButton appearance='ghost' onClick={handleAllLeft} disabled={!rightItems.length}>≪</MyButton>
              </div>

              <div style={{ flex: 1 }}>
              </div>
            </div>
          </Col>
          <Col md={10}>{renderList(rightItems)}</Col>
        </Row>
      </Row>
    </div>
  );
};

export default TransferTestList;

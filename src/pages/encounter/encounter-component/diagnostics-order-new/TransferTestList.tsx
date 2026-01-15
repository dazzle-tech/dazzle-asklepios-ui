import React, { useEffect, useState } from 'react';
import {
  Checkbox,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  CircularProgress
} from '@mui/material';
import { Col, Form, Row } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import { useSelector } from 'react-redux';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { useEnumOptions } from '@/services/enumsApi';

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
  isFetching
}) => {
  const mode = useSelector((state: any) => state.ui.mode);
  const [checked, setChecked] = useState<any[]>([]);

      const diagTypeResponse = useEnumOptions("TestType");
    

  /* ================= helpers ================= */

  const getItemKey = (item: any) => item?.id ?? item?.key;
  const getItemName = (item: any) => item?.testName ?? item?.name ?? '';

  const intersection = (a: any[], b: any[]) =>
    a.filter(v => b.includes(v));

  /* ================= computed ================= */

  const leftChecked = intersection(
    checked,
    leftItems.map(getItemKey)
  );

  const rightChecked = intersection(
    checked,
    rightItems.map(getItemKey)
  );

  const filteredLeft = leftItems.filter(item =>
    getItemName(item)
      .toLowerCase()
      .includes((searchTerm ?? '').toLowerCase())
  );

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


  return (
    <Row>
      <Row>
        <Col md={24}>
          <Form fluid>
            <MyInput
              fieldName="type"
              fieldType="select"
              selectData={diagTypeResponse ?? []}
              selectDataLabel="label"
              selectDataValue="value"
              width={"100%"}
              record={searchType}
              setRecord={setSearchType}
              disabled={!!isFetching}
            />
          </Form>
        </Col>
<Col md ={24}>
</Col>
        <Col md={24}>
          <TextField
            label="Search Test"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            disabled={!!isFetching}
          />
        </Col>
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

        <Col md={10}>{renderList(filteredLeft)}</Col>

        <Col md={4} style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'stretch', // 👈 مهم
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
  );
};

export default TransferTestList;

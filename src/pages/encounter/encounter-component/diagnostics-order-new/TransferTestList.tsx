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

  const [checked, setChecked] = useState<string[]>([]);
  const [left, setLeft] = useState<any[]>(leftItems || []);
  const [right, setRight] = useState<any[]>(rightItems || []);

  const { data: diagTypesLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_TEST-TYPES');

  useEffect(() => {
    setLeft(leftItems || []);
  }, [leftItems]);

useEffect(() => {
  if (!rightItems) return;

  setRight(prev => {

    if (prev.length > 0 && rightItems.length === 0) {
      return prev;
    }
    const prevKeys = prev.map(i => i.key).sort().join(',');
    const nextKeys = rightItems.map(i => i.key).sort().join(',');

    if (prevKeys === nextKeys) {
      return prev;
    }

    return rightItems;
  });
}, [rightItems]);

  const intersection = (array1: any[], array2: any[]) => array1.filter(value => array2.includes(value));
  const not = (array1: any[], array2: any[]) =>
    array1.filter(value => !array2.some((x: any) => x.key === value.key));

  const leftChecked = intersection(checked, left.map(item => item.key));
  const rightChecked = intersection(checked, right.map(item => item.key));

  const handleToggle = (item: any) => () => {
    const currentIndex = checked.indexOf(item.key);
    const newChecked = [...checked];

    if (currentIndex === -1) newChecked.push(item.key);
    else newChecked.splice(currentIndex, 1);

    setChecked(newChecked);
  };

  const handleAllRight = () => {
    const newRight = right.concat(left);
    setRight(newRight);
    setLeft([]);
    setRightItems(newRight);
    setLeftItems([]);
    setChecked([]); // optional clear
  };

  const handleCheckedRight = () => {
    const selectedItems = left.filter(item => leftChecked.includes(item.key));
    const newRight = right.concat(selectedItems);
    const newLeft = not(left, selectedItems);

    setRight(newRight);
    setLeft(newLeft);
    setChecked(checked.filter(k => !leftChecked.includes(k)));

    setRightItems(newRight);
    setLeftItems(newLeft);
  };

  const handleCheckedLeft = () => {
    const selectedItems = right.filter(item => rightChecked.includes(item.key));
    const newLeft = left.concat(selectedItems);
    const newRight = not(right, selectedItems);

    setLeft(newLeft);
    setRight(newRight);
    setChecked(checked.filter(k => !rightChecked.includes(k)));

    setLeftItems(newLeft);
    setRightItems(newRight);
  };

  const handleAllLeft = () => {
    const newLeft = left.concat(right);
    setLeft(newLeft);
    setRight([]);
    setLeftItems(newLeft);
    setRightItems([]);
    setChecked([]); // optional clear
  };

  const customList = (items: any[]) => (
    <Paper sx={{ height: '60vh', overflow: 'auto' }}>
      <List dense component="div" role="list">
        {items.map(item => {
          const labelId = `transfer-list-item-${item.key}-label`;
          return (
            <ListItemButton
              key={item.key}
              role="listitem"
              onClick={handleToggle(item)}
              disabled={!!isFetching}
            >
              <ListItemIcon>
                <Checkbox
                  checked={checked.includes(item.key)}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': labelId }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={item.testName} />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );

  const filteredLeft = left.filter(item =>
    (item.testName ?? '').toLowerCase().includes((searchTerm ?? '').toLowerCase())
  );

useEffect(() => {
  if (!open) return;
  setChecked([]);
  setLeft(leftItems || []);
  setRight(rightItems || []);
  setSearchTerm('');
  setSearchType({});
}, [open]);

  return (
    <Row>
      <Row>
        <Col md={24} style={{ marginBottom: '10px' }}>
          <Form fluid>
            <MyInput
              width="100%"
              fieldName="type"
              fieldType="select"
              selectData={diagTypesLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              fieldLabel="Type"
              selectDataValue="key"
              record={searchType}
              setRecord={setSearchType}
              searchable={false}
              disabled={!!isFetching}
            />
          </Form>
        </Col>

        <Col md={24}>
          <TextField
            label="Search Test"
            variant="outlined"
            size="small"
            fullWidth
            sx={{ mb: 1 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            disabled={!!isFetching}
          />
        </Col>
      </Row>

      <Row
        style={{
          position: 'relative',
          backgroundColor: mode === 'light' ? '#F8FAFE' : 'var(--extra-dark-black)',
          padding: '10px',
          borderRadius: '5px'
        }}
      >
        {isFetching && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: mode === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.35)',
              borderRadius: '5px'
            }}
          >
            <CircularProgress size={34} />
          </div>
        )}

        <Col md={10}>{customList(filteredLeft)}</Col>

        <Col md={4}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60vh'
            }}
          >
            <Row>
              <MyButton
                appearance="ghost"
                width={50}
                onClick={handleAllRight}
                disabled={!!isFetching || left.length === 0}
              >
                ≫
              </MyButton>
            </Row>
            <Row>
              <MyButton
                appearance="ghost"
                width={50}
                onClick={handleCheckedRight}
                disabled={!!isFetching || leftChecked.length === 0}
              >
                &gt;
              </MyButton>
            </Row>
            <Row>
              <MyButton
                appearance="ghost"
                width={50}
                onClick={handleCheckedLeft}
                disabled={!!isFetching || rightChecked.length === 0}
              >
                &lt;
              </MyButton>
            </Row>
            <Row>
              <MyButton
                appearance="ghost"
                width={50}
                onClick={handleAllLeft}
                disabled={!!isFetching || right.length === 0}
              >
                ≪
              </MyButton>
            </Row>
          </div>
        </Col>

        <Col md={10}>{customList(right)}</Col>
      </Row>
    </Row>
  );
};

export default TransferTestList;
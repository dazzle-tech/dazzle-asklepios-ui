import React, { useEffect } from 'react';
import { Button, Checkbox, List, ListItemButton, ListItemIcon, ListItemText, Paper, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Col, Row } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import { useSelector } from 'react-redux';
import {
  useGetAllActiveDiagnosticTestsQuery,
  useGetDiagnosticTestsByNameQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';

const TransferTestList = ({ leftItems = [], rightItems = [], setLeftItems, setRightItems, searchTerm, setSearchTerm }) => {
    const mode = useSelector((state: any) => state.ui.mode);
    const [checked, setChecked] = React.useState([]);
    const [left, setLeft] = React.useState(leftItems || []);
    const [right, setRight] = React.useState(rightItems || []);

    // Fetch all active diagnostic tests from new backend
    const { data: allTestsData, isFetching: isLoadingAll } = useGetAllActiveDiagnosticTestsQuery(
        {
            page: 0,
            size: 1000,
            sort: 'id,asc'
        },
        {
            skip: !!searchTerm?.trim()
        }
    );

    // Fetch tests by name when search term is provided
    const { data: searchTestsData, isFetching: isLoadingSearch } = useGetDiagnosticTestsByNameQuery(
        {
            name: searchTerm || '',
            page: 0,
            size: 1000
        },
        {
            skip: !searchTerm || searchTerm.trim() === ''
        }
    );

    // Determine which data to use (search results or all tests)
    const fetchedTestsData = searchTerm?.trim() ? searchTestsData : allTestsData;
    const isLoading = searchTerm?.trim() ? isLoadingSearch : isLoadingAll;

    // Helper to get consistent key/id from an item
    const getItemKey = (item) => {
        const key = item?.key || item?.id;
        return key ? key.toString() : null;
    };

    // Get available tests (exclude already selected ones from right side)
    const availableTests = React.useMemo(() => {
        const allTests = fetchedTestsData?.data || [];
        const selectedKeys = right.map(getItemKey).filter(Boolean);
        
        return allTests.filter(test => {
            const testKey = getItemKey(test);
            return testKey && !selectedKeys.includes(testKey);
        });
    }, [fetchedTestsData, right]);

    // Update left items when data is fetched
    useEffect(() => {
        if (availableTests.length > 0 || (!isLoading && fetchedTestsData)) {
            setLeft(availableTests);
            // Update parent if setLeftItems is provided (for backward compatibility)
            if (setLeftItems) {
                setLeftItems(availableTests);
            }
        }
    }, [availableTests, isLoading, fetchedTestsData, setLeftItems]);

    // Sync right items with props
    useEffect(() => {
        setRight(rightItems || []);
    }, [rightItems]);
    
    const intersection = (array1, array2) => array1.filter(value => array2.includes(value));
    const not = (array1, array2) => array1.filter(value => !array2.includes(value));

    const leftChecked = intersection(checked, left.map(getItemKey).filter(Boolean));
    const rightChecked = intersection(checked, right.map(getItemKey).filter(Boolean));

    const handleToggle = (value) => () => {
        const itemKey = getItemKey(value);
        if (!itemKey) return;
        
        const currentIndex = checked.indexOf(itemKey);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(itemKey);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setChecked(newChecked);
    };

    const handleAllRight = () => {
        const newRight = right.concat(left);
        setRight(newRight);
        setLeft([]);
        setRightItems(newRight);
        if (setLeftItems) {
            setLeftItems([]);
        }
    };

    const handleCheckedRight = () => {
        const selectedItems = left.filter(item => leftChecked.includes(getItemKey(item)));
        const newRight = right.concat(selectedItems);
        const newLeft = not(left, selectedItems);
        setRight(newRight);
        setLeft(newLeft);
        setChecked(not(checked, leftChecked));
        setRightItems(newRight);
        if (setLeftItems) {
            setLeftItems(newLeft);
        }
    };

    const handleCheckedLeft = () => {
        const selectedItems = right.filter(item => rightChecked.includes(getItemKey(item)));
        const newLeft = left.concat(selectedItems);
        const newRight = not(right, selectedItems);
        setLeft(newLeft);
        setRight(newRight);
        setChecked(not(checked, rightChecked));
        if (setLeftItems) {
            setLeftItems(newLeft);
        }
        setRightItems(newRight);
    };

    const handleAllLeft = () => {
        const newLeft = left.concat(right);
        setLeft(newLeft);
        setRight([]);
        if (setLeftItems) {
            setLeftItems(newLeft);
        }
        setRightItems([]);
    };

    const customList = (items) => (
        <Paper sx={{ height: '60vh', overflow: 'auto' }}>
            <List dense component="div" role="list">
                {isLoading ? (
                    <ListItemText primary="Loading tests..." />
                ) : items.length === 0 ? (
                    <ListItemText primary="No tests available" />
                ) : (
                    items.map((item) => {
                        if (!item) return null;
                        const itemKey = getItemKey(item);
                        if (!itemKey) return null;
                        const labelId = `transfer-list-item-${itemKey}-label`;

                        return (
                            <ListItemButton key={itemKey} role="listitem" onClick={handleToggle(item)}>
                                <ListItemIcon>
                                    <Checkbox
                                        checked={checked.includes(itemKey)}
                                        tabIndex={-1}
                                        disableRipple
                                        inputProps={{ 'aria-labelledby': labelId }}
                                    />
                                </ListItemIcon>
                                <ListItemText id={labelId} primary={item?.testName || item?.name || 'Unknown Test'} />
                            </ListItemButton>
                        );
                    })
                )}
            </List>
        </Paper>
    );

    // Backend handles filtering when searchTerm is provided
    // Only filter locally if searchTerm is provided but backend search isn't used
    const filteredLeft = left;

    return (
        <Row>
            <Row>
                <Col md={24}>
                    <TextField
                        label="Search Test"
                        variant="outlined"
                        size="small"
                        fullWidth
                        sx={{ mb: 1 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    /></Col>

            </Row>
            <Row style={{backgroundColor: mode === 'light' ? '#F8FAFE' : 'var(--extra-dark-black)' ,padding: '10px', borderRadius: '5px'}}>
                <Col md={10}> {customList(filteredLeft)}</Col>
                <Col md={4}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '60vh',
                    }}>

                        <Row>
                            <MyButton appearance='ghost' width={50} onClick={handleAllRight} disabled={left.length === 0}> ≫ </MyButton>
                        </Row>
                        <Row>
                            <MyButton appearance='ghost' width={50} onClick={handleCheckedRight} disabled={leftChecked.length === 0}> &gt; </MyButton>
                        </Row>
                        <Row>
                            <MyButton appearance='ghost' width={50} onClick={handleCheckedLeft} disabled={rightChecked.length === 0}> &lt; </MyButton>
                        </Row>
                        <Row>
                            <MyButton appearance='ghost' width={50} onClick={handleAllLeft} disabled={right.length === 0}> ≪ </MyButton>
                        </Row>
                    </div>
                </Col>
                <Col md={10}>
                    {customList(right)}
                </Col>
            </Row>

        </Row>

    );
};

export default TransferTestList;

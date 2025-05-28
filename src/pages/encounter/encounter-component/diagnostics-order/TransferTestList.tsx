import React from 'react';
import { Button, Checkbox, List, ListItemButton, ListItemIcon, ListItemText, Paper, TextField } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Col, Row } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';

const TransferTestList = ({ leftItems = [], rightItems = [], setLeftItems, setRightItems,searchTerm,setSearchTerm}) => {
    const [checked, setChecked] = React.useState([]);
    const [left, setLeft] = React.useState(leftItems || []);
    const [right, setRight] = React.useState(rightItems || []);
    

    const intersection = (array1, array2) => array1.filter(value => array2.includes(value));
    const not = (array1, array2) => array1.filter(value => !array2.includes(value));

    const leftChecked = intersection(checked, left.map(item => item.key));
    const rightChecked = intersection(checked, right.map(item => item.key));

    const handleToggle = (value) => () => {
        const currentIndex = checked.indexOf(value.key);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(value.key);
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
        setLeftItems([]);
    };

    const handleCheckedRight = () => {
        const selectedItems = left.filter(item => leftChecked.includes(item.key));
        const newRight = right.concat(selectedItems);
        const newLeft = not(left, selectedItems);
        setRight(newRight);
        setLeft(newLeft);
        setChecked(not(checked, leftChecked));
        setRightItems(newRight);
        setLeftItems(newLeft);
    };

    const handleCheckedLeft = () => {
        const selectedItems = right.filter(item => rightChecked.includes(item.key));
        const newLeft = left.concat(selectedItems);
        const newRight = not(right, selectedItems);
        setLeft(newLeft);
        setRight(newRight);
        setChecked(not(checked, rightChecked));
        setLeftItems(newLeft);
        setRightItems(newRight);
    };

    const handleAllLeft = () => {
        const newLeft = left.concat(right);
        setLeft(newLeft);
        setRight([]);
        setLeftItems(newLeft);
        setRightItems([]);
    };

    const customList = (items) => (
        <Paper sx={{ height: '60vh', overflow: 'auto' }}>
            <List dense component="div" role="list">
                {items.map((item) => {
                    const labelId = `transfer-list-item-${item.key}-label`;

                    return (
                        <ListItemButton key={item.key} role="listitem" onClick={handleToggle(item)}>
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
        item.testName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
            <Row style={{backgroundColor:'#F8FAFE' ,padding: '10px', borderRadius: '5px'}}>
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

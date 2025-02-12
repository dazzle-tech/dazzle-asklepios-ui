import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { Input, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetLovValuesQuery, useSaveLovValueMutation } from '@/services/setupService';
import { Button, ButtonToolbar, Carousel, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApLovValues } from '@/types/model-types';
import { newApLovValues } from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import ArowBackIcon from '@rsuite/icons/ArowBack';

import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';

const LovValues = ({ lov, goBack, ...props }) => {
  const [lovValue, setLovValue] = useState<ApLovValues>({ ...newApLovValues, valueColor: "#ffffff" });
  const [lovValuePopupOpen, setLovValuePopupOpen] = useState(false);

   const dispatch = useAppDispatch();


  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  const [parentLovValueListRequest, setParentLovValueListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });

  const [saveLovValue, saveLovValueMutation] = useSaveLovValueMutation();

  const { data: lovValueListResponse } = useGetLovValuesQuery(listRequest);
  const [isdefault, setIsDefault] = useState(false);
  const { data: parentLovValueListResponse } = useGetLovValuesQuery(parentLovValueListRequest);

  useEffect(() => {
    console.log(lov)
    if (lov && lov.key) {
      setListRequest(addFilterToListRequest('lov_key', 'match', lov.key, listRequest));

    }
    setLovValuePopupOpen(false);
    setLovValue({ ...newApLovValues, valueColor: "#ffffff" });

    if (lov.parentLov) {
      // load the master LOV values of the parent LOV
      setParentLovValueListRequest({
        ...addFilterToListRequest('lov_key', 'match', lov.parentLov, parentLovValueListRequest),
        ignore: false
      });
    }
  }, [lov]);
  useEffect(() => {
    if (lovValueListResponse?.object) {
      const foundDefault = lovValueListResponse.object.find(Default => {

        return Default.isdefault === true;
      });
      console.log(foundDefault?.key)
      if (foundDefault?.key != null) {
        setIsDefault(true);
      }
      else {
        setIsDefault(false);
      }
    }
    console.log(isdefault);
  }, [lovValueListResponse]);

  useEffect(() => {
    console.log(parentLovValueListResponse);
  }, [parentLovValueListResponse]);

  const handleLovValueNew = () => {
    setLovValuePopupOpen(true);
    setLovValue({ ...newApLovValues, lovKey: lov.key, lovCode: lov.lovCode });
  };

  const handleLovValueSave = () => {
    setLovValuePopupOpen(false);
    console.log("LovValue:",lovValue);
    saveLovValue(lovValue).unwrap().then(()=>{
      
       dispatch(notify({ msg: 'Saved Successfully',sev: 'success'}));
    });
  };

  useEffect(() => {
    if (saveLovValueMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveLovValueMutation.data]);

  const isSelected = rowData => {
    if (rowData && lovValue && rowData.key === lovValue.key) {
      return 'selected-row';
    } else return '';
  };

  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({
        ...initialListRequest,
        filters: [
          {
            fieldName: 'lov_key',
            operator: 'match',
            value: lov.key
          }
        ]
      });

    }
  };

  return (
    <>
      {lov && lov.key && (
        <Panel
          header={
            <h3 className="title">
              <Translate> List of Values for </Translate> <i>{lov?.lovName ?? ''}</i>
            </h3>
          }
        >
          <ButtonToolbar>
            <IconButton appearance="ghost" color="cyan" icon={<ArowBackIcon />} onClick={goBack}>
              Go Back
            </IconButton>
            <Divider vertical />
            <IconButton appearance="primary" icon={<AddOutlineIcon />} onClick={handleLovValueNew}>
              Add New
            </IconButton>
            <IconButton
              disabled={!lovValue.key}
              appearance="primary"
              onClick={() => setLovValuePopupOpen(true)}
              color="green"
              icon={<EditIcon />}
            >
              Edit Selected
            </IconButton>
            <IconButton
              disabled={true || !lovValue.key}
              appearance="primary"
              color="red"
              icon={<TrashIcon />}
            >
              Delete Selected
            </IconButton>
          </ButtonToolbar>
          <hr />
          <Table
            height={400}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortColumn={(sortBy, sortType) => {
              if (sortBy)
                setListRequest({
                  ...listRequest,
                  sortBy,
                  sortType
                });
            }}
            headerHeight={80}
            rowHeight={60}
            bordered
            cellBordered
            data={lovValueListResponse?.object ?? []}
            onRowClick={rowData => {
              setLovValue({ ...rowData, lovKey: lov.key, lovCode: lov.lovCode });
              console.log(rowData);
            }}
            rowClassName={isSelected}
          >
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('lovCode', e)} />
                <Translate>Lov Code</Translate>
              </HeaderCell>
              <Cell dataKey="lovCode" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('valueCode', e)} />
                <Translate>Value Code</Translate>
              </HeaderCell>
              <Cell dataKey="valueCode" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('lovDisplayVale', e)} />
                <Translate>Display Value</Translate>
              </HeaderCell>
              <Cell dataKey="lovDisplayVale" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('valueDescription', e)} />
                <Translate>Value Description</Translate>
              </HeaderCell>
              <Cell dataKey="valueDescription" />
            </Column>
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('valueOrder', e)} />
                <Translate>Value Order</Translate>
              </HeaderCell>
              <Cell dataKey="valueOrder" />
            </Column>
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Translate>Is Default</Translate>
              </HeaderCell>
              <Cell>{rowData => <span>{rowData.isdefault ? 'Yes' : 'No'}</span>}</Cell>
            </Column>
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Translate>Parent LOV Value</Translate>
              </HeaderCell>
              <Cell>
                {rowData => (
                  <span>
                    {conjureValueBasedOnKeyFromList(
                      lovValueListResponse?.object ?? [],
                      rowData.parentValueId,
                      'displayVale'
                    )}
                  </span>
                )}
              </Cell>
            </Column>
          </Table>
          <div style={{ padding: 20 }}>
            <Pagination
              prev
              next
              first
              last
              ellipsis
              boundaryLinks
              maxButtons={5}
              size="xs"
              layout={['limit', '|', 'pager']}
              limitOptions={[5, 15, 30]}
              limit={listRequest.pageSize}
              activePage={listRequest.pageNumber}
              onChangePage={pageNumber => {
                setListRequest({ ...listRequest, pageNumber });
              }}
              onChangeLimit={pageSize => {
                setListRequest({ ...listRequest, pageSize });
              }}
              total={lovValueListResponse?.extraNumeric ?? 0}
            />
          </div>

          <Modal open={lovValuePopupOpen} overflow>
            <Modal.Title>
              <Translate>New/Edit LovValue</Translate>
            </Modal.Title>
            <Modal.Body>

              <Form fluid>
                <MyInput fieldName="valueCode" record={lovValue} setRecord={setLovValue} />
                <MyInput fieldName="lovDisplayVale" record={lovValue} setRecord={setLovValue} />
                <MyInput
                  fieldName="valueDescription"
                  fieldType="textarea"
                  record={lovValue}
                  setRecord={setLovValue}
                />
                <MyInput
                  fieldName="valueOrder"
                  fieldType="number"
                  record={lovValue}
                  setRecord={setLovValue}
                />
                <MyInput
                  disabled={isdefault == true ? (lovValue.isdefault == true ? false : true) : false}
                  fieldName="isdefault"
                  fieldType="checkbox"
                  record={lovValue}
                  setRecord={setLovValue}
                />
                <MyInput
                  disabled={!lov.parentLov}
                  fieldName="parentValueId"
                  fieldType="select"
                  selectData={parentLovValueListResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={lovValue}
                  setRecord={setLovValue}
                />
              </Form>

              select color
              <Input
                type="color"
                value={lovValue.valueColor}
                onChange={(value) => setLovValue({ ...lovValue, valueColor: value })}

              />
            </Modal.Body>
            <Modal.Footer>
              <Stack spacing={2} divider={<Divider vertical />}>
                <Button appearance="primary" onClick={handleLovValueSave}>
                  Save
                </Button>
                <Button
                  appearance="primary"
                  color="red"
                  onClick={() => setLovValuePopupOpen(false)}
                >
                  Cancel
                </Button>
              </Stack>
            </Modal.Footer>
          </Modal>
        </Panel>
      )}

      {(!lov || !lov.key) && (
        <IconButton appearance="ghost" color="cyan" icon={<ArowBackIcon />} onClick={goBack}>
          No Valid Lov Header Selected, Go Back
        </IconButton>
      )}
    </>
  );
};

export default LovValues;

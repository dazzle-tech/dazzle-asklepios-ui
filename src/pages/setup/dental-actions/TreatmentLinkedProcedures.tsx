import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form, IconButton, SelectPicker } from 'rsuite';
import './styles.less';
import { FaTooth } from 'react-icons/fa';
import Translate from '@/components/Translate';
import { initialListRequest } from '@/types/types';
import { useGetCdtsQuery, useLinkCdtActionMutation } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { PiToothFill } from 'react-icons/pi';
import { newApCdtDentalAction } from '@/types/model-types-constructor';
import { Check, Trash } from '@rsuite/icons';
import MyButton from '@/components/MyButton/MyButton';
const TreatmentLinkedProcedures = ({ open, setOpen, dentalAction, setDentalAction }) => {
  const [linkCdtAction, linkCdtActionMutation] = useLinkCdtActionMutation();
  const [cdtMap, setCdtMap] = useState({});
  const [selectedCdtKey, setSelectedCdtKey] = useState('');
  const { data: cdtListResponse } = useGetCdtsQuery({
    ...initialListRequest,
    pageSize: 1000,
    skipDetails: true
  });
  useEffect(() => {
    // fill cdt procedure objects in a map with key as item key
    let map = {};
    for (const cdt of cdtListResponse?.object ?? []) {
      map[cdt.key] = cdt;
    }
    setCdtMap(map);
  }, [cdtListResponse]);

  useEffect(() => {
    if (linkCdtActionMutation.data) {
      // add the new linked procedure to selected action procedure list
      let currentProcedureList = [...dentalAction['linkedProcedures']];
      currentProcedureList.push(linkCdtActionMutation.data);
      let clone = { ...dentalAction };
      clone['linkedProcedures'] = currentProcedureList;
      setDentalAction({ ...clone });
    }
  }, [linkCdtActionMutation.data]);

  //Table columns
  const tableColumns = [
    {
      key: 'cdtKey',
      title: <Translate>CDT Key</Translate>,
      flexGrow: 4
    },
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      flexGrow: 4,
      render: rowData => cdtMap[rowData.cdtKey].description
    }

    // {
    //   key: 'icons',
    //   title: <Translate></Translate>,
    //   flexGrow: 3,
    //   render: rowData => iconsForActions(rowData)
    // }
  ];

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <SelectPicker
              placeholder="Select Procedure"
              data={cdtListResponse?.object ?? []}
              renderMenuItem={(label, item) => {
                return (
                  <div>
                    {item.key} / {item.description}
                  </div>
                );
              }}
              labelKey={'description'}
              valueKey="key"
              style={{ width: '300px' }}
              value={selectedCdtKey}
              onChange={e => {
                if (e) setSelectedCdtKey(e);
                else setSelectedCdtKey('');
              }}
            />
            {/* <IconButton
                appearance="primary"
                icon={<Check />}
                onClick={() => {
                  linkCdtAction({
                    ...newApCdtDentalAction,
                    dentalActionKey: dentalAction.key,
                    cdtKey: selectedCdtKey
                  }).unwrap();
                }}
              >
                Link CDT Procedure to Treatment
              </IconButton> */}
            <MyButton
              prefixIcon={() => <Check />}
              color="var(--deep-blue)"
              onClick={() => {
                  linkCdtAction({
                    ...newApCdtDentalAction,
                    dentalActionKey: dentalAction.key,
                    cdtKey: selectedCdtKey
                  }).unwrap();
                }}
              width="250px"
            >
               Link CDT Procedure to Treatment
            </MyButton>
            <MyTable
              height={450}
              data={dentalAction['linkedProcedures']}
              //   loading={isDentalActionFetching}
              columns={tableColumns}
              //   rowClassName={isSelected}
              //   filters={filters()}
              //   onRowClick={rowData => {
              //     setDentalAction(rowData);
              //   }}
              //   sortColumn={listRequest.sortBy}
              //   sortType={listRequest.sortType}
              //   onSortChange={(sortBy, sortType) => {
              //     if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
              //   }}
              //   page={pageIndex}
              //   rowsPerPage={rowsPerPage}
              //   totalCount={totalCount}
              //   onPageChange={handlePageChange}
              //   onRowsPerPageChange={handleRowsPerPageChange}
            />

            {/* <Table
            height={550}
            headerHeight={80}
            rowHeight={60}
            bordered
            cellBordered
            data={dentalAction['linkedProcedures']}
          >
            <Column sortable flexGrow={5}>
              <HeaderCell align="center">
                <Translate>CDT Key</Translate>
              </HeaderCell>
              <Cell>{rowData => rowData.cdtKey}</Cell>
            </Column>
            <Column sortable flexGrow={5}>
              <HeaderCell align="center">
                <Translate>Description</Translate>
              </HeaderCell>
              <Cell>{rowData => cdtMap[rowData.cdtKey].description}</Cell>
            </Column>
            <Column sortable flexGrow={1}>
              <HeaderCell align="center">
                <Translate>Remove</Translate>
              </HeaderCell>
              <Cell>
                {rowData => (
                  <IconButton
                    onClick={() => {
                      unlinkCdtAction({
                        ...newApCdtDentalAction,
                        dentalActionKey: rowData.dentalActionKey,
                        cdtKey: rowData.cdtKey
                      }).unwrap();
                    }}
                    color="red"
                    appearance="ghost"
                    icon={<Trash />}
                  />
                )}
              </Cell>
            </Column>
          </Table> */}
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Treatment Linked Procedures"
      position="right"
      content={conjureFormContent}
      actionButtonLabel={dentalAction?.key ? 'Save' : 'Create'}
      //   actionButtonFunction={handleSave}
      steps={[{ title: 'Treatment Linked Procedures', icon: <PiToothFill /> }]}
      //   size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default TreatmentLinkedProcedures;

import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import React, { useEffect, useState } from 'react';
import { Pagination, IconButton, Input, Panel, Table, Grid, Row, Divider , Checkbox, InputGroup } from 'rsuite';
import { Modal, Button, Toggle, Form } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { useNavigate } from 'react-router-dom';
import CheckOutlineIcon from '@rsuite/icons/CheckOutline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';

import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import { newApLovValues, newApEncounter } from '@/types/model-types-constructor';
import {
  useGetEncounterReviewOfSystemsQuery,
  useRemoveReviewOfSystemMutation,
  useSaveReviewOfSystemMutation,
  useSaveEncounterChangesMutation
} from '@/services/encounterService';
import MyCard from '@/components/MyCard';
import MyButton from '@/components/MyButton/MyButton';
import './styles.less';
import MyModal from '@/components/MyModal/MyModal';
import { time } from 'console';
const ReviewOfSystems = ({ patient, encounter }) => {

  const [openModel, setOpenModel] = useState(false);
  const dispatch = useAppDispatch();
  const [selectedSystem, setSelectedSystem] = useState({ ...newApLovValues });

  const [saveEncounterChanges, saveEncounterChangesMutation] = useSaveEncounterChangesMutation();
  const [localEncounter, setLocalEncounter] = useState({ ...encounter });
  const { data: bodySystemsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_SYS');
  const { data: bodySystemsDetailLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'BODY_SYS_DETAIL',
    parentValueKey: selectedSystem.key
  });

  const encounterReviewOfSystemsResponse = useGetEncounterReviewOfSystemsQuery(
    encounter.key
  );

  const { data: encounterReviewOfSystemsSummaryResponse, refetch } = useGetEncounterReviewOfSystemsQuery(encounter.key);

  const [saveReviewOfSystem, saveReviewOfSystemMutation] = useSaveReviewOfSystemMutation();
  const [removeReviewOfSystem, removeReviewOfSystemMutation] = useRemoveReviewOfSystemMutation();
  const [mainData, setMainData] = useState({});

  useEffect(() => {
    refetch();
  }, [saveReviewOfSystemMutation])
  useEffect(() => {

  }, [encounterReviewOfSystemsSummaryResponse, encounter.key])
  const closeModel = () => {
    setOpenModel(false);
  }
  const saveChanges = async () => {
    try {
      await saveEncounterChanges(localEncounter).unwrap();

      dispatch(notify('Findings Saved Successfully'));
    } catch (error) {
      console.error("Encounter save failed:", error);
      dispatch(notify('Findings Saved fill'));
    }
  };

  useEffect(() => {
    if (saveEncounterChangesMutation.status === 'fulfilled') {
      dispatch(setEncounter(saveEncounterChangesMutation.data));
      setLocalEncounter(saveEncounterChangesMutation.data);
    }
  }, [saveEncounterChangesMutation]);


  useEffect(() => {
    if (encounterReviewOfSystemsResponse.isSuccess) {
      buildMainData(encounterReviewOfSystemsResponse.data?.object ?? []);
    }
  }, [encounterReviewOfSystemsResponse]);

  useEffect(() => {
    if (saveReviewOfSystemMutation.isSuccess) {
      buildMainData(saveReviewOfSystemMutation.data);
    }
  }, [saveReviewOfSystemMutation]);

  useEffect(() => {
    if (removeReviewOfSystemMutation.isSuccess) {
      buildMainData(removeReviewOfSystemMutation.data);
    }
  }, [removeReviewOfSystemMutation]);

  const buildMainData = data => {
    const _map = {};
 
    if (data) {
      data.map(record => {
        _map[record.systemDetailLkey] = record;
      });
      setMainData(_map);
    }
  };

  const isSelected = rowData => {
    if (rowData && rowData.key === selectedSystem.key) {
      return 'selected-row';
    } else return '';
  };

  return (
    <>
      <Panel  >
        <Grid fluid>
        {/* <InputGroup>
              <InputGroup.Addon>
                <IconButton
                  circle

                  icon={<CheckOutlineIcon />}
                  size="xs"
                  appearance="primary"
                  color="green"
                  onClick={saveChanges}
                />
              </InputGroup.Addon>
              <Input
                as={'textarea'}
                rows={1}
                style={{ fontSize: '12px', maxHeight: '50px', overflowY: 'auto', resize: 'vertical' }}
                value={localEncounter.physicalExamSummery}
                onChange={e => setLocalEncounter({ ...localEncounter, physicalExamSummery: e })}

              />          
            </InputGroup> */}
          <div className='top-div'>

           <Translate>Physical Examination & Findings</Translate>
            <div className='bt-right'
            >
               <MyButton
                  onClick={() => setOpenModel(true)}
                 
                 prefixIcon={()=><icons.List  />}>Summary</MyButton>
            </div>

          </div>
         



            <div className='details-style'>
              <div className='system-style'>
                {bodySystemsLovQueryResponse?.object.map((item, index) => (

                  <MyCard
                    showArrow={true}
                    leftArrow={false}
                    arrowClick={() => setSelectedSystem(item)}
                    footerContant={item.lovDisplayVale}
                  ></MyCard>

                ))}</div>
           <div className='system-details'>
              <Table

                data={bodySystemsDetailLovQueryResponse?.object ?? []}

                maxHeight={300}
                autoHeight
                
              >
                <Table.Column flexGrow={1} fullText>
                  <Table.HeaderCell> </Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Checkbox
                        onChange={(value, checked) => {
                          
                          if (checked) {
                            saveReviewOfSystem({
                              key: mainData[rowData.key] ? mainData[rowData.key].key : undefined,
                              encounterKey: encounter.key,
                              bodySystemDetailKey: rowData.key,
                              systemLkey: String(selectedSystem.key),
                              notes: mainData[rowData.key] ? mainData[rowData.key].notes : ''
                            }).unwrap();
                            dispatch(notify('Findings Saved Successfully'));
                            refetch();

                          } else {
                            removeReviewOfSystem({
                              key: mainData[rowData.key] ? mainData[rowData.key].key : undefined,
                              encounterKey: encounter.key,
                              bodySystemDetailKey: rowData.key,
                              notes: mainData[rowData.key] ? mainData[rowData.key].notes : ''
                            }).unwrap();
                            dispatch(notify('Findings Deleted Successfully'));
                            refetch();
                          }
                        }}
                        checked={mainData[rowData.key] ? true : false}
                      />
                    )}
                  </Table.Cell>
                </Table.Column>
                <Table.Column flexGrow={2}>
                  <Table.HeaderCell>Detail</Table.HeaderCell>
                  <Table.Cell dataKey="lovDisplayVale" />
                </Table.Column>
                <Table.Column flexGrow={4}>
                  <Table.HeaderCell>Notes</Table.HeaderCell>
                  <Table.Cell>
                    {rowData => (
                      <Input
                        disabled={!mainData[rowData.key]}
                        value={mainData[rowData.key] ? mainData[rowData.key].notes : ''}
                        onChange={e => {
                          setMainData({
                            ...mainData,
                            [rowData.key]: {
                              ...mainData[rowData.key],
                              notes: e
                            }
                          });
                        }}
                        placeholder="Insert Notes"
                        onBlur={() => {
                          saveReviewOfSystem({
                            key: mainData[rowData.key].key,
                            encounterKey: encounter.key,
                            bodySystemDetailKey: rowData.key,
                            notes: mainData[rowData.key].notes
                          }).unwrap();
                        }}
                      />
                    )}
                  </Table.Cell>
                </Table.Column>
              </Table>
              <div className='pagination' >
              <Divider  />
              <Pagination
              
                prev
                next
                first
                last
                ellipsis
                boundaryLinks
                maxButtons={5}
                size="xs"
                layout={['total', '-', 'limit', '|', 'pager', 'skip']}
                limitOptions={[4, 15, 30]}
                // limit={listOrdersResponse.pageSize}
                // activePage={listOrdersResponse.pageNumber}

                // onChangePage={pageNumber => {
                //   setListOrdersResponse({ ...listOrdersResponse, pageNumber });
                // }}
                // onChangeLimit={pageSize => {
                //   setListOrdersResponse({ ...listOrdersResponse, pageSize });
                // }}
                total={bodySystemsDetailLovQueryResponse?.extraNumeric || 0}
              />
              </div>
              </div>
            </div>

         

        </Grid>
        <MyModal 
        open={openModel} 
        setOpen={setOpenModel}
        title="Summery"
        actionButtonFunction={closeModel}
        actionButtonLabel='Close'
        hideCanel
        steps={[

          {
            title: "Summery", icon:faListCheck ,
           
          },
        ]}
        content={
           <div className='summery-div'>
          
            {encounterReviewOfSystemsSummaryResponse?.object?.map((item, index) => (
              <div key={index} className='summery-div-child'>
                <p>{item.systemLkey}</p>
                <p>{item.systemDetailLvalue ? item.systemDetailLvalue.lovDisplayVale
                  : item.systemDetailLkey}</p>
                <p> {item.notes}</p>
              </div>
            ))}

         
        </div>}>
        </MyModal>
      </Panel>
    </>
  );
};

export default ReviewOfSystems;

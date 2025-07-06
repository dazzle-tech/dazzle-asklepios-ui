import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { setEncounter } from '@/reducers/patientSlice';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import * as icons from '@rsuite/icons';
import React, { useEffect, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { Checkbox, Divider, Grid, Input, Pagination, Panel } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyCard from '@/components/MyCard';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import {
  useGetEncounterReviewOfSystemsQuery,
  useRemoveReviewOfSystemMutation,
  useSaveEncounterChangesMutation,
  useSaveReviewOfSystemMutation
} from '@/services/encounterService';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { newApLovValues } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import './styles.less';
import Summary from './Summery';
const ReviewOfSystems = ({edit, patient, encounter }) => {

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

      dispatch(notify({msg:'Findings Saved Successfully',sev:'success'}));
    } catch (error) {
      console.error("Encounter save failed:", error);
      dispatch(notify({msg:'Findings Saved fill',sev:'success'}));
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
    const tableColumns = [
      {
        key: ' ',
        title: <Translate>#</Translate>,
        flexGrow: 1,
        render: rowData => (
          <Checkbox
          disabled={edit}
            onChange={(value, checked) => {
              
              if (checked) {
                saveReviewOfSystem({
                  key: mainData[rowData.key] ? mainData[rowData.key].key : undefined,
                  encounterKey: encounter.key,
                  bodySystemDetailKey: rowData.key,
                  systemLkey: String(selectedSystem.key),
                  notes: mainData[rowData.key] ? mainData[rowData.key].notes : ''
                }).unwrap();
                dispatch(notify({msg:'Findings Saved Successfully' ,sev:"success"}));
                refetch();

              } else {
                removeReviewOfSystem({
                  key: mainData[rowData.key] ? mainData[rowData.key].key : undefined,
                  encounterKey: encounter.key,
                  bodySystemDetailKey: rowData.key,
                  notes: mainData[rowData.key] ? mainData[rowData.key].notes : ''
                }).unwrap();
                dispatch(notify({msg:'Findings Deleted Successfully',sev:"success"}));
                refetch();
              }
            }}
            checked={mainData[rowData.key] ? true : false}
          />
        )
      },
      {
        key: 'detail',
        title: <Translate>Detail</Translate>,
        flexGrow: 2,
       dataKey:"lovDisplayVale"
      },
      {
        key: 'note',
        title: <Translate>Notes</Translate>,
        flexGrow: 4,
        render:rowData => (
          <Input
            disabled={(!mainData[rowData.key]) ||(edit)}
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
        )
      }
    ];
      const [pageIndex, setPageIndex] = useState(0);
        const [rowsPerPage, setRowsPerPage] = useState(5);
    
        const handlePageChange = (_: unknown, newPage: number) => {
            setPageIndex(newPage);
        }
        const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPageIndex(0);
    
        };
        const totalCount = bodySystemsDetailLovQueryResponse?.object?.length ?? 0;
        const paginatedData = bodySystemsDetailLovQueryResponse?.object?.slice(
            pageIndex * rowsPerPage,
            pageIndex * rowsPerPage + rowsPerPage
        );
  return (
    <>
      <Panel>
        <Grid fluid>
       
          <div className='top-div'>

           <Translate>Physical Examination & Findings</Translate>
            <div className='bt-right'
            >
               <MyButton
                  onClick={() => setOpenModel(true)}
                 
                 prefixIcon={()=><icons.List  />}>Findings</MyButton>
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
            <MyTable
            data={paginatedData ?? []}
            columns={tableColumns}
              page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            ></MyTable>

              </div>
            </div>
        </Grid>
  <Summary  open={openModel} setOpen={setOpenModel} list={encounterReviewOfSystemsSummaryResponse?.object} encounter={localEncounter} setEncounter={setLocalEncounter} saveEncounter={saveChanges}/>
      </Panel>
    </>
  );
};

export default ReviewOfSystems;

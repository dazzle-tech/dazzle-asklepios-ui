import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import * as icons from '@rsuite/icons';
import React, { useEffect, useMemo, useState } from 'react';
import 'react-tabs/style/react-tabs.css';
import { Checkbox, Grid, Input, Panel } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyCard from '@/components/MyCard';
import MyTable from '@/components/MyTable';
import {
  useCreateReviewOfSystemMutation,
  useDeleteReviewOfSystemByIdMutation,
  useGetReviewOfSystemByEncounterQuery,
  useUpdateReviewOfSystemMutation
} from '@/services/medicalsheetsEncounter/ReviewOfSystemService'; // ✅ new service
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { newApLovValues } from '@/types/model-types-constructor';
import { notify } from '@/utils/uiReducerActions';
import './styles.less';
import Summary from './Summery';

const ReviewOfSystems = ({ edit, patient, encounter , setEncounter, ...props }) => {
  const dispatch = useAppDispatch();

  const [openModel, setOpenModel] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState({ ...newApLovValues });


  const { data: bodySystemsLovQueryResponse } = useGetLovValuesByCodeQuery('BODY_SYS');
  const { data: bodySystemsDetailLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'BODY_SYS_DETAIL',
    parentValueKey: selectedSystem.key
  });

 
  const {
    data: rosList,
    refetch: refetchRos,
    isLoading: rosLoading
  } = useGetReviewOfSystemByEncounterQuery(encounter.id, { skip: !encounter?.id });

  const [createRos] = useCreateReviewOfSystemMutation();
  const [updateRos] = useUpdateReviewOfSystemMutation();
  const [deleteRos] = useDeleteReviewOfSystemByIdMutation();
 
  // mainData map: key = systemDetail (detailId), value = ros record
  const [mainData, setMainData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (rosList) {
      const _map: Record<string, any> = {};
      rosList.forEach((r: any) => {
        _map[String(r.systemDetail)] = r;
      });
      setMainData(_map);
    }
  }, [rosList]);


const handleClearSection = async () => {
  if (!selectedSystem?.key) return;

  try {
    const sectionItems =
      bodySystemsDetailLovQueryResponse?.object ?? [];

    for (const item of sectionItems) {
      const existing = mainData[String(item.key)];

      if (existing?.id) {
        await deleteRos(existing.id).unwrap();
      }
    }

    setMainData(prev => {
      const clone = { ...prev };

      sectionItems.forEach(item => {
        delete clone[String(item.key)];
      });

      return clone;
    });

    setSelectedSystem({ ...newApLovValues });

    refetchRos();

    dispatch(
      notify({
        msg: 'Section cleared successfully',
        sev: 'success'
      })
    );
  } catch (e) {
    dispatch(
      notify({
        msg: 'Failed to clear section',
        sev: 'error'
      })
    );
  }
};



  const totalCount = bodySystemsDetailLovQueryResponse?.object?.length ?? 0;
  const paginatedData = bodySystemsDetailLovQueryResponse?.object ?? [];

  const tableColumns = useMemo(
    () => [
      {
        key: 'check',
        title: <Translate>#</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const detailId = String(rowData.key);
          const existing = mainData[detailId]; // { id, bodySystem, systemDetail, note, ... }
          return (
            <Checkbox
              disabled={edit || !selectedSystem?.key}
              checked={!!existing}
              onChange={async (_value, checked) => {
                try {
                  if (checked) {
                    // ✅ Create (upsert behavior from backend) - store keys
                    const saved = await createRos({
                      patientId: patient.id, // ✅ adjust if your patient id field is patient.id not key
                      encounterId: encounter.id,
                      bodySystem: String(selectedSystem.key),
                      systemDetail: detailId,
                      note: existing?.note ?? ''
                    }).unwrap();

                    setMainData(prev => ({ ...prev, [detailId]: saved }));
                    dispatch(notify({ msg: 'Findings Saved Successfully', sev: 'success' }));
                  } else {
                    // ✅ Delete by id
                    if (existing?.id) {
                      await deleteRos(existing.id).unwrap();
                    }
                    setMainData(prev => {
                      const clone = { ...prev };
                      delete clone[detailId];
                      return clone;
                    });
                    dispatch(notify({ msg: 'Findings Deleted Successfully', sev: 'success' }));
                  }

                  refetchRos();
                } catch (e) {
                  console.error(e);
                  dispatch(notify({ msg: 'Action Failed', sev: 'error' }));
                }
              }}
            />
          );
        }
      },
      {
        key: 'detail',
        title: <Translate>Detail</Translate>,
        flexGrow: 2,
        dataKey: 'lovDisplayVale'
      },
      {
        key: 'note',
        title: <Translate>Notes</Translate>,
        flexGrow: 4,
        render: (rowData: any) => {
          const detailId = String(rowData.key);
          const existing = mainData[detailId];

          return (
            <Input
              disabled={!existing || edit}
              value={existing?.note ?? ''}
              placeholder="Insert Notes"
              onChange={val => {
                setMainData(prev => ({
                  ...prev,
                  [detailId]: { ...(prev[detailId] ?? {}), note: val }
                }));
              }}
              onBlur={async () => {
                try {
                  const current = mainData[detailId];
                  if (!current?.id) return;

                  const updated = await updateRos({
                    id: current.id,
                    patientId: current.patientId ?? patient.key,
                    encounterId: current.encounterId ?? encounter.key,
                    bodySystem: current.bodySystem ?? String(selectedSystem.key),
                    systemDetail: current.systemDetail ?? detailId,
                    note: current.note ?? ''
                  }).unwrap();

                  setMainData(prev => ({ ...prev, [detailId]: updated }));
                } catch (e) {
                  console.error(e);
                  dispatch(notify({ msg: 'Note Save Failed', sev: 'error' }));
                }
              }}
            />
          );
        }
      }
    ],
    [
      mainData,
      edit,
      selectedSystem?.key,
      patient?.key,
      encounter?.key,
      createRos,
      deleteRos,
      updateRos,
      refetchRos
    ]
  );




  return (
    <>
      <Panel>
        <Grid fluid>
          <div className="top-div">
            <div className="bt-right">
              <MyButton
                disabled={!selectedSystem?.key || edit}
                onClick={handleClearSection}
              >
                Clear
              </MyButton>

            <MyButton
              onClick={() => {
                setOpenModel(!openModel);
              }}
              disabled={edit}
              prefixIcon={() => <icons.List />}
            >
              Findings
            </MyButton>
            </div>
          </div>

          <div className="details-style">
            {openModel && (
              <div className="summary-popup">
                <Summary
                  list={rosList}
                  encounter={encounter}
                  setEncounter={setEncounter}
                  system={bodySystemsLovQueryResponse}
                />
              </div>
            )}
          <div className="system-container">
            <div className="system-style filter-form-disable-fix">
              {bodySystemsLovQueryResponse?.object?.map((item: any) => (
                <MyCard
                  key={item.key}
                  showArrow
                  leftArrow={false}
                  arrowClick={() => setSelectedSystem(item)}
                  footerContant={item.lovDisplayVale}
                  isSelected={selectedSystem?.key === item.key}
                />
              ))}
            </div>

            <div className="system-details">
              <MyTable
                data={paginatedData}
                columns={tableColumns}
                loading={rosLoading}
              />
            </div>
          </div>
          </div>
        </Grid>
      </Panel>
    </>
  );
};

export default ReviewOfSystems;

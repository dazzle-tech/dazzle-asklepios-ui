import React, { useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faPlus } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds } from '@/utils';
import {
  useGetDentalHistoriesByPatientQuery,
  useSaveDentalHistoryMutation,
  useUpdateDentalHistoryMutation
} from '@/services/dentalHistoryService';
import { useGetEncountersByIdsQuery } from '@/services/encounters/patientEncounterService';
import type { DentalHistory } from '@/types/model-types-new';

type DentalHistorySectionProps = {
  patient?: any;
  encounter?: any;
  disabled?: boolean;
};

const DentalHistorySection: React.FC<DentalHistorySectionProps> = ({
  patient,
  encounter,
  disabled = false
}) => {
  const dispatch = useAppDispatch();
  const patientId = Number(patient?.id ?? patient?.key);
  const encounterId = Number(encounter?.id);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ id?: number; historyText: string }>({ historyText: '' });

  const { data, isFetching } = useGetDentalHistoriesByPatientQuery(
    { patientId, page, size },
    { skip: !patientId }
  );
  const [saveHistory, saveState] = useSaveDentalHistoryMutation();
  const [updateHistory, updateState] = useUpdateDentalHistoryMutation();

  const rows = data?.data ?? [];

  const encounterIds = useMemo(
    () =>
      Array.from(
        new Set(
          rows
            .map(row => row.encounterId)
            .filter((id): id is number => id != null)
        )
      ),
    [rows]
  );

  const { data: encounters = [] } = useGetEncountersByIdsQuery(
    { ids: encounterIds },
    { skip: encounterIds.length === 0 }
  );

  const encounterNumberById = useMemo(() => {
    const map = new Map<number, string>();
    const currentId = Number(encounter?.id);
    if (currentId && encounter?.encounterNumber) {
      map.set(currentId, String(encounter.encounterNumber));
    }
    encounters.forEach(item => {
      if (item?.id != null && item.encounterNumber) {
        map.set(Number(item.id), String(item.encounterNumber));
      }
    });
    return map;
  }, [encounters, encounter]);

  const openAdd = () => {
    setDraft({ historyText: '' });
    setOpen(true);
  };

  const openEdit = (row: DentalHistory) => {
    setDraft({ id: row.id, historyText: row.historyText ?? '' });
    setOpen(true);
  };

  const handleSave = async () => {
    const historyText = draft.historyText?.trim();
    if (!historyText) {
      dispatch(notify({ msg: 'Dental history is required.', sev: 'warning' }));
      return;
    }
    if (!patientId || !encounterId) {
      dispatch(notify({ msg: 'Patient and encounter are required.', sev: 'warning' }));
      return;
    }

    try {
      if (draft.id) {
        await updateHistory({ id: draft.id, historyText }).unwrap();
        dispatch(notify({ msg: 'Dental history updated', sev: 'success' }));
      } else {
        await saveHistory({ patientId, encounterId, historyText }).unwrap();
        dispatch(notify({ msg: 'Dental history saved', sev: 'success' }));
      }
      setOpen(false);
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Failed to save dental history',
          sev: 'warning'
        })
      );
    }
  };

  return (
    <>
      <SectionContainer
        collapsible
        title={<Translate>Dental History</Translate>}
        action={
          <MyButton
            disabled={disabled || !encounterId}
            prefixIcon={() => <FontAwesomeIcon icon={faPlus} />}
            onClick={openAdd}
          >
            Add
          </MyButton>
        }
        content={
          <MyTable
            columns={[
              {
                key: 'historyText',
                title: <Translate>Dental History</Translate>,
                flexGrow: 3,
                render: (row: DentalHistory) => row.historyText || '-'
              },
              {
                key: 'encounterNumber',
                title: <Translate>Encounter</Translate>,
                flexGrow: 1,
                render: (row: DentalHistory) => {
                  if (!row.encounterId) return '-';
                  const number = encounterNumberById.get(Number(row.encounterId)) || '-';
                  const thisVisit =
                    Number(row.encounterId) === encounterId ? ' (this visit)' : '';
                  return `${number}${thisVisit}`;
                }
              },
              {
                key: 'createdByAt',
                title: <Translate>Created By / At</Translate>,
                flexGrow: 2,
                render: (row: DentalHistory) => (
                  <>
                    {row.createdBy ?? '-'}
                    <br />
                    <span className="date-table-style">
                      {formatDateWithoutSeconds(row.createdDate)}
                    </span>
                  </>
                )
              },
              {
                key: 'actions',
                title: <Translate>Actions</Translate>,
                flexGrow: 1,
                render: (row: DentalHistory) => (
                  <FontAwesomeIcon
                    icon={faPen}
                    style={{
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      color: disabled ? '#ccc' : 'var(--primary-gray)'
                    }}
                    onClick={() => {
                      if (!disabled) openEdit(row);
                    }}
                  />
                )
              }
            ]}
            data={rows}
            loading={isFetching}
            page={page}
            rowsPerPage={size}
            totalCount={data?.totalCount ?? rows.length}
            onPageChange={(_: unknown, newPage: number) => setPage(newPage)}
            onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setSize(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        }
      />

      <MyModal
        open={open}
        setOpen={setOpen}
        title={draft.id ? 'Edit Dental History' : 'Add Dental History'}
        size="36vw"
        position="right"
        steps={[{ title: 'Dental History' }]}
        actionButtonLabel={saveState.isLoading || updateState.isLoading ? 'Saving' : 'Save'}
        actionButtonFunction={handleSave}
        isDisabledActionBtn={saveState.isLoading || updateState.isLoading}
        content={() => (
          <Form fluid>
            <MyInput
              width="100%"
              height="140px"
              fieldType="textarea"
              fieldName="historyText"
              fieldLabel="Dental History"
              record={draft}
              setRecord={setDraft}
              required
            />
            <p className="dental-history-hint">
              This list shows every dental history recorded for the patient, including other visits.
              A new entry is saved on the current encounter.
            </p>
          </Form>
        )}
      />
    </>
  );
};

export default DentalHistorySection;

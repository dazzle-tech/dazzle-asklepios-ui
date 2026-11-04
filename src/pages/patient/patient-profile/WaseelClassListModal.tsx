import React, { useMemo } from 'react';
import { Message } from 'rsuite';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { PatientInsurance } from '@/types/model-types-new';

import { buildWaseelClassListDisplay } from './cchiMappers';

type WaseelClassListModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  insurance: PatientInsurance | null;
};

const classListColumns = [
  {
    key: 'classType',
    title: <Translate>Class Type</Translate>,
    width: 140
  },
  {
    key: 'className',
    title: <Translate>Class Name</Translate>,
    width: 220
  },
  {
    key: 'classValue',
    title: <Translate>Class Value</Translate>,
    width: 180
  }
];

const WaseelClassListModal: React.FC<WaseelClassListModalProps> = ({
  open,
  setOpen,
  insurance
}) => {
  const classList = useMemo(
    () => buildWaseelClassListDisplay(insurance),
    [insurance]
  );

  const planLabel =
    insurance?.policyClassName ||
    insurance?.planCode ||
    insurance?.policyNumber ||
    '-';

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      size="44vw"
      bodyheight="auto"
      hideActionBtn
      title={
        <Translate>Waseel Plan Class List</Translate>
      }
      icon={faLayerGroup}
      content={
        <div className="waseel-class-list-modal">
          <p className="waseel-class-list-modal__subtitle">
            <Translate>Plan</Translate>: {planLabel}
          </p>

          {classList.length ? (
            <MyTable
              data={classList}
              columns={classListColumns}
              totalCount={classList.length}
              page={0}
              rowsPerPage={classList.length || 10}
              onPageChange={() => undefined}
              onRowsPerPageChange={() => undefined}
            />
          ) : (
            <Message showIcon type="info">
              <Translate>
                No Waseel class list is available for this insurance yet. Run eligibility check first.
              </Translate>
            </Message>
          )}
        </div>
      }
    />
  );
};

export default WaseelClassListModal;

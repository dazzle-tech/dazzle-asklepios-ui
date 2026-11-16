import SectionContainer from '@/components/SectionsoContainer';
import ServiceAndProductsTab from '@/pages/encounter/encounter-pre-observations-new/Service&Products/ServiceAndProducts';
import React from 'react';
import { Text } from 'rsuite';

type EquipmentAndLogisticsProps = {
  procedure: any;
  patient: any;
  encounter: any;
  readOnly?: boolean;
};

/**
 * The encounter's services and products, limited to the ones added from this procedure.
 * They are billed exactly like items added from the encounter screen.
 */
const EquipmentAndLogistics: React.FC<EquipmentAndLogisticsProps> = ({
  procedure,
  patient,
  encounter,
  readOnly
}) => (
  <SectionContainer
    title={<Text>Services and Products used in this procedure</Text>}
    content={
      <ServiceAndProductsTab
        edit={readOnly}
        procedureId={procedure?.id}
        patient={patient}
        encounter={encounter}
      />
    }
  />
);

export default EquipmentAndLogistics;

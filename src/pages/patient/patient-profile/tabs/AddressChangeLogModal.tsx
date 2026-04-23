import React, { useState } from 'react';

import MyModal from '@/components/MyModal/MyModal';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';

import { useGetPatientAddressesQuery } from '@/services/patients/AddressService';
import { useGetCountriesQuery } from '@/services/setup/country/countryService';
import { Address } from '@/types/model-types-new';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

interface AddressChangeLogModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  patientId?: number;
  countryLovQueryResponse?: any;
}

const AddressChangeLogModal: React.FC<AddressChangeLogModalProps> = ({
  open,
  setOpen,
  patientId,
  countryLovQueryResponse
}) => {
  const { data: addressesResult, isFetching } = useGetPatientAddressesQuery(
    { patientId: patientId as number },
    { skip: !patientId || !open }
  );

  const { isLoading: isCountriesLoading } = useGetCountriesQuery(
    undefined,
    { skip: !open }
  );

  const rows: Address[] = addressesResult?.data ?? [];

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const pagedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const columns: ColumnConfig[] = [
    {
      key: 'isCurrent',
      title: 'Current',
      width: 90,
      render: (row: Address) =>
        row.isCurrent ? (
          <MyBadgeStatus contant="Yes" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="No" color="#969fb0" />
        )
    },
    {
      key: 'country',
      title: 'Country',
      width: 160,
      render: (row: Address) => (
        <span>
          {conjureValueBasedOnKeyFromList(
            countryLovQueryResponse?.object ?? [],
            row.locationJson?.country?.name,
            'lovDisplayVale'
          )}
        </span>
      )
    },
    {
      key: 'district',
      title: 'State/Province',
      width: 160,
      render: (row: Address) => row.locationJson?.district?.name || ''
    },
    {
      key: 'community',
      title: 'City',
      width: 160,
      render: (row: Address) => row.locationJson?.community?.name || ''
    },
    {
      key: 'area',
      title: 'Area',
      width: 160,
      render: (row: Address) => row.locationJson?.area?.name || ''
    },
    {
      key: 'streetName',
      title: 'Street Name',
      width: 200,
      dataKey: 'streetName'
    },
    {
      key: 'houseApartmentNumber',
      title: 'House/Apartment Number',
      width: 160,
      dataKey: 'houseApartmentNumber'
    },
    {
      key: 'postalZipCode',
      title: 'Postal/ZIP code',
      width: 140,
      dataKey: 'postalZipCode'
    },
    {
      key: 'additionalAddressLine',
      title: 'Additional Address Line',
      width: 220,
      dataKey: 'additionalAddressLine'
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Address Change Log</Translate>}
      size="80vw"
      bodyheight="70vh"
      pagesCount={1}
      hideActionBtn
      hideBack
      content={() => (
        <MyTable
          data={pagedRows}
          columns={columns}
          loading={isFetching || isCountriesLoading}
          height={500}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={rows.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
      handleCancelFunction={() => {
        setPage(0);
      }}
    />
  );
};

export default AddressChangeLogModal;

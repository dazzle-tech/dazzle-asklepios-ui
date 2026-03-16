import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import {
  useGetDiagnosticTestRequestByIdQuery,
  useSetDiagnosticTestForRequestMutation
} from '@/services/diagnosic-order/diagnosticTestRequestService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Panel, Radio, RadioGroup } from 'rsuite';

type Props = {
  open: boolean;
  setOpen: (val: boolean) => void;
  request: any;
  onConfirm: () => void;
};

const ApproveRequestModal: React.FC<Props> = ({ open, setOpen, request, onConfirm }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [setDiagnosticTestForRequest, setTestMutation] = useSetDiagnosticTestForRequestMutation();

  const { data: freshRequest } = useGetDiagnosticTestRequestByIdQuery(request?.id, {
    skip: !request?.id || !open
  });

  const { data, isFetching } = useGetAllDiagnosticTestsQuery({
    page: 0,
    size: 1000,
    sort: 'name,asc'
  });

  const filteredTests = useMemo(() => {
    if (!data?.data) return [];
    if (!request?.type) return data.data;
    return data.data.filter((t: any) => t.type === request.type);
  }, [data, request?.type]);

  const searchedTests = useMemo(() => {
    if (!search.trim()) return filteredTests;

    return filteredTests.filter((t: any) =>
      t.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [filteredTests, search]);


  useEffect(() => {
    if (open && freshRequest) {
      setSelectedId(freshRequest.diagnosticTestId ? String(freshRequest.diagnosticTestId) : null);
    }
  }, [open, freshRequest]);

  const isApproved = freshRequest?.status === 'APPROVED';

  const persistSelectedTest = async (id: string) => {
    if (!request?.id) return;
    if (isApproved) return;

    if (id === String(freshRequest?.diagnosticTestId ?? '')) {
      setSelectedId(id);
      return;
    }

    setSelectedId(id);

    try {
      await setDiagnosticTestForRequest({
        id: request.id,
        diagnosticTestId: id
      }).unwrap();
    } catch (e) {
      setSelectedId(freshRequest?.diagnosticTestId ? String(freshRequest.diagnosticTestId) : null);
    }
  };

  const handleApproveOnly = () => {
    onConfirm();
    setOpen(false);
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Select Ready Test</Translate>}
      size="600px"
      bodyheight="60vh"
      hideBack
      actionButtonLabel="Approve"
      actionButtonFunction={handleApproveOnly}
      isDisabledActionBtn={
        isApproved || !selectedId || setTestMutation.isLoading
      }
      content={
        <>
          {isFetching ? (
            <Loader center content="Loading..." />
          ) : (


            <div style={{ overflowY: 'auto', maxHeight: '45vh' }}>

              <div style={{ marginBottom: 10 }}>
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid #ccc'
                  }}
                />
              </div>
              <RadioGroup
                name="diagnosticTest"
                value={selectedId ?? undefined}
                onChange={(value) => persistSelectedTest(String(value))}
              >
                {searchedTests.map((test: any) => (
                  <Panel
                    key={test.id}
                    bordered
                    style={{ marginBottom: 8, padding: 10, cursor: isApproved ? 'not-allowed' : 'pointer', opacity: isApproved ? 0.6 : 1 }}
                    onClick={() => persistSelectedTest(String(test.id))}
                  >
                    <Radio value={String(test.id)}>
                      <strong>{test.name}</strong>
                    </Radio>
                  </Panel>
                ))}
              </RadioGroup>

              {setTestMutation.isLoading && (
                <div style={{ marginTop: 8 }}>
                  <Loader size="sm" content="Saving selection..." />
                </div>
              )}
            </div>
          )}
        </>
      }
    />
  );
};

export default ApproveRequestModal;
import {
  useGetDiagnosticTestProfilesByTestIdQuery
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import React from 'react';
import { FaChartLine } from 'react-icons/fa';
import { Tooltip, Whisper } from 'rsuite';


type Props = {
  testId?: number;
  testType?: string;
  onClick?: (profile: any) => void;
};

const DefaultProfileIndicator: React.FC<Props> = ({
  testId,
  testType,
  onClick
}) => {

const { data, isFetching, isLoading } =
  useGetDiagnosticTestProfilesByTestIdQuery(
    testId && testType === 'LABORATORY'
      ? { testId, page: 0, size: 2 }
      : undefined,
    {
      skip: !testId || testType !== 'LABORATORY',
      refetchOnMountOrArgChange: true
    }
  );

const profiles = data?.data ?? [];
const activeProfiles = profiles.filter(p => p.isActive === true);
const defaultActiveProfiles = activeProfiles.filter(p => p.isDefault === true);

const isDefaultOnly =
  defaultActiveProfiles.length === 1 && activeProfiles.length === 1;

if (!isDefaultOnly) return null;

const isReady =
  !isFetching && !isLoading && defaultActiveProfiles.length > 0;


  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Whisper placement="top" speaker={<Tooltip>Default Normal Range</Tooltip>} >
      <span
        onClick={e => {
          e.stopPropagation();

          if (!isReady) return;

          onClick?.(defaultActiveProfiles[0]);
        }}
        style={{
          cursor: isReady ? 'pointer' : 'not-allowed',
          opacity: isReady ? 1 : 0.5
        }}
        dir={dir}
      >
        <FaChartLine
          size={18}
          color="var(--primary-gray)"
          style={{ marginLeft: 6 }}
        />
      </span>
    </Whisper>
  );
};

export default DefaultProfileIndicator;

import React, { useEffect, useState } from 'react';
import { Form, Toggle } from 'rsuite';
import type { IconType } from 'react-icons';
import {
  MdBlock,
  MdCheck,
  MdContentCopy,
  MdFactCheck,
  MdLocalOffer,
  MdPayments,
  MdPersonOutline,
  MdSpeed,
  MdVerifiedUser
} from 'react-icons/md';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { notifyError, notifySuccess, notifyWarning } from './coverageHelpers';
import {
  useCloneCoverageClassMutation,
  type CoverageClass,
  type CoverageClassCloneSection
} from '@/services/setup/coverageManagement/coverageManagementService';

type CloneSectionOption = {
  key: CoverageClassCloneSection;
  label: string;
  description: string;
  icon: IconType;
};

const CLONE_SECTIONS: CloneSectionOption[] = [
  { key: 'CO_PAYMENT', label: 'Patient Co-Payment', description: 'Patient share by facility, department and encounter', icon: MdPersonOutline },
  { key: 'COVERAGE', label: 'Coverages', description: 'Coverage rules and their readings', icon: MdVerifiedUser },
  { key: 'COVERAGE_LIMIT', label: 'Coverage Limit', description: 'Limits, readings and limit exclusions', icon: MdSpeed },
  { key: 'CASH_LIMIT', label: 'Cash Limit', description: 'Cash limits and their readings', icon: MdPayments },
  { key: 'DISCOUNT', label: 'Discount', description: 'Discounts by category, subcategory or service', icon: MdLocalOffer },
  { key: 'EXCLUSION', label: 'Exclusions', description: 'Excluded services and diagnoses', icon: MdBlock },
  { key: 'PRE_APPROVAL', label: 'Pre-Approval', description: 'Pre-approval rules and their items', icon: MdFactCheck }
];

const ALL_SECTIONS = CLONE_SECTIONS.map(section => section.key);

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  source: CoverageClass | null;
  onCloned: (coverageClass: CoverageClass) => void;
};

/** Clones a coverage class into the same contract with the rule tabs the user picks. */
const CoverageClassCloneModal = ({ open, setOpen, source, onCloned }: Props) => {
  const dispatch = useAppDispatch();
  const [cloneClass, { isLoading }] = useCloneCoverageClassMutation();
  const [record, setRecord] = useState<{ name: string }>({ name: '' });
  const [sections, setSections] = useState<CoverageClassCloneSection[]>(ALL_SECTIONS);
  const [copyPolicyLink, setCopyPolicyLink] = useState(true);
  const hasPolicy = Boolean(source?.insuranceCompanyPolicyId);
  const allSelected = sections.length === ALL_SECTIONS.length;

  useEffect(() => {
    if (open) {
      setRecord({ name: source?.name ? `${source.name} - Copy` : '' });
      setSections(ALL_SECTIONS);
      setCopyPolicyLink(true);
    }
  }, [open, source?.name]);

  const toggleSection = (key: CoverageClassCloneSection) =>
    setSections(prev => (prev.includes(key) ? prev.filter(item => item !== key) : [...prev, key]));

  const save = async () => {
    const name = record.name?.trim();
    if (!source?.id) return;
    if (!name) {
      notifyWarning(dispatch, 'Class name is required');
      return;
    }
    try {
      const cloned = await cloneClass({
        id: source.id,
        body: { name, sections, copyPolicyLink: hasPolicy && copyPolicyLink }
      }).unwrap();
      notifySuccess(dispatch, `Class ${cloned.name} created from ${source.name}`);
      setOpen(false);
      onCloned(cloned);
    } catch (error: any) {
      notifyError(dispatch, error, 'Unable to clone class');
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Clone Class"
      size="760px"
      bodyheight="62vh"
      actionButtonLabel="Clone"
      actionButtonFunction={save}
      isDisabledActionBtn={isLoading || !record.name?.trim()}
      modalColor="var(--primary-blue)"
      content={
        <div className="coverage-clone">
          <div className="coverage-clone-source">
            <MdContentCopy size={20} />
            <div>
              <div className="coverage-clone-source-label">Cloning from</div>
              <div className="coverage-clone-source-name">
                {source?.name}
                {source?.policyName ? <span className="coverage-clone-source-policy"> · {source.policyName}</span> : null}
              </div>
            </div>
          </div>

          <Form fluid>
            <MyInput
              required
              width="100%"
              fieldLabel="New Class Name"
              fieldName="name"
              record={record}
              setRecord={setRecord}
              placeholder="Name of the new class"
            />
          </Form>

          <div className="coverage-clone-sections-head">
            <div>
              <div className="coverage-clone-sections-title">Tabs to copy</div>
              <div className="coverage-clone-sections-hint">
                {sections.length} of {ALL_SECTIONS.length} selected · active rules are copied with all their details
              </div>
            </div>
            <button
              type="button"
              className="coverage-clone-link"
              onClick={() => setSections(allSelected ? [] : ALL_SECTIONS)}
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          </div>

          <div className="coverage-clone-grid">
            {CLONE_SECTIONS.map(({ key, label, description, icon: Icon }) => {
              const selected = sections.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  className={`coverage-clone-card${selected ? ' is-selected' : ''}`}
                  onClick={() => toggleSection(key)}
                >
                  <span className="coverage-clone-card-icon">
                    <Icon size={20} />
                  </span>
                  <span className="coverage-clone-card-text">
                    <span className="coverage-clone-card-label">{label}</span>
                    <span className="coverage-clone-card-description">{description}</span>
                  </span>
                  <span className="coverage-clone-card-check">{selected ? <MdCheck size={14} /> : null}</span>
                </button>
              );
            })}
          </div>

          {hasPolicy && (
            <label className="coverage-clone-policy">
              <Toggle checked={copyPolicyLink} onChange={setCopyPolicyLink} size="sm" />
              <span>
                Link the new class to the same policy
                <span className="coverage-clone-policy-name"> ({source?.policyName})</span>
              </span>
            </label>
          )}
        </div>
      }
    />
  );
};

export default CoverageClassCloneModal;

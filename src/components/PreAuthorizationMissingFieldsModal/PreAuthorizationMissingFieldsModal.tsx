import React, { useMemo } from 'react';
import { Modal } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBookMedical,
  faCircleInfo,
  faClipboardCheck,
  faCommentMedical,
  faFileShield,
  faFlask,
  faHeartPulse,
  faRulerVertical,
  faStethoscope,
  faUserDoctor
} from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { hideMissingFields } from '@/reducers/preAuthorizationMissingFieldsSlice';
import type {
  PreAuthorizationClaimType,
  PreAuthorizationMissingField
} from '@/services/waseel-integration/preAuthorizationService';
import './styles.less';

const CLAIM_TYPE_LABELS: Record<PreAuthorizationClaimType, string> = {
  PROFESSIONAL_OP: 'Professional - OP',
  PROFESSIONAL_EMERGENCY: 'Professional - Emergency',
  ORAL_OP: 'Dental - OP'
};

/** Where each group of fields is filled in the visit. */
const SECTION_ICONS: Record<string, IconDefinition> = {
  Diagnosis: faStethoscope,
  'Chief complaint': faCommentMedical,
  'Patient history': faBookMedical,
  'Physical examination': faUserDoctor,
  'Assessment / plan': faClipboardCheck,
  Investigations: faFlask,
  'Vital signs': faHeartPulse,
  'Body measurements': faRulerVertical
};

type SectionGroup = { section: string; fields: PreAuthorizationMissingField[] };

const groupBySection = (fields: PreAuthorizationMissingField[]): SectionGroup[] =>
  fields.reduce<SectionGroup[]>((groups, field) => {
    const group = groups.find(item => item.section === field.section);
    if (group) {
      group.fields.push(field);
    } else {
      groups.push({ section: field.section, fields: [field] });
    }
    return groups;
  }, []);

/**
 * Lists the fields Waseel requires before a pre-authorization can be sent (NPHIES MDS), grouped by
 * the visit section where they are filled. Opened from any screen by the missing-fields listener.
 */
const PreAuthorizationMissingFieldsModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { open, claimType, fields } = useAppSelector(state => state.preAuthorizationMissingFields);
  const sections = useMemo(() => groupBySection(fields), [fields]);

  const close = () => dispatch(hideMissingFields());

  return (
    <Modal open={open} onClose={close} size="sm" className="preauth-missing-fields">
      <Modal.Body className="preauth-missing-fields__body">
        <header className="preauth-missing-fields__hero">
          <span className="preauth-missing-fields__hero-icon">
            <FontAwesomeIcon icon={faFileShield} />
          </span>
          <div className="preauth-missing-fields__hero-text">
            <h4>Complete the visit to request pre-authorization</h4>
            <p>
              Waseel needs these fields before the request can be sent. The service waits off the
              patient account until they are filled.
            </p>
            <div className="preauth-missing-fields__chips">
              {claimType && (
                <span className="preauth-missing-fields__chip">{CLAIM_TYPE_LABELS[claimType]}</span>
              )}
              <span className="preauth-missing-fields__chip preauth-missing-fields__chip--count">
                {fields.length} required field{fields.length === 1 ? '' : 's'} missing
              </span>
            </div>
          </div>
        </header>

        <div className="preauth-missing-fields__sections">
          {sections.map(group => (
            <section key={group.section} className="preauth-missing-fields__section">
              <div className="preauth-missing-fields__section-head">
                <span className="preauth-missing-fields__section-icon">
                  <FontAwesomeIcon icon={SECTION_ICONS[group.section] ?? faClipboardCheck} />
                </span>
                <span className="preauth-missing-fields__section-name">{group.section}</span>
                <span className="preauth-missing-fields__section-count">{group.fields.length}</span>
              </div>
              <ul className="preauth-missing-fields__fields">
                {group.fields.map(field => (
                  <li key={field.code}>{field.label}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="preauth-missing-fields__note">
          <FontAwesomeIcon icon={faCircleInfo} />
          After filling them, save the service again, or use “Send pre-authorization” in Patient Billing.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <MyButton onClick={close}>Got it</MyButton>
      </Modal.Footer>
    </Modal>
  );
};

export default PreAuthorizationMissingFieldsModal;

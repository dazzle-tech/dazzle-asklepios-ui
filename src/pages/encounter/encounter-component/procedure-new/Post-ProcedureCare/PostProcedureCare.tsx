import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import {
  useGetProcedurePostCareQuery,
  useSaveProcedurePostCareMutation
} from '@/services/patients/patientProcedureService';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { Col, Row } from 'rsuite';
import '../styles.less';
import Diagnosis from './Diagnosis';
import PostProcedureAnesthesia from './PostProcedureAnesthesia';
import PostProcedureChecklist from './PostProcedureChecklist';
import ProcedureMedications from './ProcedureMedications';
import ProcedureVitals from './ProcedureVitals';

const PostProcedureCare = ({ procedure, setActiveTab }) => {
  const dispatch = useAppDispatch();
  const [postCare, setPostCare] = useState<any>({});
  const { data: savedPostCare } = useGetProcedurePostCareQuery(procedure?.id, {
    skip: !procedure?.id
  });
  const [savePostCare] = useSaveProcedurePostCareMutation();

  useEffect(() => {
    if (savedPostCare) setPostCare(savedPostCare);
  }, [savedPostCare]);

  const handleSave = async () => {
    try {
      await savePostCare({ id: procedure.id, body: postCare }).unwrap();
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch {
      dispatch(notify({ msg: 'Save failed', sev: 'error' }));
    }
  };

  return (
    <>
      <Row gutter={15} className="r">
        <Col md={12}>
          <Row>
            <Col md={24}>
              <Diagnosis record={postCare} setRecord={setPostCare} />
            </Col>
          </Row>

          <ProcedureMedications procedureId={procedure?.id} />

          <Row>
            <Col md={24}>
              <PostProcedureAnesthesia record={postCare} setRecord={setPostCare} />
            </Col>
          </Row>
        </Col>
        <Col md={12}>
          <Row>
            <Col md={24}>
              <ProcedureVitals record={postCare} setRecord={setPostCare} />
            </Col>
          </Row>

          <Row>
            <Col md={24}>
              <PostProcedureChecklist record={postCare} setRecord={setPostCare} />
            </Col>
          </Row>
        </Col>
      </Row>

      <div className="bt-div">
        <div className="bt-right">
          <MyButton onClick={handleSave}>Save</MyButton>
          <MyButton>Create Follow-up</MyButton>
          <MyButton onClick={() => setActiveTab('5')}>Complete and Next</MyButton>
        </div>
      </div>
    </>
  );
};
export default PostProcedureCare;

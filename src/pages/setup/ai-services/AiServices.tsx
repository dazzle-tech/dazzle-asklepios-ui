import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useEnumOptions } from '@/services/enumsApi';
import AmbientScribeSetup from './AmbientScribeSetup';
import './styles.less';

const selectedFacilityId = () => {
  try {
    const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
    const id = tenant?.selectedFacility?.id;
    return id == null || id === '' ? null : Number(id);
  } catch {
    return null;
  }
};

const AiServices = () => {
  const dispatch = useAppDispatch();
  const services = useEnumOptions('AiService');
  const [selected, setSelected] = useState('AMBIENT_SCRIBE');
  const facilityId = selectedFacilityId();
  const selectedService = services.find(service => service.value === selected) ?? services[0];

  useEffect(() => {
    dispatch(setPageCode('AI_SERVICES'));
    dispatch(setDivContent('AI Services'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    if (!services.some(service => service.value === selected) && services[0]) {
      setSelected(services[0].value);
    }
  }, [services, selected]);

  return (
    <div className="ai-services">
      <div className="ai-services-body">
        <aside className="ai-services-nav">
          <div className="ai-services-nav-label">AI Services</div>
          {services.map(service => (
            <button
              key={service.value}
              type="button"
              className={service.value === selectedService?.value ? 'is-active' : ''}
              onClick={() => setSelected(service.value)}
            >
              <span>{service.label}</span>
              {service.value === 'AMBIENT_SCRIBE' && <em>New</em>}
            </button>
          ))}
        </aside>

        <main className="ai-services-main">
          {selectedService?.value === 'AMBIENT_SCRIBE' ? (
            facilityId ? (
              <AmbientScribeSetup facilityId={facilityId} />
            ) : (
              <div className="ai-services-status">Select a facility before configuring Ambient Scribe.</div>
            )
          ) : (
            <section className="ai-services-placeholder">
              <h1>{selectedService?.label}</h1>
              <p>This setup is not available yet.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AiServices;

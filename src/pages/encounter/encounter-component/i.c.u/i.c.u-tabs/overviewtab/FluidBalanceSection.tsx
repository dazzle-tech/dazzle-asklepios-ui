import React, { useState } from "react";
import SectionContainer from '@/components/SectionsoContainer';
import MyButton from '@/components/MyButton/MyButton';
import DynamicCard from '@/components/DynamicCard';
import PlusIcon from '@rsuite/icons/Plus';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet } from '@fortawesome/free-solid-svg-icons';
import MyModal from "@/components/MyModal/MyModal";
import IntakeOutputBalanceConsultation from "@/pages/encounter/tele-consultation-screen/start-tele-consultation/in-take-out-put-balance-tele-consultation/IntakeOutputBalanceConsultation";

const inVal = 2850;
const outVal = 2100;
const netVal = inVal - outVal;
const target = -5000;
const off = Math.abs(netVal - target);

const FluidBalanceSection = () => {

      const [openFluidBalance, setOpenFluidBalance] = useState(false);
  
const mode = useSelector((state: any) => state.ui.mode);

  return (<>
    <div className={`active-fluid-balance-section ${mode === 'dark' ? 'dark' : 'light'}`}>
    <SectionContainer
      title={<>
        <span className="today-goals-section-title">
            <FontAwesomeIcon
                          color="#254476ff"
                          icon={faDroplet}
                          className="title-icon-main-title"
                        />

          Fluid Balance (24h)
        </span>


                              <div className="add-button-for-cards-over-view">
                      <MyButton
                        prefixIcon={() => <PlusIcon />}
                        onClick={() => setOpenFluidBalance(true)}
                      >
                        Add
                      </MyButton></div>
                </>}
      content={
        <>
          <DynamicCard
            width="100%"
            data={[
              {
                value: (
                  <div className="fluid-balance-card-content">
                    <div className="fb-row">
                      <div className="fb-col">
                        <div className="fb-value blue">{inVal}</div>
                        <div className="fb-label">IN (mL)</div>
                      </div>
                      <div className="fb-col">
                        <div className="fb-value orange">{outVal}</div>
                        <div className="fb-label">OUT (mL)</div>
                      </div>
                      <div className="fb-col">
                        <div className="fb-value yellow">+{netVal}</div>
                        <div className="fb-label">NET (mL)</div>
                      </div>
                    </div>
                  </div>
                ),
                type: 'text',
                section: 'center',
                showLabel: false,
              },
            ]}
          />
        </>
      }
    />


        <MyModal
      open={openFluidBalance}
      setOpen={setOpenFluidBalance}
      title="New/Edit Patient Attachments"
      size="80vw"
      bodyheight="80vh"
      position="center"
      content={<IntakeOutputBalanceConsultation/>}
      hideBack={true}
      actionButtonLabel="Save"
      actionButtonFunction={{}}
    />


  </div></>);
};

export default FluidBalanceSection;

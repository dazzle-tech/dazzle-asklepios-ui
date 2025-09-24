import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import { Text, Uploader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { BiExport } from 'react-icons/bi';
import { PiWarningCircle } from 'react-icons/pi';
import { MdOutlineFileDownload } from 'react-icons/md';
import { faUsersLine } from '@fortawesome/free-solid-svg-icons';
const BulkRegistration = ({ open, setOpen }) => {
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <div className="container-of-bulk-registration">
            <div className="container-of-icon-and-text-bulk-registration">
              <BiExport size={22} />
              <Text>Import</Text>
            </div>
            <div className="container-of-instruction-bulk-registration">
              <div className="container-of-icon-and-text-bulk-registration">
                <PiWarningCircle color="blue" size={20} />
                <h5>Import Instructions</h5>
              </div>
              <ol>
                <li>Download the Excel template</li>
                <li>Fill in patient data according to the template format</li>
                <li>Upload the completed Excel file</li>
              </ol>
            </div>
            <a
              href="/public/files/template.xlsx"
              className="download-color-text container-of-uploader-bulk-registration"
              download
            >
              <MdOutlineFileDownload fill="#353B66" size={22} />
              Download Template
            </a>
            <div>
              <h6>Upload Excel File</h6>
              <small className="gray-color-text">Supports .xlsx and .xls files only</small>
              <Uploader
                listType="picture-text"
                action="//jsonplaceholder.typicode.com/posts/"
                accept=".xls,.xlsx"
                draggable
              >
                <div className="container-of-uploader-bulk-registration">
                  <BiExport fill="#B1B7BD" size={22} />
                  <Text className="gray-color-text">Import</Text>
                </div>
              </Uploader>
            </div>
          </div>
        );
    }
  };

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Bulk Registration"
      position="right"
      content={conjureFormContent}
      hideActionBtn
      size={width > 600 ? '36vw' : '70vw'}
      steps={[
        {
          title: 'Bulk Registration',
          icon: <FontAwesomeIcon icon={faUsersLine} />
        }
      ]}
    />
  );
};
export default BulkRegistration;

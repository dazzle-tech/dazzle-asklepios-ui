import React from 'react';
import MyButton from '../MyButton/MyButton';
import { Modal } from 'rsuite';
import './styles.less';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons';

const actionConfig = {
  delete: {
    text: 'Delete',
    color: 'var(--primary-pink)',
    icon: faTrash,
  },
  deactivate: {
    text: 'Deactivate',
    color: 'var(--primary-pink)',
    icon: faTrash,
  },
  reactivate: {
    text: 'Reactivate',
    color: 'var(--primary-blue)',
    icon: faArrowRotateLeft,
  },
};

const DeletionConfirmationModal = ({
  open,
  setOpen,
  itemToDelete = '',
  actionButtonFunction = null,
  actionType = 'delete', // delete | deactivate | reactivate
}) => {
  const config = actionConfig[actionType] || actionConfig.delete;

  return (
    <>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="450px"
        className="delete-modal"
      >
        <Modal.Header>
        <div className="delete-circle-wrapper" style={{ ['--circle-color' as any]: config.color }}>
            <div
              className="delete-circle-inner"
              style={{ backgroundColor: config.color }}
            >
              <FontAwesomeIcon icon={config.icon} />
            </div>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="body-delete-modal">
            <span>{`Are you sure you want to ${config.text.toLowerCase()} this ${itemToDelete} ?`}</span>
          </div>
        </Modal.Body>
        <Modal.Footer className="footer-delete-modal">
          <MyButton
            appearance="subtle"
            color="var(--dark-blue-gray)"
            onClick={() => setOpen(false)}
          >
            Cancel
          </MyButton>
          <MyButton backgroundColor={config.color} onClick={actionButtonFunction}>
            {config.text}
          </MyButton>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DeletionConfirmationModal

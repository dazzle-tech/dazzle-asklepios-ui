import { Input, Modal, Pagination, Panel, Table, Form, Stack, Divider, Button, Text } from 'rsuite';
import React from 'react';
import Translate from '../Translate';

const LogDialog = ({ ObjectListResponseData, popupOpen, setPopupOpen }) => (
  <Panel>
    <Modal open={popupOpen} overflow>
      <Modal.Title>
        <Translate>Info</Translate>
      </Modal.Title>
      <Modal.Body>
        <Form fluid>
          <Table bordered data={ObjectListResponseData?.object ?? []}>
          <Table.Column  flexGrow={1}>
              <Table.HeaderCell align='center'>Created At</Table.HeaderCell>
              <Table.Cell dataKey="createdAt">
                {rowData => <Text>{rowData.createdAt}</Text>}
              </Table.Cell>
            </Table.Column >
            <Table.Column  flexGrow={1}>
              <Table.HeaderCell align='center'>Created By</Table.HeaderCell>
              <Table.Cell dataKey="createdBy">
                {rowData => <Text>{rowData.createdBy}</Text>}
              </Table.Cell>
            </Table.Column >
          </Table>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Stack spacing={2} divider={<Divider vertical />}>
          <Button appearance="primary" color="red" onClick={() => setPopupOpen(false)}>
            Close
          </Button>
        </Stack>
      </Modal.Footer>
    </Modal>
  </Panel>
);

export default LogDialog;

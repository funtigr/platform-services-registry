import * as React from 'react';
import { sampleRequest } from './components/Params';
import { RequestRejectionTemplate } from './templates/RequestRejectionTemplate';

export const RequestRejection = () => {
  return <RequestRejectionTemplate request={sampleRequest} />;
};

export default RequestRejection;
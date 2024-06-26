import * as React from 'react';
import { samplePrivateEditRequest } from './_components/Params';
import EditRequestTemplate from './_templates/private-cloud/EditRequest';

export default function EditRequest() {
  return <EditRequestTemplate request={samplePrivateEditRequest} userName={'Session User'} />;
}

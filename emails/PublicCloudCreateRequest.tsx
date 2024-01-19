import * as React from 'react';
import { samplePublicRequest } from './_components/Params';
import NewRequestTemplate from './_templates/public-cloud/CreateRequest';

export const NewRequest = () => {
  return <NewRequestTemplate request={samplePublicRequest} />;
};

export default NewRequest;

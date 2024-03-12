import { instance } from './axios';

export async function getPriviateCloudProject(licencePlate: string) {
  const result = await instance.get(`private-cloud/project/${licencePlate}`).then((res) => {
    // Secondaty technical lead should only be included if it exists
    if (res.data.secondaryTechnicalLead === null) {
      delete res.data.secondaryTechnicalLead;
    }

    return res.data;
  });

  return result;
}

export async function editPriviateCloudProject(licencePlate: string, data: any) {
  const result = await instance.post(`private-cloud/edit/${licencePlate}`, data).then((res) => res.data);
  return result;
}

export async function createPriviateCloudProject(data: any) {
  const result = await instance.post(`private-cloud/create/`, data).then((res) => res.data);
  return result;
}

export async function getPriviateCloudActiveRequest(licencePlate: string) {
  const result = await instance.get(`private-cloud/active-request/${licencePlate}`).then((res) => res.data);
  return result;
}

export async function getPriviateCloudRequest(licencePlate: string) {
  const result = await instance.get(`private-cloud/request/${licencePlate}`).then((res) => {
    // Secondaty technical lead should only be included if it exists
    if (res.data.requestedProject.secondaryTechnicalLead === null) {
      delete res.data.requestedProject.secondaryTechnicalLead;
    }

    return res.data;
  });

  return result;
}

export async function makePriviateCloudRequestedDecision(licencePlate: string, data: any) {
  const result = await instance.post(`private-cloud/decision/${licencePlate}`, data).then((res) => res.data);
  return result;
}
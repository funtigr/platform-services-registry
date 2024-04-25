import { instance } from './axios';
import { PublicCloudRequestGetPayload } from '@/app/api/public-cloud/requests/[id]/route';
import { PublicCloudProjectGetPayload } from '@/app/api/public-cloud/products/[licencePlate]/route';
import { PublicCloudProductRequestsGetPayload } from '@/app/api/public-cloud/products/[licencePlate]/requests/route';
import { PublicCloudProductSearchPayload } from '@/queries/public-cloud-products';
import { PublicCloudRequestSearchPayload } from '@/queries/public-cloud-requests';
import { downloadFile } from '@/utils/file-download';
import { PublicCloudProjectDecorate, PublicCloudRequestDecorate } from '@/types/doc-decorate';
import { PublicCloudRequest } from '@prisma/client';

export interface PublicCloudProductAllCriteria {
  search: string;
  page: number;
  pageSize: number;
  ministry: string;
  provider: string;
  includeInactive: boolean;
  sortKey: string;
  sortOrder: string;
}

export interface PublicCloudProductSearchCriteria extends PublicCloudProductAllCriteria {
  page: number;
  pageSize: number;
}

export async function searchPublicCloudProducts(data: PublicCloudProductSearchCriteria) {
  const result = await instance.post(`public-cloud/products/search`, data).then((res) => {
    return res.data;
  });

  return result as PublicCloudProductSearchPayload;
}

export async function downloadPublicCloudProducts(data: PublicCloudProductSearchCriteria) {
  const result = await instance.post(`public-cloud/products/download`, data, { responseType: 'blob' }).then((res) => {
    if (res.status === 204) return false;

    downloadFile(res.data, 'public-cloud-products.csv');
    return true;
  });

  return result;
}

export async function getPublicCloudProject(licencePlate: string) {
  const result = await instance.get(`public-cloud/products/${licencePlate}`).then((res) => {
    // Secondaty technical lead should only be included if it exists
    if (res.data.secondaryTechnicalLead === null) {
      delete res.data.secondaryTechnicalLead;
    }

    return res.data;
  });

  return result as PublicCloudProjectGetPayload & PublicCloudProjectDecorate;
}
export async function editPublicCloudProject(licencePlate: string, data: any) {
  const result = await instance.post(`public-cloud/edit/${licencePlate}`, data).then((res) => res.data);
  return result;
}

export async function createPublicCloudProject(data: any) {
  const result = await instance.post(`public-cloud/products`, data).then((res) => res.data);
  return result;
}

export async function getPublicCloudRequest(id: string) {
  const result = await instance.get(`public-cloud/requests/${id}`).then((res) => res.data);
  return result as PublicCloudRequestGetPayload;
}

export async function getPublicCloudProductRequests(licencePlate: string, active = false) {
  const result = await instance
    .get(`public-cloud/products/${licencePlate}/requests?active=${active}`)
    .then((res) => res.data);

  return result as PublicCloudProductRequestsGetPayload[];
}

export async function deletePublicCloudProject(licencePlate: string) {
  const result = await instance.post(`public-cloud/delete/${licencePlate}`).then((res) => res.data);
  return result;
}

export async function makePublicCloudRequestedDecision(licencePlate: string, data: any) {
  const result = await instance.post(`public-cloud/decision/${licencePlate}`, data).then((res) => res.data);
  return result;
}

export async function searchPublicCloudRequests(data: PublicCloudProductSearchCriteria) {
  const result = await instance.post(`public-cloud/requests/search`, data).then((res) => {
    return res.data;
  });

  return result as PublicCloudRequestSearchPayload;
}

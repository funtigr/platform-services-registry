import {
  ProjectStatus,
  RequestType,
  DecisionStatus,
  DefaultCpuOptions,
  DefaultMemoryOptions,
  DefaultStorageOptions,
  PrivateCloudRequest,
} from "@prisma/client";
import prisma from "@/lib/prisma";
import generateLicensePlate from "@/lib/generateLicencePlate";
import { CreateRequestBody } from "@/schema";

const defaultQuota = {
  cpu: DefaultCpuOptions.CPU_REQUEST_0_5_LIMIT_1_5,
  memory: DefaultMemoryOptions.MEMORY_REQUEST_2_LIMIT_4,
  storage: DefaultStorageOptions.STORAGE_1,
};

export default async function createRequest(
  formData: CreateRequestBody,
  authEmail: string
): Promise<PrivateCloudRequest> {
  const licencePlate = generateLicensePlate();

  return prisma.privateCloudRequest.create({
    data: {
      type: RequestType.CREATE,
      decisionStatus: DecisionStatus.PENDING,
      active: true,
      createdByEmail: authEmail,
      licencePlate,
      requestedProject: {
        create: {
          name: formData.name,
          description: formData.description,
          cluster: formData.cluster,
          ministry: formData.ministry,
          status: ProjectStatus.ACTIVE,
          licencePlate: licencePlate,
          commonComponents: formData.commonComponents,
          productionQuota: defaultQuota,
          testQuota: defaultQuota,
          toolsQuota: defaultQuota,
          developmentQuota: defaultQuota,
          projectOwner: {
            connectOrCreate: {
              where: {
                email: formData.projectOwner.email,
              },
              create: formData.projectOwner,
            },
          },
          primaryTechnicalLead: {
            connectOrCreate: {
              where: {
                email: formData.primaryTechnicalLead.email,
              },
              create: formData.primaryTechnicalLead,
            },
          },
          secondaryTechnicalLead: formData.secondaryTechnicalLead
            ? {
                connectOrCreate: {
                  where: {
                    email: formData.secondaryTechnicalLead.email,
                  },
                  create: formData.secondaryTechnicalLead,
                },
              }
            : undefined,
        },
      },
    },
    include: {
      requestedProject: {
        include: {
          projectOwner: true,
          primaryTechnicalLead: true,
          secondaryTechnicalLead: true,
        },
      },
    },
  });
}
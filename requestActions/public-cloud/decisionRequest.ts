import { ProjectStatus, DecisionStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { PublicCloudEditRequestBody } from '@/schema';
import { Prisma } from '@prisma/client';

export type PublicCloudRequestWithRequestedProject = Prisma.PublicCloudRequestGetPayload<{
  include: {
    requestedProject: {
      include: {
        projectOwner: true;
        primaryTechnicalLead: true;
        secondaryTechnicalLead: true;
      };
    };
  };
}>;

export default async function makeDecisionRequest(
  licencePlate: string,
  decision: DecisionStatus,
  comment: string | undefined,
  formData: PublicCloudEditRequestBody,
  authEmail: string,
): Promise<PublicCloudRequestWithRequestedProject> {
  // Get the request
  const request: PublicCloudRequestWithRequestedProject | null = await prisma.publicCloudRequest.findFirst({
    where: {
      licencePlate,
      active: true,
    },
    include: {
      project: true,
      requestedProject: {
        include: {
          projectOwner: true,
          primaryTechnicalLead: true,
          secondaryTechnicalLead: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error('Request not found.');
  }

  const {
    id: _,
    projectOwnerId,
    primaryTechnicalLeadId,
    secondaryTechnicalLeadId,
    ...userRequestedProject
  } = request.requestedProject;
  // Update the request with the data passed in from the form.
  // Since the admin has the ablilty to modify the request, we put these changes into the adminRequestedProject field
  // that is the new requested project from the admin form. The adminRequestedProject may be the same as the requested
  // project if the admin did not change anything.
  const decisionRequest: PublicCloudRequestWithRequestedProject | null = await prisma.publicCloudRequest.update({
    where: {
      id: request.id,
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
    data: {
      decisionStatus: decision,
      humanComment: comment,
      active: decision === DecisionStatus.APPROVED,
      decisionDate: new Date(),
      decisionMakerEmail: authEmail,
      requestedProject: {
        update: {
          ...formData,
          status: ProjectStatus.ACTIVE,
          licencePlate: request.licencePlate,
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
  });

  if (decisionRequest === null) {
    throw new Error('Unable to update request.');
  }

  return decisionRequest;
}
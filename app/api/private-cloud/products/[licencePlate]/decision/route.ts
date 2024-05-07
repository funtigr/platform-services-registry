import { z } from 'zod';
import { $Enums, Cluster, DecisionStatus, User } from '@prisma/client';
import { PermissionsEnum } from '@/types/permissions';
import { PrivateCloudDecisionRequestBodySchema } from '@/schema';
import makeRequestDecision from '@/request-actions/private-cloud/decision-request';
import createApiHandler from '@/core/api-handler';
import { BadRequestResponse, OkResponse, UnauthorizedResponse } from '@/core/responses';
import { subscribeUsersToMautic } from '@/services/mautic';
import { sendRequestRejectionEmails, sendRequestApprovalEmails } from '@/services/ches/private-cloud/email-handler';
import { wrapAsync } from '@/helpers/runtime';
import { sendRequestNatsMessage } from '@/helpers/nats-message';

const pathParamSchema = z.object({
  licencePlate: z.string(),
});

const apiHandler = createApiHandler({
  roles: ['user'],
  permissions: [PermissionsEnum.ReviewAllPrivateCloudRequests],
  validations: { pathParams: pathParamSchema, body: PrivateCloudDecisionRequestBodySchema },
});
export const POST = apiHandler(async ({ pathParams, body, session }) => {
  const { userEmail } = session;
  const { licencePlate } = pathParams;
  const { decision, decisionComment, ...decisionDataFormData } = body;

  const request = await makeRequestDecision(
    licencePlate,
    decision,
    decisionComment,
    decisionDataFormData,
    userEmail as string,
  );

  if (!request.decisionData) {
    return BadRequestResponse(`Error creating decision request for ${request.licencePlate}`);
  }

  if (request.decisionStatus !== DecisionStatus.APPROVED) {
    // Send rejection email, message will need to be passed
    wrapAsync(() => sendRequestRejectionEmails(request, decisionComment));

    return OkResponse(`Request for ${request.licencePlate} successfully created as rejected.`);
  }

  await sendRequestNatsMessage(request, {
    projectOwner: { email: decisionDataFormData.projectOwner.email },
    primaryTechnicalLead: { email: decisionDataFormData.primaryTechnicalLead.email },
    secondaryTechnicalLead: { email: decisionDataFormData.secondaryTechnicalLead?.email },
  });

  const users: User[] = [
    request.decisionData.projectOwner,
    request.decisionData.primaryTechnicalLead,
    request.decisionData?.secondaryTechnicalLead,
  ].filter((usr): usr is User => Boolean(usr));

  // Subscribe users to Mautic
  await subscribeUsersToMautic(users, request.decisionData.cluster, 'Private');

  if (request.type == $Enums.RequestType.EDIT) {
    sendRequestApprovalEmails(request);
  }

  return OkResponse(`Decision request for ${request.licencePlate} successfully created.`);
});

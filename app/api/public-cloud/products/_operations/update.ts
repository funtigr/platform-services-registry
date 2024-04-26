import { z, TypeOf, ZodType } from 'zod';
import prisma from '@/core/prisma';
import { PublicCloudEditRequestBodySchema } from '@/schema';
import { Session } from 'next-auth';
import { putPathParamSchema } from '../[licencePlate]/route';
import { subscribeUsersToMautic } from '@/services/mautic';
import { BadRequestResponse, OkResponse, UnauthorizedResponse } from '@/core/responses';
import { PublicCloudRequest, User } from '@prisma/client';
import editRequest from '@/request-actions/public-cloud/edit-request';
import { sendPublicCloudNatsMessage } from '@/services/nats';
import { sendEditRequestEmails, sendExpenseAuthorityEmail } from '@/services/ches/public-cloud/email-handler';
import { wrapAsync } from '@/helpers/runtime';

export default async function updateOp({
  session,
  body,
  pathParams,
}: {
  session: Session;
  body: TypeOf<typeof PublicCloudEditRequestBodySchema>;
  pathParams: TypeOf<typeof putPathParamSchema>;
}) {
  if (!session) {
    return UnauthorizedResponse('You do not have the required credentials.');
  }
  const { userEmail } = session;
  const { licencePlate } = pathParams;

  if (
    ![body.projectOwner.email, body.primaryTechnicalLead.email, body.secondaryTechnicalLead?.email].includes(
      userEmail as string,
    ) &&
    !(session.permissions.editAllPublicCloudProducts || session.ministries.editor.includes(`${body.ministry}`))
  ) {
    return UnauthorizedResponse('You need to assign yourself to this project in order to create it.');
  }

  const existingRequest: PublicCloudRequest | null = await prisma.publicCloudRequest.findFirst({
    where: {
      AND: [{ licencePlate }, { active: true }],
    },
  });

  if (existingRequest !== null) {
    return BadRequestResponse('This project already has an active request or it does not exist.');
  }

  const request = await editRequest(licencePlate, body, userEmail as string);

  await sendPublicCloudNatsMessage(request.type, request.requestedProject, request.project);

  wrapAsync(() => {
    const users: User[] = [
      request.requestedProject.projectOwner,
      request.requestedProject.primaryTechnicalLead,
      request.requestedProject?.secondaryTechnicalLead,
    ].filter((usr): usr is User => Boolean(usr));

    subscribeUsersToMautic(users, request.requestedProject.provider, 'Private');
    sendEditRequestEmails(request);
    if (request.requestedProject.expenseAuthorityId !== request.project?.expenseAuthorityId) {
      sendExpenseAuthorityEmail(request.requestedProject);
    }
  });

  return OkResponse('Successfully created and provisioned edit request ');
}

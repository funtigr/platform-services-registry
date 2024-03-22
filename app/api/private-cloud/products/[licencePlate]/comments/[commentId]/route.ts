import { NextResponse } from 'next/server';
import createApiHandler from '@/core/api-handler';
import { z } from 'zod';
import { PermissionsEnum } from '@/types/permissions';
import { UnauthorizedResponse, OkResponse, NotFoundResponse } from '@/core/responses';
import deleteOp from '../_operations/delete';
import { readOp } from '../_operations/read';
import { updateOp } from '../_operations/update';

const licencePlateSchema = z.object({
  licencePlate: z.string(),
  commentId: z.string(),
});

export const GET = createApiHandler({
  roles: ['user'],
  permissions: [PermissionsEnum.ViewAllPrivateProductComments],
  validations: {
    pathParams: licencePlateSchema,
  },
})(async ({ session, pathParams }) => {
  if (!session) {
    return UnauthorizedResponse('Session not found');
  }
  const { licencePlate, commentId } = pathParams;
  const comment = await readOp(licencePlate, commentId);
  if (!comment) {
    return NotFoundResponse('Comment not found');
  }
  return OkResponse(comment);
});

const updateCommentBodySchema = z.object({
  text: z.string().min(1, 'The comment text must not be empty'),
});

export const PUT = createApiHandler({
  roles: ['user'],
  permissions: [PermissionsEnum.EditAllPrivateProductComments],
  validations: {
    pathParams: licencePlateSchema,
    body: updateCommentBodySchema,
  },
})(async ({ session, pathParams, body }) => {
  if (!session) {
    return UnauthorizedResponse('Session not found');
  }

  const { licencePlate, commentId } = pathParams;
  const updatedComment = await updateOp({ licencePlate, commentId, ...body });
  if (!updatedComment) {
    return NotFoundResponse('Comment not found or update failed');
  }

  return OkResponse(updatedComment);
});

export async function DELETE() {
  const data = await deleteOp();
  return NextResponse.json(data);
}

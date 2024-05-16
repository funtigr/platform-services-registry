import createApiHandler from '@/core/api-handler';
import { OkResponse } from '@/core/responses';
import { PrivateCloudCreateRequestBodySchema } from '@/schema';
import createOp from './_operations/create';
import listOp from './_operations/list';

export const POST = createApiHandler({
  roles: ['user'],
  validations: { body: PrivateCloudCreateRequestBodySchema },
})(async ({ session, body }) => {
  const res = await createOp({ session, body });
  return res;
});

export const GET = createApiHandler({
  roles: [],
  validations: {},
})(async () => {
  const data = await listOp();
  return OkResponse(data);
});

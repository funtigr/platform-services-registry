import { NextResponse } from 'next/server';
import { z } from 'zod';
import createApiHandler from '@/core/api-handler';
import { getUserPhoto } from '@/msal/service';

interface QueryParam {
  email: string;
}

const queryParamSchema = z.object({
  email: z.string(),
});

const apiHandler = createApiHandler<undefined, QueryParam>({
  roles: ['user'],
  validations: { queryParams: queryParamSchema },
});
export const GET = apiHandler(async ({ queryParams }) => {
  const { email } = queryParams;

  const data = await getUserPhoto(email);
  if (data) {
    return new NextResponse(data, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  }

  return new NextResponse(data);
});

'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useQuery, useMutation } from '@tanstack/react-query';
import classNames from 'classnames';
import { SecurityConfig } from '@prisma/client';
import { getSecurityConfig, upsertSecurityConfig } from '@/services/security-config';

export default function Repository({ params }: { params: { licencePlate: string } }) {
  const { register, control, handleSubmit, getValues, setValue } = useForm<SecurityConfig>({
    defaultValues: { licencePlate: params.licencePlate, context: 'PRIVATE', repositories: [{ url: 'https://' }] },
  });

  const {
    data: config,
    isLoading: isFetching,
    isError: isFetchingError,
    error: fetchingError,
  } = useQuery<SecurityConfig, Error>({
    queryKey: ['securityConfig', params.licencePlate],
    queryFn: () => getSecurityConfig(params.licencePlate, 'PRIVATE'),
    enabled: !!params.licencePlate,
  });

  const {
    mutateAsync,
    isPending: isUpdating,
    isError: isUpdatingError,
    error: updatingError,
  } = useMutation({
    mutationFn: upsertSecurityConfig,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'repositories',
  });

  useEffect(() => {
    if (!config) return;
    setValue('repositories', config.repositories);
  }, [setValue, config]);

  if (isFetching) {
    return <div>Loading...</div>;
  }

  if (isFetchingError) {
    return <div>{String(fetchingError)}</div>;
  }

  if (isUpdating) {
    return <div>Updating...</div>;
  }

  if (isUpdatingError) {
    return <div>{String(updatingError)}</div>;
  }

  const values = getValues();

  return (
    <div>
      <h2 className="font-bcsans text-base lg:text-lg 2xl:text-2xl font-semibold leading-6 text-gray-900 mb-2">
        Repository URLs
      </h2>
      <form
        onSubmit={handleSubmit(async (data) => {
          await mutateAsync(data);
          toast.success('Successfully updated!');
        })}
      >
        <ul>
          {fields.map((item, index) => (
            <li key={item.id} className="flex mb-1">
              <input
                autoComplete="off"
                className={classNames(
                  'flex-auto rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6',
                )}
                {...register(`repositories.${index}.url`)}
              />

              <button
                type="button"
                className="ml-2 rounded-md bg-red-600 text-white px-4 py-2.5 font-bcsans text-sm tracking-[.2em] shadow-sm hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-32"
                onClick={() => remove(index)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        {values.repositories.length < 10 && (
          <button
            type="button"
            className="rounded-md bg-blue-400 text-white px-4 py-2.5 font-bcsans text-sm tracking-[.2em] shadow-sm hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-32"
            onClick={() => append({ url: 'https://' })}
          >
            Add New
          </button>
        )}

        <button
          type="submit"
          className="ml-2 rounded-md bg-green-600 text-white px-4 py-2.5 font-bcsans text-sm tracking-[.2em] shadow-sm hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-32"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

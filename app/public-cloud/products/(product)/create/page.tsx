'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import PreviousButton from '@/components/buttons/Previous';
import AccountCoding from '@/components/form/AccountCoding';
import Budget from '@/components/form/Budget';
import ExpenseAuthority from '@/components/form/ExpenseAuthority';
import ProjectDescription from '@/components/form/ProjectDescriptionPublic';
import TeamContacts from '@/components/form/TeamContacts';
import CreatePublicCloud from '@/components/modal/CreatePublicCloud';
import ReturnModal from '@/components/modal/Return';
import { AGMinistries } from '@/constants';
import createClientPage from '@/core/client-page';
import { PublicCloudCreateRequestBodySchema } from '@/schema';
import { createPublicCloudProject } from '@/services/backend/public-cloud/products';

const publicCloudProductNew = createClientPage({
  roles: ['user'],
});
export default publicCloudProductNew(({ pathParams, queryParams, session }) => {
  const [openCreate, setOpenCreate] = useState(false);
  const [openReturn, setOpenReturn] = useState(false);
  const [secondTechLead, setSecondTechLead] = useState(false);

  const {
    mutateAsync: createProject,
    isPending: isCreatingProject,
    isError: isCreateError,
    error: createError,
  } = useMutation({
    mutationFn: (data: any) => createPublicCloudProject(data),
    onSuccess: () => {
      setOpenCreate(false);
      setOpenReturn(true);
    },
  });

  const methods = useForm({
    resolver: zodResolver(
      PublicCloudCreateRequestBodySchema.merge(
        z.object({
          isAgMinistryChecked: z.boolean().optional(),
        }),
      ).refine(
        (formData) => {
          return AGMinistries.includes(formData.ministry) ? formData.isAgMinistryChecked : true;
        },
        {
          message: 'AG Ministry Checkbox should be checked.',
          path: ['isAgMinistryChecked'],
        },
      ),
    ),
  });

  const handleSubmit = async (data: any) => {
    createProject(data);
  };

  const secondTechLeadOnClick = () => {
    setSecondTechLead(!secondTechLead);
    if (secondTechLead) {
      methods.unregister('secondaryTechnicalLead');
    }
  };

  return (
    <div>
      <FormProvider {...methods}>
        <form autoComplete="off" onSubmit={methods.handleSubmit(() => setOpenCreate(true))}>
          <div className="space-y-12">
            <ProjectDescription mode="create" />
            <TeamContacts secondTechLead={secondTechLead} secondTechLeadOnClick={secondTechLeadOnClick} />
            <ExpenseAuthority />
            <Budget />
            <AccountCoding />
          </div>
          <div className="mt-10 flex items-center justify-start gap-x-6">
            <PreviousButton />
            <button
              type="submit"
              className="flex mr-20 rounded-md bg-bcorange px-4 py-2.5 font-bcsans text-bcblue text-sm tracking-[.2em] shadow-sm hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              SUBMIT REQUEST
            </button>
          </div>
        </form>
      </FormProvider>
      <CreatePublicCloud
        open={openCreate}
        setOpen={setOpenCreate}
        handleSubmit={methods.handleSubmit(handleSubmit)}
        isLoading={isCreatingProject}
      />
      <ReturnModal
        isPublicCreate
        open={openReturn}
        setOpen={setOpenReturn}
        redirectUrl="/public-cloud/requests/active"
        modalTitle="Thank you! We have received your create request."
        modalMessage="We have received your create request for a new product. The Product Owner and Technical Lead(s) will receive the approval/rejection decision via email."
      />
    </div>
  );
});

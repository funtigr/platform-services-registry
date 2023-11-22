'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { PrivateCloudEditRequestBodySchema } from '@/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import PreviousButton from '@/components/buttons/Previous';
import { useSession } from 'next-auth/react';
import Comment from '@/components/modal/Comment';
import ReturnModal from '@/components/modal/Return';
import { useRouter } from 'next/navigation';
import ProjectDescription from '@/components/form/ProjectDescriptionPrivate';
import TeamContacts from '@/components/form/TeamContacts';
import Quotas from '@/components/form/Quotas';
import { useQuery } from '@tanstack/react-query';
import SubmitButton from '@/components/buttons/SubmitButton';
import { PrivateCloudProjectWithUsers } from '@/app/api/private-cloud/project/[licencePlate]/route';
import { PrivateCloudRequestWithCurrentAndRequestedProject } from '@/app/api/private-cloud/request/[id]/route';
import CommonComponents from '@/components/form/CommonComponents';

async function fetchProject(licencePlate: string): Promise<PrivateCloudProjectWithUsers> {
  const res = await fetch(`/api/private-cloud/project/${licencePlate}`);
  if (!res.ok) {
    throw new Error('Network response was not ok for fetch project');
  }

  // Re format data to work with form
  const data = await res.json();

  // Secondaty technical lead should only be included if it exists
  if (data.secondaryTechnicalLead === null) {
    delete data.secondaryTechnicalLead;
  }

  return data;
}

async function fetchActiveRequest(licencePlate: string): Promise<PrivateCloudRequestWithCurrentAndRequestedProject> {
  const res = await fetch(`/api/private-cloud/active-request/${licencePlate}`);

  if (!res.ok) {
    throw new Error('Network response was not ok for fetch active request');
  }

  // Re format data to work with form
  const data = await res.json();

  return data;
}

export default function EditProject({ params }: { params: { licencePlate: string } }) {
  const { data: session, status } = useSession({
    required: true,
  });

  const router = useRouter();

  const [openComment, setOpenComment] = useState(false);
  const [openReturn, setOpenReturn] = useState(false);
  const [isDisabled, setDisabled] = useState(false);
  const [secondTechLead, setSecondTechLead] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data, isSuccess } = useQuery<PrivateCloudProjectWithUsers, Error>({
    queryKey: ['project', params.licencePlate],
    queryFn: () => fetchProject(params.licencePlate),
    enabled: !!params.licencePlate,
  });

  const { data: requestData } = useQuery<PrivateCloudRequestWithCurrentAndRequestedProject, Error>({
    queryKey: ['request', params.licencePlate],
    queryFn: () =>
      fetchActiveRequest(params.licencePlate).catch((error) => {
        console.log('error', error);
        setDisabled(true);
        return Promise.reject(error);
      }),
    enabled: !!params.licencePlate,
  });

  // The data is not available on the first render so fetching it inside the defaultValues. This is a workaround. Not doing this will result in
  // in an error.
  const methods = useForm({
    resolver: zodResolver(PrivateCloudEditRequestBodySchema),
    defaultValues: async () => {
      const response = await fetchProject(params.licencePlate);
      return response;
    },
  });

  useEffect(() => {
    if (requestData) {
      setDisabled(true);
    }
  }, [requestData]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/private-cloud/edit/${params.licencePlate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok for create request');
      }

      setOpenComment(false);
      setOpenReturn(true);
    } catch (error) {
      setIsLoading(false);
      console.error('Error:', error);
    }
  };

  const secondTechLeadOnClick = () => {
    setSecondTechLead(!secondTechLead);
    if (secondTechLead) {
      methods.unregister('secondaryTechnicalLead');
    }
  };

  const setComment = (comment: string) => {
    onSubmit({ ...methods.getValues(), comment });
  };

  return (
    <div>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => setOpenComment(true))}>
          <div className="space-y-12">
            <ProjectDescription disabled={isDisabled} clusterDisabled={true} />
            <TeamContacts
              disabled={isDisabled}
              secondTechLead={secondTechLead}
              secondTechLeadOnClick={secondTechLeadOnClick}
            />
            <Quotas
              licensePlate={data?.licencePlate as string}
              disabled={isDisabled}
              // currentProject={data as PrivateCloudProject}
            />
            <CommonComponents disabled={isDisabled} />
          </div>
          <div className="mt-16 flex items-center justify-start gap-x-6">
            <PreviousButton />
            {!isDisabled ? (
              <div className="flex items-center justify-start gap-x-6">
                <SubmitButton text="SUBMIT REQUEST" />
              </div>
            ) : null}
          </div>
        </form>
      </FormProvider>
      <Comment open={openComment} setOpen={setOpenComment} onSubmit={setComment} isLoading={isLoading} type="create" />
      <ReturnModal open={openReturn} setOpen={setOpenReturn} redirectUrl="/private-cloud/requests" />
    </div>
  );
}

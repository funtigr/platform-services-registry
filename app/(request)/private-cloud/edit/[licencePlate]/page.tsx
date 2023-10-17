"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { PrivateCloudEditRequestBodySchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import PreviousButton from "@/components/buttons/Previous";
import { useSession } from "next-auth/react";
import CreateModal from "@/components/modal/CreatePrivateCloud";
import { useRouter } from "next/navigation";
import ProjectDescription from "@/components/form/ProjectDescription";
import TeamContacts from "@/components/form/TeamContacts";
import Quotas from "@/components/form/Quotas";
import { useQuery } from "@tanstack/react-query";
import SubmitButton from "@/components/buttons/SubmitButton";
import { PrivateCloudProjectWithUsers } from "@/app/api/private-cloud/project/[licencePlate]/route";
import { PrivateCloudRequestWithCurrentAndRequestedProject } from "@/app/api/private-cloud/request/[id]/route";
import CommonComponents from "@/components/form/CommonComponents";

async function fetchProject(
  licencePlate: string
): Promise<PrivateCloudProjectWithUsers> {
  const res = await fetch(`/api/private-cloud/project/${licencePlate}`);
  if (!res.ok) {
    throw new Error("Network response was not ok for fetch project");
  }

  // Re format data to work with form
  const data = await res.json();

  // Secondaty technical lead should only be included if it exists
  if (data.secondaryTechnicalLead === null) {
    delete data.secondaryTechnicalLead;
  }

  return data;
}

async function fetchActiveRequest(
  licencePlate: string
): Promise<PrivateCloudRequestWithCurrentAndRequestedProject> {
  const res = await fetch(`/api/private-cloud/active-request/${licencePlate}`);

  if (!res.ok) {
    throw new Error("Network response was not ok for fetch active request");
  }

  // Re format data to work with form
  const data = await res.json();
  console.log("Active request data", data);

  return data;
}

export default function EditProject({
  params,
}: {
  params: { licencePlate: string };
}) {
  const { data: session, status } = useSession({
    required: true,
  });

  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [isDisabled, setDisabled] = useState(false);
  const [secondTechLead, setSecondTechLead] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data } = useQuery<PrivateCloudProjectWithUsers, Error>(
    ["project", params.licencePlate],
    () => fetchProject(params.licencePlate),
    {
      enabled: !!params.licencePlate,
    }
  );

  const { data: requestData } = useQuery<
    PrivateCloudRequestWithCurrentAndRequestedProject,
    Error
  >(
    ["request", params.licencePlate],
    () => fetchActiveRequest(params.licencePlate),
    {
      enabled: !!params.licencePlate,
      onError: (error) => {
        console.log("error", error);
        setDisabled(true);
      },
    }
  );

  const methods = useForm({
    resolver: zodResolver(PrivateCloudEditRequestBodySchema),
    values: data,
  });

  useEffect(() => {
    if (requestData) {
      setDisabled(true);
    }
  }, [requestData]);

  const onSubmit = async (data: any) => {
    console.log("SUBMIT", data);
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/private-cloud/edit/${params.licencePlate}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok for create request");
      }

      const result = await response.json();

      console.log("Success:", result);
    } catch (error) {
      console.error("Error:", error);
    }

    setIsLoading(false);
    router.replace("/private-cloud/requests");
    router.refresh();
  };

  const secondTechLeadOnClick = () => {
    setSecondTechLead(!secondTechLead);
    if (secondTechLead) {
      methods.unregister("secondaryTechnicalLead");
    }
  };

  return (
    <div>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => setOpen(true))}>
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
      <CreateModal
        open={open}
        setOpen={setOpen}
        handleSubmit={methods.handleSubmit(onSubmit)}
        isLoading={isLoading}
      />
    </div>
  );
}
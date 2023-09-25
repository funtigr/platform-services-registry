"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { CreateRequestBodySchema } from "@/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import CommonComponents from "@/components/form/CommonComponents";
import PreviousButton from "@/components/buttons/Previous";
import { useSession } from "next-auth/react";
import CreateModal from "@/components/modal/Create";
import { useRouter } from "next/navigation";
import ProjectDescription from "@/components/form/ProjectDescription";
import TeamContacts from "@/components/form/TeamContacts";

export default function Page() {
  const { data: session, status } = useSession({
    required: true,
  });

  const { push } = useRouter();

  const [open, setOpen] = useState(false);
  const [secondTechLead, setSecondTechLead] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm({
    resolver: zodResolver(CreateRequestBodySchema),
  });

  console.log("VALUES");
  console.log(methods.watch());

  console.log("ERRORS");
  console.log(methods.formState.errors);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    console.log(data);
    try {
      const response = await fetch("/api/requests/private-cloud/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("response", response);

      if (!response.ok) {
        throw new Error("Network response was not ok for create request");
      }

      const result = await response.json();

      console.log("Success:", result);
    } catch (error) {
      console.error("Error:", error);
    }

    setIsLoading(false);
    push("/private-cloud/products");
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
            <ProjectDescription />
            <TeamContacts
              secondTechLead={secondTechLead}
              secondTechLeadOnClick={secondTechLeadOnClick}
            />
            <CommonComponents />
          </div>
          <div className="mt-16 flex items-center justify-start gap-x-6">
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
      <CreateModal
        open={open}
        setOpen={setOpen}
        handleSubmit={methods.handleSubmit(onSubmit)}
        isLoading={isLoading}
      />
    </div>
  );
}
import { Fragment, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useQuery } from "@tanstack/react-query";
import { UserInputSchema } from "@/schema";
import classNames from "@/components/utils/classnames";

type Person = {
  id: number;
  surname: string;
  givenName: string;
  mail: string;
  displayName: string;
};

async function fetchPeople(email: string): Promise<Person[]> {
  const res = await fetch(`/api/msal?email=${email}`);
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
}

const parseMinistryFromDisplayName = (displayName: string | null) => {
  if (displayName && displayName.length > 0) {
    const dividedString = displayName.split(/(\s+)/);
    if (dividedString[2]) {
      const ministry = dividedString[dividedString.length - 1].split(":", 1)[0];
      return ministry;
    }
  }
};

export default function AsyncAutocomplete({
  name,
  label,
  placeHolder,
  className,
  register,
  control,
  errors,
  setValue,
  setError,
  clearErrors,
}: {
  name: string;
  label: string;
  placeHolder: string;
  className?: string;
  register: any;
  control: any;
  errors: any;
  setValue: any;
  setError: any;
  clearErrors: any;
}) {
  const [selected, setSelected] = useState<Person | null>(null);
  const [query, setQuery] = useState<string | null>(null);

  const {
    data: people,
    isLoading,
    error,
  } = useQuery<Person[], Error>(
    ["people", query],
    () => fetchPeople(query || ""),
    {
      enabled: !!query,
    }
  );

  const autocompleteOnChangeHandler = (value: Person) => {
    setSelected(value);

    const {
      givenName: firstName,
      surname: lastName,
      mail: email,
      displayName,
    } = value;

    const ministry = parseMinistryFromDisplayName(displayName);

    const parsedParams = UserInputSchema.safeParse({
      firstName,
      lastName,
      email,
      ministry,
    });

    if (!parsedParams.success) {
      // Corner case where the user does not have a properly formatted IDIR account
      // do something with the error

      console.log("ERROR WITH " + name);

      setError(name, {
        type: "manual",
        message:
          "The IDIR account assosiated with this email address is badly formatted and cannot be added as it does not contain the users name or ministry",
      });
    } else {
      clearErrors(name);
    }

    setValue(name, {
      firstName,
      lastName,
      email,
      ministry,
    });
  };

  return (
    <div className={className}>
      <label
        htmlFor="first-name"
        className={classNames(
          errors.ministry ? "text-red-400" : "",
          "block text-sm font-medium leading-6 text-gray-900"
        )}
      >
        {label}
      </label>
      <Combobox value={selected} onChange={autocompleteOnChangeHandler}>
        <div className="relative mt-1">
          <div className="relative w-full cursor-default rounded-lg bg-white text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
            <Combobox.Input
              className="rounded-md border-slate-300 w-full py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(person: Person) => person?.mail}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeHolder}
            />
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery(null)}
          >
            <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {isLoading ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Loading...
                </div>
              ) : error ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Error fetching data.
                </div>
              ) : people && people.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No IDIR linked email address found.
                </div>
              ) : (
                people &&
                people.map((person) => (
                  <Combobox.Option
                    key={person?.mail}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? "bg-teal-600 text-white" : "text-gray-900"
                      }`
                    }
                    value={person}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {person?.mail}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-teal-600"
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
      {errors[name] ? (
        <p className={"text-red-400 mt-3 text-sm leading-6"}>
          {errors[name].message}
        </p>
      ) : null}
      {/* {errors?.[name]?.["email"] ? (
        <p className={"text-red-400 mt-3 text-sm leading-6"}>
          {errors?.[name]?.["email"].message}
        </p>
      ) : null} */}

      <div className="mt-8 col-span-full">
        <label
          htmlFor="description"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          First Name
        </label>
        <div className="mt-2">
          <input
            disabled
            value={selected?.givenName}
            placeholder="Autofilled from IDIR"
            type="text"
            id="first-name"
            autoComplete="first-name"
            {...register(name + ".firstName")}
            className="block w-full rounded-md border-0 py-1.5 text-slate-400 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>
      <div className="mt-8 col-span-full">
        <label
          htmlFor="description"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Last Name
        </label>
        <div className="mt-2">
          <input
            disabled
            value={selected?.surname}
            placeholder="Autofilled from IDIR"
            type="text"
            id="last-name"
            autoComplete="last-name"
            {...register(name + ".lastName")}
            className="block w-full rounded-md border-0 py-1.5 text-slate-400 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>
      <div className="mt-8 col-span-full">
        <label
          htmlFor="description"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Ministry
        </label>
        <div className="mt-2">
          <input
            disabled
            value={parseMinistryFromDisplayName(selected?.displayName || "")}
            placeholder="Autofilled from IDIR"
            type="text"
            id="ministry"
            autoComplete="ministry"
            {...register(name + ".ministry")}
            className="block w-full rounded-md border-0 py-1.5 text-slate-400 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>
      </div>
    </div>
  );
}
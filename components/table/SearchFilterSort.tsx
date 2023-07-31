"use client";

import Image from "next/image";
import Search from "@/components/assets/search.svg";
import Filter from "@/components/assets/filter.svg";
import Export from "@/components/assets/export.svg";
import { useState, useTransition, useCallback, useEffect } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
  useParams,
} from "next/navigation";
import { useDebounce } from "@/components/utils/useDebounce";
import FilterPanel from "./FilterPanel";
import { Disclosure, Menu, Transition } from "@headlessui/react";

export default function SearchFilterSort() {
  const [focused, setFocused] = useState(false);
  const { replace } = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams()!;
 
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const debouncedValue = useDebounce<string>(searchTerm, 450);

  const handleSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams?.toString());

      if (term) {
        params.set("search", term);
      } else {
        params.delete("search");
      }
      params.delete("page");

      startTransition(() => {
        replace(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, replace, pathname]
  );

  useEffect(() => {
    if (debouncedValue == "") {
      // remove search param
      const params = new URLSearchParams(searchParams?.toString());
      params.delete("search");
      replace(`${pathname}?${params.toString()}`);
    } else {
      handleSearch(debouncedValue);
    }
  }, [debouncedValue, handleSearch]);

  return (
    <Disclosure>
      <div className="flex justify-end space-x-2.5">
        <form className="flex-grow flex-shrink max-w-sm">
          <label htmlFor="simple-search" className="sr-only">
            Search
          </label>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Image
                alt="Search"
                src={Search}
                width={15}
                height={15}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                }}
              />
            </div>
            <input
              type="text"
              id="simple-search"
              className="w-full border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-300-500 focus:border-slate-300-500 block pl-9 p-1.5 dark:border-gray-300 dark:placeholder-gray-400 dark:text-darkergrey dark:focus:ring-slate-300 dark:focus:border-slate-300"
              placeholder="Search"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => setSearchTerm(e.target.value)}
              spellCheck={false}
            />
            {isPending && (
              <div className="absolute inset-y-0 right-0 mr-4 flex items-center pl-3 pointer-events-none">
                <span className=" border-gray-300 h-5 w-5 animate-spin rounded-full border-2 border-t-slate-400" />
              </div>
            )}
          </div>
        </form>
        <Disclosure.Button
          type="button"
          className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-darkergrey shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <Image
            alt="Filter"
            src={Filter}
            width={16}
            height={10}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />

          <span className="md:inline hidden">Filters</span>
        </Disclosure.Button>
        <button
          type="button"
          className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-darkergrey shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          <Image
            alt="Export"
            src={Export}
            width={16}
            height={12.5}
            style={{
              maxWidth: "100%",
              height: "auto",
            }}
          />
          <span className="md:inline hidden">Export</span>
        </button>
      </div>
      <Disclosure.Panel className="py-10">
        <FilterPanel />
      </Disclosure.Panel>
    </Disclosure>
  );
}

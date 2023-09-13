"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Plus from "@/components/assets/plus.svg";

export default function Tabs() {
  const pathname = usePathname();

  return (
    <span className=" flex mr-20 rounded-md bg-bcorange px-4 py-2 h-10  text-bcsans text-bcblue text-base font-light tracking-[.2em] shadow-sm hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
      <Image src={Plus} alt="plus" width={20} height={20} className="mr-2" />
      <Link type="button" href={`/${pathname.split("/")[1]}/create`}>
        REQUEST A NEW PROJECT SET
      </Link>
    </span>
  );
}
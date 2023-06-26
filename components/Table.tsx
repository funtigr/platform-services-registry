"use client"

import Link from "next/link";

interface TableProps {
  headers: Record<string, string>[];
  rows: Record<string, any>[];
  cloud: string;
}

export default function Table({ headers, rows, cloud }: TableProps) {
  const pageSize = rows.length;

  console.log("TABLE");
  return (
    <>
      <div className="flow-root h-[700px] overflow-y-auto ">
        <div className="w-full overflow-auto">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full text-left">
              <thead className="bg-tableheadergrey border-b-1">
                <tr>
                  {headers.map(({ headerName }, index) => (
                    <th
                      key={headerName + index}
                      scope="col"
                      className={`font-bcsans relative isolate py-3.5 text-left text-sm font-normal text-mediumgrey md:w-auto ${
                        index === 0 ? "pl-4 sm:pl-6 lg:pl-8" : "px-3"
                      } ${
                        index === headers.length - 1
                          ? "pr-4 sm:pr-6 lg:pr-8"
                          : ""
                      }`}
                    >
                      {headerName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.licencePlate + i}
                    className="hover:bg-tableheadergrey"
                    onClick={() => console.log("clicked")}
                  >
                    {headers.map((value, index) => (
                      <td
                        key={value["field"] + index}
                        className={` px-3 py-4 text-sm text-mediumgrey md:table-cell border-b-1 ${
                          index === 0 ? "pl-4 sm:pl-6 lg:pl-8" : ""
                        } `}
                      >
                        {row[value["field"]]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
{
  /* <Link
href={{
  pathname: `/dashboard/${cloud}/products/${row.licencePlate}`,
}}
> */
}

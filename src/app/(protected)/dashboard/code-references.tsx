"use client";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Prism as SyntaxHighligher } from "react-syntax-highlighter";
import { lucario } from "react-syntax-highlighter/dist/esm/styles/prism";

type Props = {
  filesReferences: { fileName: string; sourceCode: string; summary: string }[];
};
const CodeReferences = ({ filesReferences }: Props) => {
  const [tab, setTab] = useState(filesReferences[0]?.fileName);
  if (filesReferences.length === 0) return null;

  return (
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden rounded-lg">
      <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col">
        {/* Mobile dropdown for small screens */}
        <select
          value={tab}
          onChange={(e) => setTab(e.target.value)}
          className="mb-2 w-full rounded-lg border-gray-200 bg-gray-100 p-2 dark:border-gray-700 dark:bg-gray-800 md:hidden"
        >
          {filesReferences.map(({ fileName }) => (
            <option key={fileName} value={fileName}>
              {fileName}
            </option>
          ))}
        </select>

        {/* Desktop tabs */}
        <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 hidden max-w-full gap-2 overflow-x-auto rounded-t-lg bg-gray-100/80 p-2 backdrop-blur supports-[backdrop-filter]:bg-gray-100/60 dark:bg-gray-800/80 dark:supports-[backdrop-filter]:bg-gray-800/60 md:flex">
          {filesReferences.map(({ fileName }, index) => (
            <button
              key={index}
              onClick={() => setTab(fileName)}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-800",
                {
                  "scale-[1.02] bg-primary text-primary-foreground shadow-sm":
                    tab === fileName,
                  "text-gray-600 dark:text-gray-300": tab !== fileName,
                },
              )}
            >
              {fileName}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {filesReferences.map((file) => (
            <TabsContent
              key={file.fileName}
              value={file.fileName}
              className="order-gray-200 m-0 h-full min-h-[500px] rounded-lg border shadow-sm dark:border-gray-700"
            >
              <div className="h-[500px] overflow-auto">
                <SyntaxHighligher
                  language="typescript"
                  style={lucario}
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.5rem",
                    height: "100%",
                    padding: "1.5rem",
                  }}
                >
                  {file.sourceCode}
                </SyntaxHighligher>
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

export default CodeReferences;

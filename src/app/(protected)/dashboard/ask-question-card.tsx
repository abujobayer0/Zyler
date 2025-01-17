"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import MDEditor from "@uiw/react-md-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import useProject from "@/hooks/use-project";
import { Loader2, Sparkles } from "lucide-react";
import Image from "next/image";
import { askQuestion } from "./actions";
import { readStreamableValue } from "ai/rsc";
import CodeReferences from "./code-references";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";

const AskQuestionCard = () => {
  const { project } = useProject();
  const [question, setQuestion] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filesReferences, setFilesReferences] = useState<
    { fileName: string; sourceCode: string; summary: string }[]
  >([]);
  const [answers, setAnswers] = useState("");
  const saveAnswer = api.project.saveAnswer.useMutation();

  const refetch = useRefetch();
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setAnswers("");
    setFilesReferences([]);
    e.preventDefault();
    if (!project?.id) return;
    setLoading(true);

    const { output, filesReferences } = await askQuestion(question, project.id);
    setIsDialogOpen(true);

    setFilesReferences(filesReferences);
    for await (const delta of readStreamableValue(output)) {
      if (delta) {
        setAnswers((ans) => ans + delta);
      }
    }
    setLoading(false);
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[80vw]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>
                <Image src={"/logo.png"} width={40} height={40} alt="logo" />
              </DialogTitle>
              <Button
                variant={"outline"}
                disabled={saveAnswer.isPending}
                onClick={() => {
                  saveAnswer.mutate(
                    {
                      projectId: project!.id,
                      question,
                      answer: answers,
                      filesReferences,
                    },
                    {
                      onSuccess: () => {
                        toast.success("Answer saved!");
                        refetch();
                      },
                      onError: () => {
                        toast.error("Failed to save answer. Please try again.");
                      },
                    },
                  );
                }}
              >
                Save Answer
              </Button>
            </div>
          </DialogHeader>
          <MDEditor.Markdown
            source={answers}
            className="!h-full max-h-[40vh] max-w-[70vw] overflow-scroll"
          />
          <div className="h-4"></div>

          <CodeReferences filesReferences={filesReferences} />
          <Button type="button" onClick={() => setIsDialogOpen(false)}>
            Close{" "}
          </Button>
        </DialogContent>
      </Dialog>
      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>
            Ask a question about {project?.name || "Project"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              placeholder="Which file should i edit to change the home page?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <div className="h-4"></div>
            <Button disabled={loading} type="submit">
              Ask Zyler{" "}
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default AskQuestionCard;

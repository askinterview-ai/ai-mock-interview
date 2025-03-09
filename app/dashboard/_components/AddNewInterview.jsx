"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chatSession } from "@/utils/GeminiAIModal";
import { LoaderCircle } from "lucide-react";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { useRouter } from "next/navigation";

function AddNewInterview() {
  const [openDailog, setOpenDailog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [jsonResponse, setJsonResponse] = useState([]);
  const router = useRouter();
  const { user } = useUser();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const InputPrompt =
        `Job position: ${jobPosition}, ` +
        `Job Description: ${jobDesc}, ` +
        `Years of Experience: ${jobExperience}. ` +
        `Based on the above details, provide ${process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT} ` +
        `interview questions and answers in JSON format with 'question' and 'answer' fields.`;

      const result = await chatSession.sendMessage(InputPrompt);

      // Clean up the AI response
      const MockJsonResp = result.response
        .text()
        .replace(/```json|```/g, "") // Remove code block markers
        .trim(); // Remove extra whitespace


      // Try parsing JSON
      const parsedResponse = JSON.parse(MockJsonResp);
      setJsonResponse(parsedResponse);

      // Insert into the database
      const resp = await db
        .insert(MockInterview)
        .values({
          mockId: uuidv4(),
          jsonMockResp: JSON.stringify(parsedResponse),
          jobPosition,
          jobDesc,
          jobExperience,
          createdBy: user?.primaryEmailAddress?.emailAddress,
          createdAt: moment().format("DD-MM-yyyy"),
        })
        .returning({ mockId: MockInterview.mockId });

      console.log("Inserted ID:", resp);

      if (resp) {
        setOpenDailog(false);
        router.push(`/dashboard/interview/${resp[0]?.mockId}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Add New Button */}
      <div
        className="p-10 border rounded-lg bg-secondary hover:scale-105 hover:shadow-md cursor-pointer transition-all border-dashed"
        onClick={() => setOpenDailog(true)}
      >
        <h2 className="text-lg text-center">+ Add New</h2>
      </div>

      {/* Dialog */}
      <Dialog open={openDailog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Tell us more about your job interviewing 🤩
            </DialogTitle>
            <DialogDescription>
              <form onSubmit={onSubmit}>
                {/* Job Role/Position */}
                <div className="mt-7 my-3">
                  <label className="block font-medium">Job Role/Job Position</label>
                  <Input
                    placeholder="Ex. Full Stack Developer"
                    required
                    value={jobPosition}
                    onChange={(event) => setJobPosition(event.target.value)}
                  />
                </div>

                {/* Job Description */}
                <div className="my-3">
                  <label className="block font-medium">Job Description/Tech Stack (In Short)</label>
                  <Textarea
                    placeholder="Ex. React, Angular, NodeJs, MySQL, etc."
                    required
                    value={jobDesc}
                    onChange={(event) => setJobDesc(event.target.value)}
                  />
                </div>

                {/* Years of Experience */}
                <div className="my-3">
                  <label className="block font-medium">Years of Experience</label>
                  <Input
                    placeholder="Ex. 5"
                    type="number"
                    max="100"
                    required
                    value={jobExperience}
                    onChange={(event) => setJobExperience(event.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-5 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenDailog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <LoaderCircle className="animate-spin mr-2" />
                        Generating from AI...
                      </>
                    ) : (
                      "Start Interview"
                    )}
                  </Button>
                </div>
              </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterview;

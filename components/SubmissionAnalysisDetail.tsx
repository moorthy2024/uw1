"use client";
import { SubmissionAnalysis } from "./SubmissionAnalysis";

interface SubmissionAnalysisDetailProps {
  submissionId: string;
}

export function SubmissionAnalysisDetail({ submissionId }: SubmissionAnalysisDetailProps) {
  return <SubmissionAnalysis submissionId={submissionId} />;
}


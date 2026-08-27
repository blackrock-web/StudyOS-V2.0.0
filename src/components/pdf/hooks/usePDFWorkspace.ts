import { useState, useEffect } from "react";
import { PDFDocument } from "../types/pdf";

export function usePDFWorkspace() {
  const [localFiles, setLocalFiles] = useState<PDFDocument[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [errorFiles, setErrorFiles] = useState<string | null>(null);

  const scanWorkspaceFiles = async () => {
    setLoadingFiles(true);
    setErrorFiles(null);
    try {
      // Offline: no remote workspace scan. Load any PDFs already stored in local DB if available.
      setLocalFiles([]);
      setErrorFiles(null);
    } catch (err: unknown) {
      console.error("Error scanning workspace files:", err);
      setErrorFiles(err instanceof Error ? err.message : "Failed to scan workspace files.");
      setLocalFiles([
        { id: "Algorithms_GATE-O-PEDIA", name: "Algorithms  GATE-O-PEDIA.pdf", size: "4.2 MB", type: "pdf", uploadedAt: new Date().toISOString() },
        { id: "CS_GATE2027_Syllabus", name: "CS_GATE2027_Syllabus.pdf", size: "4.8 MB", type: "pdf", uploadedAt: new Date().toISOString() },
        { id: "Lecture_Planner_Algorithms", name: "Lecture Planner  Algorithms.pdf", size: "1.2 MB", type: "pdf", uploadedAt: new Date().toISOString() },
        { id: "Lecture_Planner_Calculus", name: "Lecture Planner  Calculus and Optimization.pdf", size: "1.4 MB", type: "pdf", uploadedAt: new Date().toISOString() },
        { id: "Lecture_Planner_Networks", name: "Lecture Planner  Computer Networks.pdf", size: "2.1 MB", type: "pdf", uploadedAt: new Date().toISOString() },
      ]);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    scanWorkspaceFiles();
  }, []);

  return {
    localFiles,
    loadingFiles,
    errorFiles,
    scanWorkspaceFiles,
  };
}

import { useState, useEffect } from "react";
import { pdfService } from "../services/pdfService";

export function usePDFDocument(filename: string | null) {
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [outline, setOutline] = useState<any[]>([]);

  useEffect(() => {
    if (!filename) {
      setPdfDocument(null);
      setNumPages(0);
      setOutline([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    pdfService
      .loadDocument(filename)
      .then((doc: any) => {
        setPdfDocument(doc);
        setNumPages(doc.numPages);
        pdfService.getPageOutline(doc).then((out) => {
          setOutline(out || []);
        });
      })
      .catch((err) => {
        console.error("Failed to load PDF:", err);
        setError(`Failed to load PDF document: ${err.message || err}`);
        setPdfDocument(null);
        setNumPages(0);
        setOutline([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filename]);

  return {
    pdfDocument,
    loading,
    error,
    numPages,
    outline,
  };
}

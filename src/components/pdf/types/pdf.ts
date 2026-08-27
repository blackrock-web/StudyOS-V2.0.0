export interface PDFDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt?: string;
  subject?: string;
}

export interface PDFTab {
  id: string; // matches pdf id
  name: string;
  currentPage: number;
  zoom: number;
  rotation: number;
  scrollPosition: number;
  bookmarks: number[]; // page numbers
  isPinned?: boolean;
}

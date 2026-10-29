export type SourceKind = "pdf" | "text";

export type StudyDoc = {
  id: string;
  title: string;
  source: SourceKind;
  text: string;
  pages?: number;
  createdAt: number;
};

export type ApiError = { error: string; message: string };

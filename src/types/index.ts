export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'excel';
  size: number;
  uploadDate: string;
  sheets?: ExcelSheet[];
  content?: string;
  url?: string;
  public_id?: string;
}

export interface ExcelSheet {
  name: string;
  data: Array<Record<string, string | number>>;
}

export interface SearchResult {
  documentId: string;
  documentName: string;
  sheet: string;
  row: number;
  column: string;
  value: string;
  matchText: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}
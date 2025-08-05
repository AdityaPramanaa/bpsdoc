export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'other';
  size: number;
  uploadDate: string;
  sheets?: ExcelSheet[];
  content?: string;
  url?: string;
  public_id?: string;
  resource_type?: string;
}

export interface ExcelSheet {
  name: string;
  data: Array<Record<string, string | number>>;
}

export interface SearchResult {
  file: string;
  type: 'excel' | 'pdf' | 'other';
  sheet?: string;
  row?: number;
  column?: string;
  value?: string;
  page?: number;
  snippet?: string;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
}
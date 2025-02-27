export interface ShareSession {
  id: string;
  process: any;
  pid?: number;
  ticket: string;
  filePath: string;
  fileName: string;
  startTime: Date;
  isDetached?: boolean;
}

export interface StoredSession {
  id: string;
  pid: number;
  ticket: string;
  filePath: string;
  fileName: string;
  startTime: string;
}

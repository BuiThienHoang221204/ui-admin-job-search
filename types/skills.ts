export interface SkillReferenceFile {
  name: string;
  bytes: number;
}

export interface SkillManifest {
  name: string;
  description: string;
  allowedTools: string[];
  frameworkVersion?: string;
  contentHash: string;
  bodyBytes: number;
  references: SkillReferenceFile[];
}

export type DependencyField =
  | "dependencies"
  | "devDependencies"
  | "optionalDependencies"
  | "peerDependencies";

export interface PackageManifest {
  name?: string;
  version?: string;
  pnpm?: {
    overrides?: Record<string, string>;
  } & Record<string, unknown>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  [key: string]: unknown;
}

export interface DependencySpec {
  field: DependencyField;
  name: string;
  spec: string;
}

export interface UnsupportedDependency {
  field: DependencyField;
  name: string;
  spec: string;
  reason: string;
}

export interface RegistryVersionMeta {
  version: string;
  publishedAt: Date;
  deprecated?: string;
}

export interface RegistryPackageMeta {
  name: string;
  latestVersion?: string;
  versions: RegistryVersionMeta[];
}

export interface DependencySelection {
  dependency: DependencySpec;
  latest?: RegistryVersionMeta;
  selected?: RegistryVersionMeta;
  skippedRecent: RegistryVersionMeta[];
  skippedIncompatible: number;
  reason?: string;
}

export interface CommandOptions {
  age?: number;
  dependencyNames?: string[];
  dryRun: boolean;
  ignorePinned?: "all" | "major" | "minor";
  includeTransitive: boolean;
  projectDir: string;
  usePnpmGlobalConfig: boolean;
}

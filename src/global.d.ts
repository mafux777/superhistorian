// Global `pendo` object created by the Novus by Pendo install snippet in
// src/app/layout.tsx. Types the agent's lifecycle calls.

type PendoMetadataValue = string | number | boolean | string[];

interface PendoMetadata {
  id: string;
  [field: string]: PendoMetadataValue | undefined;
}

interface PendoIdentity {
  visitor: PendoMetadata;
  account?: PendoMetadata;
}

interface PendoAgent {
  initialize(options: PendoIdentity): void;
  identify(identity: PendoIdentity): void;
  clearSession(): void;
}

declare var pendo: PendoAgent;

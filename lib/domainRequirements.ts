export interface DomainRequirement {
  tld: string;
  name: string;
  requiresAdditionalDetails: boolean;
  requirements: string[];
  restrictions: string[];
  supported: boolean;
  warningMessage?: string;
}

export const DOMAIN_REQUIREMENTS: Record<string, DomainRequirement> = {
  au: {
    tld: "au",
    name: "Australian (.au)",
    requiresAdditionalDetails: true,
    supported: false,
    requirements: [
      "Australian Business Number (ABN) or Australian Company Number (ACN)",
      "Australian presence or connection",
      "Business registration details",
      "Specific contact information requirements",
    ],
    restrictions: [
      "Must have Australian business registration",
      "Cannot be registered by individuals without business connection",
      "Requires additional verification process",
    ],
    warningMessage:
      "Australian domains require business registration and additional verification. Please contact support for assistance.",
  },
  "co.uk": {
    tld: "co.uk",
    name: "UK Commercial (.co.uk)",
    requiresAdditionalDetails: true,
    supported: false,
    requirements: [
      "UK business registration",
      "UK presence or connection",
      "Company registration number",
    ],
    restrictions: [
      "Must have UK business registration",
      "Requires UK company details",
    ],
    warningMessage:
      "UK commercial domains require business registration. Please contact support for assistance.",
  },
  uk: {
    tld: "uk",
    name: "UK (.uk)",
    requiresAdditionalDetails: true,
    supported: false,
    requirements: [
      "UK business registration",
      "UK presence or connection",
      "Company registration number",
    ],
    restrictions: [
      "Must have UK business registration",
      "Requires UK company details",
    ],
    warningMessage:
      "UK domains require business registration. Please contact support for assistance.",
  },
  ca: {
    tld: "ca",
    name: "Canadian (.ca)",
    requiresAdditionalDetails: true,
    supported: false,
    requirements: [
      "Canadian business registration",
      "Canadian presence or connection",
      "Business registration number",
    ],
    restrictions: [
      "Must have Canadian business registration",
      "Requires Canadian company details",
    ],
    warningMessage:
      "Canadian domains require business registration. Please contact support for assistance.",
  },
  de: {
    tld: "de",
    name: "German (.de)",
    requiresAdditionalDetails: true,
    supported: false,
    requirements: [
      "German business registration",
      "German presence or connection",
      "Business registration number",
    ],
    restrictions: [
      "Must have German business registration",
      "Requires German company details",
    ],
    warningMessage:
      "German domains require business registration. Please contact support for assistance.",
  },
  eu: {
    tld: "eu",
    name: "European Union (.eu)",
    requiresAdditionalDetails: true,
    supported: false,
    requirements: [
      "EU citizenship OR residence in EU/EEA countries",
      "Company/organization established in EU/EEA",
      "Valid EU business registration",
      "Compliance with EURid registry policies",
    ],
    restrictions: [
      "Only EU citizens can register as individuals",
      "Non-EU citizens must reside in EU/EEA countries",
      "Companies must be legally established in EU/EEA",
      "Indian residents without EU citizenship/company cannot register",
    ],
    warningMessage:
      "EU domains require EU citizenship, residence, or business establishment. Indian residents without EU connections cannot register .eu domains. Please contact support for assistance.",
  },
};

export function getDomainRequirements(
  domainName: string
): DomainRequirement | null {
  const domainParts = domainName.split(".");
  const tld = domainParts.slice(1).join(".").toLowerCase(); // Get full TLD for multi-level TLDs
  if (!tld) return null;

  return DOMAIN_REQUIREMENTS[tld] || null;
}

export function isDomainSupported(domainName: string): boolean {
  const requirements = getDomainRequirements(domainName);
  return !requirements || requirements.supported;
}

export function requiresAdditionalDetails(domainName: string): boolean {
  const requirements = getDomainRequirements(domainName);
  return requirements?.requiresAdditionalDetails || false;
}

export function getRestrictedDomains(): string[] {
  return Object.values(DOMAIN_REQUIREMENTS)
    .filter((req) => !req.supported)
    .map((req) => req.tld);
}

// Domain requirements data for different TLDs
export interface DomainRequirement {
  text: string;
  required: boolean;
}

export interface DomainRestriction {
  text: string;
  type: "warning" | "error" | "info";
}

export interface AlternativeDomain {
  domain: string;
  available: boolean;
  price?: string;
}

// TLDs that require special permissions and should be blocked from cart
// Since we only serve India, we restrict all country-specific TLDs except Indian ones
export const RESTRICTED_TLDS = [
  ".au", // Australian domains - require ABN/ACN
  ".uk", // UK domains - require UK presence
  ".co.uk", // UK domains - require UK presence
  ".ca", // Canadian domains - require Canadian presence
  ".de", // German domains - require German presence
  ".fr", // French domains - require French presence
  ".nl", // Dutch domains - require Dutch presence
  ".es", // Spanish domains - require Spanish presence
  ".it", // Italian domains - require Italian presence
  ".jp", // Japanese domains - require Japanese presence
  ".cn", // Chinese domains - require Chinese presence
  ".br", // Brazilian domains - require Brazilian presence
  ".mx", // Mexican domains - require Mexican presence
  ".ru", // Russian domains - require Russian presence
  ".za", // South African domains - require South African presence
  // Note: .in and .co.in are allowed as we serve India
];

// Function to check if a TLD is restricted
export function isRestrictedTLD(tld: string): boolean {
  const normalizedTld = tld.startsWith(".") ? tld : `.${tld}`;
  return RESTRICTED_TLDS.includes(normalizedTld.toLowerCase());
}

// Pre-defined requirements for common TLDs
export const DOMAIN_REQUIREMENTS: Record<
  string,
  {
    requirements: DomainRequirement[];
    restrictions: DomainRestriction[];
  }
> = {
  ".au": {
    requirements: [
      {
        text: "Australian Business Number (ABN) or Australian Company Number (ACN)",
        required: true,
      },
      { text: "Australian presence or connection", required: true },
      { text: "Business registration details", required: true },
      { text: "Specific contact information requirements", required: true },
    ],
    restrictions: [
      { text: "Must have Australian business registration", type: "warning" },
      {
        text: "Cannot be registered by individuals without business connection",
        type: "error",
      },
      { text: "Requires additional verification process", type: "info" },
    ],
  },
  ".co.uk": {
    requirements: [
      { text: "UK presence or connection", required: true },
      { text: "Valid UK address", required: true },
      { text: "Contact information in UK", required: true },
    ],
    restrictions: [
      { text: "Must have UK connection", type: "warning" },
      { text: "Cannot be registered without UK presence", type: "error" },
    ],
  },
  ".ca": {
    requirements: [
      { text: "Canadian presence or connection", required: true },
      { text: "Valid Canadian address", required: true },
      { text: "Canadian citizen or permanent resident", required: true },
    ],
    restrictions: [
      { text: "Must have Canadian connection", type: "warning" },
      { text: "Cannot be registered without Canadian presence", type: "error" },
    ],
  },
  ".de": {
    requirements: [
      { text: "German presence or connection", required: true },
      { text: "Valid German address", required: true },
      { text: "German citizen or resident", required: true },
    ],
    restrictions: [
      { text: "Must have German connection", type: "warning" },
      { text: "Cannot be registered without German presence", type: "error" },
    ],
  },
};

// Function to get requirements for a specific TLD
export function getDomainRequirements(tld: string): {
  requirements: DomainRequirement[];
  restrictions: DomainRestriction[];
} {
  return (
    DOMAIN_REQUIREMENTS[tld] || {
      requirements: [],
      restrictions: [],
    }
  );
}

// Function to generate alternative domains
export function generateAlternativeDomains(
  domainName: string,
  tld: string
): AlternativeDomain[] {
  const alternatives: AlternativeDomain[] = [];
  const commonTlds = [".com", ".net", ".org", ".io", ".co"];

  commonTlds.forEach((altTld) => {
    if (altTld !== tld) {
      alternatives.push({
        domain: `${domainName}${altTld}`,
        available: true, // This would be checked against actual availability
        price: getTldPrice(altTld),
      });
    }
  });

  return alternatives;
}

// Function to get pricing for TLDs
function getTldPrice(tld: string): string {
  const prices: Record<string, string> = {
    ".com": "$12.99/year",
    ".net": "$14.99/year",
    ".org": "$13.99/year",
    ".io": "$49.99/year",
    ".co": "$29.99/year",
  };

  return prices[tld] || "$12.99/year";
}

// Function to check if a TLD requires special verification
export function requiresSpecialVerification(tld: string): boolean {
  return Object.keys(DOMAIN_REQUIREMENTS).includes(tld);
}

// Alias for backward compatibility
export const requiresAdditionalDetails = requiresSpecialVerification;
export const isDomainSupported = (tld: string): boolean =>
  !requiresSpecialVerification(tld);

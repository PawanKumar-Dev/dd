export interface User {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Domain {
  _id: string;
  domainName: string;
  status: "available" | "registered" | "pending" | "failed";
  price: number;
  currency: string;
  registrationPeriod: number;
  userId: string;
  orderId?: string;
  resellerClubOrderId?: string;
  registeredAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  domainName: string;
  price: number;
  currency: string;
  registrationPeriod: number;
}

export interface Payment {
  _id: string;
  userId: string;
  orderId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  domainIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DNSRecord {
  _id: string;
  domainId: string;
  recordType: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResellerClubResponse {
  status: string;
  message?: string;
  data?: any;
}

export interface DomainSearchResult {
  domainName: string;
  available: boolean;
  price: number;
  currency: string;
  registrationPeriod: number;
  pricingSource?: "live" | "fallback" | "unavailable" | "taken";
  originalPrice?: number;
  isPromotional?: boolean;
  promotionalDetails?: {
    startTime: string;
    endTime: string;
    period: string;
    originalCustomerPrice: number;
    originalResellerPrice: number;
  };
}

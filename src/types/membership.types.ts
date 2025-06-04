export interface Membership {
  id: number;
  uuid: string;
  name: string;
  user: number;
  recurringPrice: number;
  validFrom: Date;
  validUntil: Date;
  state: string;
  paymentMethod: string;
  billingInterval: string;
  billingPeriods: number;
}

export interface MembershipPeriod {
  id: number;
  uuid: string;
  membership: number;
  start: Date;
  end: Date;
  state: string;
}

export interface CreateMembershipRequest {
  name: string;
  recurringPrice: number;
  validFrom?: string;
  paymentMethod: string;
  billingInterval: string;
  billingPeriods: number;
}

export interface CreateMembershipResponse {
  membership: Membership;
  membershipPeriods: MembershipPeriod[];
}

export interface MembershipWithPeriods {
  membership: Membership;
  periods: MembershipPeriod[];
}
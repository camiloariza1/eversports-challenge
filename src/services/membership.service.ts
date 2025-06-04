import { v4 as uuidv4 } from 'uuid';
import memberships from '../data/memberships.json';
import membershipPeriods from '../data/membership-periods.json';
import { 
  Membership, 
  MembershipPeriod, 
  CreateMembershipRequest, 
  CreateMembershipResponse,
  MembershipWithPeriods 
} from '../types/membership.types';

export class MembershipService {
  private static readonly USER_ID = 2000;

  static getAllMemberships(): MembershipWithPeriods[] {
    const rows: MembershipWithPeriods[] = [];
    
    for (const membership of memberships) {
      const periods = membershipPeriods.filter(p => p.membership === membership.id);
      rows.push({ 
        membership: {
          ...membership,
          user: (membership as any).userId || this.USER_ID,
          validFrom: new Date(membership.validFrom),
          validUntil: new Date(membership.validUntil)
        } as Membership, 
        periods: periods.map(p => ({
          ...p,
          start: new Date(p.start),
          end: new Date(p.end)
        })) as MembershipPeriod[]
      });
    }
    
    return rows;
  }

  static validateMembershipRequest(req: CreateMembershipRequest): string | null {
    if (!req.name || !req.recurringPrice) {
      return "missingMandatoryFields";
    }

    if (req.recurringPrice < 0) {
      return "negativeRecurringPrice";
    }

    if (req.recurringPrice > 100 && req.paymentMethod === 'cash') {
      return "cashPriceBelow100";
    }

    if (req.billingInterval === 'monthly') {
      if (req.billingPeriods > 12) {
        return "billingPeriodsMoreThan12Months";
      }
      if (req.billingPeriods < 6) {
        return "billingPeriodsLessThan6Months";
      }
    } else if (req.billingInterval === 'yearly') {
      if (req.billingPeriods < 3) {
        return "billingPeriodsLessThan3Years";
      }
      if (req.billingPeriods > 10) {
        return "billingPeriodsMoreThan10Years";
      }
    } else {
      return "invalidBillingPeriods";
    }

    return null;
  }

  static createMembership(req: CreateMembershipRequest): CreateMembershipResponse {
    const validFrom = req.validFrom ? new Date(req.validFrom) : new Date();
    const validUntil = new Date(validFrom);
    
    if (req.billingInterval === 'monthly') {
      validUntil.setMonth(validFrom.getMonth() + req.billingPeriods);
    } else if (req.billingInterval === 'yearly') {
      validUntil.setMonth(validFrom.getMonth() + req.billingPeriods * 12);
    } else if (req.billingInterval === 'weekly') {
      validUntil.setDate(validFrom.getDate() + req.billingPeriods * 7);
    }

    let state = 'active';
    if (validFrom > new Date()) {
      state = 'pending';
    }
    if (validUntil < new Date()) {
      state = 'expired';
    }

    const newMembership: Membership = {
      id: memberships.length + 1,
      uuid: uuidv4(),
      name: req.name,
      state,
      validFrom: validFrom,
      validUntil: validUntil,
      user: this.USER_ID,
      paymentMethod: req.paymentMethod,
      recurringPrice: req.recurringPrice,
      billingPeriods: req.billingPeriods,
      billingInterval: req.billingInterval,
    };

    memberships.push(newMembership as any);

    const createdPeriods: MembershipPeriod[] = [];
    let periodStart = validFrom;

    console.log('validFrom', validFrom);
    console.log('validUntil', validUntil);
    console.log('req.billingPeriods', req.billingPeriods);
    console.log('req.billingInterval', req.billingInterval);
    
    for (let i = 0; i < req.billingPeriods; i++) {
      const periodValidFrom = periodStart;
      const periodValidUntil = new Date(periodValidFrom);
      
      if (req.billingInterval === 'monthly') {
        periodValidUntil.setMonth(periodValidFrom.getMonth() + 1);
      } else if (req.billingInterval === 'yearly') {
        periodValidUntil.setMonth(periodValidFrom.getMonth() + 12);
      } else if (req.billingInterval === 'weekly') {
        periodValidUntil.setDate(periodValidFrom.getDate() + 7);
      }
      
      const period: MembershipPeriod = {
        id: i + 1,
        uuid: uuidv4(),
        membership: newMembership.id,
        start: periodValidFrom,
        end: periodValidUntil,
        state: 'planned'
      };
      
      createdPeriods.push(period);
      periodStart = periodValidUntil;
    }

    return { membership: newMembership, membershipPeriods: createdPeriods };
  }
}
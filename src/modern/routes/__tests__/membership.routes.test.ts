import request from 'supertest';
import express from 'express';
import membershipRoutes from '../membership.routes';

const app = express();
app.use(express.json());
app.use('/memberships', membershipRoutes);

describe('Membership Routes', () => {
  describe('GET /memberships', () => {
    it('should return all memberships with their periods', async () => {
      const response = await request(app)
        .get('/memberships')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const firstMembership = response.body[0];
      expect(firstMembership).toHaveProperty('membership');
      expect(firstMembership).toHaveProperty('periods');
      expect(firstMembership.membership).toHaveProperty('id');
      expect(firstMembership.membership).toHaveProperty('name');
      expect(firstMembership.membership).toHaveProperty('recurringPrice');
      expect(Array.isArray(firstMembership.periods)).toBe(true);
    });
  });

  describe('POST /memberships', () => {
    const validMembershipData = {
      name: 'Test Membership',
      recurringPrice: 50,
      paymentMethod: 'credit card',
      billingInterval: 'monthly',
      billingPeriods: 6
    };

    it('should create a new membership with valid data', async () => {
      const response = await request(app)
        .post('/memberships')
        .send(validMembershipData)
        .expect(201);

      expect(response.body).toHaveProperty('membership');
      expect(response.body).toHaveProperty('membershipPeriods');
      expect(response.body.membership.name).toBe(validMembershipData.name);
      expect(response.body.membership.recurringPrice).toBe(validMembershipData.recurringPrice);
      expect(response.body.membershipPeriods.length).toBe(validMembershipData.billingPeriods);
    });

    it('should return 400 when name is missing', async () => {
      const invalidData = { ...validMembershipData, name: undefined as any };

      const response = await request(app)
        .post('/memberships')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('missingMandatoryFields');
    });

    it('should return 400 when recurringPrice is missing', async () => {
      const invalidData = { ...validMembershipData, recurringPrice: undefined as any };

      const response = await request(app)
        .post('/memberships')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('missingMandatoryFields');
    });

    it('should return 400 when recurringPrice is negative', async () => {
      const invalidData = { ...validMembershipData, recurringPrice: -10 };

      const response = await request(app)
        .post('/memberships')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('negativeRecurringPrice');
    });

    it('should return 400 when cash payment exceeds 100', async () => {
      const invalidData = { 
        ...validMembershipData, 
        recurringPrice: 150, 
        paymentMethod: 'cash' 
      };

      const response = await request(app)
        .post('/memberships')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('cashPriceBelow100');
    });

    it('should return 400 when monthly billing periods exceed 12', async () => {
      const invalidData = { 
        ...validMembershipData, 
        billingInterval: 'monthly',
        billingPeriods: 15 
      };

      const response = await request(app)
        .post('/memberships')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('billingPeriodsMoreThan12Months');
    });

    it('should return 400 when monthly billing periods are less than 6', async () => {
      const invalidData = { 
        ...validMembershipData, 
        billingInterval: 'monthly',
        billingPeriods: 3 
      };

      const response = await request(app)
        .post('/memberships')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('billingPeriodsLessThan6Months');
    });

    it('should return 400 when yearly billing periods are less than 3', async () => {
      const invalidData = { 
        ...validMembershipData, 
        billingInterval: 'yearly',
        billingPeriods: 2 
      };

      const response = await request(app)
        .post('/memberships')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('billingPeriodsLessThan3Years');
    });

    it('should return 400 when yearly billing periods exceed 10', async () => {
      const invalidData = { 
        ...validMembershipData, 
        billingInterval: 'yearly',
        billingPeriods: 15 
      };

      const response = await request(app)
        .post('/memberships')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('billingPeriodsMoreThan10Years');
    });

    it('should return 400 when billing interval is invalid', async () => {
      const invalidData = { 
        ...validMembershipData, 
        billingInterval: 'invalid',
        billingPeriods: 6 
      };

      const response = await request(app)
        .post('/memberships')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('invalidBillingPeriods');
    });

    it('should create membership with valid yearly data', async () => {
      const yearlyData = {
        ...validMembershipData,
        billingInterval: 'yearly',
        billingPeriods: 5
      };

      const response = await request(app)
        .post('/memberships')
        .send(yearlyData)
        .expect(201);

      expect(response.body.membership.billingInterval).toBe('yearly');
      expect(response.body.membershipPeriods.length).toBe(5);
    });

    it('should create membership with custom validFrom date', async () => {
      const customData = {
        ...validMembershipData,
        validFrom: '2024-06-01'
      };

      const response = await request(app)
        .post('/memberships')
        .send(customData)
        .expect(201);

      expect(new Date(response.body.membership.validFrom)).toEqual(new Date('2024-06-01'));
    });
  });
});
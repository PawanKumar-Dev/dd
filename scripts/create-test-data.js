#!/usr/bin/env node

/**
 * =============================================================================
 * CREATE TEST DATA SCRIPT
 * =============================================================================
 * 
 * Purpose: Create test orders and domains to populate the dashboard
 * 
 * Usage:
 *   node scripts/create-test-data.js
 * 
 * Author: Excel Technologies
 * Created: 2024
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  isActivated: { type: Boolean, default: true },
}, { timestamps: true });

// Order schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paymentId: { type: String, required: true, unique: true },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
  razorpaySignature: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'INR' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  domains: [{
    domainName: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    registrationPeriod: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'processing', 'registered', 'failed', 'cancelled'], default: 'pending' },
    bookingStatus: [{
      step: { type: String, required: true },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      progress: { type: Number, required: true },
    }],
    error: String,
    orderId: String,
    expiresAt: Date,
    resellerClubOrderId: String,
    resellerClubCustomerId: String,
    resellerClubContactId: String,
  }],
  successfulDomains: [String],
  paymentVerification: {
    verifiedAt: { type: Date, required: true },
    paymentStatus: { type: String, required: true },
    paymentAmount: { type: Number, required: true },
    paymentCurrency: { type: String, required: true },
    razorpayOrderId: { type: String, required: true },
  },
  invoiceNumber: { type: String, unique: true, sparse: true },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

async function createTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });

    if (!testUser) {
      const hashedPassword = await bcrypt.hash('testpassword123', 12);
      testUser = new User({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
        isActivated: true,
      });
      await testUser.save();
      console.log('✅ Created test user');
    } else {
      console.log('ℹ️  Test user already exists');
    }

    // Create test orders with different scenarios
    const testOrders = [
      {
        orderId: 'ORD-001',
        status: 'completed',
        domains: [
          {
            domainName: 'example.com',
            price: 1200,
            currency: 'INR',
            registrationPeriod: 1,
            status: 'registered',
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
            bookingStatus: [{
              step: 'domain_registered',
              message: 'Domain registered successfully',
              timestamp: new Date(),
              progress: 100,
            }],
          }
        ],
        amount: 1200,
        currency: 'INR',
        successfulDomains: ['example.com'],
        paymentVerification: {
          verifiedAt: new Date(),
          paymentStatus: 'success',
          paymentAmount: 1416,
          paymentCurrency: 'INR',
          razorpayOrderId: 'rzp_test_001',
        },
        invoiceNumber: 'INV-001',
      },
      {
        orderId: 'ORD-002',
        status: 'completed',
        domains: [
          {
            domainName: 'testdomain.net',
            price: 1000,
            currency: 'INR',
            registrationPeriod: 1,
            status: 'registered',
            expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
            bookingStatus: [{
              step: 'domain_registered',
              message: 'Domain registered successfully',
              timestamp: new Date(),
              progress: 100,
            }],
          }
        ],
        amount: 1000,
        currency: 'INR',
        successfulDomains: ['testdomain.net'],
        paymentVerification: {
          verifiedAt: new Date(),
          paymentStatus: 'success',
          paymentAmount: 1180,
          paymentCurrency: 'INR',
          razorpayOrderId: 'rzp_test_002',
        },
        invoiceNumber: 'INV-002',
      },
      {
        orderId: 'ORD-003',
        status: 'completed',
        domains: [
          {
            domainName: 'longterm.org',
            price: 1500,
            currency: 'INR',
            registrationPeriod: 2,
            status: 'registered',
            expiresAt: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000), // 400 days from now (not upcoming)
            bookingStatus: [{
              step: 'domain_registered',
              message: 'Domain registered successfully',
              timestamp: new Date(),
              progress: 100,
            }],
          }
        ],
        amount: 1500,
        currency: 'INR',
        successfulDomains: ['longterm.org'],
        paymentVerification: {
          verifiedAt: new Date(),
          paymentStatus: 'success',
          paymentAmount: 1770,
          paymentCurrency: 'INR',
          razorpayOrderId: 'rzp_test_003',
        },
        invoiceNumber: 'INV-003',
      }
    ];

    // Create orders
    for (const orderData of testOrders) {
      const existingOrder = await Order.findOne({ orderId: orderData.orderId });

      if (!existingOrder) {
        const order = new Order({
          ...orderData,
          userId: testUser._id,
          paymentId: `pay_${orderData.orderId}`,
          razorpayOrderId: `rzp_${orderData.orderId}`,
          razorpayPaymentId: `rzp_pay_${orderData.orderId}`,
          razorpaySignature: `sig_${orderData.orderId}`,
        });

        await order.save();
        console.log(`✅ Created order: ${orderData.orderId}`);
      } else {
        console.log(`ℹ️  Order already exists: ${orderData.orderId}`);
      }
    }

    console.log('\n📊 Test Data Summary:');
    console.log(`   Test User: test@example.com`);
    console.log(`   Total Orders: ${await Order.countDocuments({ userId: testUser._id })}`);
    console.log(`   Registered Domains: ${await Order.aggregate([
      { $match: { userId: testUser._id } },
      { $unwind: '$domains' },
      { $match: { 'domains.status': 'registered' } },
      { $count: 'count' }
    ]).then(result => result[0]?.count || 0)}`);

    // Check upcoming renewals
    const upcomingRenewals = await Order.aggregate([
      { $match: { userId: testUser._id } },
      { $unwind: '$domains' },
      {
        $match: {
          'domains.status': 'registered',
          'domains.expiresAt': { $exists: true, $ne: null }
        }
      },
      {
        $addFields: {
          daysLeft: {
            $ceil: {
              $divide: [
                { $subtract: ['$domains.expiresAt', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      { $match: { daysLeft: { $lte: 30, $gt: 0 } } },
      { $count: 'count' }
    ]);

    console.log(`   Upcoming Renewals (≤30 days): ${upcomingRenewals[0]?.count || 0}`);

    console.log('\n🎯 Next Steps:');
    console.log('1. Login with test@example.com / testpassword123');
    console.log('2. Check the dashboard - you should now see upcoming renewals');
    console.log('3. The renewals will show domains expiring in 15 and 25 days');

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

createTestData();

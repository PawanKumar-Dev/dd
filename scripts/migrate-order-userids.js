#!/usr/bin/env node

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

// Load environment variables
loadEnvFile();

// Define schemas inline since we can't easily import ES modules
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  phoneCc: { type: String, required: true },
  companyName: { type: String, required: true },
  address: {
    line1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true, default: 'IN' },
    zipcode: { type: String, required: true }
  },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  isActivated: { type: Boolean, default: false },
  activationToken: String,
  activationTokenExpiry: Date,
  resetToken: String,
  resetTokenExpiry: Date,
  cart: [{
    domainName: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    registrationPeriod: { type: Number, required: true }
  }]
}, { timestamps: true });

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
    status: { type: String, enum: ['registered', 'failed'], required: true },
    error: String,
    orderId: String,
    expiresAt: Date
  }],
  successfulDomains: [String],
  paymentVerification: {
    verifiedAt: { type: Date, required: true },
    paymentStatus: { type: String, required: true },
    paymentAmount: { type: Number, required: true },
    paymentCurrency: { type: String, required: true },
    razorpayOrderId: { type: String, required: true }
  },
  invoiceNumber: { type: String, unique: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

/**
 * Migration script to convert Order.userId from String to ObjectId
 * This script handles the transition from string-based userId to ObjectId references
 */
async function migrateOrderUserIds(dryRun = false) {
  try {
    console.log('🔄 Starting Order userId migration...');
    if (dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made');
    }

    // Connect to database
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');

    // Find all orders with string userId
    const orders = await Order.find({
      userId: { $type: 'string' }
    });

    console.log(`📊 Found ${orders.length} orders with string userId`);

    if (orders.length === 0) {
      console.log('✅ No orders need migration');
      return;
    }

    let migrated = 0;
    let failed = 0;

    for (const order of orders) {
      try {
        let user = null;

        // First, try to find user by ObjectId (in case userId is already an ObjectId string)
        if (mongoose.Types.ObjectId.isValid(order.userId)) {
          user = await User.findById(order.userId);
        }

        // If not found by ObjectId, try to find by email (in case userId was stored as email)
        if (!user) {
          user = await User.findOne({ email: order.userId });
        }

        if (user) {
          if (dryRun) {
            console.log(`🔍 Would migrate order ${order.orderId} -> user ${user.email} (${user.firstName} ${user.lastName})`);
            migrated++;
          } else {
            // Update the order with the ObjectId
            await Order.updateOne(
              { _id: order._id },
              { userId: user._id }
            );
            migrated++;
            console.log(`✅ Migrated order ${order.orderId} -> user ${user.email}`);
          }
        } else {
          console.log(`⚠️  User not found for order ${order.orderId} (userId: ${order.userId})`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Failed to migrate order ${order.orderId}:`, error.message);
        failed++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migrated} orders`);
    console.log(`❌ Failed migrations: ${failed} orders`);
    console.log(`📊 Total processed: ${orders.length} orders`);

    if (failed > 0) {
      console.log('\n⚠️  Some orders could not be migrated. You may need to:');
      console.log('1. Check if the user accounts exist');
      console.log('2. Manually update the userId field for failed orders');
      console.log('3. Or delete orphaned orders if users no longer exist');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Handle command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/migrate-order-userids.js [options]

Description:
  Migrates Order.userId from String to ObjectId references.
  This script is needed after updating the Order model to use ObjectId references.

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be migrated without making changes

Examples:
  node scripts/migrate-order-userids.js
  node scripts/migrate-order-userids.js --dry-run
    `);
    process.exit(0);
  }

  const dryRun = args.includes('--dry-run');
  migrateOrderUserIds(dryRun);
}

module.exports = { migrateOrderUserIds };

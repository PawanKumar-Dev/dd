/**
 * Check User Provider Status
 * 
 * This script checks the provider status of users to help identify
 * which users are actually social login vs credentials.
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// User schema (simplified for this script)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String }, // Social login users won't have this
  phone: { type: String },
  phoneCc: { type: String },
  companyName: { type: String },
  address: {
    line1: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'IN' },
    zipcode: { type: String }
  },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  provider: { type: String, enum: ['google', 'facebook', 'credentials'], default: 'credentials' },
  providerId: { type: String }, // Social login users will have this
  profileCompleted: { type: Boolean, default: false },
  isActivated: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function checkUserProviders() {
  try {
    // Check if MongoDB URI is loaded
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not set');
      return;
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all non-admin users
    const users = await User.find({ role: { $ne: 'admin' } });
    console.log(`Found ${users.length} non-admin users\n`);

    console.log('📋 User Analysis:');
    console.log('Email\t\t\t\tProvider\tHas Password\tHas ProviderId\tActivated');
    console.log('---------------------------------------------------------------------------------');

    for (const user of users) {
      const hasPassword = !!user.password;
      const hasProviderId = !!user.providerId;
      const isActivated = user.isActivated;

      // Determine likely actual provider based on data
      let likelyProvider = user.provider;
      if (!hasPassword && hasProviderId) {
        likelyProvider = 'SOCIAL (has providerId, no password)';
      } else if (hasPassword && !hasProviderId) {
        likelyProvider = 'CREDENTIALS (has password, no providerId)';
      }

      console.log(`${user.email.padEnd(30)}\t${(user.provider || 'undefined').padEnd(12)}\t${hasPassword ? 'Yes' : 'No'}\t\t${hasProviderId ? 'Yes' : 'No'}\t\t${isActivated ? 'Yes' : 'No'}`);

      if (likelyProvider !== user.provider) {
        console.log(`  ⚠️  Likely actual provider: ${likelyProvider}`);
      }
    }

    // Show specific user details
    const targetUser = await User.findOne({ email: 'karmaastar2024@gmail.com' });
    if (targetUser) {
      console.log('\n🔍 Detailed analysis for karmaastar2024@gmail.com:');
      console.log('Current provider:', targetUser.provider);
      console.log('Has password:', !!targetUser.password);
      console.log('Has providerId:', !!targetUser.providerId);
      console.log('ProviderId value:', targetUser.providerId);
      console.log('Is activated:', targetUser.isActivated);
      console.log('Profile completed:', targetUser.profileCompleted);
      console.log('Created at:', targetUser.createdAt);
      console.log('Updated at:', targetUser.updatedAt);

      // Determine correct provider
      if (!targetUser.password && targetUser.providerId) {
        console.log('✅ This user appears to be a SOCIAL LOGIN user (no password, has providerId)');
      } else if (targetUser.password && !targetUser.providerId) {
        console.log('✅ This user appears to be a CREDENTIALS user (has password, no providerId)');
      } else {
        console.log('❓ Unable to determine provider type clearly');
      }
    }

  } catch (error) {
    console.error('❌ Error checking user providers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the check
checkUserProviders();
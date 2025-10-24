/**
 * Fix Specific User Provider
 * 
 * This script fixes the provider field for users where it was incorrectly set.
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
  password: { type: String },
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
  providerId: { type: String },
  profileCompleted: { type: Boolean, default: false },
  isActivated: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function fixUserProvider() {
  try {
    // Check if MongoDB URI is loaded
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not set');
      return;
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fix the specific user
    const user = await User.findOne({ email: 'karmaastar2024@gmail.com' });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('📋 Current user data:');
    console.log('Email:', user.email);
    console.log('Current provider:', user.provider);
    console.log('Has password:', !!user.password);
    console.log('Has providerId:', !!user.providerId);
    console.log('ProviderId:', user.providerId);

    // Determine correct provider based on data
    let correctProvider = user.provider;

    if (!user.password && user.providerId) {
      // This is a social login user
      if (user.providerId.startsWith('1')) {
        // Google provider IDs are typically long numbers starting with 1
        correctProvider = 'google';
      } else {
        // Facebook provider IDs are typically shorter
        correctProvider = 'facebook';
      }
    } else if (user.password && !user.providerId) {
      // This is a credentials user
      correctProvider = 'credentials';
    }

    if (correctProvider !== user.provider) {
      console.log(`🔄 Updating provider from '${user.provider}' to '${correctProvider}'`);
      user.provider = correctProvider;
      await user.save();
      console.log('✅ Provider updated successfully');
    } else {
      console.log('✅ Provider is already correct');
    }

    console.log('\n📋 Final user data:');
    console.log('Email:', user.email);
    console.log('Provider:', user.provider);
    console.log('Profile completed:', user.profileCompleted);

  } catch (error) {
    console.error('❌ Error fixing user provider:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the fix
fixUserProvider();
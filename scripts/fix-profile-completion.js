/**
 * Fix Profile Completion Status
 * 
 * This script properly checks each user's profile and sets the profileCompleted
 * status based on whether they actually have all required fields filled.
 * 
 * Usage: node scripts/fix-profile-completion.js
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
  profileCompleted: { type: Boolean, default: false },
});

const User = mongoose.model('User', userSchema);

function checkProfileCompletion(user) {
  // Check if all required fields are filled
  const hasPhone = user.phone && user.phone.trim() !== '';
  const hasPhoneCc = user.phoneCc && user.phoneCc.trim() !== '';
  const hasCompanyName = user.companyName && user.companyName.trim() !== '';
  const hasAddress = user.address?.line1 && user.address.line1.trim() !== '';
  const hasCity = user.address?.city && user.address.city.trim() !== '';
  const hasState = user.address?.state && user.address.state.trim() !== '';
  const hasCountry = user.address?.country && user.address.country.trim() !== '';
  const hasZipcode = user.address?.zipcode && user.address.zipcode.trim() !== '';

  return hasPhone && hasPhoneCc && hasCompanyName && hasAddress && hasCity && hasState && hasCountry && hasZipcode;
}

async function fixProfileCompletion() {
  try {
    // Check if MongoDB URI is loaded
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is not set');
      console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('MONGO')));
      return;
    }

    console.log('🔗 Connecting to MongoDB...');
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all non-admin users
    const users = await User.find({ role: { $ne: 'admin' } });
    console.log(`Found ${users.length} non-admin users to check`);

    let updatedCount = 0;
    let completeProfiles = 0;
    let incompleteProfiles = 0;
    let providerUpdates = 0;

    for (const user of users) {
      let needsUpdate = false;

      // Fix provider field if missing - determine based on user data
      if (!user.provider) {
        let correctProvider = 'credentials'; // default

        // Determine correct provider based on user data
        if (!user.password && user.providerId) {
          // Social login user (no password, has providerId)
          if (user.providerId.toString().startsWith('1')) {
            correctProvider = 'google'; // Google IDs typically start with 1
          } else {
            correctProvider = 'facebook'; // Facebook IDs are different
          }
        } else if (user.password && !user.providerId) {
          // Credentials user (has password, no providerId)
          correctProvider = 'credentials';
        }

        user.provider = correctProvider;
        needsUpdate = true;
        providerUpdates++;
        console.log(`Set provider to '${correctProvider}' for user: ${user.email} (based on: ${!user.password && user.providerId ? 'no password + has providerId' : 'has password + no providerId'})`);
      }

      const isActuallyComplete = checkProfileCompletion(user);
      const currentStatus = user.profileCompleted;

      // For credential users, if they have complete profile data, set profileCompleted to true
      // For social login users, keep their current profileCompleted status unless it's wrong
      if (user.provider === 'credentials') {
        // Credential users should have profileCompleted = true if profile is complete
        if (isActuallyComplete && !currentStatus) {
          user.profileCompleted = true;
          needsUpdate = true;
          console.log(`Updated credential user ${user.email}: profileCompleted = true (profile is complete)`);
        } else if (!isActuallyComplete && currentStatus) {
          user.profileCompleted = false;
          needsUpdate = true;
          console.log(`Updated credential user ${user.email}: profileCompleted = false (profile is incomplete)`);
        }
      } else {
        // Social login users: only update if the status is wrong
        if (isActuallyComplete !== currentStatus) {
          user.profileCompleted = isActuallyComplete;
          needsUpdate = true;
          console.log(`Updated social user ${user.email}: profileCompleted = ${isActuallyComplete}`);
        }
      }

      if (needsUpdate) {
        await user.save();
        updatedCount++;
      }

      if (isActuallyComplete) {
        completeProfiles++;
      } else {
        incompleteProfiles++;
        console.log(`Incomplete profile: ${user.email} (${user.provider}) - Missing:`, {
          phone: !user.phone,
          phoneCc: !user.phoneCc,
          companyName: !user.companyName,
          address: !user.address?.line1,
          city: !user.address?.city,
          state: !user.address?.state,
          country: !user.address?.country,
          zipcode: !user.address?.zipcode,
        });
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Complete profiles: ${completeProfiles}`);
    console.log(`❌ Incomplete profiles: ${incompleteProfiles}`);
    console.log(`🔄 Updated users: ${updatedCount}`);
    console.log(`🏷️ Provider field updates: ${providerUpdates}`);

    // Show breakdown by provider
    const providerBreakdown = await User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $group: {
          _id: {
            provider: '$provider',
            profileCompleted: '$profileCompleted'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.provider': 1, '_id.profileCompleted': 1 } }
    ]);

    console.log('\n📋 Breakdown by Provider:');
    console.log('Provider\t\tCompleted\tCount');
    console.log('----------------------------------------');
    providerBreakdown.forEach(item => {
      const provider = item._id.provider || 'undefined';
      const completed = item._id.profileCompleted === true ? 'Yes' : 'No';
      console.log(`${provider}\t\t${completed}\t\t${item.count}`);
    });

  } catch (error) {
    console.error('❌ Error fixing profile completion status:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixProfileCompletion();
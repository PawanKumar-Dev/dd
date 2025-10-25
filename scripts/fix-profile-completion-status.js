/**
 * Fix Profile Completion Status for Existing Users
 * 
 * This script fixes users who have complete profile data but profileCompleted is incorrectly set to false.
 * This can happen if users manually registered then signed in with Google before the fix was applied.
 * 
 * Usage: node scripts/fix-profile-completion-status.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema (simplified for this script)
const UserSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  phone: String,
  phoneCc: String,
  companyName: String,
  address: {
    line1: String,
    city: String,
    state: String,
    country: String,
    zipcode: String,
  },
  provider: String,
  profileCompleted: Boolean,
  isActivated: Boolean,
  isActive: Boolean,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Check if a user has a complete profile based on required fields
const hasCompleteProfile = (user) => {
  // Required fields for a complete profile
  const hasBasicInfo = user.firstName && user.lastName && user.email;
  const hasPhone = user.phone && user.phoneCc;
  const hasAddress = user.address && 
                     user.address.line1 && 
                     user.address.city && 
                     user.address.state && 
                     user.address.country && 
                     user.address.zipcode;
  
  return hasBasicInfo && hasPhone && hasAddress;
};

// Main fix function
const fixProfileCompletionStatus = async () => {
  try {
    console.log('\n🔍 Scanning for users with incorrect profileCompleted status...\n');

    // Find users who have complete profile data but profileCompleted is false
    const usersToFix = await User.find({
      profileCompleted: { $ne: true }, // Not true (false or undefined)
      isActive: true,
      'address.line1': { $exists: true, $ne: null, $ne: '' },
      'address.city': { $exists: true, $ne: null, $ne: '' },
      'address.state': { $exists: true, $ne: null, $ne: '' },
      'address.country': { $exists: true, $ne: null, $ne: '' },
      'address.zipcode': { $exists: true, $ne: null, $ne: '' },
      phone: { $exists: true, $ne: null, $ne: '' },
      phoneCc: { $exists: true, $ne: null, $ne: '' },
    });

    console.log(`📊 Found ${usersToFix.length} users with complete profiles but incorrect status\n`);

    if (usersToFix.length === 0) {
      console.log('✅ No users need fixing. All profile statuses are correct!\n');
      return;
    }

    console.log('Users to fix:');
    console.log('─'.repeat(80));

    let fixedCount = 0;
    const errors = [];

    for (const user of usersToFix) {
      // Double-check with our validation function
      if (hasCompleteProfile(user)) {
        try {
          console.log(`\n📧 ${user.email}`);
          console.log(`   Name: ${user.firstName} ${user.lastName}`);
          console.log(`   Phone: ${user.phoneCc} ${user.phone}`);
          console.log(`   Address: ${user.address.city}, ${user.address.state}`);
          console.log(`   Provider: ${user.provider || 'credentials'}`);
          console.log(`   Current profileCompleted: ${user.profileCompleted}`);

          // Update profileCompleted to true
          user.profileCompleted = true;
          await user.save();

          console.log(`   ✅ Updated to profileCompleted: true`);
          fixedCount++;
        } catch (error) {
          console.error(`   ❌ Error updating user: ${error.message}`);
          errors.push({ email: user.email, error: error.message });
        }
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log(`\n📈 Summary:`);
    console.log(`   Total users scanned: ${usersToFix.length}`);
    console.log(`   Successfully fixed: ${fixedCount}`);
    console.log(`   Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(({ email, error }) => {
        console.log(`   - ${email}: ${error}`);
      });
    }

    console.log('\n✅ Profile completion status fix completed!\n');

  } catch (error) {
    console.error('\n❌ Error during fix:', error);
    throw error;
  }
};

// Also check for users who might need attention
const reportIncompleteProfiles = async () => {
  try {
    console.log('\n📋 Checking for users with incomplete profiles...\n');

    const incompleteUsers = await User.find({
      isActive: true,
      profileCompleted: false,
      $or: [
        { 'address.line1': { $in: [null, ''] } },
        { 'address.city': { $in: [null, ''] } },
        { phone: { $in: [null, ''] } },
        { phoneCc: { $in: [null, ''] } },
      ]
    }).select('email firstName lastName provider profileCompleted address phone phoneCc');

    if (incompleteUsers.length === 0) {
      console.log('✅ No users with incomplete profiles found.\n');
      return;
    }

    console.log(`📊 Found ${incompleteUsers.length} users with genuinely incomplete profiles:`);
    console.log('─'.repeat(80));

    incompleteUsers.forEach(user => {
      console.log(`\n📧 ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Provider: ${user.provider || 'credentials'}`);
      console.log(`   Missing fields:`);
      
      if (!user.phone || !user.phoneCc) {
        console.log(`     - Phone number`);
      }
      if (!user.address || !user.address.line1) {
        console.log(`     - Address line 1`);
      }
      if (!user.address || !user.address.city) {
        console.log(`     - City`);
      }
      if (!user.address || !user.address.state) {
        console.log(`     - State`);
      }
      if (!user.address || !user.address.zipcode) {
        console.log(`     - Zipcode`);
      }
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`\nThese users legitimately need to complete their profiles.\n`);

  } catch (error) {
    console.error('\n❌ Error checking incomplete profiles:', error);
  }
};

// Run the script
const main = async () => {
  try {
    await connectDB();
    
    console.log('\n' + '='.repeat(80));
    console.log('🔧 Profile Completion Status Fix Script');
    console.log('='.repeat(80));

    // Fix users with incorrect status
    await fixProfileCompletionStatus();

    // Report users with legitimately incomplete profiles
    await reportIncompleteProfiles();

    console.log('='.repeat(80));
    console.log('✅ Script completed successfully');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed\n');
    process.exit(0);
  }
};

// Execute
main();

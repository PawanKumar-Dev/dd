/**
 * Fix Profile Completion Status
 * 
 * This script properly checks each user's profile and sets the profileCompleted
 * status based on whether they actually have all required fields filled.
 * 
 * Usage: node scripts/fix-profile-completion.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

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
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all non-admin users
    const users = await User.find({ role: { $ne: 'admin' } });
    console.log(`Found ${users.length} non-admin users to check`);

    let updatedCount = 0;
    let completeProfiles = 0;
    let incompleteProfiles = 0;

    for (const user of users) {
      const isActuallyComplete = checkProfileCompletion(user);
      const currentStatus = user.profileCompleted;

      if (isActuallyComplete !== currentStatus) {
        user.profileCompleted = isActuallyComplete;
        await user.save();
        updatedCount++;
        console.log(`Updated user ${user.email}: profileCompleted = ${isActuallyComplete}`);
      }

      if (isActuallyComplete) {
        completeProfiles++;
      } else {
        incompleteProfiles++;
        console.log(`Incomplete profile: ${user.email} - Missing:`, {
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
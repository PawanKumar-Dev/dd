const mongoose = require('mongoose');
require('dotenv').config();

// User schema (inline definition like other scripts)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
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
    zipcode: { type: String },
  },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  isActivated: { type: Boolean, default: false },
  provider: { type: String, enum: ['google', 'facebook', 'credentials'], default: 'credentials' },
  providerId: { type: String },
  profileCompleted: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  activationToken: { type: String },
  activationTokenExpiry: { type: Date },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
  cart: [{
    domainName: { type: String },
    price: { type: Number },
    currency: { type: String },
    registrationPeriod: { type: Number },
  }],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function updateProfileCompleted() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/domain-registry');
    console.log('Connected to MongoDB');

    // Update all users except admins to have profileCompleted: true
    const result = await User.updateMany(
      {
        role: { $ne: 'admin' }, // Exclude admin users
        profileCompleted: { $ne: true } // Only update users who don't already have it set to true
      },
      {
        $set: { profileCompleted: true }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users with profileCompleted: true`);
    console.log(`📊 Matched ${result.matchedCount} users (excluding admins)`);

    // Show summary of users by role and profile completion status
    const summary = await User.aggregate([
      {
        $group: {
          _id: { role: '$role', profileCompleted: '$profileCompleted' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.role': 1, '_id.profileCompleted': 1 }
      }
    ]);

    console.log('\n📈 User Summary:');
    console.log('Role\t\tProfile Completed\tCount');
    console.log('----------------------------------------');
    summary.forEach(item => {
      const role = item._id.role || 'undefined';
      const completed = item._id.profileCompleted === true ? 'Yes' :
        item._id.profileCompleted === false ? 'No' : 'undefined';
      console.log(`${role}\t\t${completed}\t\t\t${item.count}`);
    });

  } catch (error) {
    console.error('❌ Error updating profile completion status:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the update
updateProfileCompleted();

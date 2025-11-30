const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelbuddy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if owner already exists
    const existingOwner = await User.findOne({ role: 'owner' });
    if (existingOwner) {
      console.log('Owner already exists:', existingOwner.email);
      console.log('To create a new owner, you must first remove the existing owner.');
      process.exit(0);
    }

    // Get admin details from command line arguments or use defaults
    const args = process.argv.slice(2);
    const email = args[0] || process.env.ADMIN_EMAIL || 'admin@travelbuddy.com';
    const password = args[1] || process.env.ADMIN_PASSWORD || 'admin123';
    const name = args[2] || 'Admin Owner';

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Update existing user to owner
      existingUser.role = 'owner';
      existingUser.password = password; // Will be hashed by pre-save hook
      await existingUser.save();
      console.log('Existing user updated to owner:', email);
    } else {
      // Create new owner
      const owner = new User({
        name,
        email,
        password,
        role: 'owner'
      });

      await owner.save();
      console.log('Owner created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role: owner');
    }

    console.log('\nYou can now login with these credentials.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating owner:', error);
    process.exit(1);
  }
};

createAdmin();


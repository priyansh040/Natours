// Core modules and external packages
const crypto = require('crypto'); // Built-in Node.js module for secure random token generation
const mongoose = require('mongoose'); // ODM library to interact with MongoDB
const validator = require('validator'); // Library to validate strings (e.g. email format)
const bcrypt = require('bcryptjs'); // Library for hashing passwords

// Define user schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, // Converts email to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'], // Email validation
  },
  photo: String, // Optional field to store profile image path/name
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'], // Acceptable roles
    default: 'user', // Default role
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // Prevents the password field from showing up in query results
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // Only works on .save() and .create()
      validator: function (el) {
        return el === this.password; // Passwords must match
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date, // Used to invalidate JWT if password was changed after token was issued
  passwordResetToken: String, // Used to reset the password (hashed token stored here)
  passwordResetExpires: Date, // Token expiration timestamp
  active: {
    type: Boolean,
    default: true,
    select: false, // Exclude this field from query results by default
  },
});

///////////////////////////
// Mongoose Middleware //
///////////////////////////

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it's new or modified
  if (!this.isModified('password')) return next();

  // Hash password with cost factor 12
  this.password = await bcrypt.hash(this.password, 12);

  // Remove passwordConfirm before saving to DB
  this.passwordConfirm = undefined;
  next();
});

// Pre-save hook to set passwordChangedAt timestamp
userSchema.pre('save', function (next) {
  // Skip if password is not modified or document is new
  if (!this.isModified('password') || this.isNew) return next();

  // Subtracting 1 second ensures the token is created after this timestamp
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Pre-query middleware to exclude inactive users from all find queries
userSchema.pre(/^find/, function (next) {
  // "this" refers to the current query
  this.find({ active: { $ne: false } }); // Only include users with active !== false
  next();
});

///////////////////////
// Schema Methods //
///////////////////////

// Check if input password is correct
userSchema.methods.correctPassword = async function (
  candidatePassword, // Plain text password
  userPassword, // Hashed password in DB
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp; // Token is invalid if issued before change
  }

  // Return false means password was NOT changed
  return false;
};

// Create a password reset token
userSchema.methods.createPasswordResetToken = function () {
  // Generate a random 32-byte token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token before storing it in DB
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Return plain reset token (to be sent via email)
  return resetToken;
};

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;

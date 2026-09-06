import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { consumeOtp, issueOtp, getJwtSecret } from '../services/otp.service';
import { randomBytes } from 'node:crypto';
import { mailService } from '../services/mail.service';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';

import mongoose from 'mongoose';
import { Order } from '../models/order.model';



export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password, name, otp } = req.body;
    await consumeOtp(email, otp);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role: 'customer',
      emailVerified: true,
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.emailVerified) throw new AppError('Verify your email with a one-time code before signing in.', 403);

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user!.id).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { name, email } = req.body;
    const userId = req.user!.id;

    if (email && email !== req.user!.email) {
      throw new AppError('Email changes require verification. Sign in with the email associated with your orders.', 400);
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { ...(name ? { name } : {}) } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Enter a valid email and verification code.', 400);
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const otp = await issueOtp(email);

    // Send email
    await mailService.sendOtp(email, otp);

    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Enter a valid email and verification code.', 400);
    const email = String(req.body.email || '').trim().toLowerCase();
    const { otp, name } = req.body;

    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400);
    }

    await consumeOtp(email, otp);

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create guest user
      const dummyPassword = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        password: dummyPassword,
        role: 'customer',
        emailVerified: true,
      });
    }

    if (!user.emailVerified) { user.emailVerified = true; await user.save(); }

    await Order.updateMany(
      { 'customer.email': email.toLowerCase(), 'customer.userId': { $exists: false } },
      { $set: { 'customer.userId': String(user._id) } }
    );

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const normalizeAddress = (input: any) => ({
  firstName: String(input.firstName || '').trim(),
  lastName: String(input.lastName || '').trim(),
  address1: String(input.address1 || '').trim(),
  address2: String(input.address2 || '').trim(),
  city: String(input.city || '').trim(),
  state: String(input.state || '').trim(),
  country: String(input.country || 'India').trim(),
  postalCode: String(input.postalCode || '').trim(),
  phone: String(input.phone || '').trim(),
  isDefault: Boolean(input.isDefault),
});

export const getAddresses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id).select('addresses');
    if (!user) throw new AppError('User not found', 404);
    res.json({ success: true, data: user.addresses || [] });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Complete all required address fields', 400);
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError('User not found', 404);
    const address = normalizeAddress(req.body);
    const addresses = user.addresses || [];
    if (address.isDefault || !addresses.length) {
      addresses.forEach((item: any) => { item.isDefault = false; });
      address.isDefault = true;
    }
    addresses.push(address as any);
    user.addresses = addresses;
    await user.save();
    res.status(201).json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError('Complete all required address fields', 400);
    if (!mongoose.isValidObjectId(req.params.addressId)) throw new AppError('Invalid address', 400);
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError('User not found', 404);
    const addresses = user.addresses || [];
    const address = (addresses as any).id(req.params.addressId);
    if (!address) throw new AppError('Address not found', 404);
    const nextAddress = normalizeAddress({ ...address.toObject(), ...req.body });
    if (nextAddress.isDefault) addresses.forEach((item: any) => { item.isDefault = false; });
    Object.assign(address, nextAddress);
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw new AppError('User not found', 404);
    const addresses = user.addresses || [];
    const address = (addresses as any).id(req.params.addressId);
    if (!address) throw new AppError('Address not found', 404);
    const wasDefault = address.isDefault;
    address.deleteOne();
    if (wasDefault && addresses[0]) (addresses[0] as any).isDefault = true;
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { Otp } from '../models/otp.model';
import { mailService } from '../services/mail.service';
import { AppError } from '../middleware/error-handler';
import { AuthRequest } from '../middleware/auth';
import { generateOtp } from '@repo/utils';
import mongoose from 'mongoose';
import { Order } from '../models/order.model';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password, name, role } = req.body;

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
      role: role || 'customer',
    });

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
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

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
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

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        throw new AppError('Email already in use', 400);
      }
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { name, email } },
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
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP (upsert if exists)
    await Otp.findOneAndUpdate(
      { email, type: 'login' },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

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
    const email = String(req.body.email || '').trim().toLowerCase();
    const { otp, name } = req.body;

    if (!email || !otp) {
      throw new AppError('Email and OTP are required', 400);
    }

    const otpRecord = await Otp.findOne({ email, otp, type: 'login' });

    if (!otpRecord) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new AppError('OTP has expired', 400);
    }

    // OTP is valid, delete it
    await Otp.deleteOne({ _id: otpRecord._id });

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Create guest user
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        password: dummyPassword,
        role: 'customer',
      });
    }

    await Order.updateMany(
      { 'customer.email': email.toLowerCase(), 'customer.userId': { $exists: false } },
      { $set: { 'customer.userId': String(user._id) } }
    );

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
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

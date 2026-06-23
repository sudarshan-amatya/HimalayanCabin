import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../config/prisma.js";
import { uploadImageToCloudinary } from "../utils/cloudinaryUpload.js";
import { generateToken } from "../utils/generateToken.js";
import { createNotification } from "../utils/notification.js";
function removePassword(user) {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
        giftCredit: user.giftCredit,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
function getSignupRole(role) {
    if (role === "OWNER")
        return "OWNER";
    return "USER";
}
function normalizePhone(phone) {
    return String(phone || "").trim();
}
function splitGoogleName(name, email) {
    const fallback = email?.split("@")[0] || "Guest";
    const parts = String(name || fallback).trim().split(/\s+/).filter(Boolean);
    const firstName = parts[0] || fallback;
    const lastName = parts.slice(1).join(" ") || "User";
    return { firstName, lastName };
}
export async function signup(req, res) {
    try {
        const { firstName, lastName, email, phone, password, role } = req.body;
        if (!firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({
                message: "First name, last name, email, contact number, and password are required",
            });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedPhone = normalizePhone(phone);
        if (normalizedPhone.length < 7) {
            return res.status(400).json({ message: "Please enter a valid contact number" });
        }
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists with this email" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const signupRole = getSignupRole(role);
        const user = await prisma.user.create({
            data: {
                firstName: String(firstName).trim(),
                lastName: String(lastName).trim(),
                email: normalizedEmail,
                phone: normalizedPhone,
                password: hashedPassword,
                role: signupRole,
            },
        });
        await createNotification({
            userId: user.id,
            title: "Welcome to HimalayanCabins",
            message: signupRole === "OWNER" ? "Your owner account is ready. Add your first cabin from the owner dashboard." : "Your guest account is ready. You can now bookmark cabins, book stays, and receive gifts.",
            type: "PROFILE",
            link: signupRole === "OWNER" ? "/owner" : "/profile",
        });
        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        return res.status(201).json({ message: "Signup successful", token, user: removePassword(user) });
    }
    catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user)
            return res.status(401).json({ message: "Invalid email or password" });
        if (!user.password)
            return res.status(401).json({ message: "This account uses Google login. Please continue with Google." });
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect)
            return res.status(401).json({ message: "Invalid email or password" });
        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        return res.status(200).json({ message: "Login successful", token, user: removePassword(user) });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function googleLogin(req, res) {
    try {
        const { credential, role } = req.body;
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId)
            return res.status(500).json({ message: "GOOGLE_CLIENT_ID is missing in server .env" });
        if (!credential)
            return res.status(400).json({ message: "Google credential is required" });
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({ idToken: String(credential), audience: clientId });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            return res.status(401).json({ message: "Google account email could not be verified" });
        }
        const normalizedEmail = payload.email.toLowerCase();
        const googleId = payload.sub;
        const signupRole = getSignupRole(role);
        let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        let isNew = false;
        if (user) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: user.googleId || googleId,
                    profileImage: user.profileImage || payload.picture || null,
                },
            });
        }
        else {
            const names = splitGoogleName(payload.name, normalizedEmail);
            user = await prisma.user.create({
                data: {
                    firstName: names.firstName,
                    lastName: names.lastName,
                    email: normalizedEmail,
                    googleId,
                    profileImage: payload.picture || null,
                    role: signupRole,
                    password: null,
                    phone: null,
                },
            });
            isNew = true;
            await createNotification({
                userId: user.id,
                title: "Google account connected",
                message: "Your account was created with Google. Please add your contact number in your profile before booking or managing cabins.",
                type: "PROFILE",
                link: "/profile",
            });
        }
        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        return res.status(200).json({
            message: isNew ? "Google account created successfully" : "Google login successful",
            token,
            user: removePassword(user),
        });
    }
    catch (error) {
        console.error("Google login error:", error);
        return res.status(401).json({ message: "Google login failed. Please try again." });
    }
}
export async function updateProfile(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        const { firstName, lastName, email, phone } = req.body;
        if (!firstName || !lastName || !email || !phone) {
            return res.status(400).json({ message: "First name, last name, email, and contact number are required" });
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedPhone = normalizePhone(phone);
        if (normalizedPhone.length < 7) {
            return res.status(400).json({ message: "Please enter a valid contact number" });
        }
        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser && existingUser.id !== req.user.id) {
            return res.status(409).json({ message: "Another user already uses this email" });
        }
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                firstName: String(firstName).trim(),
                lastName: String(lastName).trim(),
                email: normalizedEmail,
                phone: normalizedPhone,
            },
        });
        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        return res.status(200).json({ message: "Profile updated successfully", token, user: removePassword(user) });
    }
    catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function updateProfileImage(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        if (!req.file) {
            return res.status(400).json({ message: "Profile image file is required" });
        }
        const uploadedImage = await uploadImageToCloudinary(req.file, "profiles");
        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { profileImage: uploadedImage.url },
        });
        return res.status(200).json({ message: "Profile photo updated successfully", user: removePassword(user) });
    }
    catch (error) {
        console.error("Update profile image error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export async function getMe(req, res) {
    try {
        if (!req.user)
            return res.status(401).json({ message: "Not authorized" });
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImage: true,
                role: true,
                giftCredit: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.status(200).json({ message: "User fetched successfully", user });
    }
    catch (error) {
        console.error("Get me error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            unique: [true, "Email must be unique"],
            minLength: 5,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
            select: false,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        verificationCode: {
            type: String,
            select: false,
        },
        verificationCodeValidation: {
            type: String,
            select: false,
        },
        forgotPasswordCode: {
            type: String,
            select: false,
        },
        forgotPasswordCode: {
            type: String,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

export const User = mongoose.model("User", userSchema);

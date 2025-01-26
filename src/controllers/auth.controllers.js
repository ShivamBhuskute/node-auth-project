import { signupSchema, signinSchema } from "../middlewares/validator.cjs";
import { User } from "../models/user.modals.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { doHash, doHashValidation, hmacProcess } from "../utils/hashing.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { transport } from "../middlewares/sendMail.js";

const signup = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { error, value } = signupSchema.validate({ email, password });

    if (error) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        email,
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    const hashedPassword = await doHash(password, 12);

    const newUser = new User({
        email,
        password: hashedPassword,
    });

    const result = await newUser.save();
    result.password = undefined;

    return res
        .status(201)
        .json(new ApiResponse(200, "User registered Successfully"));
});

const signin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { error, value } = signinSchema.validate({ email, password });

    if (error) {
        throw new ApiError(400, "Fields are required");
    }

    const existingUser = await User.findOne({ email }).select("+password");

    if (!existingUser) {
        throw new ApiError(404, "User does not exist");
    }

    const result = await doHashValidation(password, existingUser.password);

    if (!result) {
        throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign(
        {
            userId: existingUser._id,
            email: existingUser.email,
            verified: existingUser.verified,
        },
        process.env.TOKEN_SECRET,
        {
            expiresIn: "8h",
        }
    );

    res.cookie("Authorization", "Bearer" + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
    }).json(new ApiResponse(200, "Logged in successfully"));
});

const signout = asyncHandler(async (req, res) => {
    res.clearCookie("Authorization").json(
        new ApiResponse(200, "Logged out successfully")
    );
});

const verificationCode = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const existingUser = await User.findOne({ email });

    if (!existingUser) throw new ApiError(404, "User does not exist");

    if (existingUser.verified) {
        throw new ApiError(400, "You are already verified");
    }

    const codeVal = Math.floor(Math.random() * 1000000).toString();
    let info = await transport.sendMail({
        from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
        to: existingUser.email,
        subject: "verification code",
        html: "<h1>" + codeVal + "</h1>",
    });

    if (info.accepted[0] === existingUser.email) {
        const hashedCodeValue = hmacProcess(
            codeVal,
            process.env.HMAC_VERIFICATION_CODE_SECRET
        );
        existingUser.verificationCode = hashedCodeValue;
        existingUser.verificationCodeValidation = Date.now();
        await existingUser.save();
        return res.json(new ApiResponse(200, "Code sent successfully"));
    }
    throw new ApiError(400, "Error sending code");
});

export { signup, signin, signout, verificationCode };

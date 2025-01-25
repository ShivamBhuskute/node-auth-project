import { signupSchema, signinSchema } from "../middlewares/validator.cjs";
import { User } from "../models/user.modals.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { doHash, doHashValidation } from "../utils/hashing.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

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



export { signup, signin, signout };

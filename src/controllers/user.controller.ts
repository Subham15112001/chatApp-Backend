import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Prisma,User } from "@prisma/client";
import jwt from "jsonwebtoken";
import prisma from '../utils/index.js';
import bcrypt from "bcryptjs";
import cloudinary from "../../lib/cloudinary.js";
import { AppError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { toAuthUser, toProfilePicDto } from "./auth.dto.js";
import type { EditProfileInput, LoginInput, SignupInput } from "./auth.schemas.js";

const authInclude = { profilePics: { orderBy: { id: "desc" as const } } };

export const signup = async (input: SignupInput) => {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { name: input.fullName, email: input.email, username: input.username, passwordHash },
    include: authInclude,
  });
  return toAuthUser(user, user.profilePics);
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: authInclude });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }
  return toAuthUser(user, user.profilePics);
};

export const getAuthUser = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: authInclude });
  if (!user) throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  return toAuthUser(user, user.profilePics);
};

export const getSessionUser = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, username: true, number: true, createdAt: true },
  });
  if (!user) throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  return toAuthUser(user);
};

export const searchUsers = async (userId: number, username: string, limit: number) => {
  const users = await prisma.user.findMany({
    where: { id: { not: userId }, username: { contains: username, mode: "insensitive" } },
    take: limit,
    orderBy: { username: "asc" },
    include: { profilePics: { take: 1, orderBy: { id: "desc" } } },
  });
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    profilePic: user.profilePics[0] ? toProfilePicDto(user.profilePics[0]) : null,
  }));
};

export const updateProfileData = async (userId: number, input: EditProfileInput) => {
  const user = await prisma.user.update({ where: { id: userId }, data: input, include: authInclude });
  return toAuthUser(user, user.profilePics);
};

export const addProfileImage = async (userId: number, profilePic: string) => {
  const upload = await cloudinary.uploader.upload(profilePic, { resource_type: "image" });
  try {
    const pic = await prisma.profilePic.create({ data: { userId, url: upload.secure_url } });
    return toProfilePicDto(pic);
  } catch (error) {
    await cloudinary.uploader.destroy(upload.public_id).catch(() => undefined);
    throw error;
  }
};

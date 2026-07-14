import type { RequestHandler } from "express";
import { clearAuthCookie, setAuthCookie, signToken } from "../../lib/jwt.js";
import * as authService from "./auth.service.js";
import type { EditProfileInput, LoginInput, SignupInput } from "./auth.schemas.js";

export const signup: RequestHandler = async (req, res) => {
  const user = await authService.signup(req.validated?.body as SignupInput);
  setAuthCookie(res, signToken(user.id));
  res.status(201).json(user);
};

export const login: RequestHandler = async (req, res) => {
  const user = await authService.login(req.validated?.body as LoginInput);
  setAuthCookie(res, signToken(user.id));
  res.json(user);
};

export const logout: RequestHandler = (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out successfully" });
};

export const checkAuth: RequestHandler = async (req, res) => {
  res.json(await authService.getAuthUser(req.user!.id));
};

export const searchUser: RequestHandler = async (req, res) => {
  const { username, limit } = req.validated?.query as { username: string; limit: number };
  res.json(await authService.searchUsers(req.user!.id, username, limit));
};

export const editProfile: RequestHandler = async (req, res) => {
  res.json(await authService.updateProfileData(req.user!.id, req.validated?.body as EditProfileInput));
};

export const updateProfile: RequestHandler = async (req, res) => {
  const { profilePic } = req.validated?.body as { profilePic: string };
  const picture = await authService.addProfileImage(req.user!.id, profilePic);
  res.json(picture);
};

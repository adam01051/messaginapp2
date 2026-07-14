import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../config/env.js";

const COOKIE_NAME = "jwt";

export const signToken = (userId: number) => jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as { userId: number };

export const setAuthCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: env.NODE_ENV === "production",
  });
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "strict",
    secure: env.NODE_ENV === "production",
  });
};

export const readCookie = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
};

export const readAuthCookie = (cookieHeader: string | undefined) => readCookie(cookieHeader, COOKIE_NAME);

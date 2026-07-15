type UserLike = {
  id: number;
  name: string;
  email: string;
  username: string;
  number: string | null;
  createdAt: Date;
};

type ProfilePicLike = { id: number; url: string; userId: number };

export type AuthUser = ReturnType<typeof toAuthUser>;

export const toProfilePicDto = (pic: ProfilePicLike) => ({
  profile_id: pic.id,
  profile_url: pic.url,
  user_ref: pic.userId,
});

export const toAuthUser = (user: UserLike, profilePics: ProfilePicLike[] = []) => ({
  id: user.id,
  name: user.name,
  fullName: user.name,
  email: user.email,
  username: user.username,
  number: user.number,
  createdAt: user.createdAt.toISOString(),
  profilePics: profilePics.map(toProfilePicDto),
});

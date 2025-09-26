import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import pool from "./postgres.js";
import { config } from "dotenv";

config();

const callbackURL =
	process.env.NODE_ENV === "production"
		? "https://threerd-messagin-application.onrender.com/api/auth/google/callback"
		: "http://localhost:5001/api/auth/google/callback";

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL,
			passReqToCallback: true,
		},
		async (req, accessToken, refreshToken, profile, done) => {
			try {
				const email = profile.emails[0].value;

				// Check if user exists
				let result = await pool.query("SELECT * FROM users WHERE email = $1", [
					email,
				]);

				const tempProfileImage = profile.photos[0]?.value || "/avatar.png";

				// Create if not exists
				if (result.rows.length === 0) {
					result = await pool.query(
						`INSERT INTO users (name, email, username, password_, profileimage) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
						[
							profile.name.givenName,
							email,
							profile.displayName.split(" ").join(""),
							"google",
							tempProfileImage,
						]
					);
				}

				return done(null, result.rows[0]);
			} catch (err) {
				return done(err, null);
			}
		}
	)
);

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try {
		const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
		done(null, result.rows[0]);
	} catch (err) {
		done(err, null);
	}
});

export default passport;

import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { config } from "dotenv";
import pool from "./postgres.js";
config();


passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "http://localhost:5001/api/auth/google/callback",
			passReqToCallback: true,
		},
        async (req,accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                let result = await pool.query(
                    "SELECT * FROM users WHERE email = $1",
                    [email]
				);
				const tempProfileImage = profile.photos[0]?.value || "./public/avatar.png";

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
                return done(err);
            }
        }
    )
);
	




passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
	done(null, result.rows[0]);
});

export default passport;

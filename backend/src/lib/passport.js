import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { config } from "dotenv";
config();


passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "http://localhost:5001/api/auth/google/callback",
			passReqToCallback: true,
		},
        function (request, accessToken, refreshToken, profile, done) {
            
			console.log(profile);
			return done(err, user);
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

/*

export const signupgoogle = (req, res) => {
    try {
        passport.use(
        "google",
            new GoogleStrategy(
                {
                    clientID: process.env.CLIENT_ID,
                    clientSecret: process.env.CLIENT_SECRET,
                    callbackURL: "http://localhost:5001/api/auth/google/callback",
                    
                },
                async (accessToken, refreshToken, profile, cb) => {
                    try {
                        const email = profile.emails[0].value;
                        let result = await pool.query(
                            "SELECT * FROM users WHERE email = $1",
                            [email]
                        );

                        if (result.rows.length === 0) {
                            result = await pool.query(
                                "INSERT INTO users (name, email, username, password_) VALUES ($1, $2, $3, $4) RETURNING *",
                                [profile.displayName, email, profile.displayName, "google"]
                            );
                        }
                        passport.authenticate("google", { scope: ["profile", "email"] });

                        return cb(null, result.rows[0]);
                    } catch (err) {
                        return cb(err);
                    }
                }
            )
        );
        
    } catch (error) {
        console.log("Error in signupgoogle:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
*/

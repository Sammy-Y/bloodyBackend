// import passportJWT from "passport-jwt";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import User from "../models/user-model.js";

// create cookies
// passport.serializeUser((user, done) => {
//   console.log("Serialize");
//   done(null, user._id);
// });

// passport.deserializeUser((_id, done) => {
//   console.log("Deserialize");
//   User.findById({ _id: _id }).then((user) => {
//     console.log("Found User");
//     done(null, user);
//   });
// });

export const JWT = (passport) => {
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  opts.secretOrKey = process.env.PASSPORT_SECRET;

  passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
      try {
        const user = await User.findOne({ _id: jwt_payload._id });
        if (user) return done(null, user);
        else return done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );
};

export const google = passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/user/auth/google/redirect",
    },
    (accessToken, refreshToken, profile, done) => {
      // passport callback
      User.findOne({ googleId: profile.id }).then((foundUser) => {
        if (foundUser) {
          // user is already existed
          console.log(foundUser);
          done(null, foundUser);
        } else {
          // add new user into database
          new User({
            userName: profile.displayName,
            googleId: profile.id,
            confirmed: true,
            userPw: profile.id,
          })
            .save()
            .then((newUser) => {
              console.log("New User created.");
              done(null, newUser);
            });
        }
      });
    }
  )
);

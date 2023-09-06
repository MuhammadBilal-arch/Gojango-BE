const passport = require('passport')
const User = require('../model/user')
const GoogleStrategy = require('passport-google-oauth20').Strategy

// Configure Google OAuth strategy
const GOOGLE_CLIENT_ID =
    '866749866420-tat1r2jmv3a8im2le7juesbk3urpjf61.apps.googleusercontent.com'
const GOOGLE_CLIENT_SECRET = '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'
passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: '/account/google/callback',
            scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            done(null, profile)
        }
    )
)

passport.serializeUser((user,done)=> {
    done(null,user)
})

passport.deserializeUser((user,done)=> {
    User.findById(id, (err, user) => {
        done(err, user);
      })
})


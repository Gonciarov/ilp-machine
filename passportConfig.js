const LocalStrategy = require('passport-local').Strategy;
const { pool } = require('./dbConfig');
const bcrypt = require("bcrypt");

function initialize(passport) {
    const authenticateUser = (prisonNumber, password, done) => {
        pool.query(
            `SELECT * FROM users WHERE prison_number = $1`, [prisonNumber], (err, results) => {
                if (err) {
                    throw err;
                }



                if (results.rows.length > 0) {
                    const user = results.rows[0];
                    bcrypt.compare(password, user.password, function(err, isMatch) {
                        if (err) {
                            throw err;
                        }

                        if (isMatch) {
                            return done(null, user);

                        } else {
                            return done(null, false, { message: "Incorrect password" });
                        }
                    });
                } else {
                    return done(null, false, { message: "User does not exist" });
                }
            });
    };

    passport.use(
        new LocalStrategy({
                usernameField: "prisonNumber",
                passwordField: "password"
            },
            authenticateUser
        )
    );

    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser((id, done) => {
        pool.query(
            'SELECT * FROM users WHERE id = $1', [id], (err, results) => {
                if (err) {
                    throw err
                }
                return done(null, results.rows[0]);
            });
    });
}

module.exports = initialize;
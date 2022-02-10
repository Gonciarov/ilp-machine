const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const alert = require('alert');




const initializePassport = require("./passportConfig");

initializePassport(passport);

const PORT = process.env.PORT || 4000;

app.set('view engine', 'ejs')
let ejsOptions = { async: true }
app.use(express.urlencoded({ extended: false }));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(express.static(__dirname + '/public'))

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
    res.render("register");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
    res.render("login");
});

app.get("/dashboard", checkNotAuthenticated, (req, res) => {
        Promise.all([
            pool.query(`SELECT * FROM users WHERE prison_number = $1`, [req.user.prison_number]),
            pool.query(`SELECT * FROM posts WHERE prison_number = $1`, [req.user.prison_number]),
            pool.query(`SELECT * FROM users`)
        ]).then(function([user, posts, students]) {
            if (req.user.prison_number == process.env.ADMIN_PRISON_NUMBER) {

                res.render("admin", { posts: posts.rows, students: students.rows });
            } else {
                posts = sortPosts(posts.rows)
                res.render("dashboard", { user: user.rows[0].name, prisonNumber: user.rows[0].prison_number, posts: posts });
            }
        })
    }),


    app.post("/dashboard", async(req, res) => {
        let { text } = req.body;
        let id = req.body.postId;
        text = `${text}`
        let date = new Date().toDateString();
        let prisonNumber = req.user.prison_number;
        if (id) {
            pool.query(`UPDATE posts SET text = '${text}' WHERE id = ${id}`, (err, results) =>{
                if (err) {
                    console.log(err)
                } else {
                    res.redirect('/dashboard');
                }
            });
        } else {
            pool.query(`INSERT INTO posts (text, prison_number, date)
            VALUES ($1, $2, $3)`, [text, prisonNumber, date], (err, results) =>{
                if (err) {
                    console.log(err)
                } else {
                    res.redirect('/dashboard');
                }
            });
        }
            
        
            }),


    app.get("/dashboard/:student", checkNotAuthenticated, async(req, res) => {
        if (req.user.prison_number === process.env.ADMIN_PRISON_NUMBER) {
            
            let student = req.params.student;
            let comment = req.body.comment

            Promise.all([
                pool.query(`SELECT * FROM posts WHERE prison_number = $1`, [student]),
                pool.query(`SELECT * FROM users WHERE prison_number = $1`, [student]),
                pool.query(`SELECT * FROM projects WHERE prison_number = $1`, [student])
            ]).then(function([posts, user, projects]) {
                posts = sortPosts(posts.rows)
                let prisonNumber = user.rows[0].prison_number;
                let name = user.rows[0].name;
                projects = projects.rows
                res.render("viewPosts", { user: name, prisonNumber: prisonNumber, posts: posts, projects: projects })
                
            })
        } else {
        res.redirect('/dashboard')
        }
    }),

    app.get("/comment/view", async(req, res) => {
        res.redirect('/dashboard')
    }),

    app.get("/comment/edit", async(req, res) => {
        res.redirect('/dashboard')
    }),

    app.post("/dashboard/:student", async(req, res) => {
        
        let student = req.params.student;
        let comment = req.body.comment
        let review = req.body.review
        let title = req.body.title
        let date = new Date().toDateString();

        Promise.all([
            pool.query(`SELECT * FROM posts WHERE prison_number = $1`, [student]),
            pool.query(`SELECT * FROM users WHERE prison_number = $1`, [student]),
            pool.query(`SELECT * FROM projects WHERE prison_number = $1`, [student])
        ]).then(function([posts, user, projects]) {
            posts = sortPosts(posts.rows)
            let prisonNumber = user.rows[0].prison_number;
            let name = user.rows[0].name;
            projects = projects.rows
            if (comment) {
        
                let postId = req.body.postId;
                
            Promise.all([
                pool.query(`UPDATE posts SET comment='${comment}' WHERE ID = ${postId} RETURNING *`, 
            )]).then(function([result]) {
                alert("Comment posted")
                res.render("viewComment", { user: name, prisonNumber: prisonNumber, post: result.rows[0] })
            })

            } else if (review) {
                Promise.all([
                pool.query(`INSERT INTO projects (prison_number, review, title, date)
                VALUES ($1, $2, $3, $4)`, [prisonNumber, review, title, date]), 
                ]).then(function() {
                    Promise.all([
                    pool.query(`SELECT * FROM projects WHERE prison_number = $1`, [prisonNumber])
                ]).then(function([projects]) {
                    projects = sortPosts(projects.rows)
                    
                    res.render("viewPosts", { user: name, prisonNumber: prisonNumber, posts: posts, projects: projects })
                })
                
            })
         } else {
            Promise.all([
                pool.query(`SELECT * FROM projects WHERE prison_number = $1`, [prisonNumber])
            ]).then(function([projects]) {
                projects = sortPosts(projects.rows)
               
                res.render("viewPosts", { user: name, prisonNumber: prisonNumber, posts: posts, projects: projects })
            })
            }
        })
        

    }),

    app.get("/projects", async(req,res) => {
        let prisonNumber = req.user.prison_number
        pool.query(
            `SELECT * FROM projects WHERE prison_number = $1`, [prisonNumber],
            (err, results) => {
                if (err) {
                    throw err;
                } else {
                    let reviews = results.rows
                    res.render("projects", {reviews: reviews})
                }
            }
        )
        
    })

    app.post("/reviews/:review", (req, res) => {
        if (req.user.prison_number === process.env.ADMIN_PRISON_NUMBER) {
            
        let id = req.params.review
        let prisonNumber = req.body.editPrisonNumber
        Promise.all([
            pool.query(`SELECT * FROM projects WHERE id = ${id}`),
            pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]) 
        ]).then(function([result, user]) {
            let name = user.rows[0].name;
            let review = result.rows[0].review
            let title = result.rows[0].title
            let date = result.rows[0].date
            res.render("viewReview", { user: name, id: id, prisonNumber: prisonNumber, title: title, date: date, review: review })
            
        })
    
        }
    })

    app.post("/review/edit", (req, res) => {
        let id = req.body.reviewId
        let prisonNumber = req.body.prisonNumber
        let review = req.body.review
        let title = req.body.title
        let date = req.body.date
        Promise.all([
            pool.query(`UPDATE projects SET review='${review}' WHERE ID = ${id} RETURNING *`),
            pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]) 
        ]).then(function([result, user]) {
            
            let name = user.rows[0].name;
            review = result.rows[0].review
            if (req.body.edited === 'edited') {
                res.render("viewReview", { user: name, date: date, id: id, prisonNumber: prisonNumber, review: review, title: title })
            } else { 
                res.render("editReview", { user: name, date: date, id: id, prisonNumber: prisonNumber, review: review, title: title })
            }
        })
    })

    app.post("/edit", async(req, res) => {
        let id = req.body.postId
        let result = await pool.query(`SELECT * FROM posts WHERE id = ${id}`)
        let text = result.rows[0].text
        let comment = result.rows[0].comment
        let date = result.rows[0].date
        res.render("editPost", {id: id, text: text, comment: comment, date: date, alert: alert })
    })

    app.post("/comment/edit", (req, res) => {
        console.log(req.body)
        let id = req.body.postId
        let prisonNumber = req.body.prisonNumber
        let comment = req.body.comment
        let date = req.body.date
        let text = req.body.text
        Promise.all([
            pool.query(`UPDATE posts SET comment='${comment}' WHERE ID = ${id} RETURNING *`),
            pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]) 
        ]).then(function([result, user]) {
            let name = user.rows[0].name;
            if (req.body.edited === 'edited') {
                res.render("viewComment", { user: name, prisonNumber: prisonNumber, text: text, date: date, id: id, comment: comment })
            } else { 
                res.render("editComment", { user: name, prisonNumber: prisonNumber, text: text, date: date, id: id, comment: comment })
            }
        })
    })
        
    app.post("/comment/view", (req, res) => {
        let id = req.body.postId
        let prisonNumber = req.body.prisonNumber
        Promise.all([
            pool.query(`SELECT * FROM posts WHERE id = ${id}`),
            pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]) 
        ]).then(function([result, user]) {
            let name = user.rows[0].name;
            let text = result.rows[0].text;
            let comment = result.rows[0].comment;
            let id = result.rows[0].id;
            let date = result.rows[0].date
            res.render("viewComment", { user: name, prisonNumber: prisonNumber, text: text, comment: comment, id: id, date: date })
            
        })
    })
            
   
    app.post("/delete", async(req, res) => {
        
        let id = req.body.postId
        let requested = req.body.requested
        if(requested === 'yes') {
                pool.query(`DELETE FROM posts WHERE id = ${id}`)
            }
            res.redirect('/')
        })

    app.post("/review/delete", async(req, res) => {
    
        let id = req.body.reviewId
        pool.query(`DELETE FROM projects WHERE id = ${id}`)
        })

    app.post("/comment/delete", async(req, res) => {

        let id = req.body.postId
        pool.query(`UPDATE posts SET comment='' WHERE ID = ${id}`)
        })
 
    app.get("/users/logout", (req, res) => {
        req.logOut();
        req.flash('success_msg', "You have logged out");
        res.redirect('/users/login');
    });



app.post("/users/register", async(req, res) => {
    let { name, prisonNumber, password, password2 } = req.body;


    let errors = [];

    if (!name || !prisonNumber || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }

    if (password.length < 6) {
        errors.push({ message: "Password should be at least 6 characters" });
    }

    if (password != password2) {
        errors.push({ message: "Passwords should match" });
    }

    if (errors.length > 0) {
        res.render('register', { errors });

    } else {

        let hashedPassword = await bcrypt.hash(password, 10);

        pool.query(
            `SELECT * FROM users WHERE prison_number = $1`, [prisonNumber], (err, results) => {
                if (err) {
                    console.log(err);
                }


                if (results.rows.length > 0) {
                    errors.push({ message: "User already registered" });
                    res.render("register", { errors });
                } else {
                    pool.query(
                        `INSERT INTO users (name, prison_number, password)
                        VALUES ($1, $2, $3)
                        RETURNING id, password`, [name, prisonNumber, hashedPassword],
                        (err, results) => {
                            if (err) {
                                throw err;
                            }

                            req.flash("success_msg", "You are now registered please log in")
                            res.redirect('/users/login')
                        }
                    )
                }
            }
        )
    }
});

app.post('/users/login', passport.authenticate('local', {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
}));




function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }
    next();
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/users/login");
}

function sortPosts(...posts) {
    return posts[0].sort(function(a, b) {
        return a.id - b.id
    })
}



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
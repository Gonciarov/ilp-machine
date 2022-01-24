const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const alert = require('alert');
const prompt = require('prompt-sync')();
const Swal = require('sweetalert2');




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
        console.log(id);
        text = `<p>${text}</p>`
        console.log(text);
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


    app.get("/dashboard/:student", async(req, res) => {
        res.redirect('/dashboard')
    }),

    app.get("/comment/view", async(req, res) => {
        res.redirect('/dashboard')
    }),

    app.get("/comment/edit", async(req, res) => {
        res.redirect('/dashboard')
    }),

    app.post("/dashboard/:student", async(req, res) => {
        
        let student = req.params.student;
        console.log(student)
        let comment = req.body.comment;
       
        Promise.all([
            pool.query(`SELECT * FROM posts WHERE prison_number = $1`, [student]),
            pool.query(`SELECT * FROM users WHERE prison_number = $1`, [student])
        ]).then(function([posts, user]) {
            posts = sortPosts(posts.rows)
            let prisonNumber = user.rows[0].prison_number;
            let name = user.rows[0].name;
            if (comment) {
        
                let postId = req.body.postId;
                
            Promise.all([
                pool.query(`UPDATE posts SET comment='${comment}' WHERE ID = ${postId} RETURNING *`, 
            )]).then(function([result]) {
                alert("Comment posted")
                res.render("viewComment", { user: name, prisonNumber: prisonNumber, post: result.rows[0] })
            })

            
            } else {
                res.render("viewPosts", { user: name, prisonNumber: prisonNumber, posts: posts })
            }
        })
        

    }),

    app.post("/edit", async(req, res) => {
        let id = req.body.postId
        let text = await pool.query(`SELECT * FROM posts WHERE id = ${id}`)
        text = text.rows[0].text.slice(3, -4)
        res.render("editPost", {id: id, text: text, alert: alert })
    })

    app.post("/comment/edit", (req, res) => {
        let id = req.body.postId
        let prisonNumber = req.body.prisonNumber
        let comment = req.body.comment
       
      
        Promise.all([
            pool.query(`UPDATE posts SET comment='${comment}' WHERE ID = ${id} RETURNING *`),
            pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]) 
        ]).then(function([result, user]) {
            let name = user.rows[0].name;
            if (req.body.edited === 'edited') {
                res.render("viewComment", { user: name, prisonNumber: prisonNumber, post: result.rows[0] })
            } else { 
                res.render("editComment", { user: name, prisonNumber: prisonNumber, post: result.rows[0] })
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
            res.render("viewComment", { user: name, prisonNumber: prisonNumber, post: result.rows[0] })
            
        })
    })
            
   
    app.post("/delete", async(req, res) => {
        
        let id = req.body.postId
        let requested = req.body.requested
        console.log(req)
        if(requested === 'yes') {
            
                pool.query(`DELETE FROM posts WHERE id = ${id}`)
                console.log('deleted')
             

            }
            res.redirect('/')
        })
         
        app.get("/deleted", async(req, res) => {
        
                            res.redirect('/dashboard')
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
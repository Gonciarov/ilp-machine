const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const alert = require('alert');
const initializePassport = require("./passportConfig");
const { jsPDF } = require("jspdf");

initializePassport(passport);

const PORT = process.env.PORT || 4000;

app.set('view engine', 'ejs')
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

app.get("/login", checkAuthenticated, (req, res) => {
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
                res.render("dashboard", { 
                    name: user.rows[0].name, 
                    prisonNumber: user.rows[0].prison_number, 
                    posts: posts   
             });
            }
        })
    });


app.post("/dashboard", async(req, res) => {
    let { text, id } = req.body;
    let date = new Date().toDateString();
    let prisonNumber = req.user.prison_number;
    if (id) {
        pool.query(`UPDATE posts SET text = '${text}' WHERE id = ${id}`, (err) =>{
            if (err) {
                console.log(err)
            } else {
                res.redirect('/dashboard');
            }
        })
    } else {
        pool.query(`INSERT INTO posts (text, prison_number, date)
        VALUES ($1, $2, $3)`, [text, prisonNumber, date], (err) =>{
            if (err) {
                console.log(err)
            } else {
                res.redirect('/dashboard');
            }
        });
    }
});

app.get("/dashboard/:prisonNumber", checkAdminRole, async(req, res) => {        
        let prisonNumber = req.params.prisonNumber;
        Promise.all([
            pool.query(`SELECT * FROM posts WHERE prison_number = $1`, [prisonNumber]),
            pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]),
            pool.query(`SELECT * FROM projects WHERE prison_number = $1`, [prisonNumber]),
            pool.query(`SELECT * FROM targets WHERE prison_number = $1`, [prisonNumber]),
            pool.query(`SELECT * FROM softskills WHERE prison_number = $1`, [prisonNumber])
        ]).then(function([posts, user, reviews, techSkills, softSkills]) {
            let name = user.rows[0].name;
            let htmlcss = techSkills.rows[0].htmlcss;
            let jsbasics = techSkills.rows[0].jsbasics;
            let reactjs = techSkills.rows[0].reactjs;
            softSkills = softSkills.rows[0].softskills;
            res.render("viewPostsAndReviews", { 
                name: name, 
                prisonNumber: prisonNumber, 
                posts: sortPosts(posts.rows), 
                reviews: reviews.rows,
                techSkills: [htmlcss, jsbasics, reactjs],
                softSkills: softSkills
            })     
        })
}),

app.get("/view/:anything", async(req, res) => {
    res.redirect('/dashboard')
}),

app.post("/dashboard/:prisonNumber", checkAdminRole, async(req, res) => {
    let prisonNumber = req.params.prisonNumber;
    let { name, text, comment, review, title, postId } = req.body
    let date = req.body.date || new Date().toDateString();
    Promise.all([
        pool.query(`SELECT * FROM posts WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM projects WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM targets WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM softskills WHERE prison_number = $1`, [prisonNumber])
    ]).then(function([posts, reviews, techSkills, softSkills]) {
        let htmlcss = techSkills.rows[0].htmlcss;
        let jsbasics = techSkills.rows[0].jsbasics;
        let reactjs = techSkills.rows[0].reactjs;
        softSkills = softSkills.rows[0].softskills;
        posts = sortPosts(posts.rows)
        reviews = reviews.rows
        if (comment) {
            Promise.all([
                pool.query(`UPDATE posts SET comment='${comment}' WHERE ID = ${postId} RETURNING *`, 
            )]).then(function([result]) {
                alert("Comment posted")
                res.render("viewComment", { 
                    name: name, 
                    comment: comment, 
                    text: text, 
                    prisonNumber: 
                    prisonNumber, 
                    date: date, 
                    techSkills: [htmlcss, jsbasics, reactjs],
                    softSkills: softSkills
                 })
            })
        } else if (review) {
            Promise.all([
            pool.query(`INSERT INTO projects (prison_number, review, title, date)
            VALUES ($1, $2, $3, $4)`, [prisonNumber, review, title, date]), 
            ]).then(function() {
                Promise.all([
                pool.query(`SELECT * FROM projects WHERE prison_number = $1`, [prisonNumber])
            ]).then(function([reviews]) {
                reviews = sortPosts(reviews.rows)
                res.render("viewPostsAndReviews", { 
                    name: name, 
                    prisonNumber: prisonNumber, 
                    posts: posts, 
                    reviews: reviews,
                    techSkills: [htmlcss, jsbasics, reactjs],
                    softSkills: softSkills 
                })
            })
            
        })
        } else {
        Promise.all([
            pool.query(`SELECT * FROM projects WHERE prison_number = $1`, [prisonNumber])
        ]).then(function([reviews]) {
            reviews = sortPosts(reviews.rows)     
            res.render("viewPostsAndReviews", { name: name, prisonNumber: prisonNumber, posts: posts, reviews: reviews, techSkills: [htmlcss, jsbasics, reactjs],
                softSkills: softSkills  })
        })
        }
    })
    

}),

app.get("/reviews", checkNotAuthenticated, async(req,res) => {
    let prisonNumber = req.user.prison_number
    pool.query(
        `SELECT * FROM projects WHERE prison_number = $1`, [prisonNumber],
        (err, results) => {
            if (err) {
                throw err;
            } else {
                let reviews = results.rows
                res.render("reviews", {reviews: reviews})
            }
        }
    )
    
})


app.post("/view/review", checkAdminRole, (req, res) => {
    let { name, reviewId, prisonNumber, review, title, date, editing } = req.body
    if (editing) {
        pool.query(`UPDATE projects SET review='${review}' WHERE ID = ${reviewId}`)
    } 
    res.render("viewReview", { name: name, date: date, reviewId: reviewId, prisonNumber: prisonNumber, review: review, title: title })

})

app.get("/targets", checkNotAuthenticated, (req, res) => {
    let prisonNumber = req.user.prison_number
    pool.query(
        `SELECT * FROM targets WHERE prison_number = $1`, [prisonNumber], (err, results) => {
            if (err) {
                console.log(err);
            } else {
               
              
                res.render('targets', {
                    targets: {
                        htmlcss: results.rows[0].htmlcss, 
                        jsbasics: results.rows[0].jsbasics, 
                        reactjs: results.rows[0].reactjs} })
            }
    })
})

app.post("/targets", checkNotAuthenticated, (req, res) => {
    let prisonNumber = req.user.prison_number
    let data = JSON.parse(req.body.data)
    let {column} = req.body
    console.log(data)
    Promise.all([
        pool.query(`SELECT * FROM targets WHERE prison_number = $1`, [prisonNumber])
    ]).then(function([results]) {  
        for (i in data) {
            if (i) {  
                results.rows[0][column][i] = data[i]     
            }
        } 
        pool.query(`UPDATE targets SET ${column} = '${JSON.stringify(results.rows[0][column])}' WHERE prison_number = 'a@a'`)    
        res.render('targets', {targets: [results.htmlcss, results.jsbasics, results.reactjs]})
    })
})



app.get("/softskills", checkNotAuthenticated, (req, res) => {
    let prisonNumber = req.user.prison_number
    pool.query(
        `SELECT * FROM softskills WHERE prison_number = $1`, [prisonNumber], (err, results) => {
            if (err) {
                console.log(err);
            } else {  
                res.render('softSkills', {
                    softskills: 
                        results.rows[0].softskills 
                             })
            }
    })
})

app.post("/softskills", checkNotAuthenticated, (req, res) => {
    let prisonNumber = req.user.prison_number
    let data = JSON.parse(req.body.data)
    console.log(data)
    Promise.all([
        pool.query(`SELECT * FROM softskills WHERE prison_number = $1`, [prisonNumber])
    ]).then(function([results]) {
        let softskills = results.rows[0].softskills
        for (i in data) {
            if (i) { 
                softskills[i] = data[i]     
            }
        } 
        pool.query(`UPDATE softskills SET softskills = '${JSON.stringify(softskills)}' WHERE prison_number = $1`, [prisonNumber])    
        res.render('softSkills', {softskills: softskills})

    })
})


app.post("/view/post", async(req, res) => {
    let { name, postId, prisonNumber, text, comment, date, editing } = req.body
    if (editing) {
        pool.query(`UPDATE posts SET text = '${text}' WHERE ID = ${postId} RETURNING *`)
    }
    res.render("viewPost", {name: name, postId: postId, text: text, prisonNumber: prisonNumber, comment: comment, date: date, alert: alert })
})
    
app.post("/view/comment", checkAdminRole, (req, res) => {
    let { name, postId, comment, prisonNumber, date, text } = req.body
    
        Promise.all([
            pool.query(`UPDATE posts SET comment='${comment}' WHERE ID = ${postId} RETURNING *`)
        ]).then(function([result, user]) {
            res.render("viewComment", { name: name, prisonNumber: prisonNumber, text: text, date: date, postId: postId, comment: comment })
        })
})
      
app.post("/delete/post", async(req, res) => {
    let postId = req.body.postId
    pool.query(`DELETE FROM posts WHERE id = ${postId}`)   
    })

app.post("/delete/review", checkAdminRole, async(req, res) => {
    let id = req.body.reviewId
    pool.query(`DELETE FROM projects WHERE id = ${id}`)
    })

app.post("/delete/comment", checkAdminRole, async(req, res) => {
    let id = req.body.postId
    pool.query(`UPDATE posts SET comment='' WHERE ID = ${id}`)
    })

app.post("/report/:prisonNumber", checkAdminRole, (req, res) => {
 let prisonNumber = req.params.prisonNumber;
 let name = req.body.name
 let doc = new jsPDF();
 doc.text(
     `name: ${name}\nprison number: ${prisonNumber}`, 
     
     10, 10);
 doc.save("test.pdf");
 res.redirect(`/dashboard/${prisonNumber}`)
 alert("Report saved")
})


app.post("/create/user", (req, res) => {
    let { name, postId, comment, prisonNumber, date, text } = req.body
    
        Promise.all([
            pool.query(`UPDATE posts SET comment='${comment}' WHERE ID = ${postId} RETURNING *`)
        ]).then(function([result, user]) {
            res.render("viewComment", { name: name, prisonNumber: prisonNumber, text: text, date: date, postId: postId, comment: comment })
        })
})

app.get("/logout", (req, res) => {
    req.logOut();
    req.flash('success_msg', "You have logged out");
    res.redirect('/login');
});

app.get("/register", checkAuthenticated, (req, res) => {
    res.render("register");
});

app.post("/register", async(req, res) => {
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
                            res.redirect('/login')
                        }
                    )
                }
            }
        )
    }
});



app.post('/login', passport.authenticate('local', {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureFlash: true
}));

/* functions */

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
    res.redirect("/login");
}

function checkAdminRole(req, res, next) {
    if (req.user.prison_number === process.env.ADMIN_PRISON_NUMBER) {
        return next();
    }
    res.redirect("/dashboard");
}

function sortPosts(...posts) {
    return posts[0].sort(function(a, b) {
        return a.id - b.id
    })
}



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
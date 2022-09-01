const express = require('express');
const app = express();
const { pool } = require("./dbConfig");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");
const alert = require('alert');
const initializePassport = require("./passportConfig");
const genericSkills = require("./serverHelpers/genericSkills");
const reportGenerator = require("./serverHelpers/generateReport");
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
    res.render("login");
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
                pool.query(`SELECT * FROM requests`, (err, results) => {
                if (err) {
                    console.log(err)
                } else {
                    let requests = results.rows;
                    res.render("admin", { 
                        posts: posts.rows, 
                        requests: requests, 
                        students: students.rows, 
                        prisonNumber: req.user.prison_number
                    });
                }})
            } else {
                posts = sortPosts(posts.rows)
                res.render("dashboard", { 
                    name: user.rows[0].name, 
                    prisonNumber: user.rows[0].prison_number, 
                    posts: posts,
                    students: sortPosts(students.rows),
                    notSeen: user.rows[0].unseen
                    
                     
             });
            }
        })
    });


app.post("/dashboard", async(req, res) => {
    let { text, id } = req.body;
    let date = new Date().toDateString();
    let prisonNumber = req.user.prison_number;
    let name = req.user.name;
    console.log(prisonNumber)
    let currentDateTime = createDateTime(); 
    let log = `User ${name} (${prisonNumber}) has created a new post on ${currentDate}`
    pool.query(`INSERT INTO requests (prison_number, log, type, date, name) 
    VALUES ($1, $2, $3, $4, $5)`, [prisonNumber, log, "post", currentDateTime, name])
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
            pool.query(`SELECT * FROM reviews WHERE prison_number = $1`, [prisonNumber]),
            pool.query(`SELECT * FROM techskills WHERE prison_number = $1`, [prisonNumber]),
            pool.query(`SELECT * FROM softskills WHERE prison_number = $1`, [prisonNumber])
        ]).then(function([posts, user, reviews, techSkills, softskills]) {
            let name = user.rows[0].name;
            let htmlcss = techSkills.rows[0].htmlcss;
            let jsbasics = techSkills.rows[0].jsbasics;
            let reactjs = techSkills.rows[0].reactjs;
            softskills = softskills.rows[0].softskills;
            res.render("viewPostsAndReviews", { 
                name: name, 
                prisonNumber: prisonNumber, 
                posts: sortPosts(posts.rows), 
                reviews: reviews.rows,
                techSkills: [htmlcss, jsbasics, reactjs],
                softskills: softskills
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
        pool.query(`SELECT * FROM reviews WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM techskills WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM softskills WHERE prison_number = $1`, [prisonNumber])
    ]).then(function([posts, reviews, techSkills, softskills]) {
        let htmlcss = techSkills.rows[0].htmlcss;
        let jsbasics = techSkills.rows[0].jsbasics;
        let reactjs = techSkills.rows[0].reactjs;
        softskills = softskills.rows[0].softskills;
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
                    softskills: softskills
                 })
            })
        } else if (review) {
            Promise.all([
            pool.query(`INSERT INTO reviews (prison_number, review, title, date)
            VALUES ($1, $2, $3, $4)`, [prisonNumber, review, title, date]), 
            ]).then(function() {
                Promise.all([
                pool.query(`SELECT * FROM reviews WHERE prison_number = $1`, [prisonNumber])
            ]).then(function([reviews]) {
                reviews = sortPosts(reviews.rows)
                res.render("viewPostsAndReviews", { 
                    name: name, 
                    prisonNumber: prisonNumber, 
                    posts: posts, 
                    reviews: reviews,
                    techSkills: [htmlcss, jsbasics, reactjs],
                    softskills: softskills 
                })
            })
            
        })
        } else {
        Promise.all([
            pool.query(`SELECT * FROM reviews WHERE prison_number = $1`, [prisonNumber])
        ]).then(function([reviews]) {
            reviews = sortPosts(reviews.rows)     
            res.render("viewPostsAndReviews", { name: name, prisonNumber: prisonNumber, posts: posts, reviews: reviews, techSkills: [htmlcss, jsbasics, reactjs],
                softskills: softskills  })
        })
        }
    })
    

}),

app.get("/reviews", checkNotAuthenticated, async(req,res) => {
    let prisonNumber = req.user.prison_number
    let name = req.user.name
    Promise.all([
        pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM reviews WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM users`)
            ]).then(function([user, reviews, students]) {
                        reviews = reviews.rows
                        students = sortPosts(students.rows)
                        res.render("reviews", 
                        {
                            reviews: reviews, 
                            students: students, 
                            prisonNumber: prisonNumber, 
                            name: name,
                            notSeen: user.rows[0].unseen
                        })
            })     
            }
    )
    


app.post("/view/review", checkAdminRole, (req, res) => {
    let { name, reviewId, prisonNumber, review, title, date, editing } = req.body
    if (editing) {
        pool.query(`UPDATE reviews SET review='${review}' WHERE ID = ${reviewId}`)
    } 
    res.render("viewReview", { name: name, date: date, reviewId: reviewId, prisonNumber: prisonNumber, review: review, title: title })

})

app.get("/techskills", checkNotAuthenticated, (req, res) => {
    let prisonNumber = req.user.prison_number
    Promise.all([
        pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM techskills WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM users`)
    ]).then(function([user, results, students]) {
               students = sortPosts(students.rows);
                res.render('techskills', {
                    students: students,
                    prisonNumber: prisonNumber,
                    notSeen: user.rows[0].unseen,
                    techskills: {
                        htmlcss: results.rows[0].htmlcss, 
                        jsbasics: results.rows[0].jsbasics, 
                        reactjs: results.rows[0].reactjs} })
            })
    })


app.post("/techskills", checkNotAuthenticated, (req, res) => {
    let prisonNumber = req.user.prison_number
    let data = JSON.parse(req.body.data)
    let {column} = req.body
    Promise.all([
        pool.query(`SELECT * FROM techskills WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM users`),
        pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]),
    ]).then(function([results, students, user]) {  
        for (i in data) {
            if (i) {  
                results.rows[0][column][i] = data[i]     
            }
        }
        students = sortPosts(students.rows);
        pool.query(`UPDATE techskills SET ${column} = '${JSON.stringify(results.rows[0][column])}' WHERE prison_number = $1`, [prisonNumber])    
        res.render('techskills', {
            students: students, 
            prisonNumber: prisonNumber,
            notSeen: user.rows[0].unseen,
            techskills: [results.htmlcss, results.jsbasics, results.reactjs]})
    })
})



app.get("/softskills", checkNotAuthenticated, (req, res) => {
    let prisonNumber = req.user.prison_number
    Promise.all([
        pool.query(`SELECT * FROM softskills WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM users`),
        pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]),
    ]).then(function([results, students, user]) {  
        students = sortPosts(students.rows);
                res.render('softskills', {
                    students: students, 
                    prisonNumber: prisonNumber, 
                    notSeen: user.rows[0].unseen,
                    softskills: 
                        results.rows[0].softskills 
                             })
            })
    })


app.post("/softskills", checkNotAuthenticated, (req, res) => {
    let prisonNumber = req.user.prison_number
    let data = JSON.parse(req.body.data)
    Promise.all([
        pool.query(`SELECT * FROM softskills WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM users`),
        pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber])
    ]).then(function([results, students, user]) {
        let softskills = results.rows[0].softskills
        students = sortPosts(students.rows)
        for (i in data) {
            if (i) { 
                softskills[i] = data[i]     
            }
        } 
        pool.query(`UPDATE softskills SET softskills = '${JSON.stringify(softskills)}' WHERE prison_number = $1`, [prisonNumber])    
        res.render('softskills', {
            softskills: softskills,
            students: students, 
            prisonNumber: prisonNumber,
            notSeen: user.rows[0].unseen
        })

    })
})

app.get("/messages/:dialogId", checkDialogAccess, (req, res) => {
    let dialogId = req.params.dialogId
    pool.query(`SELECT * FROM messages WHERE id = '${dialogId}'`, (err, results) => {
        if (err) {
            console.log(err)
        } else {
            results = results.rows
        }
        res.render("messages", {dialogId: dialogId, messages: results})
    })
})

app.post("/messages/:dialogId", checkDialogAccess, (req, res) => {
    let dialogId = req.params.dialogId;
    let text = req.body.message;
    let {participant2} = req.body;
    let admin = req.body.admin || "notAdmin"
    let dateTime = new Date().toLocaleString();
    let msgs = [];
    let name = req.user.name;
    let prisonNumber = req.user.prison_number;
    let recipient = dialogId.replace('-', '').replace(prisonNumber, '');
    if (text) {
        
        Promise.all([
            pool.query(`INSERT INTO messages (id, author, message, datetime)
        VALUES ($1, $2, $3, $4)`, [dialogId, name, text, dateTime]),
            pool.query(`SELECT * FROM users WHERE prison_number = $1`, [recipient]),
        ]).then(function([inserted, selected]) {
                if (!selected.rows[0].unseen) {
                    selected.rows[0].unseen = {}
                } 
                selected.rows[0].unseen[prisonNumber] = "unseen";
                pool.query(`UPDATE users SET unseen = $1 WHERE prison_number = $2`, [ selected.rows[0].unseen, recipient]),
                pool.query(`SELECT * FROM messages WHERE id = '${dialogId}'`, (err, results) => {
                    if (err) {
                        console.log(err)
                    } else {
                        msgs = results.rows;
                    
                    pool.query('SELECT * FROM users', (err, users) => {
                        if (err) {
                            console.log(err)
                        } else {
                        let students = sortPosts(users.rows);
                        let notSeen = []
                        for (let i=0; i < students.length; i++) {
                            if (students[i].prison_number === prisonNumber) {
                               notSeen.push(students[i].unseen);
                            if (students[i].prison_number === 'aaaaaa') {
                                participant2 = students[i]
                            }
                            }
                        }

                        res.render("messages", {
                            dialogId: dialogId, 
                            messages: msgs, 
                            participant2: participant2,
                            students: students,
                            prisonNumber: prisonNumber,
                            participant2pn: recipient,
                            notSeen: notSeen, 
                            admin: admin               
                        }) 
                    }})
                }})
            })
        } else {
        Promise.all([
            pool.query(`SELECT * FROM users WHERE prison_number = '${prisonNumber}'`),
            pool.query(`SELECT * FROM messages WHERE id = '${dialogId}'`),
            pool.query('SELECT * FROM users;')
        ]).then(function([user, results, users]) {
            msgs = results.rows;
            let students = sortPosts(users.rows);
            res.render("messages", {
                dialogId: dialogId, 
                messages: msgs, 
                participant2: participant2,
                students: students,
                notSeen: user.rows[0].unseen,
                prisonNumber: prisonNumber,
                participant2pn: recipient,
                admin: admin
            })  
        })  
        }              
    })    


app.post("/unseen-seen", (req, res) => {
    let prisonNumber = req.user.prison_number
    let dialogId = req.body.dialogId
    let anotherParticipant = dialogId.replace('-', '').replace(prisonNumber, '')
    Promise.all([
    pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber])
    ]).then(function([selected]) {
        if (!selected.rows[0].unseen) {
            selected.rows[0].unseen = {}
        } 
        selected.rows[0].unseen[anotherParticipant] = "seen";
        pool.query(`UPDATE users SET unseen = $1 WHERE prison_number = $2`, [selected.rows[0].unseen, prisonNumber])
    })

})

app.post("/admin-notif", (req, res) => {
    let prisonNumber = req.body.prisonNumber
        Promise.all([
    pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber])
    ]).then(function([selected]) {
        if (!selected.rows[0].unseen) {
            selected.rows[0].unseen = {}
        } 
        selected.rows[0].unseen[process.env.ADMIN_PRISON_NUMBER] = "unseen";
        pool.query(`UPDATE users SET unseen = $1 WHERE prison_number = $2`, [selected.rows[0].unseen, prisonNumber])
    })

})
     
app.get("/ilp", checkNotAuthenticated, (req, res) => {
    Promise.all([
        pool.query(`SELECT * FROM users WHERE prison_number = $1`, [req.user.prison_number]),
        pool.query(`SELECT * FROM ilp WHERE prison_number = $1`, [req.user.prison_number]),
        
    ]).then(function([user, targets]) {
                targets = targets.rows[0];
                let name = req.user.name;
                res.render("ilp", {name: name, targets: targets})  
                           
         })
        })


app.post("/ilp", checkNotAuthenticated, (req, res) => {
    if (req.user.prison_number !== process.env.ADMIN_PRISON_NUMBER) {
    let name = req.user.name;
    let {module, date} = req.body;
    let prisonNumber = req.user.prison_number;
    if (req.body.requestFromSidebar === "update") {
        addRequestToLog(name, prisonNumber, module, "update", date);
        Promise.all([
        pool.query(`SELECT * FROM ilp WHERE prison_number = $1`, [prisonNumber])
            ]).then(function([results]) {
                let req_new_date = results.rows[0].req_new_date;
                let requested = results.rows[0].requested
                targets = results.rows[0];
                req_new_date[module] = date;
                targets.req_new_date = req_new_date;
                targets.requested = requested;
                pool.query(`UPDATE ilp SET req_new_date = '${JSON.stringify(req_new_date)}' WHERE prison_number = $1`, [prisonNumber])
                res.render('ilp', {
                    // students: students, 
                    prisonNumber: prisonNumber,
                    // notSeen: user.rows[0].unseen,
                    targets: targets,
                    name: name
                }) 
    })
    } 
    else if (req.body.requestFromSidebar === "delete") {
        Promise.all([
            pool.query(`SELECT * FROM ilp WHERE prison_number = $1`, [prisonNumber])
                ]).then(function([results]) {
                    targets = results.rows[0];
                    if (targets["requested"]) {
                        targets["requested"][module] = "delete"
                    } else {
                        targets["requested"] = {};
                        targets["requested"][module] = "delete"
                    }
                    addRequestToLog(name, prisonNumber, module, 'delete')
                    pool.query(`UPDATE ilp SET requested = '${JSON.stringify(targets["requested"])}' WHERE prison_number = $1`, [prisonNumber]);
                    res.render('ilp', {
                        // students: students, 
                        prisonNumber: prisonNumber,
                        // notSeen: user.rows[0].unseen,
                        targets: targets,
                        name: name
                    }) 
        })
    } else if (req.body.requestFromSidebar === "cancel-request") {
        pool.query(`DELETE FROM requests WHERE prison_number = $1 AND module = $2`, [prisonNumber, module]);
        Promise.all([
            pool.query(`SELECT * FROM ilp WHERE prison_number = $1`, [prisonNumber])
                ]).then(function([results]) {
                    targets = results.rows[0];
                    if (targets["requested"][module] === "add") {
                        delete targets["current"][module]
                        pool.query(`UPDATE ilp SET current = '${JSON.stringify(targets["current"])}' WHERE prison_number = $1`, [prisonNumber]);
                    }
                    delete targets["requested"][module]
                    pool.query(`UPDATE ilp SET requested = '${JSON.stringify(targets["requested"])}' WHERE prison_number = $1`, [prisonNumber]);
                    res.redirect('/ilp')
                })
    } else if (req.body.requestFromSidebar === "add") {
        Promise.all([
            pool.query(`SELECT * FROM ilp WHERE prison_number = $1`, [prisonNumber])
                ]).then(function([results]) {
                    targets = results.rows[0];
                    targets["requested"][module] = "add"
                    let current = results.rows[0].current;
                    let date = req.body.date;
                    current[module] = date;
                    targets.current = current;
                    pool.query(`UPDATE ilp SET current = '${JSON.stringify(current)}' WHERE prison_number = $1`, [prisonNumber]);
                    pool.query(`UPDATE ilp SET requested = '${JSON.stringify(targets["requested"])}' WHERE prison_number = $1`, [prisonNumber]);
                    addRequestToLog(name, prisonNumber, module, 'add', date)
                    res.render('ilp', {
                    prisonNumber: prisonNumber,
                    targets: targets,
                    name: name
                }) 
                })
    } else if (req.body.requestFromSidebar === "complete") {
        Promise.all([
            pool.query(`SELECT * FROM ilp WHERE prison_number = $1`, [prisonNumber])
                ]).then(function([results]) {
                    targets = results.rows[0];
                    targets["requested"][module] = "complete";
                    addRequestToLog(name, prisonNumber, module, "complete", date);
                    pool.query(`UPDATE ilp SET requested = '${JSON.stringify(targets["requested"])}' WHERE prison_number = $1`, [prisonNumber]);
                })
                res.redirect('/ilp')
    } else {
    let data = JSON.parse(req.body.data)
    Promise.all([
        pool.query(`SELECT * FROM ilp WHERE prison_number = $1`, [prisonNumber]),
        pool.query(`SELECT * FROM users`),
        pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]),
    ]).then(function([targets, students, user]) {  
        for (i in data) {
            if (i) {
                targets.rows[0][module][i] = data[i]     
            }
        }
        pool.query(`UPDATE ilp SET ${module} = '${JSON.stringify(targets.rows[0][module])}' WHERE prison_number = $1`, [prisonNumber])    
        res.render('ilp', {
            prisonNumber: prisonNumber,
            targets: targets.rows[0],
            name: name
        })
    })
}} else {
    let prisonNumber = req.body.prisonNumber
    let {module, decline, targetDate} = req.body
    pool.query(`SELECT * FROM ilp WHERE prison_number = $1`, [prisonNumber], (err, results) => {
        
        if (err) {
            console.log(err)
        } else {
                let targets = results.rows[0]
                if (req.body.requestFromSidebar === "add") {
                    delete targets["requested"][module]
                    pool.query(`UPDATE ilp SET requested = '${JSON.stringify(targets["requested"])}' WHERE prison_number = $1`, [prisonNumber]);
                    
                    if (decline) {
                        approved = false;
                        delete targets["current"][module];
                        pool.query(`UPDATE ilp SET current = '${JSON.stringify(targets["current"])}' WHERE prison_number = $1`, [prisonNumber]);
                    }
                } 
                else if (req.body.requestFromSidebar === "complete") {
                    delete targets["requested"][module];
                    
                    if (!decline) {
                    delete targets["current"][module];
                    targets["completed"][module] = new Date().toDateString();
                    pool.query(`UPDATE ilp SET requested = '${JSON.stringify(targets["requested"])}' WHERE prison_number = $1`, [prisonNumber]);
                    pool.query(`UPDATE ilp SET current = '${JSON.stringify(targets["current"])}' WHERE prison_number = $1`, [prisonNumber]);
                    pool.query(`UPDATE ilp SET completed = '${JSON.stringify(targets["completed"])}' WHERE prison_number = $1`, [prisonNumber]);              
                    }
                } 
                else if (req.body.requestFromSidebar === "update") {
                    targets["current"][module] = targetDate;
                    delete targets["req_new_date"][module];
                    pool.query(`UPDATE ilp SET req_new_date = '${JSON.stringify(targets["req_new_date"])}' WHERE prison_number = $1`, [prisonNumber]);
                    pool.query(`UPDATE ilp SET current = '${JSON.stringify(targets["current"])}' WHERE prison_number = $1`, [prisonNumber]);          
                }
                else if (req.body.requestFromSidebar === "delete") {
                    delete targets["requested"][module]
                    delete targets["current"][module]
                    pool.query(`UPDATE ilp SET requested = '${JSON.stringify(targets["requested"])}' WHERE prison_number = $1`, [prisonNumber]);
                    pool.query(`UPDATE ilp SET current = '${JSON.stringify(targets["current"])}' WHERE prison_number = $1`, [prisonNumber]);          
                }
            }
        })
        sendAutomatedRequestReply(prisonNumber, decline, module, req.body.requestFromSidebar)
        pool.query(`DELETE FROM requests WHERE prison_number = $1 AND module = $2`, [prisonNumber, module])
        res.redirect('/dashboard')
    }
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
    pool.query(`DELETE FROM reviews WHERE id = ${id}`)
    })

app.post("/delete/comment", checkAdminRole, async(req, res) => {
    let id = req.body.postId
    pool.query(`UPDATE posts SET comment='' WHERE ID = ${id}`)
    })

app.post("/report/:prisonNumber", checkAdminRole, (req, res) => {
 let prisonNumber = req.params.prisonNumber;
 let {name, curriculumCompleted, softskillsCompleted, postsTotal, reviewsTotal} = req.body
 Promise.all([
    pool.query(`SELECT * FROM posts WHERE prison_number = $1`, [prisonNumber]),
    pool.query(`SELECT * FROM reviews WHERE prison_number = $1`, [prisonNumber]),
]).then(function([posts, reviews]) {
    reportGenerator.generateReport(
        posts, 
        reviews, 
        name, 
        prisonNumber, 
        curriculumCompleted, 
        softskillsCompleted, 
        postsTotal, 
        reviewsTotal
        );
    res.redirect(`/dashboard/${prisonNumber}`)
    alert("Report saved")
    })
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
                    genericSkills.seed(prisonNumber)
                    ilp.seed(prisonNumber)
                    let date = new Date().toDateString();
                    pool.query(`INSERT INTO posts (text, prison_number, date, comment)
                    VALUES ($1, $2, $3, $4)`, ['INITIAL POST', prisonNumber, date, 'NOT TO BE COMMENTED']);
                    pool.query(
                        `INSERT INTO users (name, prison_number, password, unseen)
                        VALUES ($1, $2, $3, $4)
                        RETURNING id, password`, [name, prisonNumber, hashedPassword, {}],
                        (err, results) => {
                            if (err) {
                                throw err;
                            }

                            req.flash("success_msg", "You are now registered please log in")
                            genericSkills.seed(prisonNumber)
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

function checkDialogAccess(req, res, next) {
    if (req.params.dialogId.includes(req.user.prison_number)) {
        return next();
    }
    res.redirect("/dashboard");
}

function addRequestToLog(name, prisonNumber, module, type, targetDate=null) {
    let currentDate = createDateTime();
    let log;
    targetDate ? 

            log = `User ${name} (${prisonNumber}) requested to ${type} module ${module}. Target date: ${targetDate}` 
            :
            log = `User ${name} (${prisonNumber}) requested to ${type} module ${module}`
        
    type == "update" ?
    pool.query(`INSERT INTO requests (prison_number, log, type, module, date, target_date) 
    VALUES ($1, $2, $3, $4, $5, $6)`, [prisonNumber, log, type, module, currentDate, targetDate]) 
    :
    pool.query(`INSERT INTO requests (prison_number, log, type, module, date) 
    VALUES ($1, $2, $3, $4, $5)`, [prisonNumber, log, type, module, currentDate]) 
}


function sendAutomatedRequestReply(prisonNumber, decline, module, type) {      
    let dialogId = [prisonNumber, process.env.ADMIN_PRISON_NUMBER].sort().join("-").toString();
    let dateTime = new Date().toLocaleString();
    let text = generateAutomatedReply(decline, type, module);
    pool.query(`INSERT INTO messages (id, author, message, datetime)
        VALUES ($1, $2, $3, $4)`, [dialogId, "Admin", text, dateTime])
        }

function generateAutomatedReply(decline, type, module) {
    decline !== "true" ? 
        text = `Automated message: your request to ${type} module ${module} has been approved.`
        :
        text = `Automated message: your request to ${type} module ${module} has not been approved. Please speak to your tutor about this.`
    return text
    }

function createDateTime() {
   return new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
}



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
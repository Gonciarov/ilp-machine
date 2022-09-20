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
const ilp = require("./serverHelpers/generateIlp");
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

app.get('/terms', (req, res) => {
    let prisonNumber = req.user.prison_number;
    res.render('terms', {prisonNumber: prisonNumber});
})

app.post('/terms', (req, res) => {
    let {prisonNumber, terms} = req.body;
    updateData(prisonNumber, 'prison_number', 'users', 'terms', terms)
})

app.get('/rules', (req, res) => {
    let {name, prisonNumber} = req.user;
    res.render('rules', {prisonNumber: prisonNumber, name: name});
})

app.get("/dashboard", checkNotAuthenticated, checkTermsAndConditions, (req, res) => {
    let prisonNumber = req.user.prison_number;
        Promise.all([
            getUser(prisonNumber),
            getData(prisonNumber, 'posts'),
            getAllFromTable('users')
        ]).then(function([user, posts, students]) {
            if (req.user.prison_number == process.env.ADMIN_PRISON_NUMBER) {
                getAllFromTable('requests').then(function(results) { 
                    let requests = results.rows;
                    res.render("admin", { 
                        posts: posts.rows, 
                        requests: requests, 
                        students: students.rows, 
                        prisonNumber: req.user.prison_number,
                        signed: "signed"
                    });
                })
            } else {
                posts = sortPosts(posts.rows)
                res.render("dashboard", { 
                    name: user.rows[0].name, 
                    prisonNumber: user.rows[0].prison_number, 
                    posts: posts,
                    students: sortPosts(students.rows),
                    notSeen: user.rows[0].unseen,
                    signed: user.rows[0].signed    
             });
            }
        })
    });


app.post("/dashboard",  checkTermsAndConditions, async(req, res) => {
    let prisonNumber = req.user.prison_number;
   
    let { text, id } = req.body;
    let date = new Date().toDateString();
    let name = req.user.name;
    let currentDateTime = createDateTime(); 
    let log = `User ${name} (${prisonNumber}) has created a new post on ${date}`
    pool.query(`INSERT INTO requests (prison_number, log, type, date, name) 
    VALUES ($1, $2, $3, $4, $5)`, [prisonNumber, log, "post", currentDateTime, name])
    if (id) {
        updateData(id, 'ID', 'posts', 'text', text)
        res.redirect('/dashboard');
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
            getData(prisonNumber, 'posts'),
            getUser(prisonNumber),
            getData(prisonNumber, 'reviews'),
            getData(prisonNumber, 'techskills'),
            getData(prisonNumber, 'softskills'), 
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
        getData(prisonNumber, 'posts'),
        getData(prisonNumber, 'reviews'),
        getData(prisonNumber, 'techskills'),
        getData(prisonNumber, 'softskills'), 
    ]).then(function([posts, reviews, techSkills, softskills]) {
        let htmlcss = techSkills.rows[0].htmlcss;
        let jsbasics = techSkills.rows[0].jsbasics;
        let reactjs = techSkills.rows[0].reactjs;
        softskills = softskills.rows[0].softskills;
        posts = sortPosts(posts.rows)
        reviews = reviews.rows
        if (comment) {
            updateData(postId, 'ID', 'posts', 'comment', comment)
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
        } else if (review) {
            Promise.all([
            pool.query(`INSERT INTO reviews (prison_number, review, title, date)
            VALUES ($1, $2, $3, $4)`, [prisonNumber, review, title, date]), 
            ]).then(function() {
                getData(prisonNumber, 'reviews').then(function(reviews) {
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
            getData(prisonNumber, 'reviews').then(function(reviews) {
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
        getUser(prisonNumber),
        getData(prisonNumber, 'reviews'),
        getAllFromTable('users')
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
        updateData(reviewId, 'ID', 'reviews', 'review', review)
    } 
    res.render("viewReview", { name: name, date: date, reviewId: reviewId, prisonNumber: prisonNumber, review: review, title: title })

})

app.get("/techskills", checkNotAuthenticated, (req, res) => {
    let prisonNumber = req.user.prison_number
    Promise.all([
        getUser(prisonNumber),
        getData(prisonNumber, 'techskills'),
        getAllFromTable('users')
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
        getData(prisonNumber, 'techskills'),
        getAllFromTable('users'),
        getUser(prisonNumber),
    ]).then(function([results, students, user]) {  
        for (i in data) {
            if (i) {  
                results.rows[0][column][i] = data[i]     
            }
        }
        students = sortPosts(students.rows);
        updateData(prisonNumber, 'prison_number', 'techskills', column, JSON.stringify(results.rows[0][column]))
           
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
        getData(prisonNumber, 'softskills'),
        getAllFromTable('users'),
        getUser(prisonNumber),
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
        getData(prisonNumber, 'softskills'),
        getAllFromTable('users'),
        getUser(prisonNumber),
    ]).then(function([results, students, user]) {
        let softskills = results.rows[0].softskills
        students = sortPosts(students.rows)
        for (i in data) {
            if (i) { 
                softskills[i] = data[i]     
            }
        } 
        updateData(prisonNumber, 'prison_number', 'softskills', 'softskills', JSON.stringify(softskills));  
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
    getMessages(dialogId).then(function(results) {
        res.render("messages", {dialogId: dialogId, messages: results.rows})
    })
})

app.post("/messages/:dialogId", checkDialogAccess, (req, res) => {
    let dialogId = req.params.dialogId;
    let text = req.body.message;
    let {participant2} = req.body;
    let admin = req.body.admin || "notAdmin"
    let dateTime = new Date().toLocaleString();
    let name = req.user.name;
    let prisonNumber = req.user.prison_number;
    let recipient = dialogId.replace('-', '').replace(prisonNumber, '');
    if (text) {
        insertIntoMessages(dialogId, name, text, dateTime);
        getUser(recipient).then(function(selected) {
            if (!selected.rows[0].unseen) {
                selected.rows[0].unseen = {}
                } 
                selected.rows[0].unseen[prisonNumber] = "unseen";
                updateData(recipient, 'prison_number', 'users', 'unseen', JSON.stringify(selected.rows[0].unseen));
                getMessages(dialogId).then(function(messages) {
                    getAllFromTable('users').then(function(users){
                        let students = sortPosts(users.rows);
                        let notSeen = []
                        for (let i=0; i < students.length; i++) {
                            if (students[i].prison_number === prisonNumber) {
                                notSeen.push(students[i].unseen);
                            if (students[i].prison_number === process.env.ADMIN_PRISON_NUMBER) {
                                participant2 = students[i]
                                }
                            }
                        }
                    res.render("messages", {
                        dialogId: dialogId, 
                        messages: messages.rows, 
                        participant2: participant2,
                        students: students,
                        prisonNumber: prisonNumber,
                        participant2pn: recipient,
                        notSeen: notSeen, 
                        admin: admin               
                    }) 
                })
            })
        })
    } else {
        Promise.all([
            getUser(prisonNumber),
            getMessages(dialogId),
            getAllFromTable('users')
        ]).then(function([user, messages, users]) {
            let students = sortPosts(users.rows);
            res.render("messages", {
                dialogId: dialogId, 
                messages: messages.rows, 
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
    getUser(prisonNumber).then(function(selected) {
        if (!selected.rows[0].unseen) {
            selected.rows[0].unseen = {}
        } 
        selected.rows[0].unseen[anotherParticipant] = "seen";
        updateData(prisonNumber, 'prison_number', 'users', 'unseen', JSON.stringify(selected.rows[0].unseen));
    })

})

app.post("/admin-notif", (req, res) => {
    let prisonNumber = req.body.prisonNumber
    getUser(prisonNumber).then(function(selected) {
        if (!selected.rows[0].unseen) {
            selected.rows[0].unseen = {}
        } 
        selected.rows[0].unseen[process.env.ADMIN_PRISON_NUMBER] = "unseen";
        updateData(prisonNumber, 'prison_number', 'users', 'unseen', JSON.stringify(selected.rows[0].unseen));
    })

})
     
app.get("/ilp", checkNotAuthenticated, (req, res) => {
    Promise.all([
        getUser(req.user.prison_number),
        getData(req.user.prison_number, 'ilp') 
    ]).then(function([user, targets]) {
        targets = targets.rows[0];
        let name = req.user.name;
        res.render("ilp", {name: name, targets: targets})             
        })
    })


app.post("/ilp-save", checkNotAuthenticated, (req, res) => {
    let name = req.user.name;
    let {module} = req.body;
    let prisonNumber = req.user.prison_number;
    let data = JSON.parse(req.body.data)
    getData(prisonNumber, 'ilp').then(function(targets) {  
        for (i in data) {
            if (i) {
                targets.rows[0][module][i] = data[i]     
            }
        }
        updateIlp(prisonNumber, module, targets.rows[0][module])    
        res.render('ilp', {
            prisonNumber: prisonNumber,
            targets: targets.rows[0],
            name: name
        })
    })
});

app.post("/ilp-admin", checkAdminRole, (req, res) => {
    let prisonNumber = req.body.prisonNumber
    let {module, decline, targetDate, requestType} = req.body
    getData(prisonNumber, 'ilp').then(function(results) { 
        let targets = results.rows[0]
        switch (requestType) {
            case "add": 
                delete targets["requested"][module]
                updateIlp(prisonNumber, 'requested', targets["requested"]);
                if (decline) {
                    approved = false;
                    delete targets["current"][module];
                    updateIlp(prisonNumber, 'current', targets["current"]);
                }
            break;
            case "complete": 
                delete targets["requested"][module];
                if (!decline) {
                    delete targets["current"][module];
                    targets["completed"][module] = new Date().toDateString();
                    updateIlp(prisonNumber, 'current', targets["current"]);
                    updateIlp(prisonNumber, 'completed', targets["completed"]);              
                }
                updateIlp(prisonNumber, 'requested', targets["requested"]);
            break; 
            case "update": 
                targets["current"][module] = targetDate;
                delete targets["req_new_date"][module];
                updateIlp(prisonNumber, 'req_new_date', targets["req_new_date"]);
                updateIlp(prisonNumber, 'current', targets["current"]);        
            break;
            case "delete": 
                delete targets["requested"][module]
                delete targets["current"][module]
                updateIlp(prisonNumber, 'requested', targets["requested"]);
                updateIlp(prisonNumber, 'current', targets["current"]);          
            break; 
        } 
    })
    sendAutomatedRequestReply(prisonNumber, decline, module, requestType);
    deleteData(prisonNumber, 'requests', module);
    res.redirect('/dashboard')
})

app.post("/ilp-add", (req, res) => {
    let prisonNumber = req.user.prison_number
    let name = req.user.name
    let {module} = req.body
    getData(prisonNumber, 'ilp').then(function(results) {
        targets = results.rows[0];
        targets["requested"][module] = "add"
        let current = results.rows[0].current;
        let date = req.body.date;
        current[module] = date;
        targets.current = current;
        updateIlp(prisonNumber, 'current', current)
        updateIlp(prisonNumber, 'requested', targets["requested"]);
        addRequestToLog(name, prisonNumber, module, 'add', date)
        res.render('ilp', {
            prisonNumber: prisonNumber,
            targets: targets,
            name: name
        }) 
    })
})


app.post("/ilp-update", (req, res) => {
    let prisonNumber = req.user.prison_number
    let name = req.user.name
    let {module} = req.body
    let date = req.body.date || new Date().toDateString();
    addRequestToLog(name, prisonNumber, module, "update", date);
    getData(prisonNumber, 'ilp').then(function(results) {
        let req_new_date = results.rows[0].req_new_date;
        let requested = results.rows[0].requested
        targets = results.rows[0];
        req_new_date[module] = date;
        targets.req_new_date = req_new_date;
        targets.requested = requested;
        updateIlp(prisonNumber, 'req_new_date', req_new_date)
        res.render('ilp', {
            prisonNumber: prisonNumber,
            targets: targets,
            name: name
        }) 
    })
})

app.post("/ilp-delete", (req, res) => {
    let prisonNumber = req.user.prison_number
    let name = req.user.name
    let {module} = req.body
    getData(prisonNumber, 'ilp').then(function(results) {
        targets = results.rows[0];
        if (targets["requested"]) {
            targets["requested"][module] = "delete"
        } else {
            targets["requested"] = {};
            targets["requested"][module] = "delete"
        }
        addRequestToLog(name, prisonNumber, module, 'delete')
        updateIlp(prisonNumber, 'requested', targets["requested"]);
        res.render('ilp', {
            prisonNumber: prisonNumber,
            targets: targets,
            name: name
        }) 
    }) 
})

app.post("/ilp-complete", (req, res) => {
    let prisonNumber = req.user.prison_number
    let name = req.user.name
    let {module} = req.body
    let date = req.body.date || new Date().toDateString();
    getData(prisonNumber, 'ilp').then(function(results) {
        targets = results.rows[0];
        targets["requested"][module] = "complete";
        addRequestToLog(name, prisonNumber, module, "complete", date);
        updateIlp(prisonNumber, 'requested', targets["requested"]);
        res.render('ilp', {
            prisonNumber: prisonNumber,
            targets: targets,
            name: name
        }) 
    })
})

app.post("/ilp-cancel", (req, res) => {
    let prisonNumber = req.user.prison_number
    let {module} = req.body
    deleteData(prisonNumber, 'requests', module)
    getData(prisonNumber, 'ilp').then(function(results) {
        targets = results.rows[0];
        if (targets["requested"][module] === "add") {
            delete targets["current"][module]
            updateIlp(prisonNumber, 'current', targets["current"])
        }
        delete targets["requested"][module]
        updateIlp(prisonNumber, 'requested', targets["requested"]);
        res.redirect('/ilp')
    })   
})

app.post("/view/post", async(req, res) => {
    let { name, postId, prisonNumber, text, comment, date, editing } = req.body
    if (editing) {
        updateData(postId, 'ID', 'posts', 'text', text)
    }
    res.render("viewPost", {name: name, postId: postId, text: text, prisonNumber: prisonNumber, comment: comment, date: date, alert: alert })
})
    
app.post("/view/comment", checkAdminRole, (req, res) => {
    let { name, postId, comment, prisonNumber, date, text } = req.body
    updateData(postId, 'ID', 'posts', 'comment', comment)
    .then(function() {
    res.render("viewComment", { name: name, prisonNumber: prisonNumber, text: text, date: date, postId: postId, comment: comment })
    })
})
      
app.post("/delete/post", async(req, res) => {
    let id = req.body.postId
    deleteData(id, 'posts') 
    })

app.post("/delete/review", checkAdminRole, async(req, res) => {
    let id = req.body.reviewId
    deleteData(id, 'reviews')
    })

app.post("/delete/comment", checkAdminRole, async(req, res) => {
    let id = req.body.postId
    updateData(id, 'ID', 'posts', 'comment', '')
    })

app.post("/report/:prisonNumber", checkAdminRole, (req, res) => {
 let prisonNumber = req.params.prisonNumber;
 let {name, curriculumCompleted, softskillsCompleted, postsTotal, reviewsTotal} = req.body
 Promise.all([
    getData(prisonNumber, 'posts'),
    getData(prisonNumber, 'reviews'),
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

app.delete("/delete/request", (req,res) => {
    let id = req.body.id
    deleteData(id, 'requests')
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
        getUser(prisonNumber).then(function(results) {
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
        })
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
    let log = generateRequestLog(name, prisonNumber, type, module, targetDate);
    insertIntoRequests(prisonNumber, log, type, module, currentDate, targetDate);
}

function sendAutomatedRequestReply(prisonNumber, decline, module, type) {      
    let dialogId = generateDialogId(prisonNumber);
    let dateTime = new Date().toLocaleString();
    let text = generateAutomatedReply(decline, type, module);
    insertIntoMessages(dialogId, 'Admin', text, dateTime)
        }

function generateAutomatedReply(decline, type, module) {
    decline !== "true" ? 
        text = `Automated message: your request to ${type} module ${module} has been approved.`
        :
        text = `Automated message: your request to ${type} module ${module} has not been approved. Please speak to your tutor about this.`
    return text
    }

function generateRequestLog(name, prisonNumber, type, module, targetDate) {
    targetDate ? 
    log = `User ${name} (${prisonNumber}) requested to ${type} module ${module}. Target date: ${targetDate}` 
    :
    log = `User ${name} (${prisonNumber}) requested to ${type} module ${module}`
    return log
}

function generateDialogId(prisonNumber) {
    return [prisonNumber, process.env.ADMIN_PRISON_NUMBER].sort().join("-").toString();
}

function createDateTime() {
   return new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
}

function checkTermsAndConditions(req, res, next) {
    let prisonNumber = req.user.prison_number;
   getUser(prisonNumber).then(function(result) {
       if (result.rows[0].terms === "signed") {
           next();
       } else {
           res.redirect('/terms')
       }
   })
  
     }

function getUser(prisonNumber) {
    return new Promise(function(res) {
        res(pool.query(`SELECT * FROM users WHERE prison_number = $1`, [prisonNumber]))
    })
}

function getAllFromTable(table) {
    return new Promise(function(res) {
        res(pool.query(`SELECT * FROM ${table}`))
    })
}

function getData(prisonNumber, table) {
    return new Promise(function(res) {
        res(pool.query(`SELECT * FROM ${table} WHERE prison_number = '${prisonNumber}'`))
    })
}

function getMessages(dialogId) {
    return new Promise(function(res) {
    res(pool.query(`SELECT * FROM messages WHERE id = '${dialogId}'`))
    })
}

function updateData(id, idType, table, column, data) {
    return new Promise(function(res) {
        res(pool.query(`UPDATE ${table} SET ${column} = '${data}' WHERE ${idType} = '${id}'`))
    })
}

function updateIlp(id, column, data) {
    return new Promise(function(res, rej) {
        res(pool.query(`UPDATE ilp SET ${column} = '${JSON.stringify(data)}' WHERE prison_number = '${id}'`))
    })
}

function deleteData(id, table, module=null) {
    return new Promise(function() {
        module ? 
        pool.query(`DELETE FROM ${table} WHERE prison_number = '${id}' AND module = '${module}'`)
        :
        pool.query(`DELETE FROM ${table} WHERE id = '${id}'`)
    })
}

function insertIntoRequests(prisonNumber, log, type, module, currentDate, targetDate) {
    type == "update" ?
    pool.query(`INSERT INTO requests (prison_number, log, type, module, date, target_date) 
    VALUES ($1, $2, $3, $4, $5, $6)`, [prisonNumber, log, type, module, currentDate, targetDate]) 
    :
    pool.query(`INSERT INTO requests (prison_number, log, type, module, date) 
    VALUES ($1, $2, $3, $4, $5)`, [prisonNumber, log, type, module, currentDate]) 
}

function insertIntoMessages(dialogId, name, text, dateTime) {
    pool.query(`INSERT INTO messages (id, author, message, datetime)
    VALUES ($1, $2, $3, $4)`, [dialogId, name, text, dateTime])
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
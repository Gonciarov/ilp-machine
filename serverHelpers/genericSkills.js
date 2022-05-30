
const { pool } = require("../dbConfig");

function seed(prisonNumber) {
    pool.query("INSERT INTO targets (prison_number, htmlcss, jsbasics, reactjs) VALUES ($1, $2, $3, $4)", [
        prisonNumber,
        {"I know what a browser is":"false","I know what to do if I get stuck":"false","I know what coding is":"false","I know what HTML is":"false",
"I know how to use HTML tags":"false","I know how to build a static web page with HTML":"false","I know what Naming Conventions are":"false",
"I know what Code Indentation is":"false","I know how to apply CSS to my static page":"false",
"I know what Selectors, Properties, and Values are in HTML":"false","I know how to apply colours in CSS":"false",
"I know how to use font-family, font-size, font-weight and font-style":"false","I know how to use text-decoration, text-transform, and text-spacing in CSS":"false",
"I know concepts of Margins and Padding":"false","I know how Box Model works in CSS":"false","I know how Border works in CSS":"false",
"I know concepts of Float and Position in CSS":"false","I know what Z-Index is":"false","I know how tables work in HTML":"false",
"I know how Links work in HTML":"false","I know how to display an image on a web page":"false","I know how to create a button in HTML":"false",
"I know how forms work in HTML":"false","I know how to create ordered and unordered lists in HTML":"false",
"I know how to use code editor (Sublime, VSCode, etc)":"false","I know how to use developer tools (Console) in browser":"false",
"I know how to style any static web page with CSS":"false"},
{"I know how to comment out a line of code":"false","I know how to create Variable":"false",
"I know how to assign Value to Variables":"false","I know how to assign Value of one Varible to Another":"false",
"I know how to declare String variables":"false","I know what is Case Sensitivity in JS":"false","I know the difference between var, let, and const":"false",
"I know how to add, subtract, multiply, divide, increment, and decrement numbers":"false","I know what Plus Equal operator means":"false",
"I know how to concatenate strings":"false","I know how to find a length of the string":"false",
"I know how to find the Nth letter of the word using brackets":"false","I know what Array is in JS":"false",
"I know how to access Array data with Indexes":"false","I know how to use push, pop, shift, and unshift methods":"false",
"I know how to create a function in JS":"false","I know how to pass values to Functions with Arguments":"false","I know how Return works in Functions":"false",
"I know the difference between Local and Global Scope":"false","I know what is Undefined Value":"false","I know what is True and False in JS":"false",
"I know how to create an If-Else statement":"false","I know the meaning of Equality and Inequality operators":"false",
"I know the meaning of Strict Equality and Strict Inequality operators":"false","I know what <= and >= mean in JS":"false",
"I know how to use else if statement":"false","I know how to use Switch statement":"false","I know what Object is in JS":"false",
"I know how to access a value from Object key and value pair":"false","I know how to operate nested Arrays":"false",
"I know how to operate nested Objects":"false","I know how to create a For loop":"false","I know how to use Nested For loops":"false",
"I know replace For Loop with recursion":"false","I know how to use ParseInt and toString":"false",
"I know how to replace if-else expression with conditional operator":"false"},
 {"Some provisional target for React":"false"}
    ])

pool.query("INSERT INTO softskills (prison_number, softskills) VALUES ($1, $2)", [
    prisonNumber,
    {"I communicate to the fellow learners and tutors in a good manner": "false","I can ask my tutors and fellow students for help if I stuck": "false",
    "I help fellow learners if they stuck": "false","I can work in a team with anyone in classroom": "false",
    "I can organize my workspace and keep it tidy": "false",
    "I can plan my work a week, a day, or a session ahead": "false","My general appearance is ok": "false",
    "I do not skip sessions without proper reason": "false",
    "I treat everyone in classroom with respect":"false","I can actively listen to what others say":"false",
    "I can understand the feelings of somebody in anger or irritated": "false","I can deliver clear messages to others": "false",
    "I can clearly explain complex ideas I understand myself": "false","I can present in front of public": "false",
    "I can support other people emotionally": "false","I can inspire others": "false","I can comply with classroom rules":"false",
    "I do what I promise whenever possible":"false","I can politely disagree with someone if I feel I need to do so":"false",
    "I can think creatively":"false"}
]);
};

module.exports = {seed}




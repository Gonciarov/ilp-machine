<b>What is it about</b>

This is a browser application aimed to store Code4000 learners' weekly reflections, progression path, tutors' notes and project reviews. Used on internal Code4000 server and be accessible from all classroom computers. Does not have mobile version, as not needed in prison environment.

<b>Functionalities available:</b>

- all users (students, admin) can login and logout into the system;
- students can create, edit, and delete reflections ('posts');
- students can tick their learnt tech and soft skills out and see percentage of curriculum completed;
- admin can create, edit, and delete comments on each post ('comments');
- admin can create, edit, and delete project reviews ('reviews');
- admin can see students general info in one place and generate reports in PDF;
- all users can share messages in chat;


<b>Tech used</b>

- Node Express with EJS views;
- Postgres;

The idea is to replace provisional ejs views with proper frontend on React;


<b>To install:</b>

Upload the app to the server;

Create .env file in the root of the app with following values:

- DB_USER=`your db user name` 
- DB_PASSWORD=`your password`
- DB_HOST=`your host`
- DB_PORT=`your port`
- DB_DATABASE=code4000
- ADMIN_PRISON_NUMBER=`your admin prison number`

Open file sqlCommands.json and run all the commands from there;

create account for admin, add admin prison number to .env;

Run 'node server.js' and see the thing at `your host`:`your port`;

Click 'login' and create one or more students'accounts.


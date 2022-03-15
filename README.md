<b>What is it about</b>

This is a browser application aimed to store Code4000 learners' weekly reflections, progression path, tutors' notes and project reviews. To be placed on internal Code4000 server and be accessible from all classroom computers.

<b>Functionalities available:</b>

- all users ('students', 'admin') can login and logout into the system;
- students can create, edit, and delete reflections ('posts');
- admin can create, edit, and delete comments on each post ('comments');
- admin can create, edit, and delete project reviews ('reviews');

<b>Tech</b>

- NodeJS
- Postgres
- Express

<b>To install:</b>

- Upload the app to the server;

- Create .env file in the root of the app with following values:

- DB_USER=`your db user name` 
- DB_PASSWORD=`your password`
- DB_HOST=`your host`
- DB_PORT=`your port`
- DB_DATABASE=code4000
- ADMIN_PRISON_NUMBER=`your admin prison number`

- Create Postgres database Code4000, create tables (see commands in sqlCommands.json)

- create account for admin, add admin prison number to .env

- Run 'node server.js' and see the thing at `your host`:`your port`

- Click 'login' and create one or more students'accounts

- populate database tables with data (see commands in sqlCommands.json))


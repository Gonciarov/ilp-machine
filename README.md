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

- Create Postgres database Code4000 with three tables in it:

CREATE TABLE projects (
id serial PRIMARY KEY,
prison_number VARCHAR (10) NOT NULL,
title VARCHAR (30) NOT NULL,
review  VARCHAR (2000) NOT NULL,
date  VARCHAR (20) NOT NULL);

CREATE TABLE users (
id serial PRIMARY KEY,
prison_number VARCHAR (10) NOT NULL,
name VARCHAR (30) NOT NULL,
password VARCHAR(600) NOT NULL,
UNIQUE(prison_number));

CREATE TABLE posts (
id serial PRIMARY KEY,
prison_number VARCHAR (10) NOT NULL,
text VARCHAR (2000) NOT NULL,
comment VARCHAR(2000),
date  VARCHAR (20) NOT NULL));

- Create .env file in the root of the app with following values:

DB_USER=`your db user name` 
DB_PASSWORD=`your password`
DB_HOST=`your host`
DB_PORT=`your port`
DB_DATABASE=code4000
ADMIN_PRISON_NUMBER=`your admin prison number`

- Run 'node server.js' and see the thing at `your host`:`your port`


# Chat Application Backend

<p align="center">
  <a href="https://prismalens.vercel.app" target="blank"><img src="https://prismalens.vercel.app/header/logo-white.svg" width="200" alt="Prisma Logo" /></a>
  <a href="https://www.mongodb.com/" target="blank"><img src="https://webimages.mongodb.com/_com_assets/cms/kuyjf3vea2hg34taa-horizontal_default_slate_blue.svg" width="200" alt="MongoDB Logo" /></a>
</p>

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
  <a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
  <a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
  <a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
  <a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
  <a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>

## Description

This is the backend for a chat application built with [Nest.js](https://nestjs.com/), [MongoDB](https://www.mongodb.com/), and [Prisma](https://prisma.io). It provides robust features for real-time group chatting with Socket.io and web push notifications.

### Features

- **Group Chatting**: Supports both public channels and private groups.
- **Real-Time Communication**: Utilizes Socket.io for live message updates.
- **Push Notifications**: Implemented with web push for notifying users even when the app is closed or in kill mode.

## Installation

### Prerequisites

- **Node.js**: JavaScript runtime for server-side code.
- **Nest.js**: Framework for building efficient, scalable Node.js server-side applications.
- **MongoDB**: NoSQL database used to store data.
- **Prisma**: ORM (Object-Relational Mapping) for database access and management.
- **Socket.io**: Library for real-time communication.
- **Web Push**: Technology for sending push notifications to users.
- **Swagger Documentation**: Api Documentation.


### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/shkwahab/chatappbackendnestjs.git
   cd chatappbackendnestjs
   ```
2. Install the dependency if you dont have pnpm package manage than follow this setup:

    ```bash
    npm i -g pnpm
    pnpm i
    ```   
   Otherwsie:
   ```bash
   pnpm i
   ```
3. Create an .env file in the root directory with the following content and replace the keys according to your requirements:
```bash

DATABASE_URL            =     "mongodb://localhost:27017/chatapp"
ACCESS_SECRET_KEY       =     "JDzIBEsLl9PZOdYp4eQa/IPTgwNVfA2ts2+0lw6Whpc="
REFRESH_SECRET_KEY      =     "pJEZpMM6xdInYhLk28qL5N9Pob37tsdP7ohQQ4qqb5A="
WEB_PUSH_PUBLIC_KEY     =     "BFhz7f5ZMJes9tsqQhNQ4W8GyGhhoVxigttI5nlk1whWBBDBo5PXSNvPYaxVawRJnUTm9Rmt14Z4FPCigpFSP-0"
WEB_PUSH_PRIVATE_KEY    =     "3mvz9AabmvZ3xqxcVGq9Y4isavxiUMm5nmzFhVSoBm0"
WEB_PUSH_MAIL           =     "yourname@emailprovider.com"
APP_ICON                =     "https://myapp.com/logo.svg"
SITE_URL                =     "https://myapp.com"   
CLOUDINARY_CLOUD_NAME        =     "<YOUR_CLOUD_NAME>"
CLOUDINARY_API_KEY           =     "<YOUR_API_KEY>"
CLOUDINARY_API_SECRET        =     "<YOUR_API_SECRET>"
```

4. Set up MongoDB replica set (default port is 27017). 


5. Start the application:

Dev Environment:

```bash
pnpm start:dev
```

Production Environment:

```bash
pnpm start
```


## Swagger API Documentation

Run the server visit: [localhost:8000/api-docs](http://localhost:8000/api-docs/)

### Notifications

- **Subscribe**: Adds a new subscriber to the notification system.
- **Send Notification**: Sends a push notification to all subscribers.

### Group Chatting

- **Public Channels**: Channels where anyone can join and chat.
- **Private Groups**: Groups where only authorized members can join.

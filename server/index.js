const PORT = process.env.PORT || 8000;
const express = require('express')
const {MongoClient} = require('mongodb')
const jwt = require('jsonwebtoken')
const http = require('http');
const { Server } = require('socket.io');
const path = require('path')
require('dotenv').config()
const SpotifyWebApi = require('spotify-web-api-node');
const AuthMiddleware = require("./AuthMiddleware.js")

const { InMemorySessionStore } = require("./sessionStore");
const sessionStore = new InMemorySessionStore();

const uri = process.env.MONGO_URI
const app = express();
app.use(express.json());
app.use(require('cors')());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://fusic-app.herokuapp.com/",
        methods: ["GET", "POST"]
    }
});

io.on('connection', client => {
    client.on('join', ({userId}) => {
        sessionStore.saveSession(userId, client.id);
    })

    client.on('newMessage', async ({message, userId, clickedUserId}) => {
        if(sessionStore.contains(clickedUserId)) {
            io.sockets.to(sessionStore.findSession(clickedUserId))
            .emit('message', {message, user: userId});
        } else {
            const client = new MongoClient(uri);
            await client.connect()
            const database = client.db('app-data')
            const users = database.collection('users')
            await users.updateOne({user_id: clickedUserId}, { $addToSet: { new_messages: userId } })
        }
    });

    client.on('leave', ({userId}) => {
        sessionStore.delete(userId);
    })
})

app.post("/authenticate", async (req, res) => {
    const client = new MongoClient(uri);

    const { email, id, artists, tracks, picture } = req.body;

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const existingUser = await users.findOne({email});

        const token = jwt.sign({user_id: id}, process.env.JWT_SECRET, {
            expiresIn: 60 * 24 * 60
        });

        if(!existingUser) {
            const data = {
                user_id: id,
                email: email,
                onboarded: false,
                artists,
                tracks,
                picture,
                new_messages: []
            }
    
            await users.insertOne(data);

            res.status(201).json({token, userId: id});
        } else {
            await users.updateOne({email}, { $set: { artists: artists, tracks: tracks, picture: picture } })

            res.status(201).json({token, userId: existingUser.user_id, onboarded: existingUser.onboarded, existingUser: existingUser})
        }
    } catch (err) {
        res.status(400).json('Invalid Credentials');
    }
})

app.post("/spotify", (req, res) => {
    const { code } = req.body

    const spotifyApi = new SpotifyWebApi({
        redirectUri: process.env.REDIRECT_URI,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
    })

    const tokens = {
        accessToken: null,
        refreshToken : null,
        expiresIn : -1
    };
    
    spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
        tokens.accessToken = data.body.access_token;
        tokens.refreshToken = data.body.refresh_token;
        tokens.expiresIn = data.body.expires_in;
        res.send(tokens);
    })
    .catch(err => {
        res.send('Error Authenticating With Spotify')
    })
})

app.post("/refresh", (req, res) => {
    const refreshToken = req.body.refreshToken
    const spotifyApi = new SpotifyWebApi({
      redirectUri: process.env.REDIRECT_URI,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken,
    })
  
    spotifyApi
      .refreshAccessToken()
      .then(data => {
        res.json({
          accessToken: data.body.accessToken,
          expiresIn: data.body.expiresIn,
        })
      })
      .catch(err => {
        console.log(err)
        res.sendStatus(400)
       })
})

// Update User with a match
app.put('/addmatch', AuthMiddleware, async (req, res) => {
    const client = new MongoClient(uri)
    const {userId, matchedUserId} = req.body

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const query = {user_id: userId}
        const updateDocument = {
            $push: {matches: {user_id: matchedUserId}}
        }
        await users.updateOne(query, updateDocument)
        const match = await users.findOne({user_id: matchedUserId})
        console.log(match);
        res.send(match.matches.filter(e => e.user_id === userId).length > 0)
    } finally {
        await client.close()
    }
})

// Get individual user
app.get('/user', AuthMiddleware, async (req, res) => {
    const client = new MongoClient(uri)
    const userId = req.query.userId

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const query = {user_id: userId}
        const user = await users.findOne(query)
        res.send(user)

    } finally {
        await client.close()
    }
})

app.put('/update-new-message', async (req,res) => {
    const client = new MongoClient(uri)
    const {userId, matchId} = req.body.data;

    console.log(userId, matchId);

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const query = {
            'user_id': userId
        }

        await users.updateOne(query, {$pull: {new_messages: matchId}});

        res.sendStatus(200);
    } finally {
        await client.close()
    }
})

// Get all Users by userIds in the Database
app.get('/users', AuthMiddleware, async (req, res) => {
    const client = new MongoClient(uri)
    const userIds = JSON.parse(req.query.userIds)
    const userId = req.query.userId

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const query = {
            'user_id': {
                '$in': userIds
            }
        }

        const foundUsers = await users.find(query).toArray();
        const user = await users.findOne({user_id: userId});

        res.json({foundUsers: foundUsers.filter((user) => user.matches.find(match => match.user_id === userId)), user: user});
    } finally {
        await client.close()
    }
})

// Get all the Matching Genre Users in the Database
app.get('/same-genre-users', AuthMiddleware, async (req, res) => {
    const client = new MongoClient(uri)
    const genres = req.query.genres
    const matches = JSON.parse(req.query.matches)
    const userId = req.query.userId;

    try {
        await client.connect();
        const database = client.db('app-data');
        const users = database.collection('users');

        const query = {
            $and: [
                {
                    user_id: { $ne: userId }
                },
                {
                    user_id: { $nin: matches.map(e=>e.user_id) }
                },
                {
                    genres: { $elemMatch: { $in: genres } }
                }
            ]
        }

        let allUsers = await users.find(query).toArray();
        
        res.json(allUsers);
    } finally {
        await client.close()
    }
})

// Update a User in the Database
app.put('/user', AuthMiddleware, async (req, res) => {
    const client = new MongoClient(uri)
    const formData = req.body.formData
    const genres = req.body.genres

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const query = {user_id: formData.user_id}

        const updateDocument = {
            $set: {
                first_name: formData.first_name,
                dob_day: formData.dob_day,
                dob_month: formData.dob_month,
                dob_year: formData.dob_year,
                genres: genres,
                about: formData.about,
                matches: formData.matches,
                onboarded: true,
            },
        }
        const updatedUser = await users.findOneAndUpdate(query, updateDocument, {returnDocument: "after"});
        res.status(200).send(updatedUser);
    } finally {
        await client.close()
    }
})

// Get Messages by from_userId and to_userId
app.get('/messages', AuthMiddleware, async (req, res) => {
    const {userId, correspondingUserId} = req.query
    const client = new MongoClient(uri)

    try {
        await client.connect()
        const database = client.db('app-data')
        const messages = database.collection('messages')

        const query = {
            from_userId: userId, to_userId: correspondingUserId
        }
        const foundMessages = await messages.find(query).toArray()
        res.send(foundMessages)
    } finally {
        await client.close()
    }
})

// Add a Message to our Database
app.post('/message', async (req, res) => {
    const client = new MongoClient(uri)
    const message = req.body.message

    try {
        await client.connect()
        const database = client.db('app-data')
        const messages = database.collection('messages')

        const insertedMessage = await messages.insertOne(message)
        res.send(insertedMessage)
    } finally {
        await client.close()
    }
})

app.delete("/delete", AuthMiddleware, async (req, res) => {
    const client = new MongoClient(uri)
    const userId = req.body.userId;

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')
        const messages = database.collection('messages')

        const query = {user_id: userId}
        const user = await users.findOne(query)

        const matchesLength = user.matches.length;

        for(let match = 0; match < matchesLength; match++) {
            let matchId = user.matches[match].user_id

            await messages.deleteMany({
                from_userId: userId, to_userId: matchId
            });

            await messages.deleteMany({
                from_userId: matchId, to_userId: userId
            });

            const query = {user_id: matchId}

            const updateDocument = {
                $pull: {matches: {user_id: userId}},
                $pull: {new_messages: userId}
            }

            await users.updateOne(query, updateDocument)
        }

        await users.deleteOne({user_id: userId});

        res.sendStatus(201)
    } finally {
        await client.close()
    }
})

//-------------------DEPLOYMENT----------------//
// ORDER MATTERS! THIS MUST BE BELOW ALL ROUTES ABOVE
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "/client/build")));
  
    app.get("*", (req, res) =>
      res.sendFile(path.resolve(__dirname, "client", "build", "index.html"))
    );
} else {
    app.get("/", (req, res) => {
      res.send("API is running...");
    });
}

server.listen(PORT, () => {
    console.log('server running on PORT ' + PORT)
})

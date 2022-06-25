const PORT = process.env.PORT || 8000;
const express = require('express')
const {MongoClient} = require('mongodb')
const jwt = require('jsonwebtoken')
const http = require('http');
const { Server } = require('socket.io');
const path = require('path')
require('dotenv').config()
const SpotifyWebApi = require('spotify-web-api-node');

const uri = process.env.MONGO_URI
const app = express();
app.use(express.json());
app.use(require('cors')());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', client => {
    client.on('joinChat', ({userId, clickedUserId}) => {
        let room1 = userId + clickedUserId;
        let room2 = clickedUserId + userId;
        let clients1 = numberOfClients(room1);
        let clients2 = numberOfClients(room2);

        if(clients1 == 0 && clients2 == 0) {
            client.join(room1);
            client.emit('roomName', room1);
        } else if(clients1 > 0) {
            client.join(room1);
            client.emit('roomName', room1);
        } else {
            client.join(room2);
            client.emit('roomName', room2);
        }
    });

    client.on('newMessage', ({chatName, message, userId}) => {
        io.sockets.in(chatName)
            .emit('message', {message, user: userId});
    });

    function numberOfClients(roomName) {
        let room = io.sockets.adapter.rooms.get(roomName);
        
        if(room) {
            return room.size;
        }

        return 0;
    }
})

app.post("/authenticate", async (req, res) => {
    const client = new MongoClient(uri);

    const { email, id, artists, tracks } = req.body;

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const existingUser = await users.findOne({email});

        const token = jwt.sign({user_id: id}, process.env.JWT_SECRET, {
            expiresIn: 60 * 24
        });

        if(!existingUser) {
            const data = {
                user_id: id,
                email: email,
                onboarded: false,
                artists,
                tracks,
            }
    
            await users.insertOne(data);

            res.status(201).json({token, userId: id, exists: false});
        } else {
            await users.updateOne({email}, { $set: { artists: artists, tracks: tracks } })

            res.status(201).json({token, userId: existingUser.user_id, exists: true, onboarded: existingUser.onboarded})
        }
    } catch (err) {
        res.status(400).json('Invalid Credentials');
    }
})

app.get("/verify", (req, res) => {
    const { authorization } = req.headers

    if (!authorization) {
        // Status code 401 means unauthorized
        return res.status(401).json({verified: false})
    } else {
        // authorization looks like "Bearer {token}"
        const token = authorization.replace("Bearer ", "")

        jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
            if (err) {
                console.log(err)
                return res.status(401).json({verified: false})
            } else {
                return res.status(201).json({verified: true})
            }
        })
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
        console.log(err);
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

// Get individual user
app.get('/user', async (req, res) => {
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

// Update User with a match
app.put('/addmatch', async (req, res) => {
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
        const user = await users.updateOne(query, updateDocument)
        res.send(user)
    } finally {
        await client.close()
    }
})

// Get all Users by userIds in the Database
app.get('/users', async (req, res) => {
    const client = new MongoClient(uri)
    const userIds = JSON.parse(req.query.userIds)

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')

        const pipeline =
            [
                {
                    '$match': {
                        'user_id': {
                            '$in': userIds
                        }
                    }
                }
            ]

        const foundUsers = await users.aggregate(pipeline).toArray()

        res.json(foundUsers)

    } finally {
        await client.close()
    }
})

// Get all the Matching Genre Users in the Database
app.get('/same-genre-users', async (req, res) => {
    const client = new MongoClient(uri)
    const genres = req.query.genres

    try {
        await client.connect()
        const database = client.db('app-data')
        const users = database.collection('users')
        let allUsers = await users.find({}).toArray();
        let allMatchingUsers = [];
        
        for(let i = 0; i < allUsers.length; i++) {
            if(allUsers[i].onboarded) {
                let userGenres = allUsers[i].genres;
                for(let j = 0; j < userGenres.length; j++) {
                    if(genres.includes(userGenres[j])) {
                        allMatchingUsers.push(allUsers[i]);
                        break;
                    }
                }
            }
        }
        
        res.json(allMatchingUsers);
    } finally {
        await client.close()
    }
})

// Update a User in the Database
app.put('/user', async (req, res) => {
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
                url: formData.url,
                about: formData.about,
                matches: formData.matches,
                onboarded: true,
            },
        }

        const insertedUser = await users.updateOne(query, updateDocument)

        res.json(insertedUser)

    } finally {
        await client.close()
    }
})

// Get Messages by from_userId and to_userId
app.get('/messages', async (req, res) => {
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

import dotenv from 'dotenv'
import express from 'express'
import http from 'http'
import WebSocket from 'ws'
import passport from 'passport'
import session from 'express-session'
import axios from 'axios'
import { OAuth2Strategy } from 'passport-oauth';
import { v4 as uuid, validate as validateUUID } from 'uuid'

// Gets environment variables from .env file if it exists
dotenv.config();

const DEFAULT_PROTOCOL = 'http';
const PROTOCOL = process.env.PROTOCOL || DEFAULT_PROTOCOL;

const DEFAULT_PORT = 3001;
const PORT = parseInt(process.env.PORT || DEFAULT_PORT);

const DEFAULT_RETURN_HOST = `localhost:${PORT}`;
const RETURN_HOST = process.env.RETURN_HOST || DEFAULT_RETURN_HOST;

// Get your Twitch app's client ID & secret from environment variables,
// these can also be set in an .env file
// You can obtain your client ID & secret at https://dev.twitch.tv/console/apps
const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET
} = process.env;

const AUTH_SCOPE = ['user:read:email'];

const
  socketConnections = new Map(),
  usersStore = new Map();

const twitchStrategy = new OAuth2Strategy(
  {
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: TWITCH_CLIENT_ID,
    clientSecret: TWITCH_CLIENT_SECRET,
    callbackURL: `${PROTOCOL}://${RETURN_HOST}/auth/twitch/return`,
    state: true
  },
  (accessToken, refreshToken, profile, done) => {
    done(null, {
      ...profile,
      twitchAccessToken: accessToken,
      twitchRefreshToken: refreshToken
    });
  }
);

async function getUserByToken(accessToken) {
  const options = {
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Accept': 'application/vnd.twitchtv.v5+json',
      'Authorization': `Bearer ${accessToken}`
    }
  };

  const response = await axios.get('https://api.twitch.tv/helix/users', options);

  if (response.status === 200 && response.data?.data && response.data.data[0]) {
    return response.data.data[0];
  } else {
    return null;
  }
}

// Override passport profile function to get user profile from Twitch API
OAuth2Strategy.prototype.userProfile = async function(accessToken, done) {
  const twitchUser = await getUserByToken(accessToken);

  done(null, { twitchUser });
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((userSerialized, done) => {
  done(null, userSerialized);
});

passport.use('twitch', twitchStrategy);

const sessionParser = session({
  secret: 'twitch ow login',
  name: 'sid',
  resave: false,
  saveUninitialized: false
});

const
  app = express(),
  server = http.createServer(app),
  wss = new WebSocket.Server({ clientTracking: false, server })

app.use(sessionParser);

// Initialize Passport! Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

// Format JSON output in a nice way
app.set('json spaces', 2);

app.get('/', (req, res) => res.send(''));

// Gets Twitch User
app.get(
  '/get-user',
  async (req, res) => {
    const sessionId = req.query?.sessionId;

    if (!sessionId) {
      res.sendStatus(401);
      return;
    }

    if (!usersStore.has(sessionId)) {
      res.sendStatus(404);
      return;
    }

    const user = usersStore.get(sessionId);

    const userInfo = await getUserByToken(user.twitchAccessToken)

    if (userInfo) {
      res.json(userInfo);
    } else {
      res.sendStatus(404);
    }
  }
);

// Gets Twitch Channel
app.get(
  '/get-channel',
  async (req, res) => {
    const sessionId = req.query?.sessionId;

    if (!sessionId) {
      res.sendStatus(401);
      return;
    }

    if (!usersStore.has(sessionId)) {
      res.sendStatus(404);
      return;
    }

    const user = usersStore.get(sessionId);

    const options = {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Authorization': `Bearer ${user.twitchAccessToken}`
      }
    };

    const response = await axios.get(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${user.twitchUser.id}`,
      options
    );

    if (response.status === 200 && response.data?.data && response.data.data[0]) {
      res.json(response.data.data[0]);
    } else {
      res.sendStatus(404);
    }
  }
);

// Log out
app.get('/logout', (req, res) => {
  req.logout();

  const sessionId = req.query?.sessionId;

  if (sessionId) {
    socketConnections.delete(sessionId);
    usersStore.delete(sessionId);
  }

  res.redirect('/');
});

// Use passport.authenticate() as route middleware to authenticate the
// request. The first step in Twitch authentication will involve redirecting
// the user to twitch.com.  After authenticating, Twitch will redirect the
// user back to this application at /auth/steam/return
app.get(
  '/auth/twitch',
  (req, res, next) => {
    if (
      req.query?.sessionId &&
      validateUUID(req.query?.sessionId) &&
      socketConnections.has(req.query?.sessionId)
    ) {
      req.session.sessionId = req.query.sessionId;
      next();
    } else {
      res.sendStatus(401);
    }
  },
  passport.authenticate('twitch', {
    scope: AUTH_SCOPE,
    failureRedirect: '/'
  }),
  (req, res) => res.redirect('/')
);

// GET /auth/steam/return
// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page.  Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
app.get(
  '/auth/twitch/return',
  (req, res, next) => {
    if (
      req.session?.sessionId &&
      validateUUID(req.session?.sessionId) &&
      socketConnections.has(req.session?.sessionId)
    ) {
      next();
    } else {
      res.sendStatus(401);
    }
  },
  passport.authenticate('twitch', { failureRedirect: '/' }),
  (req, res) => {
    if (!req.isAuthenticated()) {
      res.sendStatus(401);
      return;
    }

    const ws = socketConnections.get(req.session.sessionId);

    if (!ws) {
      res.sendStatus(401);
      return;
    }

    usersStore.set(req.session.sessionId, req.user);

    ws.send(JSON.stringify({
      messageType: 'login',
      user: req.user.twitchUser
    }));

    res.redirect('/auth/success');

    ws.close();
  }
);

app.get(
  '/auth/success',
  (req, res) => {
    res.send(`Logged in successfully, see message in Overwolf app's console`);
  }
);

wss.on('connection', (ws, req) => {
  const sessionId = uuid();

  console.log(`Websocket client ${sessionId} connected`);

  ws.send(JSON.stringify({
    messageType: 'sessionId',
    sessionId
  }));

  socketConnections.set(sessionId, ws);

  // ws.on('message', message => {
  //   console.log(`message from client ${sessionId}:`, message);
  // });

  ws.on('close', () => {
    console.log(`websocket client ${sessionId} disconnected`);
    socketConnections.delete(sessionId);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${server.address().port}`);
});

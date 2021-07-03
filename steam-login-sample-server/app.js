import dotenv from 'dotenv'
import express from 'express'
import http from 'http'
import WebSocket from 'ws'
import passport from 'passport'
import session from 'express-session'
import SteamStrategy from 'passport-steam'
import { v4 as uuid, validate as validateUUID } from 'uuid'

// Gets environment variables from .env file if it exists
dotenv.config();

const
  PROTOCOL = process.env.PROTOCOL || 'http',
  PORT = parseInt(process.env.PORT || 3000),
  RETURN_HOST = process.env.RETURN_HOST || `localhost:${PORT}`,
  SUBDIR = process.env.SUBDIR || '/steam';

// Get the Steam API key from environment variables,
// these can also be set in .env file
// You can get your own Steam API key at https://steamcommunity.com/dev/apikey
const STEAM_API_KEY = process.env.STEAM_API_KEY;

const
  socketConnections = new Map(),
  usersStore = new Map();

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((userSerialized, done) => {
  done(null, userSerialized);
});

// Strategies in passport require a `validate` function, which accept
// credentials (in this case, an OpenID identifier and profile), and invoke a
// callback with a user object.
const strategy = new SteamStrategy(
  {
    returnURL: `${PROTOCOL}://${RETURN_HOST}${SUBDIR}/auth/return`,
    realm: `${PROTOCOL}://${RETURN_HOST}/`,
    apiKey: STEAM_API_KEY,
    profile: false
  },
  (identifier, profile, done) => {
    process.nextTick(() => {
      const
        steamIdRegex = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/,
        steamId = steamIdRegex.exec(identifier)[1];

      done(null, { ...profile, steamId });
    });
  }
);

passport.use(strategy);

const sessionParser = session({
  secret: 'lorem ipsum',
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

app.get(
  `${SUBDIR}/get-user`,
  (req, res) => {
    const sessionId = req.query?.sessionId;

    if (sessionId) {
      if (usersStore.has(req.query.sessionId)) {
        res.json({ steamID: usersStore.get(req.query.sessionId) });
      } else {
        res.sendStatus(404);
      }
    } else {
      res.sendStatus(401);
    }
  }
);

app.get(`${SUBDIR}/logout`, (req, res) => {
  req.logout();

  const sessionId = req.query?.sessionId;

  if (sessionId) {
    socketConnections.delete(sessionId);
    usersStore.delete(sessionId);
  }

  res.redirect('/');
});

// Use passport.authenticate() as route middleware to authenticate the
// request.  The first step in Steam authentication will involve redirecting
// the user to steamcommunity.com.  After authenticating, Steam will redirect the
// user back to this application at /auth/steam/return
app.get(
  `${SUBDIR}/auth/`,
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
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => res.redirect('/')
);

// Use passport.authenticate() as route middleware to authenticate the
// request.  If authentication fails, the user will be redirected back to the
// login page.  Otherwise, the primary route function function will be called,
// which, in this example, will redirect the user to the home page.
app.get(
  `${SUBDIR}/auth/return`,
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
  passport.authenticate('steam', { failureRedirect: '/' }),
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

    usersStore.set(req.session.sessionId, req.user.steamId);

    ws.send(JSON.stringify({
      messageType: 'login',
      user: req.user.steamId
    }));

    res.redirect(`${SUBDIR}/auth/success`);

    ws.close();
  }
);

app.get(
  `${SUBDIR}/auth/success`,
  (req, res) => {
    res.send(`logged in successfully, see message in Overwolf app's console`);
  }
);

wss.on('connection', (ws, req) => {
  const sessionId = uuid();

  console.log(`websocket client ${sessionId} connected`);

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

function startServer() {
  server.listen(PORT, () => {
    console.log(`Server listening on port ${server.address().port}`);
  });
}

startServer();

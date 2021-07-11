import dotenv from 'dotenv'
import express from 'express'
import http from 'http'
import WebSocket from 'ws'
import passport from 'passport'
import session from 'express-session'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { v4 as uuid, validate as validateUUID } from 'uuid'

// Gets environment variables from .env file if it exists
dotenv.config();

const
  PROTOCOL = process.env.PROTOCOL || 'http',
  PORT = parseInt(process.env.PORT || 3002),
  RETURN_HOST = process.env.RETURN_HOST || `localhost:${PORT}`,
  SUBDIR = process.env.SUBDIR || '/google';

// Get your Google app's client ID & secret from environment variables, these
// can also be set in an .env file
// You can obtain your client ID & secret at https://console.cloud.google.com/apis/dashboard
const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
} = process.env;

const AUTH_SCOPE = ['profile'];

const
  socketConnections = new Map(),
  usersStore = new Map();

const googleStrategy = new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `${PROTOCOL}://${RETURN_HOST}${SUBDIR}/auth/return`
  },
  (accessToken, refreshToken, profile, done) => {
    done(null, {
      ...profile,
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken
    });
  }
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((userSerialized, done) => {
  done(null, userSerialized);
});

passport.use('google', googleStrategy);

const sessionParser = session({
  secret: 'google ow login',
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

// Gets Google User
app.get(
  `${SUBDIR}/get-user`,
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

    res.json(usersStore.get(sessionId));
  }
);

// Log out
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
// request. The first step in Google authentication will involve redirecting
// the user to google.com. After authenticating, Google will redirect the
// user back to this application at /auth/steam/return
app.get(
  `${SUBDIR}/auth`,
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
  passport.authenticate('google', {
    scope: AUTH_SCOPE,
    failureRedirect: '/'
  }),
  (req, res) => res.redirect('/')
);

// Use passport.authenticate() as route middleware to authenticate the
// request. If authentication fails, the user will be redirected back to the
// login page. Otherwise, the primary route function function will be called,
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
  passport.authenticate('google', { failureRedirect: '/' }),
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
      user: req.user
    }));

    res.redirect(`${SUBDIR}/auth/success`);

    ws.close();
  }
);

app.get(
  `${SUBDIR}/auth/success`,
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

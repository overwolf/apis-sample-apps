const
  PROTOCOL = 'https', // replace with 'http' when running a local server
  WS_PROTOCOL = 'wss', // replace with 'ws' when running a local server
  HOST = 'social-login-sample-server.overwolf.com', // replace with 'localhost:3000' when running a local server
  API_URL = `${PROTOCOL}://${HOST}/steam`,
  WS_URL = `${WS_PROTOCOL}://${HOST}/steam`;

let
  sessionId = null, // This token will be used to identify our client & get the SteamID
  socketConnection = null; // Websocket connection handle

async function startApp() {
  if (localStorage.sessionId) {
    sessionId = await decrypt(localStorage.sessionId);
  } else {
    sessionId = null;
  }

  window.login = login;
  window.logout = logout;
  window.getUser = getUser;
  window.openConsole = openConsole;

  overwolf.extensions.onAppLaunchTriggered.addListener(openMainWindow);
  openMainWindow();
}

// 1. First make a websocket connection to server
// 2. The server sends a Session ID token that will identify this client when it
//    makes HTTP requests
// 3. The Session ID is saved in LocalStorage in an encrypted format
// 4. Login URL is opened in the browser with the identifying Session ID token
//    sent as argument
// 5. When the user logs in in their browser the server sends a Websocket
//    message with their Steam ID. Now the user is logged in, and can make
//    authenticated requests like get-user/ (getUser() function)
async function login() {
  if (sessionId) {
    console.log('login(): please log out before logging in again');
    return;
  }

  try {
    sessionId = await connectWebsocket();
    localStorage.sessionId = await encrypt(sessionId);

    overwolf.utils.openUrlInDefaultBrowser(
      `${API_URL}/auth/?sessionId=${sessionId}`,
      { skip_in_game_notification: true }
    );
  } catch(e) {
    console.warn('login(): error:', e);
    sessionId = null;
    localStorage.removeItem('sessionId');
  }
}

// Call the logout endpoint on the server, and remove the session token in this client
async function logout() {
  if (!sessionId) {
    console.log('logout(): you are not logged in');
    return;
  }

  try {
    await fetch(`${API_URL}/logout/?sessionId=${sessionId}`);
  } catch(e) {
    console.warn('logout(): error:', e);
  }

  sessionId = null;
  localStorage.removeItem('sessionId');

  console.log('logout(): logged out');
}

// Get the users steamID when they are logged in
async function getUser() {
  if (!sessionId) {
    console.log('getUser(): no sessionId, please log in');
    return;
  }

  const response = await fetch(`${API_URL}/get-user/?sessionId=${sessionId}`);

  if (response.status === 404) {
    console.log('getUser(): steamID not found, please log in again', response);
    await logout();
    return;
  } else if (response.status === 401) {
    console.log('getUser(): not logged in', response);
    return;
  } else if (!response.ok) {
    console.log('getUser(): error in response:', response);
    return;
  }

  const parsedResponse = await response.json();

  console.log('getUser():', parsedResponse);
}

function connectWebsocket() { return new Promise((resolve, reject) => {
  if (socketConnection) {
    socketConnection.close();
    socketConnection = null;
  }

  socketConnection = new WebSocket(WS_URL);

  socketConnection.addEventListener('open', () => {
    console.log('connectWebsocket(): socket connected successfully');
  });

  socketConnection.addEventListener('close', () => {
    console.log('connectWebsocket(): socket closed');
  });

  socketConnection.addEventListener('error', e => {
    console.error(e);
    reject(e);
  });

  socketConnection.addEventListener('message', e => {
    console.log('connectWebsocket(): socket message:', e?.data);

    if (!e?.data) {
      return;
    }

    try {
      const message = JSON.parse(e.data);

      switch (message?.messageType) {
        // This promise is resolved with a session token when the server connects
        case 'sessionId':
          console.log('connectWebsocket(): got sessionId from websocket:', message.sessionId);
          resolve(message.sessionId);
        break;
        // Logged in successfully, we got the steamID, we can close the websocket connection now
        case 'login':
          console.log('connectWebsocket(): logged in as user', message.user);
          socketConnection.close();
        break;
      }
    } catch (err) {
      console.warn('connectWebsocket(): could not parse websocket message:', e, err);
    }
  });

  setTimeout(
    () => reject('connectWebsocket(): websocket connection timed out'),
    5000
  );
})}

// Encrypt the session token for safe storage
function encrypt(string) { return new Promise((resolve, reject) => {
  overwolf.cryptography.encryptForCurrentUser(string, results => {
    if (results && results.success && results.ciphertext) {
      resolve(results.ciphertext);
    } else {
      reject(results);
    }
  });
})}

// Decrypt the session token
function decrypt(string) { return new Promise((resolve, reject) => {
  overwolf.cryptography.decryptForCurrentUser(string, results => {
    if (results && results.success && results.plaintext) {
      resolve(results.plaintext);
    } else {
      reject(results);
    }
  });
})}

// Opens the developer console
// PLEASE NOTE: It's not advised to use this method in production apps
function openConsole() {
  overwolfInternal.extensions.showDevTools(location.hostname, 'background');
}

// Opens the UI window
function openMainWindow() {
  overwolf.windows.obtainDeclaredWindow('main', result => {
    if (result.success && result.window && result.window.id) {
      overwolf.windows.restore(result.window.id, null);
    }
  });
}

startApp().catch(console.error);

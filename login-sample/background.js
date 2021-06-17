const
  PROTOCOL = 'http',
  HOST = 'sso-sample-server.overwolf.com', // 'localhost'
  API_URL = `${PROTOCOL}://${HOST}:3000`,
  WS_URL = `ws://${HOST}:3000`;

// This token will be used to identify our client & get the SteamID
let sessionId = null;

let socketConnection;

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

async function login() {
  if (sessionId) {
    console.log('login(): please log out before logging in again');
    return;
  }

  try {
    sessionId = await connectWebsocket();
    localStorage.sessionId = await encrypt(sessionId);

    overwolf.utils.openUrlInDefaultBrowser(
      `${API_URL}/auth/steam/?sessionId=${sessionId}`,
      { skip_in_game_notification: true }
    );
  } catch(e) {
    console.warn('login(): error:', e);
  }
}

async function logout() {
  if (!sessionId) {
    console.log('logout(): you are not logged in');
    return;
  }

  await fetch(`${API_URL}/logout/?sessionId=${sessionId}`);

  sessionId = null;
  localStorage.removeItem('sessionId');

  console.log('logout(): logged out');
}

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

    if (e?.data) {
      try {
        const message = JSON.parse(e.data);

        switch (message?.messageType) {
          case 'sessionId':
            console.log('got sessionId from websocket:', message.sessionId);
            resolve(message.sessionId);
          break;
          case 'login':
            console.log('logged in as user', message.user);
            socketConnection.close();
          break;
        }
      } catch (err) {
        console.warn('could not parse websocket message:', e, err);
      }
    }
  });

  setTimeout(
    () => reject('connectWebsocket(): websocket connection timed out'),
    5000
  );
})}

function encrypt(string) { return new Promise((resolve, reject) => {
  overwolf.cryptography.encryptForCurrentUser(string, results => {
    if (results && results.success && results.ciphertext) {
      resolve(results.ciphertext);
    } else {
      reject(results);
    }
  });
})}

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

startApp().catch(console.log);

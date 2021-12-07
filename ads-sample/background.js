let gameRunning = false;

async function init() {
  window.openConsole = openConsole;

  overwolf.extensions.onAppLaunchTriggered.addListener(openMainWindow);

  overwolf.games.onGameInfoUpdated.addListener(onGameInfoUpdated);

  gameRunning = await getGameRunningStatus();
  openMainWindow();
}

function getGameRunningStatus() {
  return new Promise(resolve => {
    overwolf.games.getRunningGameInfo(gameInfo => {
      resolve(Boolean(gameInfo && gameInfo.isRunning));
    });
  })
}

function onGameInfoUpdated(e) {
  if (e && e.runningChanged) {
    const isRunning = Boolean(e.gameInfo && e.gameInfo.isRunning);

    if (isRunning !== gameRunning) {
      gameRunning = isRunning;
      openMainWindow();
    }
  }
}

function openMainWindow() {
  if (gameRunning) {
    openWindow('ingame');
    closeWindow('desktop');
  } else {
    closeWindow('ingame');
    openWindow('desktop');
  }
}

function openWindow(windowName) {
  overwolf.windows.obtainDeclaredWindow(windowName, result => {
    if (result.success && result.window && result.window.id) {
      overwolf.windows.restore(result.window.id, null);
    }
  });
}

function closeWindow(windowName) {
  overwolf.windows.getWindowState(windowName, state => {
    if (state.success && state.window_state_ex !== 'closed') {
      overwolf.windows.obtainDeclaredWindow(windowName, result => {
        if (result.success && result.window && result.window.id) {
          overwolf.windows.close(windowName, null);
        }
      });
    }
  });
}

// Opens the developer console for a specified window
// PLEASE NOTE: It's not advised to use this method in production apps
function openConsole(windowName) {
  overwolfInternal.extensions.showDevTools(location.hostname, windowName);
}

init();

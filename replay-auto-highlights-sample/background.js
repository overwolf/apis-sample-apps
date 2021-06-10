// Basic settings
const streamSettings = {
  video: {
    buffer_length: 30000
  }
};

let turnedOn = false;

// Turn on replays
async function turnOnReplays() {
  if (turnedOn) {
    console.log('turnOnReplays(): replays already turned on');
    return;
  }

  const autoHighlightsSupported = await checkAutoHighlightsSupport();

  if (!autoHighlightsSupported) {
    console.log('turnOnReplays(): auto-highlights not supported, cannot turn on replay API');
    return;
  }

  const parameters = {
    settings: streamSettings,
    highlights: {
      enable: true,
      requiredHighlights : ['*'] // events to capture. we want to capture all events
    }
  };

  overwolf.media.replays.turnOn(parameters, result => {
    if (!result.success) {
      console.log('overwolf.media.replays.turnOn(): error:', result.error, result);
      return;
    }

    console.log('overwolf.media.replays.turnOn(): success:', result);

    // Store this for stopping the stream and manipulating stream settings
    turnedOn = true;
  });

  console.log('overwolf.media.replays.turnOn(): waiting for response');
}

// Check if auto-highlights are supported in current game
async function checkAutoHighlightsSupport() {
  // Get the current running game
  const gameInfo = await new Promise(resolve => overwolf.games.getRunningGameInfo(resolve));

  if (gameInfo && gameInfo.success) {
    const results = await new Promise(resolve => {
      overwolf.media.replays.getHighlightsFeatures(gameInfo.classId, resolve)
    });

    if (results.success) {
      console.log(
        'overwolf.media.replays.getHighlightsFeatures(): auto-highlights are supported:',
        results
      );
    } else {
      console.log(
        'overwolf.media.replays.getHighlightsFeatures(): auto-highlights are not supported:',
        results
      );
    }

    return results.success;
  }

  console.log('checkAutoHighlightsSupport(): not in game:', gameInfo);

  return false;
}

// Turn off replays
function turnOffReplays() {
  if (!turnedOn) {
    console.log('turnOffReplays(): replays already turned off');
    return;
  }

  overwolf.media.replays.turnOff(result => {
    if (result.success) {
      console.log('overwolf.media.replays.turnOff(): success:', result);
      turnedOn = false;
    } else {
      console.log('overwolf.media.replays.turnOff(): error:', result.error, result);
    }
  });
}

// Get replays state
function getReplayState() {
  overwolf.media.replays.getState(result => {
    if (result.success) {
      const isOnText = result.isOn ? 'on' : 'off';

      console.log(
        `overwolf.media.replays.getState(): is turned ${isOnText}:`,
        result
      );

      turnedOn = result.isOn;
    } else {
      console.log('overwolf.media.replays.getState(): error:', result.error, result);
    }
  });
}

// Open the media folder in Explorer
function openFolder() {
  overwolf.utils.openWindowsExplorer(
    'overwolf://media/replays/Replay+Auto+Highlights+Sample+App',
    result => console.log('overwolf.utils.openWindowsExplorer():', result)
  );
}

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

window.turnOnReplays = turnOnReplays;
window.turnOffReplays = turnOffReplays;
window.getReplayState = getReplayState;
window.openFolder = openFolder;
window.openConsole = openConsole;

// Log relevant streaming events

overwolf.media.replays.onCaptureError
  .addListener(e => console.log('overwolf.media.replays.onCaptureError:', e));

overwolf.media.replays.onCaptureWarning
  .addListener(e => console.log('overwolf.media.replays.onCaptureWarning:', e));

overwolf.media.replays.onHighlightsCaptured
  .addListener(e => console.log('overwolf.media.replays.onHighlightsCaptured:', e));

overwolf.media.replays.onReplayServicesStarted
  .addListener(e => console.log('overwolf.media.replays.onReplayServicesStarted:', e));

// overwolf.media.replays.onCaptureStopped
//   .addListener(e => console.log('overwolf.media.replays.onCaptureStopped:', e));

overwolf.extensions.onAppLaunchTriggered.addListener(openMainWindow);
openMainWindow();

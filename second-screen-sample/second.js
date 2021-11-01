async function init() {
  registerListeners();
  await positionWindow();
}

async function positionWindow() {
  const [
    window,
    displays
  ] = await Promise.all([
    getCurrentWindow(),
    getMonitorsList()
  ]);

  let
    secondary = displays[0], // a fallback monitor
    secondarySize = 0; // area of secondary monitor

  // by default selects the largest non-primary monitor
  for (const v of displays) {
    if (
      !v.is_primary &&
      ((v.width * v.height) > secondarySize)
    ) {
      secondary = v;
      secondarySize = v.width * v.height;
    }
  }

  let
    left = secondary.x + (secondary.width / 2) - (window.width / 2),
    top = secondary.y + (secondary.height / 2) - (window.height / 2);

  left = Math.floor(Math.max(left, secondary.x));
  top = Math.floor(Math.max(top, secondary.y));

  const changePositionResult = await changeWindowPosition(
    window.id,
    left,
    top
  );

  console.log('positionWindow()', {
    changePositionResult,
    displays,
    secondary
  });
}

async function getCurrentWindow() {
  return new Promise((resolve, reject) => {
    overwolf.windows.getCurrentWindow(result => {
      if (result && result.success && result.window) {
        resolve(result.window);
      } else {
        reject(result);
      }
    });
  });
}

async function getMonitorsList() {
  return new Promise((resolve, reject) => {
    overwolf.utils.getMonitorsList(result => {
      if (result && result.success && result.displays) {
        resolve(result.displays);
      } else {
        reject(result);
      }
    });
  });
}

async function changeWindowPosition(...args) {
  return new Promise((resolve, reject) => {
    overwolf.windows.changePosition(...args, result => {
      if (result && result.success) {
        resolve(result);
      } else {
        reject(result);
      }
    });
  });
}

function registerListeners() {
  document.getElementById('openBackgroundConsole').addEventListener('click', () => {
    const backgroundController = overwolf.windows.getMainWindow();

    backgroundController.openBackgroundConsole();
  });
  document.getElementById('openSecondConsole').addEventListener('click', () => {
    const backgroundController = overwolf.windows.getMainWindow();

    backgroundController.openSecondConsole();
  });
}

init().catch(e => console.error(e));

async function init() {
  window.openBackgroundConsole = openBackgroundConsole;
  window.openMainConsole = openMainConsole;

  overwolf.extensions.onAppLaunchTriggered.addListener(openMainWindow);
  openMainWindow();
}

// Opens the background window developer console
// PLEASE NOTE: It's not advised to use this method in production apps
function openBackgroundConsole() {
  overwolfInternal.extensions.showDevTools(location.hostname, 'background');
}

// Opens the main window developer console
// PLEASE NOTE: It's not advised to use this method in production apps
function openMainConsole() {
  overwolfInternal.extensions.showDevTools(location.hostname, 'main');
}

// Opens the UI window
function openMainWindow() {
  overwolf.windows.obtainDeclaredWindow('main', result => {
    if (result.success && result.window && result.window.id) {
      overwolf.windows.restore(result.window.id, null);
    }
  });
}

init();

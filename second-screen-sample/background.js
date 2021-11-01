async function init() {
  window.openBackgroundConsole = openBackgroundConsole;
  window.openSecondConsole = openSecondConsole;
  window.openSecondWindow = openSecondWindow;

  overwolf.extensions.onAppLaunchTriggered.addListener(openSecondWindow);
  openSecondWindow();
}

// Opens the background window developer console
// PLEASE NOTE: It's not advised to use this method in production apps
function openBackgroundConsole() {
  overwolfInternal.extensions.showDevTools(location.hostname, 'background');
}

// Opens the second screen window developer console
// PLEASE NOTE: It's not advised to use this method in production apps
function openSecondConsole() {
  overwolfInternal.extensions.showDevTools(location.hostname, 'second');
}

// Opens the second screen UI window
function openSecondWindow() {
  overwolf.windows.obtainDeclaredWindow(
    'second',
    // this is set to make sure the window is initially restored at -1000px top,
    // so it is hidden until positioned on the secondary screen
    { useDefaultSizeAndLocation: true },
    result => {
      if (result.success && result.window && result.window.id) {
        overwolf.windows.restore(result.window.id, null);
      }
    }
  );
}

init();

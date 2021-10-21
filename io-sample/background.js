const FILE_PATH = `${overwolf.io.paths.documents}\\testFile.txt`;

async function init() {
  window.readFile = readFile;
  window.writeFile = writeFile;
  window.openBackgroundConsole = openBackgroundConsole;
  window.openMainConsole = openMainConsole;

  overwolf.extensions.onAppLaunchTriggered.addListener(openMainWindow);
  openMainWindow();
}

async function readFile() {
  const result = await new Promise(resolve => {
    overwolf.io.readFileContents(
      FILE_PATH,
      overwolf.io.enums.eEncoding.UTF8,
      resolve
    );
  });

  console.log('readFile()', result);

  return result;
}

async function writeFile(content) {
  const result = await new Promise((resolve, reject) => {
    overwolf.io.writeFileContents(
      FILE_PATH,
      content,
      overwolf.io.enums.eEncoding.UTF8,
      true,
      r => r.success ? resolve(r) : reject(r)
    );
  });

  console.log('writeFile()', result);

  return result;
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

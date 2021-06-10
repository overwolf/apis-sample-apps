document.getElementById('turnOn').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.turnOnReplays();
});

document.getElementById('turnOff').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.turnOffReplays();
});

document.getElementById('getState').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.getReplayState();
});

document.getElementById('capture').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.capture();
});

document.getElementById('openConsole').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.openConsole();
});

document.getElementById('openFolder').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.openFolder();
});

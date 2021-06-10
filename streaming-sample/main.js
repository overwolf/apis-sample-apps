document.getElementById('start').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.startRecording();
})

document.getElementById('stop').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.stopRecording();
})

document.getElementById('openConsole').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.openConsole();
})

document.getElementById('openFolder').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.openFolder();
});

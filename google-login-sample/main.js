document.getElementById('login').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.login();
});

document.getElementById('logout').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.logout();
});

document.getElementById('getUser').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.getUser();
});

document.getElementById('openConsole').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.openConsole();
});

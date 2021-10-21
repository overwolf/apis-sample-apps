const
  statusText = document.getElementById('status'),
  textField = document.getElementById('text-field');

const readFile = async () => {
  const backgroundController = overwolf.windows.getMainWindow();

  const result = await backgroundController.readFile();

  statusText.innerText = result.success
    ? 'File read successfully'
    : `File reading error: ${result.error}`;

  textField.value = (result.success) ? result.content : '';
}

document.getElementById('readFile').addEventListener('click', readFile);

document.getElementById('writeFile').addEventListener('click', async () => {
  const backgroundController = overwolf.windows.getMainWindow();

  const result = await backgroundController.writeFile(textField.value);

  statusText.innerText = result.success
    ? 'File written successfully'
    : `File writing error: ${result.error}`;
});

document.getElementById('openBackgroundConsole').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.openBackgroundConsole();
});

document.getElementById('openMainConsole').addEventListener('click', () => {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.openMainConsole();
});

readFile();

const ExtensionUpdateState = {
  UpToDate: "UpToDate",
  UpdateAvailable: "UpdateAvailable",
  PendingRestart: "PendingRestart",
};

window.onload = async () => {
  const currentChannelSpan = document.getElementById("currentChannel");
  const channelInput = document.getElementById("channel");
  const versionSpan = document.getElementById("version");
  const changeChannelButton = document.getElementById("changeChannel");
  const checkForUpdatesButton = document.getElementById("checkForUpdates");
  const updateButton = document.getElementById("update");
  const restartButton = document.getElementById("restart");
  const messagesDiv = document.getElementById("messages");

  displayCurrentChannel();
  displayAppVersion();
  changeChannelButton.onclick = onChangeChannelClicked;
  checkForUpdatesButton.onclick = onCheckForUpdatesClicked;
  updateButton.onclick = onUpdateClicked;
  restartButton.onclick = onRestartClicked;

  // -- Functions --

  async function displayCurrentChannel() {
    const { channel } = await getExtensionSettings();
    currentChannelSpan.textContent = channel;
  }

  async function displayAppVersion() {
    const {
      meta: { version },
    } = await getManifest();

    versionSpan.textContent = version;
  }

  async function onChangeChannelClicked(e) {
    e.preventDefault();
    await setExtensionSettings({ channel: channelInput.value });
    await displayCurrentChannel();
  }

  async function onCheckForUpdatesClicked(e) {
    e.preventDefault();
    const { state } = await checkForExtensionUpdates();
    switch (state) {
      case ExtensionUpdateState.UpToDate:
        showMessage("updateNotFound");
        break;
      case ExtensionUpdateState.UpdateAvailable:
        showMessage("updateFound");
        break;
      case ExtensionUpdateState.PendingRestart:
        showMessage("restartPending");
        break;
    }
  }

  async function onUpdateClicked(e) {
    e.preventDefault();
    await updateExtension();
    hideMessages();
    onCheckForUpdatesClicked(e);
  }

  async function onRestartClicked(e) {
    e.preventDefault();
    overwolf.extensions.relaunch();
  }

  function hideMessages() {
    for (let child of messagesDiv.children) {
      child.hidden = true;
    }
  }

  function showMessage(id) {
    hideMessages();
    messagesDiv.querySelector(`#${id}`).hidden = false;
  }
};

// --- Wrappers and Helpers ---

async function getExtensionSettings() {
  const res = await promisifyOverwolf(overwolf.settings.getExtensionSettings)();
  return res.settings;
}

async function setExtensionSettings(settings) {
  return await promisifyOverwolf(overwolf.settings.setExtensionSettings)(
    settings
  );
}

async function getManifest() {
  return await promisifyOverwolf(overwolf.extensions.current.getManifest)();
}

async function checkForExtensionUpdates() {
  return await promisifyOverwolf(overwolf.extensions.checkForExtensionUpdate)();
}

async function updateExtension() {
  return await promisifyOverwolf(overwolf.extensions.updateExtension)();
}

// Promisify Overwolf API calls
function promisifyOverwolf(OWFunc) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      function callback(res) {
        if (res.success) {
          resolve(res);
        } else {
          reject(res);
        }
      }

      args.push(callback);
      OWFunc.call(this, ...args);
    });
  };
}

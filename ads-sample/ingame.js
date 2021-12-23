import './window-controls.js'

const kWindowName = 'ingame';

let
  adEnabled = false,
  windowIsOpen = false,
  gameInFocus = false,
  adInstance = null;

async function init() {
  registerListeners();

  overwolf.games.onGameInfoUpdated.addListener(onGameInfoUpdated);

  overwolf.windows.onStateChanged.addListener(onWindowStateChanged);

  gameInFocus = await getGameInFocus();

  windowIsOpen = await getWindowIsOpen();

  updateAd();
}

function loadAdLib() {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = 'https://content.overwolf.com/libs/ads/latest/owads.min.js';
    el.async = true;
    el.onload = resolve;
    el.onerror = reject;
    document.body.appendChild(el);
  });
}

async function getGameInFocus() {
  const gameInfo = await new Promise(resolve => {
    overwolf.games.getRunningGameInfo(resolve);
  });

  const inFocus = Boolean(gameInfo && gameInfo.isRunning && gameInfo.isInFocus);

  console.log(`getGameInFocus():`, gameInfo, inFocus);

  return inFocus;
}

function onGameInfoUpdated(e) {
  const inFocus = (
    e &&
    e.gameInfo &&
    e.gameInfo.isRunning &&
    e.gameInfo.isInFocus
  );

  console.log(`onGameInfoUpdated:`, inFocus);

  if (gameInFocus !== inFocus) {
    gameInFocus = inFocus;
    updateAd();
  }
}

async function getWindowIsOpen() {
  const state = await new Promise(resolve => {
    overwolf.windows.getWindowState(kWindowName, resolve);
  });

  if (state && state.success && state.window_state_ex) {
    const isOpen = (
      state.window_state_ex === 'normal' ||
      state.window_state_ex === 'maximized'
    );

    console.log(`getWindowIsOpen():`, state.window_state_ex, isOpen);

    return isOpen;
  }

  return false;
}

function onWindowStateChanged(state) {
  if (state && state.window_state_ex && state.window_name === kWindowName) {
    const isOpen = (
      state.window_state_ex === 'normal' ||
      state.window_state_ex === 'maximized'
    );

    console.log(`onWindowStateChanged:`, state.window_state_ex, isOpen);

    if (windowIsOpen !== isOpen) {
      windowIsOpen = isOpen;
      updateAd();
    }
  }
}

function updateAd() {
  const shouldEnable = (windowIsOpen && gameInFocus);

  if (adEnabled !== shouldEnable) {
    adEnabled = shouldEnable;

    if (shouldEnable) {
      createAd();
    } else {
      removeAd();
    }
  }
}

async function createAd() {
  if (!window.OwAd) {
    await loadAdLib();

    if (!window.OwAd) {
      console.error('Couldn\'t load OwAd');
      return;
    }
  }

  if (adInstance !== null) {
    adInstance.refreshAd();
    console.log('createAd(): refreshAd');
    return;
  }

  const adCont = document.getElementById('adContainer');

  adInstance = new window.OwAd(adCont, {
    size: {
      width: 400,
      height: 300
    }
  });

  adInstance.addEventListener('player_loaded', () => console.log('OwAd player_loaded'));
  adInstance.addEventListener('display_ad_loaded', () => console.log('OwAd display_ad_loaded'));
  adInstance.addEventListener('play', () => console.log('OwAd play'));
  adInstance.addEventListener('impression', () => console.log('OwAd impression'));
  adInstance.addEventListener('complete', () => console.log('OwAd complete'));
  adInstance.addEventListener('ow_internal_rendered', () => console.log('OwAd ow_internal_rendered'));

  adInstance.addEventListener('error', e => {
    console.log('OwAd instance error:');
    console.error(e);
  });

  console.log('createAd(): new Ad instance');
}

function removeAd() {
  if (adInstance !== null) {
    console.log('removeAd()');
    adInstance.removeAd();
  }
}

function setTab(tab) {
  document.querySelectorAll(`[data-tab]`).forEach(el => {
    if (el.dataset.tab === tab) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  document.querySelectorAll(`.tab-content`).forEach(el => {
    el.hidden = Boolean(el.id !== tab);
  });
}

function registerListeners() {
  document.getElementById('openConsole').addEventListener('click', () => {
    const backgroundController = overwolf.windows.getMainWindow();

    backgroundController.openConsole(kWindowName);
  });

  document.querySelectorAll('[data-tab]').forEach(el => {
    el.addEventListener('click', () => {
      setTab(el.dataset.tab);
    });
  })
}

init();

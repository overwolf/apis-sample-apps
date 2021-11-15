const WINDOW_NAME = 'main';

let
  updateWindowIsVisibleInterval = null,
  windowIsOpen = false,
  windowIsVisible = false,
  adInstance = null;

async function init() {
  // Force the ads script to display a test ad, this is not intended for production
  localStorage.owAdsForceAdUnit = "Ad_test";

  registerListeners();

  windowIsOpen = await getWindowIsOpen();

  overwolf.windows.onStateChanged.removeListener(onWindowStateChanged);
  overwolf.windows.onStateChanged.addListener(onWindowStateChanged);

  windowIsVisible = await getWindowIsVisible();

  updateWindowIsVisibleInterval = setInterval(updateWindowIsVisible, 2000);
}

function loadAdLib() { return new Promise((resolve, reject) => {
  const el = document.createElement('script');
  el.src = 'https://content.overwolf.com/libs/ads/latest/owads.min.js';
  el.async = true;
  el.onload = resolve;
  el.onerror = reject;
  document.body.appendChild(el);
})}

async function getWindowIsVisible() {
  const state = await new Promise(resolve => {
    overwolf.windows.isWindowVisibleToUser(resolve);
  });

  const isVisible = (state && state.success && state.visible !== 'hidden');

  console.log(`getWindowIsVisible():`, state.visible, isVisible);

  return isVisible;
}

async function updateWindowIsVisible() {
  const isVisible = await getWindowIsVisible();

  if (windowIsVisible !== isVisible) {
    windowIsVisible = isVisible;
    updateAd();
  }
}

async function getWindowIsOpen() {
  const state = await new Promise(resolve => {
    overwolf.windows.getWindowState(WINDOW_NAME, resolve);
  });

  if (state && state.success && state.window_state_ex) {
    const isOpen = (
      state.window_state_ex === 'normal' ||
      state.window_state_ex === 'maximized'
    );

    console.log(`getWindowIsOpen():`, isOpen, state.window_state_ex);

    return isOpen;
  }

  return false;
}

function onWindowStateChanged(state) {
  if (state && state.window_state_ex && state.window_name === WINDOW_NAME) {
    const isOpen = (
      state.window_state_ex === 'normal' ||
      state.window_state_ex === 'maximized'
    );

    console.log(`onWindowStateChanged:`, isOpen, state.window_state_ex);

    if (windowIsOpen !== isOpen) {
      windowIsOpen = isOpen;
      updateAd();
    }
  }
}

function updateAd() {
  if (windowIsOpen && windowIsVisible) {
    createAd();
  } else {
    removeAd();
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
  document.querySelectorAll(`.tabsSelector li`).forEach(el => {
    if (el.dataset.tab === tab) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  document.querySelectorAll(`.tabContent`).forEach(el => {
    el.hidden = Boolean(el.id !== tab);
  });
}

function registerListeners() {
  document.getElementById('openMainConsole').addEventListener('click', () => {
    const backgroundController = overwolf.windows.getMainWindow();

    backgroundController.openMainConsole();
  });

  document.querySelectorAll('.tabsSelector li').forEach(el => {
    el.addEventListener('click', () => {
      setTab(el.dataset.tab);
    });
  })
}

init();

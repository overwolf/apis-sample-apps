const WINDOW_NAME = 'main';

let windowIsOpen = false;
let subscriptionIsActive = false;
let adInstance = null;

async function init() {
  const backgroundController = overwolf.windows.getMainWindow();

  backgroundController.setOnSubscriptionChanged(active => {
    if (subscriptionIsActive !== active) {
      subscriptionIsActive = active;
      updateAd();
    }
  });

  subscriptionIsActive = backgroundController.isSubscriptionActive();
  windowIsOpen = await getWindowIsOpen();

  updateAd();

  overwolf.windows.onStateChanged.removeListener(onWindowStateChanged);
  overwolf.windows.onStateChanged.addListener(onWindowStateChanged);

  registerListeners();
}

function getSubscriptionPlanID() {
  const backgroundController = overwolf.windows.getMainWindow();

  return backgroundController.SUBSCRIPTION_PLAN_ID;
}

function loadAdLib() { return new Promise((resolve, reject) => {
  const el = document.createElement('script');
  el.src = 'https://content.overwolf.com/libs/ads/latest/owads.min.js';
  el.async = true;
  el.onload = resolve;
  el.onerror = reject;
  document.body.appendChild(el);
})}

async function getWindowIsOpen() {
  const state = await new Promise(resolve => {
    overwolf.windows.getWindowState(WINDOW_NAME, resolve)
  });

  if (state && state.success && state.window_state && state.status === 'success') {
    const isOpen = (state.window_state === 'normal' || state.window_state === 'maximized');

    console.log(`getWindowIsOpen(): ${WINDOW_NAME} window is open:`, isOpen);

    return isOpen;
  }

  return false;
}

function onWindowStateChanged(state) {
  if (state && state.window_state && state.window_name === WINDOW_NAME) {
    const isOpen = (state.window_state === 'normal' || state.window_state === 'maximized');

    console.log(`onWindowStateChanged: ${WINDOW_NAME} window is open:`, isOpen);

    if (windowIsOpen !== isOpen) {
      windowIsOpen = isOpen;
      updateAd();
    }
  }
}

function updateAd() {
  if (windowIsOpen && !subscriptionIsActive) {
    createAd();
  } else {
    destroyAd();
  }
}

async function createAd() {
  if (!window.OwAd) {
    await loadAdLib();

    if (!window.OwAd) {
      console.log('Couldn\'t load OwAd');
      return;
    }
  }

  const adCont = document.getElementById('adContainer');

  if (adInstance !== null) {
    adInstance.refreshAd();
    return;
  }

  adInstance = new window.OwAd(adCont, { size: { width: 400, height: 300 } });

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

  console.log('createAd()');
}

function destroyAd() {
  if (adInstance !== null) {
    console.log('destroyAd()');
    adInstance.removeAd();
  }
}

function registerListeners() {
  document.getElementById('subscribe').addEventListener('click', () => {
    const backgroundController = overwolf.windows.getMainWindow();

    backgroundController.openSubscribeWindow();
  });

  document.getElementById('subscribeInApp').addEventListener('click', () => {
    overwolf.profile.subscriptions.inapp.show(
      getSubscriptionPlanID(),
      overwolf.profile.subscriptions.inapp.enums.Theme.Dark,
      result => console.log('overwolf.profile.subscriptions.inapp.show():', result)
    );
  });

  document.getElementById('openBackgroundConsole').addEventListener('click', () => {
    const backgroundController = overwolf.windows.getMainWindow();

    backgroundController.openBackgroundConsole();
  });

  document.getElementById('openMainConsole').addEventListener('click', () => {
    const backgroundController = overwolf.windows.getMainWindow();

    backgroundController.openMainConsole();
  });
}

init();

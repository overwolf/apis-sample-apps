const SUBSCRIPTION_PLAN_ID = 96;

let subscriptionActive = false;

let onSubscriptionChanged = null;

async function init() {
  overwolf.profile.subscriptions.onSubscriptionChanged.addListener(e => {
    const active = !!(e.plans && e.plans.length && e.plans.includes(SUBSCRIPTION_PLAN_ID));

    if (subscriptionActive !== active) {
      subscriptionActive = active;

      if (onSubscriptionChanged)
        onSubscriptionChanged(subscriptionActive)
    }
  });

  const plans = await getActivePlans();

  const active = !!(plans && plans.length && plans.includes(SUBSCRIPTION_PLAN_ID));

  if (subscriptionActive !== active) {
    subscriptionActive = active;

    if (onSubscriptionChanged)
      onSubscriptionChanged(subscriptionActive)
  }

  window.openBackgroundConsole = openBackgroundConsole;
  window.openMainConsole = openMainConsole;
  window.isSubscriptionActive = isSubscriptionActive;
  window.setOnSubscriptionChanged = setOnSubscriptionChanged;
  window.openSubscribeWindow = openSubscribeWindow;
  window.SUBSCRIPTION_PLAN_ID = SUBSCRIPTION_PLAN_ID;

  overwolf.extensions.onAppLaunchTriggered.addListener(openMainWindow);
  openMainWindow();
}

function getActivePlans() { return new Promise(resolve => {
  overwolf.profile.subscriptions.getActivePlans(result => {
    resolve(result.success ? result.plans : null)
  })
})}

function isSubscriptionActive() {
  return subscriptionActive;
}

function setOnSubscriptionChanged(cb) {
  onSubscriptionChanged = cb;
}

function openSubscribeWindow() {
  overwolf.utils.openStore({
    page: overwolf.utils.enums.eStorePage.SubscriptionPage
  })
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

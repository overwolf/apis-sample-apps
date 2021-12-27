With the Ads sample app it you'll be able to demonstrate how to display an ad, in an in-game window or desktop window, when to hide it, when to restore it, etc.

The following scenarios and principles are demonstrated in the Ads sample app:

* Position and Dimentions:  
  * Ads box is implemented in the top-level component with absolute positioning.
  * Ad container is <= container div, so the ad won't cut.
  * Ad box is fixed and without scroll bar.
  * Ads box is not refreshed when navigating components inside the same window. 
  * The ad placement area is not scrollable.
  * Tabs: Ads box is not refreshed when switching tabs, and its position is permanently kept.
  * No menus or pop-up windows on top of the ad.
  * Ad placement dimensions are being kept while resizing the app window. 
* Clickable:
  * Ads are clickable, and clicking on an Ad will open the pre-defined browser (OW or user browser, as set in the manifest).
* Focus:
  * There is no ad refresh when losing focus (clicking on a different spot in the app, the game, or outside the app).
  * When the game gain focus, the Ad is not loaded if the app window was previously minimized and not restored.
* DPI: 
  * The app looks good, and ads dimensions are not cut on 125% and 150% and resolutions.
* Minimize / Restore / Closing:
  * Ad is removed when the user presses Win Key + D and refreshes on restore.
  * Ad is removed when the user minimized the app through the "_" button and refreshed on restore.
  * Ad is removed when the user minimized the app through the in-game hotkeys (if defined) and refreshed on restore.  Note that on the current version of this sample app, no hotkeys are implemented yet.
  * Ad is removed, then the user closes the app.
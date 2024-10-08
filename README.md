# BoilerKey Extension
This is a Chrome/Edge/Firefox/Opera extension that automates BoilerKey. The code is based heavily off of this [Python script](https://github.com/elnardu/local-boilerkey) made by [u/elnardu](https://www.reddit.com/r/Purdue/comments/9ulfj2/local_boilerkey_script/).

## **NOTICE**
This extension has been deprecated with the addition of Passkeys to Duo Mobile. Passkeys allow you to authenticate using Touch ID (macOS) or Windows Hello (face/fingerprint or PIN). This is much more secure than the authentication method used by this extension!

To set up a Passkey, go to the "Manage devices" page in Duo and click "Add a device". Then select Touch ID or Windows Hello depending on what platform you're using.

<img width="720" alt="image" src="https://github.com/user-attachments/assets/4b5e31df-806e-4b8e-b005-b21e1622b391">

## Downloads
* **Chrome/Edge**: https://chrome.google.com/webstore/detail/boilerkey-helper/infadhgmajhpaoejgbennpkjnobdbkij
* **Firefox**: https://addons.mozilla.org/en-US/firefox/addon/boilerkey/

## Manual Installation

### Chrome/Edge

#### Install from source
1. Clone the extension.
2. Navigate to chrome://extensions in Chrome, or edge://extensions in Edge.
3. Enable Developer mode in the top right corner.
4. Click "**Load unpacked**".
5. Select the BoilerKeyExtension folder which you cloned.
6. Navigate to the [Brightspace login page](https://purdue.brightspace.com/d2l/login), and follow the instructions in the dialogs.

### Firefox

#### Install signed extension
Download the signed extension from [GitHub Releases](https://github.com/bscholer/BoilerKeyExtension/releases/latest).

#### Install from source
1. Clone the extension.
2. Navigate to about:debugging in Mozilla Firefox.
3. Click "Load Temporary Add-on".
4. Select the manifest.json file from the cloned folder.
5. Navigate to the [Brightspace login page](https://purdue.brightspace.com/d2l/login), and follow the instructions in the dialogs.

### Security Considerations
This extension is less secure than using BoilerKey as intended. It stores a secret key in plain-text in your browser's local storage.

However, chances are, if someone has enough access to your computer to steal these details, you have bigger issues on your hands.

Use at your own risk!

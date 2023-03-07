chrome.browserAction.setPopup({ popup: "setup.html" });
if (localStorage.getItem(hotpSecret)) {
    browser.browserAction.setPopup("setup.html");
}
console.log(TEST)
var resetButton = document.getElementById("reset_button");
resetButton.addEventListener("click", reset);

function reset() {
    let url = "https://www.purdue.edu/apps/account/cas/login?reset=true";
    let win = window.open(url, '_blank');

// // creates a new exception type:
//     function FatalError() {
//         Error.apply(this, arguments);
//         this.name = "FatalError";
//     }
//
//     FatalError.prototype = Object.create(Error.prototype);
//
// // and then, use this to trigger the error:
//     throw new FatalError("Something went badly wrong!");
}

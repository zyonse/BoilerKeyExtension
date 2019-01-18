var resetButton = document.getElementById("reset_button");
resetButton.addEventListener("click", reset);

function reset() {
    let url = "https://www.purdue.edu/apps/account/cas/login";
    let win = window.open(url, '_blank');

    localStorage.removeItem("pin");
    localStorage.removeItem("code");
    localStorage.removeItem("hotpSecret");
    localStorage.removeItem("username");
    location.reload();

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

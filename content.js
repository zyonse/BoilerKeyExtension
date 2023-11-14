/*
 * @author Ben Scholer <benscholer3248511@gmail.com>
 *
 * A Chrome/Firefox Extension that authenticates through Purdue's CAS automatically,
 * alleviating BoilerKey for the device it's installed on.
 */


/*
JavaScript Password Prompt by Luc (luc@ltdinteractive.com)
Originally posted to http://stackoverflow.com/questions/9554987/how-can-i-hide-the-password-entered-via-a-javascript-dialog-prompt
This code is Public Domain :)

Syntax:
password_prompt(label_message, button_message, callback);
password_prompt(label_message, button_message, width, height, callback);

Example usage:
password_prompt("Please enter your password:", "Submit", function(password) {
    alert("Your password is: " + password);
});
*/

window.password_prompt = function (label_message, button_message, arg3, arg4, arg5) {
    if (typeof label_message !== "string") var label_message = "Password:";
    if (typeof button_message !== "string") var button_message = "Submit";
    if (typeof arg3 === "function") {
        var callback = arg3;
    }
    else if (typeof arg3 === "number" && typeof arg4 === "number" && typeof arg5 === "function") {
        var width = arg3;
        var height = arg4;
        var callback = arg5;
    }
    if (typeof width !== "number") var width = 250;
    if (typeof height !== "number") var height = 100;
    if (typeof callback !== "function") var callback = function (password) { };

    let submit = function () {
        callback(input.value);
        document.body.removeChild(div);
        window.removeEventListener("resize", resize, false);
    };
    let resize = function () {
        div.style.left = ((window.innerWidth / 2) - (width / 2)) + "px";
        div.style.top = ((window.innerHeight / 2) - (height / 2)) + "px";
    };

    let div = document.createElement("div");
    div.id = "password_prompt";
    div.style.background = "white";
    div.style.color = "black";
    div.style.border = "1px solid black";
    div.style.width = width + "px";
    div.style.height = height + "px";
    div.style.padding = "16px";
    div.style.position = "fixed";
    div.style.left = ((window.innerWidth / 2) - (width / 2)) + "px";
    div.style.top = ((window.innerHeight / 2) - (height / 2)) + "px";

    let label = document.createElement("label");
    label.id = "password_prompt_label";
    label.textContent = label_message;
    label.for = "password_prompt_input";
    div.appendChild(label);

    div.appendChild(document.createElement("br"));

    let input = document.createElement("input");
    input.id = "password_prompt_input";
    input.type = "password";
    //    input.onblur = function() {document.getElementById("password_prompt_input").focus();};
    input.addEventListener("keyup", function (e) {
        if (e.keyCode == 13) submit();
    }, false);
    div.appendChild(input);

    div.appendChild(document.createElement("br"));
    div.appendChild(document.createElement("br"));

    let button = document.createElement("button");
    button.textContent = button_message;
    button.addEventListener("click", submit, false);
    div.appendChild(button);

    document.body.appendChild(div);
    window.addEventListener("resize", resize, false);
    setTimeout(function () { document.getElementById("password_prompt_input").focus(); }, 800);
};

//Skip Brightspace campus selection screen
if (window.location.href.startsWith("https://purdue.brightspace.com/d2l/login") === true) {
    //Check to see if user manually logged out, proceed if false
    if (window.location.href !== "https://purdue.brightspace.com/d2l/login?logout=1") {
        //Check if url contains "target" parameter, append to redirect if true
        if (location.search.includes("target=")) {
            target = "&target=" + location.search.split("target=")[1].split("&")[0]
        } else target = "";
        window.location.replace("https://purdue.brightspace.com/d2l/lp/auth/saml/initiate-login?entityId=https://idp.purdue.edu/idp/shibboleth" + target);
    }
}

let url = new URL(window.location.href);
let reset = url.searchParams.get("reset") === "true";

//Make sure we're on Purdue's CAS, otherwise, don't do anything.
if (window.location.href.startsWith("https://sso.purdue.edu/idp/profile/") === true) {
    if (reset) {
        if (confirm("Are you sure you want to reset BoilerKey Helper?")) {
            localStorage.removeItem("pin");
            localStorage.removeItem("code");
            localStorage.removeItem("hotpSecret");
            localStorage.removeItem("username");
            localStorage.removeItem("counter");
            chrome.storage.sync.clear()
        }
        window.close();
    }
}

//Make sure we're on Purdue's CAS, otherwise, don't do anything.
//Autofill username/password before proceeding to the Duo authentication page
if (window.location.href.startsWith("https://sso.purdue.edu/idp/profile/") && !reset) {
    //Retrieve everything from storage.
    let password, username;
    chrome.storage.sync.get([
        'username',
        'password'
    ], (login) => {
        //If we have the username/password, log the user in automatically.
        if (login.username && login.password) {
            //Make sure this is the first login attempt (prevent endless error loop)
            if (document.querySelector("p[class='output-message output--error']") == null) {
                //Auto-fill username field
                document.getElementById("username").value = login.username;
                //Auto-fill password field
                document.getElementById("password").value = login.password;
                //Find the login button, and click it.
                document.querySelector("button[name='_eventId_proceed'][accesskey='s'][type='submit']").click();
            }
        } else {
            //If we don't have login data, remove the info currently stored, as it needs to be replaced.
            chrome.storage.sync.clear()
            //Get the user's info
            loginSetup();
        }
    });
}

async function loginSetup() {
    let username, password;
    username = prompt("For a fully automated login, please enter username (recommended):").toLowerCase();

    //Traps user until they either enter a valid password/username, or no password at all.
    while (!password) {
        if (username) {
            password = prompt("To complete auto-login setup, please enter your Purdue password (recommended):");
        } else {
            password = prompt("To enable password auto-fill, please enter your Purdue password (recommended):");
        }
        if (password) {
            if (username) {
                alert("Auto-login has been set-up and enabled!");
            } else {
                alert("PIN,code will be auto-filled on each login!")
        }
    } else {
            alert("No password set. A login code will be provided when you open this site.");
            break;
        }
    }
    //Save username/PIN if they exist.
    if (username) {
        set("username", username);
    }
    if (password) {
        set("password", password);
    }
    //Refresh the page to start auto-login.
    location.reload();
}

//Collecting user-info, and setting up the new BoilerKey.
async function duoSetup() {
    let code;
    //Traps user until they enter a valid activation link, or code.
    while (!code) {
        let link = prompt("Setup steps:\n" +
            "1) In a different browser, please navigate to your BoilerKey settings (https://purdue.edu/boilerkey), and click 'Set up a new Duo Mobile BoilerKey'.\n" +
            "2) Follow the steps, enter PIN, and choose name for the new BoilerKey e.g. 'Laptop_Chrome', 'Desktop_Firefox'.\n" +
            "3) Paste the link (https://m-1b9bef70.duosecurity.com/activate/XXXXXXXXXXXXXXXXXXXX) found under the QR code (required):");
        code = validateLink(link);
        if (!code) {
            alert("Invalid link. Please try again");
        }
    }

    // https://stackoverflow.com/a/55188241
    let keys = await window.crypto.subtle.generateKey(
        {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: { name: 'SHA-256' },
        },
        false,
        ['sign', 'verify'],
    );
    let pubKey = await window.crypto.subtle.exportKey('spki', keys.publicKey);
    let pem = `-----BEGIN PUBLIC KEY-----\n${window.btoa(String.fromCharCode(...new Uint8Array(pubKey))).match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
    console.log(pem);

    chrome.runtime.sendMessage({
        method: 'POST',
        url: 'https://api-1b9bef70.duosecurity.com/push/v2/activation/' + code,
        headers: {
            "app_id": "com.duosecurity.duomobile",
            "app_version": "3.37.1",
            "app_build_number": "326002",
            "full_disk_encryption": "true",
            "manufacturer": "Google",
            "model": "Pixel4",
            "platform": "Android",
            "jailbroken": "false",
            "version": "10.0",
            "language": "EN",
            "customer_protocol": "1",
            "pubkey": pem,
            "pkpush": "rsa-sha256"
        }
    },
        function (hotpSecret) {
            console.log(hotpSecret);
            hotpSecret = JSON.parse(hotpSecret);
            if (hotpSecret['stat'] !== 'FAIL') {
                set("hotpSecret", hotpSecret.response["hotp_secret"]);
                set("counter", 0);
                alert("Activation successful! Press OK to continue to setup auto-login.")
            } else {
                alert("Activation failed, please try again. A new BoilerKey will need to be created.");
                location.reload();
            }
        });
}

//Simply validate the link the user enters, and return the code found at the end of it.
function validateLink(link) {
    if (link != null && link.startsWith("https://m-1b9bef70.duosecurity.com/activate/")) {
        let chunks = link.split("/");
        if (chunks[chunks.length - 1].length === 20) {
            return chunks[chunks.length - 1];
        } else return null;
    } else if (link.length === 20) {
        return link;
    }
}

function makeRequest(method, url) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}

//Generating the HMAC code using the jsOTP library with our hotp-secret and counter.
function generateHmacCode(hotpSecret) {
    //Get counter into an int
    let counter = parseInt(get("counter"));
    //Get hmacCode
    var hotp = new jsOTP.hotp();
    var hmacCode = hotp.getOtp(hotpSecret, counter);
    //Increment the counter
    set("counter", counter + 1);
    return hmacCode;
}

//A simple wrapper for chrome.storage.sync.get
function get(key) {
    chrome.storage.sync.get(key, (result) => {
        console.log("Value of " + key +  " is " + result[key]);
        return result[key]
    });
}

//A simple wrapper for chrome.storage.sync.set(key, value)
function set(key, value) {
    chrome.storage.sync.set({[key]: value});
}

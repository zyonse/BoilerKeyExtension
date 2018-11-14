/*
 * @author Ben Scholer <benscholer3248511@gmail.com>
 *
 * A Chrome Extension that authenticates through Purdue's CAS automatically,
 * alleviating BoilerKey for the device it's installed on.
 */

//Click on the "Purdue Account Login" button
if (window.location.href.indexOf("https://mycourses.purdue.edu") !== -1) {
    $("tr.purdue-btn-top-row").click();
}

//Make sure we're on Purdue's CAS, otherwise, don't do anything.
if (window.location.href.indexOf("https://www.purdue.edu/apps/account/cas/login") !== -1) {
    //Retrieve everything from localStorage.
    let pin, code, hotpSecret, username;
    pin = get("pin");
    code = get("code");
    hotpSecret = get("hotpSecret");
    username = get("username");

    //If the browser has been activated, go through the login process.
    if (hotpSecret) {
        hmacCode = generateHmacCode(hotpSecret);
        //If we have the username/pin, log the user in automatically.
        if (username && pin) {
            //Auto-fill username field
            $("#username").val(username);
            //Auto-fill password field
            $("#password").val(pin + "," + hmacCode);
            //Find the login button, and click it.
            $("input[name='submit'][accesskey='s'][value='Login'][tabindex='3'][type='submit']").click();
            //Otherwise, just show the user the password they should use in an alert.
        } else if (pin && !username) {
            //Otherwise, just fill the password in for the user.
            $("#password").val(pin + "," + hmacCode);
        } else {
            alert("2FA code: " + hmacCode);
        }
    } else {
        //If we don't have activation data, remove the info currently stored, as it needs to be replaced.
        localStorage.removeItem("pin");
        localStorage.removeItem("code");
        localStorage.removeItem("username");
        localStorage.removeItem("count");
        localStorage.removeItem("hotpSecret");
        //Get the user's info to setup a new BoilerKey
        askForInfo();
    }
}

//Collecting user-info, and setting up the new BoilerKey.
function askForInfo() {
    let code, pin, username, hotpSecret;
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

    hotpSecret = getActivationData(code);
    console.log(hotpSecret);
    //If activation was successful, save the hotp-secret and reset the counter.
    if (hotpSecret) {
        set("hotpSecret", hotpSecret);
        set("counter", 0);
        alert("Activation successful! Press OK to continue to setup auto-login.")
    } else {
        alert("Activation failed, please try again. A new BoilerKey will need to be created.");
        location.reload();
    }

    username = prompt("For a fully automated login, please enter username (recommended):");

    //Traps user until they either enter a valid pin/username, or no pin at all.
    while (!pin || !(pin.match(/(\d{4})/) && pin.length === 4)) {
        if (username) {
            pin = prompt("To complete auto-login setup, please enter BoilerKey PIN (recommended):");
        } else {
            pin = prompt("To enable password auto-fill, please enter BoilerKey PIN (recommended):");
        }
        if (pin.match(/(\d{4})/) && pin.length === 4) {
            if (username) {
                alert("Auto-login has been set-up and enabled!");
            } else {
                alert("PIN,code will be auto-filled on each login!")
            }
        } else if (!pin) {
            alert("No PIN set. A login code will be provided when you open this site.");
        } else {
            alert("Invalid PIN, please try again.");
        }
    }
    //Save username/PIN if they exist.
    if (username) {
        set("username", username);
    }
    if (pin) {
        set("pin", pin);
    }
    //Refresh the page to start auto-login.
    location.reload();
}

//Simply validate the link the user enters, and return the code found at the end of it.
function validateLink(link) {
    if (link.indexOf("m-1b9bef70.duosecurity.com")) {
        let chunks = link.split("/");
        if (chunks[chunks.length - 1].length === 20) {
            return chunks[chunks.length - 1];
        } else return null;
    } else if (link.length === 20) {
        return link;
    }
}

//The function that runs during setup, returning the hotp-secret needed to create auth keys from.
function getActivationData(code) {
    let ret;
    //Making DUO think that we're activating from the Android DUO Mobile app, running on a Google Pixel.
    $.ajax({
        type: "POST",
        url: 'https://api-1b9bef70.duosecurity.com/push/v2/activation/' + code + '?app_id=com.duosecurity.duomobile.app.DMApplication' +
            '&app_version=2.3.3&app_build_number=323206&full_disk_encryption=false&manufacturer=Google&model=Pixel&' +
            'platform=Android&jailbroken=false&version=6.0&language=EN&customer_protocol=1',
        dataType: "text",
        async: false,
        success: function (data) {
            //If successful, save the hotp-secret (the only thing we really care about) to be returned.
            data = JSON.parse(data);
            ret = data.response["hotp_secret"];
            console.log(data);
        },
        error: function (data) {
            //Something went wrong. User should try to create a new BoilerKey
            console.log("ACTIVATION ERROR!");
            console.log(data);
            ret = null;
        }
    });
    return ret;
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

//A simple wrapper for localStorage.get(key) with a bit of error handling.
function get(key) {
    if (localStorage.getItem(key)) {
        let data = localStorage.getItem(key);
        if (data) {
            return data;
        } else return null;
    } else return null;
}

//A simple wrapper for localStorage.set(key, value)
function set(key, value) {
    localStorage.setItem(key, value);
}

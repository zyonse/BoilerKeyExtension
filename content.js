/*
A Chrome Extension that authenticates through Purdue's CAS automatically,
alleviating BoilerKey for the device it's installed on.
 */

if (window.location.href.indexOf("https://www.purdue.edu/apps/account/cas/login") !== -1) {
    let pin, code, activationData, username;
    pin = get("pin");
    code = get("code");
    activationData = get("activationData");
    username = get("username");
    if (activationData) {
        hmacCode = generatePassword();
        if (username && pin) {
            $("#username").val(username);
            $("#password").val(pin + "," + hmacCode);
            $("input[name='submit'][accesskey='s'][value='Login'][tabindex='3'][type='submit']").click();
            $("#password").trigger(
                jQuery.Event('keydown', {which: 13})
            );
        } else {
            alert("2FA code: " + hmacCode);
        }
    } else {
        localStorage.removeItem("pin");
        localStorage.removeItem("code");
        askForInfo();
    }
}

function get(key) {
    if (localStorage.getItem(key)) {
        let data = localStorage.getItem(key);
        if (data) {
            return data;
        } else return null;
    } else return null;
}

function set(key, value) {
    localStorage.setItem(key, value);
}

function getActivationData() {
    let ret;
    $.ajax({
        type: "POST",
        url: 'https://api-1b9bef70.duosecurity.com/push/v2/activation/' + get("code") + '?app_id=com.duosecurity.duomobile.app.DMApplication' +
            '&app_version=2.3.3&app_build_number=323206&full_disk_encryption=false&manufacturer=Google&model=Pixel&' +
            'platform=Android&jailbroken=false&version=6.0&language=EN&customer_protocol=1',
        dataType: "text",
        async: false,
        success: function (data) {
            data = JSON.parse(data);
            ret = data;
        },
        error: function (data) {
            console.log("ERROR!");
            ret = null;
        }
    });
    return ret;
}

function generatePassword() {
    let actData = JSON.parse(get("activationData"));
    let hotpSecret = actData["hotp_secret"];
    let counter = parseInt(get("counter"));
    var hotp = new jsOTP.hotp();
    var hmacCode = hotp.getOtp(hotpSecret, counter);
    set("counter", counter + 1);
    return hmacCode;
}

function askForInfo() {
    alert("In a different browser, please navigate to your BoilerKey settings (htts://purdue.edu/boilerkey), and click 'Set up a new Duo Mobile BoilerKey')");
    alert("Follow the process until you see the QR code.");
    let code;
    while (!code) {
        var link = prompt("Paste the link (https://m-1b9bef70.duosecurity.com/activate/XXXXXXXXXXX) found under the QR code.");
        code = validateLink(link);
        if (!link) {
            alert("Invalid link. Please try again");
        } else {
            set("code", code);
        }
    }
    let pin;
    alert("In order to automatically login, please enter pin.");
    while (!pin || !(pin.match(/(\d{4})/) && pin.length === 4)) {
        pin = prompt("Enter BoilerKey PIN");
        if (pin.match(/(\d{4})/) && pin.length === 4) {
            set("pin", pin);
            let username = prompt("To automatically login, please enter your Purdue username.");
            set("username", username);
        } else if (!pin) {
            alert("No pin set.");
        } else {
            alert("Invalid pin, try again.");
        }
    }
    chrome.storage.sync.set({"pin": pin}, function () {
    });
    let actData = getActivationData();
    if (actData) {
        set("activationData", JSON.stringify(actData.response));
        set("counter", 0);
    }
}

function validateLink(link) {
    if (link.indexOf("m-1b9bef70.duosecurity.com")) {
        let chunks = link.split("/");
        if (chunks[chunks.length - 1].length === 20) {
            return chunks[chunks.length - 1];
        } else return false;
    } else return false;
}
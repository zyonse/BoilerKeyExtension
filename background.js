chrome.runtime.onMessage.addListener(function makeRequest(request, sender, sendResponse) {
    fetch(request.url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
    })
        .then(response => response.text())
        .then(text => sendResponse(text))
        .catch(error => console.log("Error"))
    return true;  // Will respond asynchronously.z;
})
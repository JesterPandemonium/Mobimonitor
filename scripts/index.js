let createNewMonitor = function() {
    fetch('/createNewRecord').then(data => {
        let link = window.location.href + data.id;
        let textbox = document.getElementById('link');
        textbox.value = link;
        let popup = document.getElementById('popup-container');
        popup.style.display = 'flex';
    }).catch(alert);
}

let copyLink = function() {
    // iOS workaround - works for iOS 10 and higher
    // https://stackoverflow.com/a/34046084
    let link = document.getElementById('link');
    link.select();
    link.contentEditable = true;
    link.readOnly = false;
    let range = document.createRange();
    range.selectNodeContents(link);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    link.setSelectionRange(0, 100); // large number to cover everything
    link.contentEditable = false;
    link.readOnly = true;
    document.execCommand('copy');
    selection.removeAllRanges();
    link.blur();
    let copyButton = document.querySelector('#link-container>button');
    copyButton.innerHTML = 'Link kopiert!';
    let unhover = function() {
        copyButton.innerHTML = 'Kopieren';
        copyButton.removeEventListener('mouseout', unhover);
    }
    copyButton.addEventListener('mouseout', unhover);
}

let redirect = function() {
    let link = document.getElementById('link').value;
    window.location.replace(link);
}
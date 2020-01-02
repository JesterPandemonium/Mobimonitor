let main = function () {
    let link = document.getElementById('link');
    let dest = window.location.pathname;
    link.href = dest.replace('info', 'data');
}

window.onload = main;
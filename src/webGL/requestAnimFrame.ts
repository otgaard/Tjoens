// Functions that require support for multiple browsers

// @ts-nocheck

const requestAnimFrame = (function() {
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) { // if none of the above, use non-native timeout method
            window.setTimeout(callback, 1000 / 60);
        };
})();

export default requestAnimFrame;
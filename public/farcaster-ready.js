(function () {
    function callReady() {
        try {
            const fc = window.farcaster?.miniapp?.actions;
            if (fc && typeof fc.ready === 'function') {
                console.log('✅ Farcaster MiniApp ready() called');
                fc.ready();
                return true;
            }
        } catch (e) {
            console.warn('⚠️ Farcaster ready() failed', e);
        }
        return false;
    }

    document.addEventListener('DOMContentLoaded', function () {
        let tries = 0;
        const iv = setInterval(function () {
            tries++;
            if (callReady() || tries > 25) clearInterval(iv);
        }, 200);
    });

    window.addEventListener('focus', callReady);
    setTimeout(callReady, 1500);
})();

// ==UserScript==
// @name         Time Clock Wizard Cleanup
// @namespace    http://tampermonkey.net/
// @version      0.137
// @description  Cleaning up the Wizard
// @author       Antonio Hidalgo
// @match        *://*.timeclockwizard.com/*
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @require      https://code.jquery.com/jquery-3.3.1.js
// @updateURL    https://www.hidalgocare.com/uploads/7/9/7/8/79788936/wizard-cleanup.js
// @downloadURL  https://www.hidalgocare.com/uploads/7/9/7/8/79788936/wizard-cleanup.js
// ==/UserScript==

/* globals jQuery GM_setValue GM_getValue GM_deleteValue GM_listValues */

(function() {

    let DURATION_GUARD_DISABLED = false;

    /* eslint-disable */
    function log(msg) {  console.log(msg);  }
    /* eslint-enable */

    (function clearClockOutValuesEachMorning() {
        let now = new Date();
        let hours = now.getHours();
        log("looking to purge.");
        if(hours < 9) {
            log("Early morning, so time to purge clockout values:");
            let keys = GM_listValues();
            for (let key of keys) {
                log(key);
                GM_deleteValue(key);
            }
        }
    }());

    // We need to hide logged-in clock buttons as we are not guarding them right now.
    (function hideDashboardClockButtons() {
        var dash_clock_buttons = jQuery("div#dasboard-btn").find("a#clock_out_link, a#clock_in_link");
        dash_clock_buttons.hide();
    }());

    function getUserNameInput() { return jQuery("input#UserName");}
    function getLoginForm() { return jQuery("form[action='/Login']");}

    function isLoginPage() {
        return getLoginForm().length;
    }

    function getPasswordField() { return jQuery("input#Password"); }
    function getTimeStringFromDate(date) {
        /* eslint-disable */
        return date.getHours() + ":" + (date.getMinutes() < 10 ? "0": "") + date.getMinutes();
        /* eslint-enable */
    }
    function isUnexpectedTimeToClockOut() {
        let now = new Date();
        return (now.getHours() == 14 && now.getMinutes() > 15) || (now.getHours == 15 && now.getMinutes() < 50);
    }

    function playAlert() {
        // https://stackoverflow.com/questions/50490304/how-to-make-audio-autoplay-on-chrome
        // blocks audio
        // Common sounds:
        //let alarm = "https://d1490khl9dq1ow.cloudfront.net/sfx/mp3preview/outdoor-alarm-sound-looping_zkLnXr4O.mp3";
        let security = "https://d1490khl9dq1ow.cloudfront.net/sfx/mp3preview/hospital-pa-system-speaker-voice-clip-male-security-to-the-er_z1keyDNd.mp3";

        function soundToFrame(sound) { return '<iframe src="' + sound + '" type="audio/mpeg" allow="autoplay" style="display:none"></iframe>'; }
        function getRandomInt(max) { return Math.floor(Math.random() * Math.floor(max)); }
        let INIT_DELAY_SECS = 35.0;
        function addSoundWithDelay(sound, delaySecs) { setTimeout(() => {jQuery("body").append(soundToFrame(sound)); }, delaySecs * 1000); }
        function vampSecurity() {
            // 5 sec
            let vamp = "https://d1490khl9dq1ow.cloudfront.net/music/mp3preview/maxs-vamp-bridge-1_MkpWHZS_.mp3";
            addSoundWithDelay(vamp, INIT_DELAY_SECS);
            addSoundWithDelay(security, INIT_DELAY_SECS + 5.0);
        }
        function strutSecurity() {
            // 6 sec
            let strut = "https://d1490khl9dq1ow.cloudfront.net/music/mp3preview/walk-it-out_G1NNImHO.mp3";
            addSoundWithDelay(strut, INIT_DELAY_SECS);
            addSoundWithDelay(security, INIT_DELAY_SECS + 5.6);
        }
        function strollSecurity() {
            // 7 sec
            let stroll = "https://d1490khl9dq1ow.cloudfront.net/music/mp3preview/strolling-along_fyV0ifBu.mp3";
            addSoundWithDelay(stroll, INIT_DELAY_SECS);
            addSoundWithDelay(security, INIT_DELAY_SECS + 5.7);
        }
        function exitSecurity() {
            // 12 sec
            let exit_music = "https://d1490khl9dq1ow.cloudfront.net/music/mp3preview/exit-stage-right-cut-to-commercial-tv-theme_z1QvMgSO.mp3";
            addSoundWithDelay(exit_music, INIT_DELAY_SECS);
            addSoundWithDelay(security, INIT_DELAY_SECS + 12);
        }

        let jukebox = new Map();
        jukebox.set(0, vampSecurity);
        jukebox.set(1, strutSecurity);
        jukebox.set(2, strollSecurity);
        jukebox.set(3, exitSecurity);

        let choice = getRandomInt(jukebox.size);
        log("choice is " + choice);
        jukebox.get(choice)();
    }

    (function guardForLunchBreakDuration() {
        var username = getUserNameInput().val();

        jQuery("button#btnLocationClockout").click(function handleClockOutClick(event) { // eslint-disable-line
            //event.preventDefault();
            var now = new Date();
            log("At clock out, time is " + getTimeStringFromDate(now));
            log("Setting value " + username + " to " + now.getTime());
            GM_setValue(username, now.getTime());

            if (isUnexpectedTimeToClockOut()) {
                playAlert();
            }
        });

        function isLunchHour(now) {
            let hours = now.getHours();
            return (hours > 11 && hours < 16);
        }

        function passwordIsEmpty() { return getPasswordField().val().trim().length == 0; }

        jQuery("button[value=ClockIn]").click(function handleClockInClick(event) {
            //event.preventDefault();
            let now = new Date();
            if(DURATION_GUARD_DISABLED) {
                log("duration feature disabled");
            } else if(passwordIsEmpty()) {
                log("invalid password so defer to app.");
            } else if(!isLunchHour(now)) {
                log("Not a lunch hour, so person gets a pass.");
            } else {
                var user = getUserNameInput().val();
                var stored_clockout = GM_getValue(user);
                log("Getting value " + user + ". Is " + stored_clockout);
                let no_clockout_stored_today_on_this_machine = !stored_clockout;
                if(no_clockout_stored_today_on_this_machine) {
                    log("We don't know where they clocked out. Forgiving.");
                } else {
                    // Clock-Out time is here for analysis
                    var clock_out_millis = stored_clockout;
                    log("At clock in, time is " + now.getTime() + " or " + getTimeStringFromDate(now));
                    let millis_away = now.getTime() - clock_out_millis;
                    let _40_MINUTES_MILLIS = 40 * 60 * 1000;
                    let MIN_BREAK_TIME_MILLIS = _40_MINUTES_MILLIS;
                    let break_is_still_too_short = (millis_away < MIN_BREAK_TIME_MILLIS);
                    var seconds_away = millis_away / 1000;
                    var minutes_away = Math.floor(seconds_away / 60);
                    if(break_is_still_too_short) {
                        event.preventDefault();
                        log("Too short");
                        let verbiage = "You are only " + minutes_away + " minutes into your lunch break. Please try again later. ";
                        let too_early_popup_alert = makeErrorPopup(verbiage);
                        loadAndPlacePopup(too_early_popup_alert, 5250);
                    } else {
                        // Good break.
                        log("Good break after " + millis_away + " millis or " + minutes_away + " minutes.");
                    }
                }
            }
        });
    }());

    function makeErrorPopup(verbiage) {
        var height = jQuery(window).height();
        var width = jQuery(window).width();
        var popup = jQuery('<div id="jError" style="opacity: 1; z-index: 10000; min-width: 200px; top: ' + (Math.floor(height/5)+0) + 'px; left: ' + (Math.floor(width/5)+0) + 'px; cursor: pointer;"><a style="float: right; margin-top:-17px;margin-right:-14px;" href="#" class="clockbuttoncss"><img src="/img/cancel.png"></a>' + verbiage + '</div>');
        return popup;
    }

    function loadAndPlacePopup(popup, fadeOutDelay) {
        function clearPasswordField() {
            getPasswordField().val('');
        }
        var CLOSE_WINDOW_SELECTOR = "a.clockbuttoncss";
        var target = getLoginForm(); //jQuery("div#jOverlay");
        log("Found target? " + target.length);
        if(target.length) {
            popup.hide().insertAfter(target).fadeIn();
        }
        popup.find(CLOSE_WINDOW_SELECTOR).click((event) => {
            let the_popup = jQuery(event.delegateTarget).parent();
            the_popup.fadeOut();
        } );
        setTimeout(() => clearPasswordField(), fadeOutDelay - 1500);
        setTimeout(() => popup.fadeOut(), fadeOutDelay);
        setTimeout(() => popup.remove(), fadeOutDelay + 2750);
    }

    (function cleanClockInScreen() {
        (function setLocationToSoleValue() {
            let clock_in_select = jQuery("select#ddlLocation");
            if(clock_in_select.length) {
                let options_with_value = clock_in_select.find("option[value]");
                if(options_with_value.length) {
                    let last_option_value = options_with_value.last().attr("value");
                    clock_in_select.val(last_option_value);
                }
            }
        }());
    }());

    /*
    Camera-on in tab prevents Windows Hello from using camera.
    */
    (function cleanCameraLeakForWindowsHello() {

        let WARNING_DELAY_SECS = 90;
        if(isLoginPage()) {
            setTimeout(function() {
                let verbiage = "Closing the inactive Wizard page soon.  Please save your work now.";
                let page_refresh_warning = makeErrorPopup(verbiage);
                loadAndPlacePopup(page_refresh_warning, 10 * 1000);
            }, WARNING_DELAY_SECS * 1000);

            // Close Timeclock tab after a while
            setTimeout(function() {
                log ("TCW: Ready to Close.");
                window.close();
                log ("TCW: Closed.");
            }, (WARNING_DELAY_SECS + 15) * 1000);
            setTimeout(function() {
                location.reload();
                log ("TCW: Reloaded as backup fix.");
            }, (WARNING_DELAY_SECS + 25) * 1000);
        }

    }());

})();

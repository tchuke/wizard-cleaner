// ==UserScript==
// @name         Time Clock Wizard Cleanup
// @namespace    http://tampermonkey.net/
// @version      0.147
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

    /* eslint-disable */
    function log(...msg) {  console.log(...msg);  }
    /* eslint-enable */

    (function clearClockActionTimesPeriodically() {
        let now = new Date();
        let theDay = now.getDay();
        let theHour = now.getHours();
        const FRIDAY = 5;
        log("looking to purge.");
        let isLateFriday = (theDay === FRIDAY && theHour > 16);
        if (isLateFriday) {
            log("Early Friday evening, so time to purge clock action values:");
            let keys = GM_listValues();
            for (let key of keys) {
                log(key);
                GM_deleteValue(key);
            }
        }
    }()); // End of clearClockActionTimesPeriodically() and invoke

    // We need to hide logged-in clock buttons as we are not guarding them right now.
    (function hideDashboardClockButtons() {
        let dash_clock_buttons = jQuery("div#dasboard-btn").find("a#clock_out_link, a#clock_in_link");
        dash_clock_buttons.hide();
    }());

    function getUserNameInput() { return jQuery("input#UserName"); }
    function getPasswordField() { return jQuery("input#Password"); }
    function passwordIsEmpty() { return getPasswordField().val().trim().length === 0; }

    const MILLIS_IN_SEC = 1000;
    const SECS_IN_MINUTE = 60;

    function playAlert() {
        // https://stackoverflow.com/questions/50490304/how-to-make-audio-autoplay-on-chrome
        // blocks audio
        // Common sounds:
        const alarm = "https://d1490khl9dq1ow.cloudfront.net/sfx/mp3preview/outdoor-alarm-sound-looping_zkLnXr4O.mp3";
        const security = "https://d1490khl9dq1ow.cloudfront.net/sfx/mp3preview/hospital-pa-system-speaker-voice-clip-male-security-to-the-er_z1keyDNd.mp3";

        function soundToFrame(sound) { return '<iframe src="' + sound + '" type="audio/mpeg" allow="autoplay" style="display:none"></iframe>'; }
        function getRandomInt(max) { return Math.floor(Math.random() * Math.floor(max)); }

        const INIT_DELAY_SECS = 35.0;
        function addSoundWithDelay(sound, delaySecs, prob) {
            if (!prob || Math.random() < prob) {
                setTimeout(() => { jQuery("body").append(soundToFrame(sound)); }, delaySecs * MILLIS_IN_SEC);
            }
        }
        function vampSecurity() {
            // 5 sec
            let vamp = "https://d1490khl9dq1ow.cloudfront.net/music/mp3preview/maxs-vamp-bridge-1_MkpWHZS_.mp3";
            addSoundWithDelay(vamp, INIT_DELAY_SECS);
            addSoundWithDelay(security, INIT_DELAY_SECS + 5.0);
            addSoundWithDelay(alarm, INIT_DELAY_SECS + 7.3, 2 / 5);
        }
        function strutSecurity() {
            // 6 sec
            let strut = "https://d1490khl9dq1ow.cloudfront.net/music/mp3preview/walk-it-out_G1NNImHO.mp3";
            addSoundWithDelay(strut, INIT_DELAY_SECS);
            addSoundWithDelay(security, INIT_DELAY_SECS + 5.6);
            addSoundWithDelay(alarm, INIT_DELAY_SECS + 7.9, 2 / 5);
        }
        function strollSecurity() {
            // 7 sec
            let stroll = "https://d1490khl9dq1ow.cloudfront.net/music/mp3preview/strolling-along_fyV0ifBu.mp3";
            addSoundWithDelay(stroll, INIT_DELAY_SECS);
            addSoundWithDelay(security, INIT_DELAY_SECS + 5.7);
            addSoundWithDelay(alarm, INIT_DELAY_SECS + 8.9, 2 / 5);
        }
        function exitSecurity() {
            // 12 sec
            let exit_music = "https://d1490khl9dq1ow.cloudfront.net/music/mp3preview/exit-stage-right-cut-to-commercial-tv-theme_z1QvMgSO.mp3";
            addSoundWithDelay(exit_music, INIT_DELAY_SECS);
            addSoundWithDelay(security, INIT_DELAY_SECS + 12);
            addSoundWithDelay(alarm, INIT_DELAY_SECS + 6.0, 1 / 2);
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

    function getClockInKey(username) { return username + "-in"; }
    function getClockOutKey(username) { return username + "-out"; }

    (function warnClockingOutUserOfDefaultBreakInProgress() {
        let clockoutButton = jQuery("button#btnLocationClockout");
        if (clockoutButton.length) {
            let username = getUserNameInput().val();
            let clockInTime = GM_getValue(getClockInKey(username));
            if (isNaN(clockInTime)) {
                log("no clock in time found for this user.");
                return;
            }
            let clockOutTime = GM_getValue(getClockOutKey(username));
            let isAlreadyClockedOut = !isNaN(clockOutTime) && (clockOutTime > clockInTime);
            if (isAlreadyClockedOut) {
                log("user appears to not be clocked in, so skipping clock-out test.");
                return;
            }
            log("user is clocked in, so proceeding with clock-out test.");
            let clockingOutDate = new Date();
            let clockInDate = new Date();
            clockInDate.setTime(clockInTime);
            let userClockedInToday = (clockInDate.getDate() === clockingOutDate.getDate());
            if (userClockedInToday) {
                const BREAK_TRIGGER_HOURS = 5;
                const MINS_IN_HOUR = 60;
                const HOURS_ON_CLOCK = 12;
                const BREAK_TRIGGER_HOURS_MILLIS = BREAK_TRIGGER_HOURS * SECS_IN_MINUTE * MINS_IN_HOUR * MILLIS_IN_SEC;
                const duration_clocked_in = clockingOutDate - clockInTime;
                if (duration_clocked_in > BREAK_TRIGGER_HOURS_MILLIS) {
                    let break_warn = jQuery('<h4 class="hidalgo_breakwarn">Default Lunch Break in Progress</h4>');
                    break_warn.css("color", "red").css("margin-top", "-10px").css("margin-bottom", "24px");
                    jQuery("div.modal-body").prepend(break_warn);
                    let clockinHour = clockInDate.getHours();
                    let clockinMinutes = clockInDate.getMinutes();
                    let breakTriggerHour = (clockinHour + BREAK_TRIGGER_HOURS) % HOURS_ON_CLOCK;
                    jQuery("textarea#txtClockInNote").val(`At ${breakTriggerHour}:${clockinMinutes}, ${BREAK_TRIGGER_HOURS}` +
                                                          " hours after clock-in, I started my default, 1.2 hour lunch break.");
                    clockoutButton.text("Clock Out for Today, " + username);
                }
            } else {
                log("user did not clock in today, so skipping clock-out test.");
            }
        }
    }());

    const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
        "hour": "2-digit",
        "hour12": true,
        "minute": "2-digit",
        "second": "2-digit"
    });

    (function tallySuccessfulClockActions() {

        function isUnexpectedTimeToClockOut() {

            function isEarlyAM(now) {
                return now.getHours() < 11 || (now.getHours() === 11 && now.getMinutes() < 40);
            }
            function isAfterLunchHour(now) {
                return (now.getHours() === 13 && now.getMinutes() > 32) || now.getHours() > 13;
            }
            function isTooEarlyToLeaveForTheDay(now) {
                return now.getHours() < 16;
            }

            let time = new Date();
            return isEarlyAM(time) || (isAfterLunchHour(time) && isTooEarlyToLeaveForTheDay(time));
        }

        const username = getUserNameInput().val(); // Needs to be read early.

        function doOnClockActionCompletion(success_fun, fail_fun) {
            setTimeout(() => {
                let jSuccess_count_after = jQuery("div#jSuccess:visible").length;
                log("success after: " + jSuccess_count_after);
                if (jSuccess_count_after) {
                    success_fun();
                } else {
                    fail_fun();
                }
            }, 2500);
        }

        jQuery("button#btnLocationClockout").click(function handleClockOutClick() {
            let now = new Date();
            let clockoutTime = now.getTime();
            log("At clock out, time is " + TIME_FORMATTER.format(now));

            if (isUnexpectedTimeToClockOut()) {
                playAlert();
            }
            doOnClockActionCompletion(
                () => { log(`Setting value ${getClockOutKey(username)} to ${clockoutTime}`); GM_setValue(getClockOutKey(username), clockoutTime); },
                () => { log("After hitting clock out, no success message on the page, so presuming failed clockout."); }
            );
        });

        jQuery("button#btnLocationClockin").click(function handleClockInClick() {
            let now = new Date();
            let clockinTime = now.getTime();
            log("At clock in, time is " + TIME_FORMATTER.format(now));

            doOnClockActionCompletion(
                () => { log(`Setting value ${getClockInKey(username)} to ${clockinTime}`); GM_setValue(getClockInKey(username), clockinTime); },
                () => { log("After hitting clock out, no success message on the page, so presuming failed clockout."); }
            );
        });
    }()); // End of tallySuccessfulClockActions() and invoke

    // HELPER FUNCTIONS invoked in multiple places:
    function getLoginForm() { return jQuery("form[action='/Login']"); }
    function isLoginPage() {
        return getLoginForm().length;
    }

    function makeErrorPopup(verbiage) {
        let height = jQuery(window).height();
        let width = jQuery(window).width();
        let popup = jQuery('<div id="jError" style="opacity: 1; z-index: 10000; min-width: 200px; top: ' +
                           `${Math.floor(height / 5) + 0}px; left: ${Math.floor(width / 5) + 0}px;` +
                           ' cursor: pointer;"><a style="float: right; margin-top:-17px;margin-right:-14px;" ' +
                           `href="#" class="clockbuttoncss"><img src="/img/cancel.png"></a>${verbiage}</div>`);
        return popup;
    }

    function loadAndPlacePopup(popup, fadeOutDelay) {

        function clearPasswordField() {
            getPasswordField().val('');
        }
        const CLOSE_WINDOW_SELECTOR = "a.clockbuttoncss";
        let target = getLoginForm();
        log("Found target? " + target.length);
        if (target.length) {
            popup.hide().insertAfter(target).fadeIn();
        }
        popup.find(CLOSE_WINDOW_SELECTOR).click(event => {
            let the_popup = jQuery(event.delegateTarget).parent();
            the_popup.fadeOut();
        });
        setTimeout(() => clearPasswordField(), fadeOutDelay - 1500);
        setTimeout(() => popup.fadeOut(), fadeOutDelay);
        setTimeout(() => popup.remove(), fadeOutDelay + 2750);
    }

    (function guardForLunchBreakDuration() {

        function isLunchHour(now) {
            let hours = now.getHours();
            return (hours > 11 && hours < 16);
        }

        jQuery("button[value=ClockIn]").click(function handleClockInClick(event) {
            let now = new Date();
            if (passwordIsEmpty()) {
                log("invalid password so defer to app.");
            } else if (!isLunchHour(now)) {
                log("Not a lunch hour, so person gets a pass.");
            } else {
                let user = getUserNameInput().val();
                let stored_clockout = GM_getValue(getClockOutKey(user));
                log(`Getting value ${getClockOutKey(user)}. Is ${stored_clockout}`);
                let no_clockout_stored_today_on_this_machine = isNaN(stored_clockout);
                if (no_clockout_stored_today_on_this_machine) {
                    log("We don't know where they clocked out. Forgiving.");
                } else {
                    // Clock-Out time is here for analysis
                    let clock_out_millis = stored_clockout;
                    log(`At clock in, time is ${now.getTime()} or ${TIME_FORMATTER.format(now)}`);
                    let millis_away = now.getTime() - clock_out_millis;
                    const MIN_BREAK_TIME_MINUTES = 40;
                    let seconds_away = millis_away / MILLIS_IN_SEC;
                    const SECS_FUDGE_FOR_TENTHS_PRECISION_LOSS = SECS_IN_MINUTE;
                    let seconds_away_adj = seconds_away - SECS_FUDGE_FOR_TENTHS_PRECISION_LOSS;
                    let minutes_away = Math.abs(Math.trunc(seconds_away_adj / SECS_IN_MINUTE));
                    let break_is_still_too_short = (minutes_away < MIN_BREAK_TIME_MINUTES);
                    if (break_is_still_too_short) {
                        event.preventDefault();
                        log("Too short");
                        let verbiage = `You are only ${minutes_away} minutes into your lunch break. Please try again later. `;
                        let too_early_popup_alert = makeErrorPopup(verbiage);
                        loadAndPlacePopup(too_early_popup_alert, 5250);
                    } else {
                        // Good break.
                        log(`Good break after ${seconds_away_adj} secs or ${minutes_away} minutes.`);
                    }
                }
            }
        });
    }()); // End of guardForLunchBreakDuration() and invoke

    (function guardForEarlyClockIn() {
        function isTooEarlyInMorning(now) {
            let hours = now.getHours();
            let mins = now.getMinutes();
            return (hours < 8 || (hours === 8 && mins < 40));
        }

        jQuery("button[value=ClockIn]").click(function handleClockInClick(event) {
            const now = new Date();
            if (isTooEarlyInMorning(now)) {
                event.preventDefault();
                log("Too early");
                let verbiage = "The morning shift has not yet begun.  Please arrive at shift start time for clock-in.";
                let too_early_popup_alert = makeErrorPopup(verbiage);
                loadAndPlacePopup(too_early_popup_alert, 5250);
            }
        });
    }()); // End of guardForEarlyClockIn() and invoke

    (function setLocationToSoleValue() {
        let clock_in_select = jQuery("select#ddlLocation");
        if (clock_in_select.length) {
            let options_with_value = clock_in_select.find("option[value]");
            if (options_with_value.length) {
                let last_option_value = options_with_value.last().attr("value");
                clock_in_select.val(last_option_value);
            }
        }
    }());

    /*
    Camera-on in tab prevents Windows Hello from using camera.
    */
    (function cleanCameraLeakForWindowsHello() {

        const WARNING_DELAY_SECS = 90;
        if (isLoginPage()) {
            setTimeout(() => {
                let verbiage = "Closing the inactive Wizard page soon.  Please save your work now.";
                let page_refresh_warning = makeErrorPopup(verbiage);
                loadAndPlacePopup(page_refresh_warning, 10 * MILLIS_IN_SEC);
            }, WARNING_DELAY_SECS * MILLIS_IN_SEC);

            // Close Timeclock tab after a while
            setTimeout(() => {
                log("TCW: Ready to Close.");
                window.close();
                log("TCW: Closed.");
            }, (WARNING_DELAY_SECS + 15) * MILLIS_IN_SEC);
            setTimeout(() => {
                location.reload();
                log("TCW: Reloaded as backup fix.");
            }, (WARNING_DELAY_SECS + 25) * MILLIS_IN_SEC);
        }
    }()); // End of cleanCameraLeakForWindowsHello() and invoke

}()); // End of original jQuery ready

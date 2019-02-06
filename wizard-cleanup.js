// ==UserScript==
// @name         Time Clock Wizard Cleanup
// @namespace    http://tampermonkey.net/
// @version      0.13
// @description  Cleaning up the Wizard
// @author       Antonio Hidalgo
// @match        *://*.timeclockwizard.com/*
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @require      https://code.jquery.com/jquery-3.3.1.js
// ==/UserScript==

/* globals jQuery GM_setValue GM_getValue GM_deleteValue GM_listValues */

(function() {

    let DURATION_GUARD_DISABLED = false;
/*eslint-disable */
    function log(msg) { console.log(msg); }
/*eslint-enable */

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

    function getUserNameInput() { return jQuery("input#UserName:visible");}
    function getLoginForm() { return jQuery("form[action='/Login']");}

    function isLoginPage() {
        return getLoginForm().length;
    }

    (function guardForLunchBreakDuration() {

        jQuery("button[value=ClockOut]").click(function handleClockOutClick() {
            //event.preventDefault();
            var username = getUserNameInput().val();
            var now = new Date();
            log("At clock out, time is " + now.getTime() + " or " + now.getHours() + ":" + now.getMinutes());
            log("Setting value " + username + " to " + now.getTime());
            GM_setValue(username, now.getTime());
            var stored_clockout = GM_getValue(username);
            log("in clockout, re-Getting value " + username + ". Is " + stored_clockout);
        });

        function isLunchHour(now) {
            let hours = now.getHours();
            return (hours > 11 && hours < 16);
        }

        function isPMShiftWorker(username, now) {
            let is_pm_start_time = (now.getHours() == 13 && now.getMinutes() > 45) || (now.getHours() == 14 && now.getMinutes() < 10);
            let is_pm_worker = username == "mmoreno";
            let FRIDAY = 5;
            let is_pm_day = now.getDay() == FRIDAY;
            return is_pm_worker && is_pm_start_time && is_pm_day;
        }

        jQuery("button[value=ClockIn]").click(function handleClockInClick(event) {
            //event.preventDefault();
            let now = new Date();
            if(DURATION_GUARD_DISABLED) {
                log("duration feature disabled");
            } else if(!isLunchHour(now)) {
                log("Not a lunch hour, so person gets a pass.");
            } else {
                var username = getUserNameInput().val();
                var stored_clockout = GM_getValue(username);
                log("Getting value " + username + ". Is " + stored_clockout);
                let no_clockout_stored_today_on_this_machine = !stored_clockout;
                if(no_clockout_stored_today_on_this_machine) {
                    if(isPMShiftWorker(username, now)) {
                        // TODO Sketchy logic!!!!  Perhaps have these people ask for a manual check-in.
                        // Could be a way to check the Wizard schedule.
                        log("Not an all-day worker, so person gets a pass.");
                    } else {
                        event.preventDefault();
                        log("We don't know where they clocked out.");
                        let verbiage = "To clock in, you must be at the same desktop and user where you clocked out.";
                        let wrong_desktop_alert = make_error_popup(verbiage);
                        loadAndPlacePopup(wrong_desktop_alert, 5250);
                    }
                } else {
                    // Clock-Out time is here for analysis
                    var clock_out_millis = stored_clockout;
                    log("At clock in, time is " + now.getTime() + " or " + now.getHours() + ":" + now.getMinutes());
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
                        let too_early_popup_alert = make_error_popup(verbiage);
                        loadAndPlacePopup(too_early_popup_alert, 5250);
                    } else {
                        // Good break.
                        log("Good break after " + millis_away + " millis or " + minutes_away + " minutes.");
                    }
                }
            }
        });
    }());

    function make_error_popup(verbiage) {
        var height = jQuery(window).height();
        var width = jQuery(window).width();
        var popup = jQuery('<div id="jError" style="opacity: 1; min-width: 200px; top: ' + (Math.floor(height/5)+0) + 'px; left: ' + (Math.floor(width/5)+0) + 'px; cursor: pointer;"><a style="float: right; margin-top:-17px;margin-right:-14px;" href="#" class="clockbuttoncss"><img src="/img/cancel.png"></a>' + verbiage + '</div>');
        return popup;
    }

    function loadAndPlacePopup(popup, fadeOutDelay) {
    function clearPasswordField() {
        jQuery("input#Password").val('');
    }
        var CLOSE_WINDOW_SELECTOR = "a.clockbuttoncss";
        var target = getLoginForm(); //jQuery("div#jOverlay");
        log("Found target? " + target.length);
        popup.hide().insertAfter(target).fadeIn();
        popup.find(CLOSE_WINDOW_SELECTOR).click((event) => {
            log("trying to remove popup on a click.");
            let the_popup = jQuery(event.delegateTarget).parent();
            the_popup.fadeOut();
        } );
        setTimeout(() => clearPasswordField(), fadeOutDelay - 1500);
        setTimeout(() => popup.fadeOut(), fadeOutDelay);
        setTimeout(() => popup.remove(), fadeOutDelay + 2750);
    }

    /*
    Camera-on in tab prevents Windows Hello from using camera.
    */
    (function cleanCameraLeakForWindowsHello() {

        if(isLoginPage()) {
            setTimeout(function() {
                let verbiage = "Closing the inactive Wizard page soon.  Please save your work now.";
                let page_refresh_warning = make_error_popup(verbiage);
                loadAndPlacePopup(page_refresh_warning, 10 * 1000);
            }, 60 * 1000);

            // Close Timeclock tab after a while
            setTimeout(function() {
                log ("TCW: Ready to Close.");
                //location.reload();
                window.close();
                log ("TCW: Closed.");
            }, 75 * 1000);
        }
    }());

    // TODO: is camera in use?
    // https://stackoverflow.com/questions/42212214/how-to-check-with-javascript-that-webcam-is-being-used-in-chrome

})();

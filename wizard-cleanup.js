// ==UserScript==
// @name         Time Clock Wizard Cleanup
// @namespace    http://tampermonkey.net/
// @version      0.161
// @description  Cleaning up the Wizard
// @author       Antonio Hidalgo
// @match        *://*.timeclockwizard.com/*
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_openInTab
// @require      https://code.jquery.com/jquery-3.3.1.js
// @updateURL    https://www.hidalgocare.com/uploads/7/9/7/8/79788936/wizard-cleanup.js
// @downloadURL  https://www.hidalgocare.com/uploads/7/9/7/8/79788936/wizard-cleanup.js
// ==/UserScript==

/* globals jQuery GM_setValue GM_getValue GM_deleteValue GM_listValues GM_openInTab */

(function () {

    /* eslint-disable */
    function log(...msg) { console.log(...msg); }
    /* eslint-enable */

    (function cleanTimeOffRequest() {

        function handleNoteEdits() {

            jQuery(".modal-title").text("ADD ABSENCE REQUEST");

            jQuery("input#txtStartTime").val("09:00 AM");
            jQuery("input#txtEndTime").val("05:00 PM");

            const usePtoRadioButtons = jQuery("div#addtimeOff");
            usePtoRadioButtons.hide();

            const absenceNote = jQuery("textArea#txtaAbsenceNote");
            absenceNote.prop("placeholder", "Explain to Doctor specifically what you are taking time off for ...");

            const addAbsenceButton = jQuery("button#btnabsencepopupSave");
            addAbsenceButton.text("REQUEST TIME OFF");
            addAbsenceButton.prop('disabled', true);

            function noteHasEnoughContent() {
                return absenceNote.val().trim().length > 8;
            }

            function noteHasNoGenericWords() {
                let note = absenceNote.val().toLowerCase();
                let hasGenericWords = note.includes("personal") || note.includes("time off") || note.includes("commit");
                return !hasGenericWords;
            }

            absenceNote.on("change mouseleave", () => {
                if (noteHasEnoughContent() && noteHasNoGenericWords()) {
                    //log("On CHANGE, form is error-free.");
                    addAbsenceButton.removeAttr("disabled");
                } else {
                    //log("On CHANGE, form has error.");
                    addAbsenceButton.prop('disabled', true);
                }
            });
        } // End of handleNoteEdits()

        const addTimeOffButton = jQuery("a#add_task_link");
        const waitForRenderMillis = 1000;
        addTimeOffButton.click(() => setTimeout(handleNoteEdits, waitForRenderMillis));

    }()); // End of cleanTimeOffRequest() and invoke

    (function cleanAddTimeRecord() {

        function handleNoteEditing() {

            const timeRecordNote = jQuery("textarea#txtNoteClocked");
            timeRecordNote.prop("placeholder", "Explain to Doctor why you need to manually add a time record ...");

            const addTimeRequestButton = jQuery("button#btntimesheetpopupSave");
            addTimeRequestButton.prop('disabled', true);

            function noteHasEnoughContent() {
                return timeRecordNote.val().trim().length > 8;
            }

            function noteHasNoGenericWords() {
                let note = timeRecordNote.val().toLowerCase();
                let hasGenericWords = note.includes("personal");
                return !hasGenericWords;
            }

            timeRecordNote.on("change mouseleave", () => {
                if (noteHasEnoughContent() && noteHasNoGenericWords()) {
                    //log("On CHANGE, form is error-free.");
                    addTimeRequestButton.removeAttr("disabled");
                } else {
                    //log("On CHANGE, form has error.");
                    addTimeRequestButton.prop('disabled', true);
                }
            });
        } // End of handleNoteEditing()

        const addTimeRecordButton = jQuery("a#add_task_link_two");
        const waitForRenderMillis = 1000;
        addTimeRecordButton.click(() => setTimeout(handleNoteEditing, waitForRenderMillis));

    }()); // End of cleanAddTimeRecord() and invoke

    (function clearClockActionTimesPeriodically() {
        let now = new Date();
        let theDay = now.getDay();
        let theHour = now.getHours();
        const FRIDAY = 5;
        let isLateFriday = (theDay === FRIDAY && theHour > 16);
        if (isLateFriday) {
            log("Early Friday evening, so time to purge clock action values:");
            let keys = GM_listValues();
            for (let key of keys) {
                log(key);
                GM_deleteValue(key);
            }
        } else {
            log("looking to purge, but it is not the right time.");
        }
    }()); // End of clearClockActionTimesPeriodically() and invoke

    // We need to hide logged-in clock buttons as we are not guarding them right now.
    (function hideDashboardClockButtons() {
        let dashClockButtons = jQuery("div#dasboard-btn").find("a#clock_out_link, a#clock_in_link");
        dashClockButtons.hide();
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

        function soundToAudio(sound) {
            return `<audio id="player" autoplay><source src="${sound}" type="audio/mp3"></audio>`;
        }

        function getRandomInt(max) { return Math.floor(Math.random() * Math.floor(max)); }

        const INIT_DELAY_SECS = 35.0;

        if (Math.random() < (1 / 8)) {
            const policeTheme = "https://www.youtube.com/watch?v=Jm_t3g4RhpY";
            setTimeout(() => GM_openInTab(policeTheme, false), INIT_DELAY_SECS * MILLIS_IN_SEC);
            return;
        }

        function addSoundWithDelay(sound, delaySecs, prob) {
            if (!prob || Math.random() < prob) {
                if (prob) {
                    log("with special!");
                }
                setTimeout(() => {
                    log(`playing sound '${sound}' NOW`);
                    jQuery("body").append(soundToAudio(sound));
                }, delaySecs * MILLIS_IN_SEC);
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
            let exitMusic = "https://d1490khl9dq1ow.cloudfront.net/music/mp3preview/exit-stage-right-cut-to-commercial-tv-theme_z1QvMgSO.mp3";
            addSoundWithDelay(exitMusic, INIT_DELAY_SECS);
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

    const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
        "hour": "2-digit",
        "hour12": true,
        "minute": "2-digit",
        "second": "2-digit"
    });

    (function warnClockingOutUserOfDefaultBreakInProgress() {
        let clockoutButton = jQuery("button#btnLocationClockout");
        if (clockoutButton.length) {
            let username = getUserNameInput().val();
            let lastClockInTime = GM_getValue(getClockInKey(username));
            if (isNaN(lastClockInTime)) {
                log(`no clock in time found for this user '${username}'.`);
                return;
            }
            let lastClockOutTime = GM_getValue(getClockOutKey(username));
            let isAlreadyClockedOut = (lastClockOutTime > lastClockInTime);
            if (isAlreadyClockedOut) {
                log("user appears to not be clocked in, so skipping clock-out test.");
                return;
            }
            log("user is clocked in, so proceeding with clock-out test.");
            const BREAK_TRIGGER_HOURS = 5;
            const MINS_IN_HOUR = 60;
            const BREAK_TRIGGER_HOURS_MILLIS = BREAK_TRIGGER_HOURS * SECS_IN_MINUTE * MINS_IN_HOUR * MILLIS_IN_SEC;

            const durationClockedIn = Date.now() - lastClockInTime;
            if (durationClockedIn > BREAK_TRIGGER_HOURS_MILLIS) {
                let breakWarn = jQuery('<h4 class="hidalgo_breakwarn">Default Lunch Break in Progress</h4>');
                breakWarn.css("color", "red").css("margin-top", "-10px").css("margin-bottom", "24px");
                jQuery("div.modal-body").prepend(breakWarn);
                let expired = new Date(lastClockInTime);
                expired.setHours(new Date(lastClockInTime).getHours() + BREAK_TRIGGER_HOURS);
                jQuery("textarea#txtClockInNote").val(`At ${TIME_FORMATTER.format(expired)}, ${BREAK_TRIGGER_HOURS}` +
                    " hours after clock-in, I started my default, 1.2 hour lunch break.");
                clockoutButton.text("Clock Out for Today, " + username);
            }
        }
    }());

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
        log("Found target for popup? " + target.length);
        if (target.length) {
            popup.hide().insertAfter(target).fadeIn();
            popup.find(CLOSE_WINDOW_SELECTOR).click(event => {
                let thePopup = jQuery(event.delegateTarget).parent();
                thePopup.fadeOut();
            });
            setTimeout(() => clearPasswordField(), fadeOutDelay - 1500);
            setTimeout(() => popup.fadeOut(), fadeOutDelay);
            setTimeout(() => popup.remove(), fadeOutDelay + 2750);
        }
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
                let storedClockout = GM_getValue(getClockOutKey(user));
                log(`Getting value ${getClockOutKey(user)}. Is ${storedClockout}`);

                let noClockoutStoredTodayOnThisMachine = isNaN(storedClockout);
                if (noClockoutStoredTodayOnThisMachine) {
                    log("We don't know where they clocked out. Forgiving.");
                } else {
                    // Clock-Out time is here for analysis
                    log(`At clock in, time is ${now.getTime()} or ${TIME_FORMATTER.format(now)}`);
                    let millisAway = now.getTime() - storedClockout;
                    let secsAway = millisAway / MILLIS_IN_SEC;

                    let secsFudgeUser = 0;

                    /*
                        1:03:30          -> "1:06"  <- 1:09:30
                        1:45:30 (36-42m) -> "1:42"  <- 1:39:30 (30-36m)
                        1:51:30 (42-48m) -> "1:48"  <- 1:45:30 (36-42m)
                        1:57:30 (48-54m) -> "1:54"  <- 1:51:30 (42-48m)
                    */
                    let secsAwayAdj = secsAway - secsFudgeUser;
                    let minsAwayAdj = secsAwayAdj / SECS_IN_MINUTE;

                    const MIN_BREAK_TIME_MINUTES = 42;
                    let minsOfBreakLeft = MIN_BREAK_TIME_MINUTES - minsAwayAdj;
                    let breakIsTooShort = minsOfBreakLeft > 0;
                    if (breakIsTooShort) {
                        event.preventDefault();
                        log("Too short");
                        let wholeMinsLeft = Math.ceil(minsOfBreakLeft);
                        let minsSlug = wholeMinsLeft > 1 ? `${wholeMinsLeft} minutes` : "1 minute";
                        let verbiage = `You have ${minsSlug} left on your lunch break. Please try again later. `;
                        let tooEarlyPopupAlert = makeErrorPopup(verbiage);
                        log(`Too soon after ${secsAwayAdj} secs or ${minsAwayAdj} minutes.`);
                        loadAndPlacePopup(tooEarlyPopupAlert, 5300);
                    } else {
                        // Good break.
                        log(`Good break after ${secsAwayAdj} secs or ${minsAwayAdj} minutes.`);
                    }
                }
            }
        });
    }()); // End of guardForLunchBreakDuration() and invoke

    (function guardForEarlyClockIn() {
        function isTooEarlyInMorning(now) {
            let hours = now.getHours();
            return (hours < 9);
        }

        jQuery("button[value=ClockIn]").click(function handleClockInClick(event) {
            const now = new Date();
            if (isTooEarlyInMorning(now)) {
                event.preventDefault();
                log("Too early");
                let verbiage = "The morning shift has not yet begun.  Please arrive at shift start time for clock-in.";
                let tooEarlyPopupAlert = makeErrorPopup(verbiage);
                loadAndPlacePopup(tooEarlyPopupAlert, 5250);
            }
        });
    }()); // End of guardForEarlyClockIn() and invoke

    /*
    Camera-on in tab prevents Windows Hello from using camera.
    */
    function cleanCameraLeakForWindowsHello() {

        const WARNING_DELAY_SECS = 60;

        function getCurrentTimer() {
            return cleanCameraLeakForWindowsHello.currentTimer;
        }
        function setCurrentTimer(timer) {
            log("setting a new timer, " + timer);
            cleanCameraLeakForWindowsHello.currentTimer = timer;
        }
        function clearOngoingTimer() {
            let currentTimer = getCurrentTimer();
            if (currentTimer) {
                log("clearing existing timer, " + currentTimer);
                clearTimeout(currentTimer);
            }
        }
        function areTimersTheSame(thisTimer) {
            log("my timer: " + thisTimer);
            log("current timer: " + getCurrentTimer());
            return (thisTimer === getCurrentTimer());
        }
        function doDelayedReload(theTimer) {
            setTimeout(() => {
                if (areTimersTheSame(theTimer)) {
                    log("TCW: Ready to Reload.");
                    location.reload();
                    log("TCW: Reloaded.");
                } else {
                    log("aborting reload as have been refreshed.");
                }
            }, 20 * MILLIS_IN_SEC);
        }
        function doDelayedClose(aTimer) {
            setTimeout(() => {
                if (areTimersTheSame(aTimer)) {
                    log("TCW: Ready to Close.");
                    window.close();
                    log("TCW: Closed.");
                    doDelayedReload(aTimer);
                } else {
                    log("aborting close as have been refreshed.");
                }
            }, 15 * MILLIS_IN_SEC);
        }

        clearOngoingTimer();

        if (isLoginPage()) {
            let thisTimer = setTimeout(function closingTheWizard() {
                let verbiage = "Closing the inactive Wizard page soon.  Please save your work now.";
                let pageRefreshWarning = makeErrorPopup(verbiage);
                loadAndPlacePopup(pageRefreshWarning, 10 * MILLIS_IN_SEC);
                doDelayedClose(thisTimer);
            }, WARNING_DELAY_SECS * MILLIS_IN_SEC);
            setCurrentTimer(thisTimer);
        }
    }
    cleanCameraLeakForWindowsHello(); // End of cleanCameraLeakForWindowsHello() and invoke

    (function refreshTimeoutOnMouseActivity() {
        jQuery("div.panel").click(cleanCameraLeakForWindowsHello);
    }());

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

        function doOnClockActionCompletion(successFun, failFun) {
            function onClockHelper(mySuccessFun, myFailFun, triesLeft) {
                setTimeout(function lookForResponseOverlay() {
                    let jSuccessCountAfter = jQuery("div#jSuccess:visible").length;
                    let jErrorCountAfter = jQuery("div#jError:visible").length;

                    log(`${triesLeft} tries left: ` +
                        `success count (${jSuccessCountAfter}), ` +
                        `failure count (${jErrorCountAfter})`);

                    if (jSuccessCountAfter) {
                        mySuccessFun(triesLeft);
                    } else if (jErrorCountAfter) {
                        myFailFun(triesLeft);
                    } else if (triesLeft) {
                        onClockHelper(mySuccessFun, myFailFun, triesLeft - 1);
                    } else {
                        myFailFun(triesLeft);
                    }
                }, 1000);
            }
            cleanCameraLeakForWindowsHello();
            onClockHelper(successFun, failFun, 5);
        }

        // Leave HERE as needs to be read early, not when first referenced.
        const username = getUserNameInput().val(); // Needs to be read early.

        jQuery("button#btnLocationClockout").click(function handleClockOutClick() {
            let now = new Date();
            let clockoutTime = now.getTime();
            log("At clock out, time is " + TIME_FORMATTER.format(now));

            if (isUnexpectedTimeToClockOut()) {
                playAlert();
            }
            doOnClockActionCompletion(
                function clockOutSuccess() {
                    log(`Setting value ${getClockOutKey(username)} to ${clockoutTime}`);
                    GM_setValue(getClockOutKey(username), clockoutTime);
                },
                function clockOutFailure(triesLeft) {
                    if (triesLeft) {
                        log("After hitting clock out, error message on the page, so failed clock-out.");
                    } else {
                        log("After hitting clock out, giving up waiting for success message.  Presuming failed clock-out.");
                    }
                }
            );
        });

        jQuery("button#btnLocationClockin").click(function handleClockInClick() {
            let now = new Date();
            let clockinTime = now.getTime();
            log("At clock in, time is " + TIME_FORMATTER.format(now));

            doOnClockActionCompletion(
                function clockInSuccess() {
                    log(`Setting value ${getClockInKey(username)} to ${clockinTime}`);
                    GM_setValue(getClockInKey(username), clockinTime);
                },
                function clockInFailure(triesLeft) {
                    if (triesLeft) {
                        log("After hitting clock in, error message on the page, so failed clock-in.");
                    } else {
                        log("After hitting clock in, giving up waiting for success message.  Presuming failed clock-in.");
                    }
                }
            );
        });
    }()); // End of tallySuccessfulClockActions() and invoke

}()); // End of original jQuery ready

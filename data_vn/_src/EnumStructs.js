
var NType = {
    //note: needed for save/load game
    undefined:"undefined",
    all:"全部",
    character:"character",
    background:"background",
    textbox:"textbox",
    button:"button",
    sound_effect:6,
    sound_voice:7,
    movie:8,
    sysButton:"シスボタン",
    sysTrackbar:10,

    //[SINGLE INSTANCE TYPES]
    //types that are only allowed to have a single entity
    sysCamera:"カメラ",
    sysBacklog:"バックログ",
    sysBackgroundMusic:"背景音",
    sysWaitingUserInputIcon:14
};

var ParseScript = {
    UNKNOWN_SCRIPT: 0,
    MAIN_SCRIPT: 1,
    EXTERN_SCRIPT: 2,
    BTN_TRIGGER_SCRIPT: 3,
    KEY_HANDLE_SCRIPT: 4,
    MSGBOX_SCRIPT: 5
};

var ParserState = {
    FORBID_READ: -1,
    PARSE_CONT: 0,
    PARSE_FIN: 1,
    PARSE_SCRIPT_FIN: 2,
    WAIT_CMDFIN: 3,
    WAIT_BTNSEL: 4,
    WAIT_MSGBOXSEL: 5,
    WAIT_MOVIEFIN: 6,
    WAIT_MOVIEFIN_FREE: 7
};

var KeyTriggerRef = function()
{
    return {
        triggerLine: 0,
        trigger_function: ""
    };
};
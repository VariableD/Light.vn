
var initialScript = "";

cc.game.onStart = function()
{
    //[Apply Node-Webkit Specific Settings]
    var isNodeJS = cc._isNodeJs;
    if ( isNodeJS )
    {
        //make sure node-webkit returns actual error instead of throwing up
        process.on("uncaughtException", function(e) {
            NHelper.LogCurrentStack();
            console.log(e);
        });
        require('nw.gui').Window.get().constructor.prototype.resizeInnerTo = function (innerWidth, innerHeight) {
            var chromeWidth = this.window.outerWidth - this.window.innerWidth,
                chromeHeight = this.window.outerHeight - this.window.innerHeight;
            this.resizeTo(innerWidth + chromeWidth, innerHeight + chromeHeight);
        };
    }

    var width, height;
    width = height = 0;
    var screenWidth = window.screen.availWidth;
    var screenHeight = window.screen.availHeight;

    //[Load actual config.json]
    cc.loader.loadJson( gAppDir + "config.json", function(err, json)
    {
        width = json.Settings.Width;
        height = json.Settings.Height;
        initialScript = json.Settings.InitialScript;

        //resize window and center it in screen
        if ( isNodeJS )
        {
            var win = gui.Window.get();
            win.on("resize", function(){
                console.log("[EVENT: RESIZE] width:" + win.window.innerWidth + " height:" +win.window.innerHeight );
            });
            if ( win.window.innerWidth != width || win.window.innerHeight != height )
            {
                win.resizeInnerTo( width, height );
                win.moveTo( screenWidth / 2 - width / 2, screenHeight / 2 - height / 2 );
            }
        }
        //resize render canvas, editor windows, etc.
        if ( isNodeJS )
        {
            document.title = json.Settings.NovelTitle + " -Light.vn-js-";

            var canvas = document.getElementById("gameCanvas");
            canvas.width = width;
            canvas.height = height;
            var previewContainer = document.getElementById("previewContainer");
            if ( previewContainer )
            {
                previewContainer.style.width = width;
                previewContainer.style.height = height;
                resizeEditor();
            }
        }
        //set render settings and start scene
        {
            //note: change settings in project.json
            //Choice of RenderMode: 0(default), 1(Canvas only), 2(WebGL only)
            cc.view.setDesignResolutionSize( width, height, cc.ResolutionPolicy.SHOW_ALL );
            cc.view.resizeWithBrowserSize(true);

            //start scene
            cc.LoaderScene.preload(g_resources, function () {
                cc.director.runScene(new LightScene());
            }, this);
        }
    });
};
cc.game.run();
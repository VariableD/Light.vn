
//背景 bg1 Classroom_04_day.jpg
//背景 Classroom_01_day.jpg
var ExecuteBG = function( parseTokens )
{
    //get the screen size of your game canvas
    var winsize = cc.director.getWinSize();

    //calculate the center point
    var centerpos = cc.p(winsize.width / 2, winsize.height / 2);

    //create a background image and set it's position at the center of the screen
    var spritebg = new NSprite(gAppDir + "Images/" + (parseTokens.length == 3 ? parseTokens[2] : parseTokens[1]));
    spritebg.setPosition(tlPoint(0,0));
    gRenderLayer.addChild(spritebg);

    spritebg.setOpacity(0);
    spritebg.m_nType = NType.background;
    spritebg.scheduleUpdate(); //will set focus to middle of texture
};

//絵 alice1 scg2.png 200 180 80 カメラ無視
var ExecuteCG = function( parseTokens )
{
    var nSprite = gRenderLayer.getChildByName( parseTokens[1] );
    var textureName = parseTokens[2];

    var preExists = true;
    if ( nSprite == null )
    {
        nSprite  = new NSprite(gAppDir + "Images/" + textureName);
        preExists = false;
    }

    nSprite.stopAllActions();

    //first set anchor point to 0,1
    //the update function will set focus to middle of texture
    {
        nSprite.m_isTextureSet = false;
        nSprite.setAnchorPoint(0,1);
        nSprite.setTexture(gAppDir + "Images/" + textureName);
        nSprite.m_textureName = textureName;
        nSprite.setPosition( tlPoint(parseTokens[3], parseTokens[4]) );
    }

    if ( !preExists )
        nSprite.setOpacity(0);

    nSprite.scheduleUpdate(); //will set focus to middle of texture

    if ( !preExists )
    {
        gRenderLayer.addChild(nSprite, parseInt(parseTokens[5]), parseTokens[1]); //child, zOrder, tag
    }

    if ( parseTokens.length == 7 && parseTokens[6] != "カメラ無視" )
        nSprite.m_inCamera = false;
};
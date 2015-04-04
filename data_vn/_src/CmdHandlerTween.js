
var getTweenEntities = function( parseTokens, fromThisScriptOnly )
{
    var tweenEntities = [];
    tweenEntities = getEntitiesWithNType( parseTokens, fromThisScriptOnly );
    if ( tweenEntities.length == 0 )
    {
        tweenEntities = getTweenEntitiesWithName( parseTokens );
    }
    return tweenEntities;
};

var getTweenEntitiesWithName = function( parseTokens )
{
    var tweenEntities = [];
    var curIdx = 1;
    var isNextTokenAnEntity = true;
    var curToken;

    while ( isNextTokenAnEntity && curIdx < parseTokens.length )
    {
        curToken = parseTokens[curIdx];
        {
            //[CHECK IF NEXT TOKEN IS ALSO AN ENTITY NAME]
            //ex. fadeout entitiy1, entity2, entity3 3000
            if ( curToken.length > 0 && curToken[curToken.length - 1] ==  ','  )
            {
                isNextTokenAnEntity = true; //current token contains a comma (ex. entity1) => next token is also an entity_name
                curToken = curToken.substr( 0, curToken.length - 1 ); //remove comma at end
            }
            else
                isNextTokenAnEntity = false;
        }
        //push layer entity
        {
            var foundEntity = gRenderLayer.getChildByName( curToken );
            if ( foundEntity == null ) {
                //push nullptr: function using entitiy vector should check if nullptr or not
                tweenEntities.push( null );
            }
            else
            {
                tweenEntities.push( foundEntity );

                if ( foundEntity.m_nType == NType.textbox )
                {
                    //need to apply also to textbox skin if it exists (doesn't matter if it doesn't exist also)
                    foundEntity = gRenderLayer.getChildByName( curToken+"-skin" );
                    if ( foundEntity )
                        tweenEntities.push( foundEntity );
                }
            }
        }

        ++curIdx;
    }
    return tweenEntities;
};

var getEntitiesWithNType = function( parseTokens, fromThisScriptOnly )
{
    var tweenEntities = [];
    var nType = "";

    //[CHECK IF NTYPE FADE]
    for ( var type in NType )
    {
        if ( parseTokens[1] == NType[type] )
        {
            nType = type;
            break;
        }
    }
    if (  nType == "" )
        return tweenEntities; //nothing: return

    //[GATHER ENTITIES WITH NTYPE
    {
        var entities = gRenderLayer.getChildren();
        if ( nType == "all" )
            return entities;

        //special types that need tending to
        if ( nType == "sysBacklog" )
        {
            tweenEntities.push( NBacklog.m_nTextbox );
        }
        else if ( nType == "sysCamera" )
        {
            tweenEntities.push( nCamera );
        }
        else if ( nType == "sysBackgroundMusic" )
        {

        }
        //normal type: just go through all entities and pick up coorresponding
        else
        {
            for ( var i = 0; i < entities.length; ++i )
            {
                if ( entities[i].m_nType == NType[nType] )
                {
                    if ( fromThisScriptOnly && ( entities[i].m_nType ==  NType.button || entities[i].m_nType ==  NType.sysButton ) )
                    {
                        if ( entities[i].m_CreatedScriptName == CurParser().m_scriptName )
                            tweenEntities.push( entities[i] );
                    }
                    else
                        tweenEntities.push( entities[i] );
                }
            }
        }
    }
    return tweenEntities;
};

var isNType = function( typeName )
{
    for ( var type in NType )
    {
        if ( typeName == NType[type] )
        {
            return true;
        }
    }
    return false;
};

///////////////////////////////////////////////////////////////////
////////////////////[ TWEEN COMMANDS ]//////////////////
///////////////////////////////////////////////////////////////////

var ExecuteClear = function( parseTokens ) //ex. clear
{
    //gameplaymode: remove all entities
    if ( gServices.SysVars.gameplaymode )
    {
        cc.log("\n[ExecuteClear] RemoveEntities - START");
        gRenderLayer.removeAllChildren();
    }
    //editor mode: set all entities to not visible
    else
    {

    }

    //readd camera, etc.
    ReAddSystemEntities();
};

//[イン alice1 300]
var ExecuteFadein = function( parseTokens, syncCmd )
{
    //get tween target entities
    var tweenEntities = getTweenEntities( parseTokens );
    var fadeIdx = isNType( parseTokens[1] ) ? 2 : 1 + tweenEntities.length;

    //execute
    var targetExists = false;
    var duration = parseTokens.length >= fadeIdx + 1 && gServices.SysVars.gameplaymode ? parseTokens[fadeIdx] : 0;
    tweenEntities.forEach(function(NTarget) {
        if ( NTarget != null )
        {
            if ( !targetExists ) targetExists = true;
            var tween = cc.sequence(
                cc.fadeIn(duration/1000),
                cc.callFunc(function() { //continue script upon sync cmd finish
                    if ( syncCmd && CurParser().m_ParserState == ParserState.WAIT_CMDFIN )
                        CurParser().m_ParserState = ParserState.PARSE_CONT;
                    if ( NTarget.m_nType == NType.sysBacklog )
                        summoningBacklog = false;
                }, NTarget));
            NTarget.runAction(tween);
        }
    });

    //return the duration if exists (required for sync cmds)
    return targetExists ? duration : -1;
};

//[アウト alice1 300]
//[アウト シスボタン 0 here]
var ExecuteFadeout = function( parseTokens, syncCmd )
{
    //get tween target entities
    var fromThisScriptOnly = parseTokens.length == 4 && parseTokens[3] == "here";
    var tweenEntities = getTweenEntities( parseTokens, fromThisScriptOnly );
    var fadeIdx = isNType( parseTokens[1] ) ? 2 : 1 + tweenEntities.length;

    //execute
    var targetExists = false;
    var duration = parseTokens.length >= fadeIdx + 1 && gServices.SysVars.gameplaymode ? parseTokens[fadeIdx] : 0;
    tweenEntities.forEach(function(NTarget) {
        if ( NTarget != null )
        {
            if ( !targetExists ) targetExists = true;
            var tween = cc.sequence(
                cc.fadeOut(duration/1000),
                cc.callFunc(function() { //continue script upon sync cmd finish
                    if ( syncCmd && CurParser().m_ParserState == ParserState.WAIT_CMDFIN )
                        CurParser().m_ParserState = ParserState.PARSE_CONT;
                    //remove backlog from display
                    if ( NTarget.m_nType != NType.sysBacklog )
                        NTarget.removeFromParent();
                }, NTarget));
            NTarget.runAction(tween);
        }
    });

    //return the duration if exists (required for sync cmds)
    return targetExists ? duration : -1;
};

//[移動 alice1 10 180 500]
var ExecuteMove = function( parseTokens, syncCmd )
{
    //get tween target entities
    var tweenEntities = getTweenEntities( parseTokens );
    var xPosIdx = isNType( parseTokens[1] ) ? 2 : 1 + tweenEntities.length;
    var yPosIdx = 1 + xPosIdx;

    //execute
    var targetExists = false;
    var duration = parseTokens.length >= yPosIdx + 2 && gServices.SysVars.gameplaymode ? parseTokens[yPosIdx+1] : 0;
    tweenEntities.forEach(function(NTarget) {
        if ( NTarget != null )
        {
            if ( !targetExists ) targetExists = true;

            //[CALCULATE MOVEMENT]
            var destPosX = 0;
            var destPosY = 0;
            {
                var initPosX = NTarget.getPositionX();
                var initPosY = NTarget.getPositionY();
                var winsize = cc.director.getWinSize();
                var anchorPoint = NTarget.getAnchorPoint();

                //check x
                {
                    //relative coords
                    if ( ( parseTokens[xPosIdx][0] == '+' && parseTokens[xPosIdx].length > 1 ) || ( parseTokens[xPosIdx][0] == '-' && parseTokens[xPosIdx].length > 1 ) ) {
                        destPosX = initPosX + ( parseInt( parseTokens[xPosIdx] ) * ( 1 / NTarget.getScaleX() ));
                    }
                    //absolute coords
                    else if ( !( parseTokens[xPosIdx][0] == '+' || parseTokens[xPosIdx][0] == '-' ) )
                    {
                        if ( anchorPoint.x == 0.5 && anchorPoint.y == 0.5 )
                            destPosX = parseInt( parseTokens[xPosIdx] ) + NTarget.getContentSize().width / 2;
                        else
                            destPosX = parseInt( parseTokens[xPosIdx] );
                    }
                }
                //check y
                {
                    //relative coords
                    if ( ( parseTokens[yPosIdx][0] == '+' && parseTokens[yPosIdx].length > 1 ) || ( parseTokens[yPosIdx][0] == '-' && parseTokens[yPosIdx].length > 1 ) ) {
                        destPosY = winsize.height - initPosY + ( parseInt( parseTokens[yPosIdx] ) * ( 1 / NTarget.getScaleY() ));
                    }
                    //absolute coords
                    else if ( !( parseTokens[yPosIdx][0] == '+' || parseTokens[yPosIdx][0] == '-' ) )
                    {
                        if ( anchorPoint.x == 0.5 && anchorPoint.y == 0.5 )
                            destPosY = parseInt( parseTokens[yPosIdx] ) + NTarget.getContentSize().height / 2;
                        else
                            destPosY = parseInt( parseTokens[yPosIdx] );
                    }
                }
            }

            var tween = cc.sequence(
                cc.moveTo( duration / 1000, tlPoint(destPosX, destPosY) ),
                cc.callFunc(function() { //continue script upon sync cmd finish
                    if ( syncCmd && CurParser().m_ParserState == ParserState.WAIT_CMDFIN )
                        CurParser().m_ParserState = ParserState.PARSE_CONT;
                }, NTarget));
            NTarget.runAction(tween);
        }
    });

    //return the duration if exists (required for sync cmds)
    return targetExists ? duration : -1;
};

//[拡大  ace1 150% 1500]
var ExecuteScale = function( parseTokens, syncCmd )
{
    //get tween target entities
    var tweenEntities = getTweenEntities( parseTokens );
    var scaleIdx = isNType( parseTokens[1] ) ? 2 : 1 + tweenEntities.length;

    //execute
    var targetExists = false;
    var duration = parseTokens.length >= scaleIdx + 2 && gServices.SysVars.gameplaymode ? parseTokens[scaleIdx+1] : 0;
    tweenEntities.forEach(function(NTarget) {
        if ( NTarget != null )
        {
            if ( !targetExists ) targetExists = true;
            var scaleValue = parseInt(parseTokens[scaleIdx].replace("%", "")) / 100; //remove '%' sign
            var tween = cc.sequence(
                cc.scaleTo( duration / 1000, scaleValue, scaleValue ),
                cc.callFunc(function(){ //continue script upon sync cmd finish
                    if ( syncCmd && CurParser().m_ParserState == ParserState.WAIT_CMDFIN )
                        CurParser().m_ParserState = ParserState.PARSE_CONT;
                }, NTarget));
            NTarget.runAction(tween);
        }
    });

    //return the duration if exists (required for sync cmds)
    return targetExists ? duration : -1;
};

//note: relative movement 'rotateBy'
//~.回転 ace1 270 1500
var ExecuteRotate = function( parseTokens, syncCmd )
{
    //get tween target entities
    var tweenEntities = getTweenEntities( parseTokens );
    var rotateIdx = isNType( parseTokens[1] ) ? 2 : 1 + tweenEntities.length;

    //execute
    var targetExists = false;
    var duration = parseTokens.length >= rotateIdx + 2 && gServices.SysVars.gameplaymode ? parseTokens[rotateIdx+1] : 0;
    tweenEntities.forEach(function(NTarget) {
        if ( NTarget != null )
        {
            if ( !targetExists ) targetExists = true;
            var rotateVal = parseInt(parseTokens[rotateIdx]);
            var tween = cc.sequence(
                cc.rotateTo( duration / 1000, rotateVal ),
                cc.callFunc(function(){ //continue script upon sync cmd finish
                    if ( syncCmd && CurParser().m_ParserState == ParserState.WAIT_CMDFIN )
                        CurParser().m_ParserState = ParserState.PARSE_CONT;
                }, NTarget));
            NTarget.runAction(tween);
        }
    });

    //return the duration if exists (required for sync cmds)
    return targetExists ? duration : -1;
};

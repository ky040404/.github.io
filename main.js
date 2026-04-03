"use strict";
const myAPI = (function(){

    // タイマー
    var clock;

    // 直前のフレームのタイムスタンプ
    var lastFrameTimestamp;

    // シーン開始時のタイムスタンプ
    var sceneBeginTimestamp;

    // シーン
    var scene;
    const sceneList = {
        init: "init",
        countdown: "countdown",
        game: "game",
        failure: "failure",
        result: "result",
    };

    // シーンの初回フレームか？
    var isFirstFrame;

    // キー入力中か？
    var isKeyLeftPressed;
    var isKeyRightPressed;

    // ブロックの凸凹
    var blockNum = {
        left: undefined,
        center: undefined,
        right: undefined,
    };

    // 乱数
    var rnd;

    // 落下カウンタ
    var dropCount;

    // 最高記録
    var highScore;

    const lr = {
        left: "left",
        right: "right",
    };

    function block(bottomLR, left, right) {
        this.bottomLR = bottomLR;
        this.left = left;
        this.right = right;
    }
    const blockList = [
        new block(1, 2, 2),
        new block(-1, 2, 2),
        new block(-1, 1, 3),
        new block(1, 3, 1),
        new block(0, 1, 3),
        new block(2, 3, 1),
        new block(-2, 1, 3),
        new block(0, 3, 1),
        new block(0, 2, 2),
        new block(0, 2, 1),
        new block(0, 1, 2),
        new block(1, 2, 1),
        new block(-1, 1, 2),
        new block(0, 1, 1),
    ]

    // 初期化（時間リセット、タイマー非表示、ループ開始）
    function init() {
        scene = sceneList.init;
        lastFrameTimestamp = 0;
        sceneBeginTimestamp = 0;
        isKeyLeftPressed = false;
        isKeyRightPressed = false;
        highScore = 99999999;
        requestAnimationFrame(gameLoop);
    }

    // ループの中身
    function gameLoop(timestamp) {
        // おまじない
        requestAnimationFrame(gameLoop);

        // 10msごとに
        if(timestamp - lastFrameTimestamp >= 10) {
            // おまじない
            lastFrameTimestamp = timestamp;

            // 内部でタイマーの値を更新
            clock = ((timestamp - sceneBeginTimestamp) / 1000).toFixed(2);

            switch(scene) {
                case sceneList.countdown:
                    // 初回
                    if(isFirstFrame) {
                        // カウントダウン開始時のタイマーの値を取得
                        sceneBeginTimestamp = lastFrameTimestamp;

                        // タイマー非表示
                        document.getElementById("clock").textContent = "";

                        //落下カウンタをリセット
                        dropCount = 0;

                        document.getElementById("tbl").style.display = "none";
                        document.getElementById("tbl_sub").style.display = "table";

                        isFirstFrame = false;
                    }
                    // 3秒経過
                    else if(timestamp - sceneBeginTimestamp >= 3000) {
                        scene = sceneList.game;
                        isFirstFrame = true;
                    }

                    // 落下カウンタを利用してカウントダウン表示
                    var i;
                    document.getElementById("dropCount").textContent = "";
                    for(i = 0; i < 12 - Math.floor((timestamp - sceneBeginTimestamp) / 250); i++) {
                        document.getElementById("dropCount").textContent += "- ";
                    }
                    document.getElementById("dropCount").textContent += 3 - Math.floor((timestamp - sceneBeginTimestamp) / 1000);
                    for(i = 0; i < 12 - Math.floor((timestamp - sceneBeginTimestamp) / 250); i++) {
                        document.getElementById("dropCount").textContent += " -";
                    }

                    break;

                case sceneList.game:

                    // 初回
                    if(isFirstFrame) {
                        // ゲーム開始時のタイマーの値を取得
                        sceneBeginTimestamp = lastFrameTimestamp;

                        blockNum.left = 0;
                        blockNum.center = 0;
                        blockNum.right = 0;

                        // 落下カウンタ
                        document.getElementById("dropCount").textContent = "00 / 30";

                        document.getElementById("tbl").style.display = "table";
                        document.getElementById("tbl_sub").style.display = "none";

                        // 次のブロック決定
                        rnd = decideNextBlock();

                        // 次のブロック描画
                        drawNextBlock(rnd);

                        isFirstFrame = false;
                    }

                    // タイマーの表示を更新
                    document.getElementById("clock").textContent = clock;

                    break;

                case sceneList.result:

                    // 初回
                    if(isFirstFrame) {

                        document.getElementById("dropCount").textContent = "congratulations!";

                        // ハイスコア表示
                        highScore = Math.min(highScore, document.getElementById("clock").textContent);
                        document.getElementById("highScore").textContent = "best time: " + highScore.toFixed(2);

                        // Twitterリンク表示
                        document.getElementById("twitter").href = "https://twitter.com/intent/tweet?text=" + "ki-oku %23kioku_puzzle%0Abest time: " + highScore.toFixed(2) + "&url=" + location.href;
                        document.getElementById("twitter").style.visibility = "visible";

                        document.getElementById("tbl").style.display = "none";
                        document.getElementById("tbl_sub").style.display = "table";

                        isFirstFrame = false;
                    }

                    break;

                case sceneList.failure:

                    // 初回
                    if(isFirstFrame) {

                        document.getElementById("dropCount").textContent = "failure";

                        document.getElementById("tbl").style.display = "none";
                        document.getElementById("tbl_sub").style.display = "table";

                        // タイマー非表示
                        document.getElementById("clock").textContent = "";

                        isFirstFrame = false;
                    }

                    break;

                default:
            }
        }
    }

    // 表示サイズ調整
    function adjustDisplaySize() {
        document.getElementById("tbl").style.width = (Math.min(window.innerWidth, window.innerHeight) * 0.3) + "px";
        document.getElementById("tbl").style.height = (Math.min(window.innerWidth, window.innerHeight) * 0.45) + "px";
        document.getElementById("tbl_sub").style.width = (Math.min(window.innerWidth, window.innerHeight) * 0.45) + "px";
        document.getElementById("tbl_sub").style.height = (Math.min(window.innerWidth, window.innerHeight) * 0.45) + "px";
    }

    // 次のブロック決定
    function decideNextBlock() {
        while(true){
            var tmpRnd = Math.floor(Math.random() * 14);

            // 左に落として問題ないか
            if(blockNum.center - blockNum.left === blockList[tmpRnd].bottomLR) {
                if(Math.abs((blockNum.center + blockList[tmpRnd].right) - (blockNum.left + blockList[tmpRnd].left)) < 3) {
                    if(Math.abs((blockNum.center + blockList[tmpRnd].right) - blockNum.right) < 3) {
                        if((blockNum.center + blockList[tmpRnd].right) - (blockNum.left + blockList[tmpRnd].left) !== 2 || (blockNum.center + blockList[tmpRnd].right) - blockNum.right !== 2) {
                            if(tmpRnd !== rnd) {
                                return tmpRnd;
                            }
                        }
                    }
                }
            }

            // 右に落として問題ないか
            if(blockNum.right - blockNum.center === blockList[tmpRnd].bottomLR) {
                if(Math.abs((blockNum.center + blockList[tmpRnd].left) - blockNum.left) < 3) {
                    if(Math.abs((blockNum.center + blockList[tmpRnd].left) - (blockNum.right + blockList[tmpRnd].right)) < 3) {
                        if((blockNum.center + blockList[tmpRnd].left) - blockNum.left !== 2 || (blockNum.center + blockList[tmpRnd].left) - (blockNum.right + blockList[tmpRnd].right) !== 2) {
                            if(tmpRnd !== rnd) {
                                return tmpRnd;
                            }
                        }
                    }
                }
            }
        }
    }

    // 次のブロック描画
    function drawNextBlock(rnd) {
        var leftMin, rightMin, leftMax, rightMax;
        if(blockList[rnd].bottomLR > 0){
            leftMin = 1;
            rightMin = blockList[rnd].bottomLR + 1;
        } else {
            leftMin = -1 * blockList[rnd].bottomLR + 1;
            rightMin = 1;
        }
        leftMax = leftMin + blockList[rnd].left - 1;
        rightMax = rightMin + blockList[rnd].right - 1;

        if(leftMin <= 3 && 3 <= leftMax) {
            document.getElementById("tbl_1_1").style.backgroundColor = "black";
        } else {
            document.getElementById("tbl_1_1").style.backgroundColor = "white";
        }
        if(rightMin <= 3 && 3 <= rightMax) {
            document.getElementById("tbl_1_2").style.backgroundColor = "black";
        } else {
            document.getElementById("tbl_1_2").style.backgroundColor = "white";
        }
        if(leftMin <= 2 && 2 <= leftMax) {
            document.getElementById("tbl_2_1").style.backgroundColor = "black";
        } else {
            document.getElementById("tbl_2_1").style.backgroundColor = "white";
        }
        if(rightMin <= 2 && 2 <= rightMax) {
            document.getElementById("tbl_2_2").style.backgroundColor = "black";
        } else {
            document.getElementById("tbl_2_2").style.backgroundColor = "white";
        }
        if(leftMin <= 1 && 1 <= leftMax) {
            document.getElementById("tbl_3_1").style.backgroundColor = "black";
        } else {
            document.getElementById("tbl_3_1").style.backgroundColor = "white";
        }
        if(rightMin <= 1 && 1 <= rightMax) {
            document.getElementById("tbl_3_2").style.backgroundColor = "black";
        } else {
            document.getElementById("tbl_3_2").style.backgroundColor = "white";
        }
    }

    // ボタン押下
    function clickButton() {
        scene = sceneList.countdown;
        isFirstFrame = true;
    }

    function clickWindow(selectedLr) {
        if(scene !== sceneList.game){
            // ゲーム中以外は無反応
        } else {

            // 落下カウンタ更新
            dropCount++;
            document.getElementById("dropCount").textContent = dropCount.toString().padStart(2, "0") + " / 30";

            // 選択されたのは左右どちらか
            switch(selectedLr) {
                case lr.left:
                    if(blockNum.center - blockNum.left !== blockList[rnd].bottomLR) {
                        scene = sceneList.failure;
                        isFirstFrame = true;
                        return;
                    } else {
                        blockNum.left += blockList[rnd].left;
                        blockNum.center += blockList[rnd].right;
                    }
                    break;
                case lr.right:
                    if(blockNum.right - blockNum.center !== blockList[rnd].bottomLR) {
                        scene = sceneList.failure;
                        isFirstFrame = true;
                        return;
                    } else {
                        blockNum.center += blockList[rnd].left;
                        blockNum.right += blockList[rnd].right;
                    }
                    break;
                default:
            }

            if(Math.abs(blockNum.center - blockNum.left) >= 3) {
                scene = sceneList.failure;
                isFirstFrame = true;
                return;
            }
            if(Math.abs(blockNum.center - blockNum.right) >= 3) {
                scene = sceneList.failure;
                isFirstFrame = true;
                return;
            }
            if(blockNum.center - blockNum.left === 2 && blockNum.center - blockNum.right === 2) {
                scene = sceneList.failure;
                isFirstFrame = true;
                return;
            }

            if(dropCount === 30) {
                scene = sceneList.result;
                isFirstFrame = true;
            } else {
                // 次のブロック決定
                rnd = decideNextBlock();
                // 次のブロック描画
                drawNextBlock(rnd);
            }
        }
    }

    // 関数を公開
    return {
        init: init,
        clickButton: clickButton,
        adjustDisplaySize: adjustDisplaySize,
        clickWindow: clickWindow,
        lr: lr,
    };

})();

// ボタン押下
document.getElementById("btn").addEventListener("click", function () {
    myAPI.clickButton();
});

// ページ読込
window.addEventListener("load", function () {
    myAPI.init();
    myAPI.adjustDisplaySize();
});

// リサイズ
window.addEventListener("resize", function () {
    myAPI.adjustDisplaySize();
});

// 左右クリック
window.addEventListener("pointerdown", (e) => {
    if(!e.isPrimary || e.target.closest("button, a")) {
        // 2本目の指は無反応、ボタンやURLクリックも無反応
    } else if (e.clientX < window.innerWidth / 2) {
        myAPI.clickWindow(myAPI.lr.left);
    } else {
        myAPI.clickWindow(myAPI.lr.right);
    }
});

// キー入力
window.addEventListener("keydown", (e) => {
    if(e.key === "ArrowLeft") {
        if(!myAPI.isKeyLeftPressed && !myAPI.isKeyRightPressed) {
            myAPI.clickWindow(myAPI.lr.left);
        }
        myAPI.isKeyLeftPressed = true;
    } else if(e.key === "ArrowRight") {
        if(!myAPI.isKeyLeftPressed && !myAPI.isKeyRightPressed) {
            myAPI.clickWindow(myAPI.lr.right);
        }
        myAPI.isKeyRightPressed = true;
    }
});

// キー入力終了
window.addEventListener("keyup", (e) => {
    if(e.key === "ArrowLeft") {
        myAPI.isKeyLeftPressed = false;
    } else if(e.key === "ArrowRight") {
        myAPI.isKeyRightPressed = false;
    }
});
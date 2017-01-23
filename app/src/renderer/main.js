// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const production = true;

if(production){
  process.env = Object.assign(
    Object.create(null),
    process.env,
    {
      TWITTER_KEY    : "",
      TWITTER_SECRET : "",
      mode           : ""
    }
  )
}else{
  require('dotenv').config()
}

const $ = e=>document.querySelector(e);

const Vue = require("vue/dist/vue.common.js");
const Service = {
  Logger: require("../services/Logger"),
  TimeStamp: require("../services/TimeStamp")
};

new Vue({
  el: "#app",
	template: $("#app-component").innerText,
  data: ()=>{
    return {
      status: "",

      isSetOauth: false,
      isDragging: false,
      isTweetMode: false,
      isGeneratingImage: false,

      ruler: require("../stores/RulerStore"),
      capture: require("../stores/CaptureStore"),
      selector: require("../stores/SelectorStore"),

      authData: {
        token: null,
        secret: null
      }
    }
  },
  created(){
    if("token" in localStorage && "secret" in localStorage){
      this.authData.token = localStorage.token;
      this.authData.secret = localStorage.secret;
      this.isSetOauth = true;
    }else{
      const oauth = require("electron").remote.require("./src/browser/oauth");
      oauth()
      .then((data)=>{
        this.authData.token = localStorage.token  = data.token;
        this.authData.secret = localStorage.secret = data.secret;
        this.isSetOauth = true;

        console.log(`
          token : ${data.token}\n
          secret: ${data.secret}
        `);
      });
    }
  },
  computed: {
    getRulerCSS(){
      return this.ruler.css;
    },

    getRulerX(){
      return this.ruler.pos.x;
    },

    getRulerY(){
      return this.ruler.pos.y;
    },

    getSelectorCSS(){
      return this.selector.css;
    },

    textcount(){
      return (128 - this.status.length);
    }
  },
  methods: {

    appClass(){
      return `${this.isGeneratingImage ? "busy" : ""}`
    },

    mousedown(e){
      if(this.isGeneratingImage) return;
      Service.Logger.log("start");

      this.selector.pos.start = {x: e.clientX, y: e.clientY};
      this.selector.pos.end = this.selector.pos.start;

      this.isDragging = true;
      this.isTweetMode = false;
    },

    mousemove(e){
      if(!this.isDragging) return

      this.selector.css = {
        width: `${e.clientX - this.selector.pos.start.x}px`,
        height: `${e.clientY - this.selector.pos.start.y}px`,
        transform: `
          translate(
            ${this.selector.pos.start.x}px,
            ${this.selector.pos.start.y}px
          )
        `
      };

      this.ruler.css = {
        transform: `
          translate(
            ${e.clientX}px,
            ${e.clientY}px
          )
        `
      };

      this.ruler.pos = {
        x: e.clientX - this.selector.pos.start.x,
        y: e.clientY - this.selector.pos.start.y
      };
    },

    mouseup(e){
      this.isDragging = false;

      this.selector.pos.end = {
        x: e.clientX,
        y: e.clientY
      };

      this.capture.pos = this.selector.pos;
      this.getCapture();
    },

    postProcessing(data, message){
      console.log(data);
      new Notification("screenbird", {
        title: "screenbird",
        body: message
      });

      setTimeout(()=>{
        this.isGeneratingImage = false;
        this.exit();
      }, 3000);
    },

    executeTweet(){
      const canvas = $("canvas");
      const Twitter = require("twitter");

      const client = new Twitter({
        consumer_key: process.env.TWITTER_KEY,
        consumer_secret: process.env.TWITTER_SECRET,
        access_token_key: this.authData.token,
        access_token_secret: this.authData.secret
      });

      Service.Logger.log(1, "red", "ツイート開始");

      $("html, body").style.display = "none";

      Promise.resolve()
      .then(()=>{
        return new Promise((resolve, reject)=>{
          Service.Logger.log(2, "gray", "アップロード開始");
          client.post(
            "media/upload",
            {
              media_data: canvas.toDataURL("image/png").replace(/data:image\/png;base64,/g, "")
            },
            (err, tweets, response)=>{
              if(err){
                reject(err);
              }else{
                resolve(tweets);
              }
            }
          )
        });
      })
      .then((data)=>{
        Service.Logger.log(2, "gray", "アップロード完了");
        console.log(data);
        return new Promise((resolve, reject)=>{
          client.post(
            "statuses/update",
            {
              status: `${this.status} #screenbird`,
              media_ids: data.media_id_string
            },
            (err, tweets, response)=>{
              if(err){
                reject(err);
              }else{
                resolve(tweets);
              }
            }
          )
        });
      })
      .then((data)=>{
        Service.Logger.log(1, "red", "ツイート完了");
        this.postProcessing(data, "アップロードに成功しました.");
      })
      .catch((err)=>{
        console.log(err);
        Service.Logger.log(1, "red", "ツイート失敗");
        this.postProcessing(err, "アップロードに失敗しました。");
      })
    },

    generateImage(stream){
      Service.Logger.log(0, "blue", "画面キャプチャ完了");

      $("video").src = URL.createObjectURL(stream);

      setTimeout(()=>{
        this.isGeneratingImage = false;
        this.isTweetMode = true;

        Service.Logger.log(1, "orange", "ツイート用画像生成開始");

        const size = require("electron").remote.require("./src/browser/size")();
        const electron = require("electron");
        const canvas = $("canvas");

        canvas.setAttribute("width" , (this.capture.pos.end.x - this.capture.pos.start.x) * window.devicePixelRatio);
        canvas.setAttribute("height", (this.capture.pos.end.y - this.capture.pos.start.y) * window.devicePixelRatio);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(
          $("video"),
          (-this.capture.pos.start.x    ) * window.devicePixelRatio,
          (-this.capture.pos.start.y-23 ) * window.devicePixelRatio,
          size.width  * window.devicePixelRatio,
          size.height * window.devicePixelRatio
        );

        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.fillRect(0,0,1,1);

        Service.Logger.log(1, "orange", "ツイート用画像生成完了");
      }, 500);
    },

    getCapture(){
      const size = require("electron").remote.require("./src/browser/size")();

      this.isGeneratingImage = true;

      Service.Logger.log(0, "blue", "画面キャプチャ開始");

      navigator.webkitGetUserMedia(
        {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'screen',
              minWidth: size.width * window.devicePixelRatio,
              maxWidth: size.width * window.devicePixelRatio,
              minHeight: size.height * window.devicePixelRatio,
              maxHeight: size.height * window.devicePixelRatio
            }
          }
        },
        this.generateImage,
        (e)=>{
          console.log(e);
          alert("キャプチャの実行時に問題が発生しました。");
        }
      )
    },

    exit(){
      require('electron').remote.app.quit();
    }
  }
});

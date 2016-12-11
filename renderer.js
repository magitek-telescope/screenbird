// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const $ = e=>document.querySelector(e);

const Vue = require("vue/dist/vue.common.js");
new Vue({
  el: "#app",
  data: ()=>{
    return {
      isDragging: false,
      isBusy: false,
      pos: {
        start: {x: 0, y: 0},
        end  : {x: 0, y: 0}
      },
      ruler: {x: 0, y: 0},

      css: {
        rulerCSS: {

        },
        selectorCSS: {
          width: "0px",
          height: "0x",
          transform: ""
        }
      }
    }
  },
  computed: {
    getRulerCSS(){
      return this.css.rulerCSS;
    },

    getRulerX(){
      return this.ruler.x;
    },

    getRulerY(){
      return this.ruler.y;
    },

    getSelectorCSS(){
      return this.css.selectorCSS;
    },
  },
  methods: {
    appClass(){
      return `${this.isBusy ? "busy" : ""}`
    },

    mousedown(e){
      if(this.isBusy) return;
      console.log("start");

      this.pos.start = {
        x: e.clientX,
        y: e.clientY
      };

      this.pos.end = this.pos.start;

      this.isDragging = true;
    },

    mousemove(e){
      if(!this.isDragging) return

      console.log(`${this.pos.start.x - e.clientX}px`);

      this.css.selectorCSS = {
        width: `${e.clientX - this.pos.start.x}px`,
        height: `${e.clientY - this.pos.start.y}px`,
        transform: `
          translate(
            ${this.pos.start.x}px,
            ${this.pos.start.y}px
          )
        `
      };

      this.css.rulerCSS = {
        transform: `
          translate(
            ${e.clientX}px,
            ${e.clientY}px
          )
        `
      };

      this.ruler = {
        x: e.clientX,
        y: e.clientY
      };
    },

    mouseup(e){
      this.isDragging = false;

      this.pos.end = {
        x: e.clientX,
        y: e.clientY
      };

      this.getCapture(this.pos);
    },

    getCapture(pos){
      this.isBusy = true;

      navigator.webkitGetUserMedia(
        {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'screen',
              minWidth: 1440,
              maxWidth: 1440,
              minHeight: 900,
              maxHeight: 900
            }
          }
        },
        (stream)=>{
          $("video").src = URL.createObjectURL(stream);

          setTimeout(()=>{
            const Twitter = require("twitter");
            const client = new Twitter({
            })

            const canvas = $("canvas");
            canvas.setAttribute("width" , (pos.end.x - pos.start.x));
            canvas.setAttribute("height", (pos.end.y - pos.start.y));
            const ctx = canvas.getContext("2d");

            ctx.drawImage(
              $("video"),
              -pos.start.x,
              -pos.start.y-23,
              1440,
              900
            );
            console.log("Done.");

            Promise.resolve()
            .then(()=>{
              return new Promise((resolve, reject)=>{
                client.post(
                  "media/upload",
                  {
                    media_data: canvas.toDataURL("image/jpeg").replace(/data:image\/jpeg;base64,/g, "")
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
              console.log("アップロード疎通");
              console.log(data);
              return new Promise((resolve, reject)=>{
                client.post(
                  "statuses/update",
                  {
                    status: `これはテストです${Math.random(10)}`,
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
              alert("いけました。");
              console.log(data);
              this.isBusy = false;
            })
            .catch((err)=>{
              alert("Twitterに投稿できませんでした。");
              console.log(err);
              this.isBusy = false;
            })

          }, 500);
        },
        (e)=>{
          console.log(e);
        }
      )

    }
  }
});

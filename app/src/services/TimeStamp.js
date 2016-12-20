const TimeStamp = function(){
  this.makeTimeStamp = ()=>{
    const raw = new Date();
    const Y  = raw.getFullYear();
    const m = raw.getMonth() + 1;
    const d   = raw.getDate();
    const H  = ( raw.getHours()   < 10 ) ? '0' + raw.getHours()   : raw.getHours();
    const i   = ( raw.getMinutes() < 10 ) ? '0' + raw.getMinutes() : raw.getMinutes();
    const S   = ( raw.getSeconds() < 10 ) ? '0' + raw.getSeconds() : raw.getSeconds();

    return `${Y}/${m}/${d} ${H}:${i}:${S}`;
  }
}

module.exports = function(){
  return new TimeStamp();
}();

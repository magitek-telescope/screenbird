const Logger = function(){
  this.log = (indent, color, message)=>{
    let spacing = ">>";
    for (var i = 0; i < indent; i++) spacing += ">>";
    console.log(`%c${spacing}%c${message}`, `color: ${color}`, "color: black");
  }
}

module.exports = function(){
  return new Logger();
}();

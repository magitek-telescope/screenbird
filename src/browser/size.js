module.exports = function(){
  const screen = require("electron").screen;
  const size = screen.getPrimaryDisplay().size;
  return {
    width: size.width,
    height: size.height
  };
};

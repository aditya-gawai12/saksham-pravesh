const getColors = require('get-image-colors');
const path = require('path');

getColors(path.join(__dirname, 'public/images/logo.png')).then(colors => {
  console.log("Dominant Colors:");
  colors.forEach(color => console.log(color.hex()));
}).catch(err => {
  console.error("Error reading logo colors:", err);
});

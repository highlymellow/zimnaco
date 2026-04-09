const fs = require('fs');
try {
  fs.copyFileSync('/Users/mb/.gemini/antigravity/brain/de0f29d1-2580-448f-9424-39cb2d84ac13/tire_summer_1775768876432.png', './tire_test.png');
  console.log("Success");
} catch(e) {
  console.log("Failed:", e.message);
}

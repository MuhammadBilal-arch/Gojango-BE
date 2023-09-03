const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/files')
    },
    filename: (req, file, cb) => {
        const fileExtension = file.originalname.split('.').pop();
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${uniqueSuffix}.${fileExtension}`;
        cb(null, filename);
    },
});

const uploadToLocalDir = multer({ storage: storage }).array('file')
const uploadSingleToLocalDir = multer({ storage: storage }).single('file')
const upload = multer({ storage: storage })

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
}

function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

const generateOTP = () => {
    var digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < 6; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  };

module.exports = {
    uploadToLocalDir,
    uploadSingleToLocalDir,
    upload,
    calculateDistance,
    generateOTP
}

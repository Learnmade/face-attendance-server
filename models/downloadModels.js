const fs = require('fs');
const path = require('path');
const https = require('https');

const MODELS_DIR = path.join(__dirname, '../models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

const models = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
];

if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR);
}

const downloadFile = (file) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(MODELS_DIR, file);
        const fileUrl = `${BASE_URL}/${file}`;

        console.log(`Downloading ${file}...`);
        const fileStream = fs.createWriteStream(filePath);

        https.get(fileUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${file}: ${response.statusCode}`));
                return;
            }
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`Downloaded ${file}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => { });
            reject(err);
        });
    });
};

const downloadAll = async () => {
    try {
        for (const model of models) {
            await downloadFile(model);
        }
        console.log('All models downloaded successfully!');
    } catch (err) {
        console.error('Error downloading models:', err);
    }
};

downloadAll();

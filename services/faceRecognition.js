// Load TensorFlow Node backend for performance (Cloud only)
try {
    require('@tensorflow/tfjs-node');
} catch (e) {
    console.log('TensorFlow Node backend not found - using vanilla JS (slower)');
}

const faceApi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');

const { Canvas, Image, ImageData } = canvas;
faceApi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

const loadModels = async () => {
    if (modelsLoaded) return;
    const modelsPath = path.join(__dirname, '../models');

    try {
        await faceApi.nets.tinyFaceDetector.loadFromDisk(modelsPath); // Lighter than SSD
        await faceApi.nets.faceLandmark68Net.loadFromDisk(modelsPath);
        await faceApi.nets.faceRecognitionNet.loadFromDisk(modelsPath);
        modelsLoaded = true;
        console.log('FaceAPI Models loaded successfully (Using TinyFaceDetector)');
    } catch (error) {
        console.error('Failed to load FaceAPI models:', error);
        throw error; // Critical failure
    }
};

const getFaceDescriptor = async (base64Image) => {
    if (!modelsLoaded) await loadModels();

    try {
        const img = await canvas.loadImage(base64Image);

        // Use TinyFaceDetectorOptions for speed/memory efficiency
        const detection = await faceApi.detectSingleFace(img, new faceApi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            return null; // No face detected
        }
        return detection.descriptor;
    } catch (error) {
        console.error('Error getting face descriptor:', error);
        return null;
    }
};

const matchFace = (storedDescriptor, inputDescriptor) => {
    // Convert stored object/array back to Float32Array if needed
    const storedFloat = new Float32Array(Object.values(storedDescriptor));
    const inputFloat = new Float32Array(inputDescriptor);

    const distance = faceApi.euclideanDistance(storedFloat, inputFloat);
    // Threshold: 0.6 is standard for dlib/face-api, lower is stricter (e.g. 0.5)
    // For production attendance, 0.45-0.5 is better to prevent false positives.
    console.log(`Face Match Distance: ${distance}`);
    return distance < 0.5;
};

module.exports = { getFaceDescriptor, matchFace };

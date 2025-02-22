import * as faceapi from 'face-api.js';
import { Canvas, createCanvas, Image } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// 覆盖环境中的 document 对象
const canvas = createCanvas(1000, 1000);
const faceDetectionNet = faceapi.nets.ssdMobilenetv1;

// 初始化 face-api.js
async function run() {
  // 加载模型
  const MODELS_PATH = './weights'
  await faceDetectionNet.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH);

  // 加载示例图片
  const img = await canvas.loadImage('./test.jpg');
  
  // 检测人脸
  const detections = await faceapi.detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();

  console.log('检测到的人脸数量:', detections.length);
  
  // 在这里可以添加更多的处理逻辑
  detections.forEach((detection, i) => {
    console.log(`人脸 ${i + 1}:`, {
      位置: detection.detection.box,
      置信度: detection.detection.score
    });
  });
}

run().catch(console.error); 
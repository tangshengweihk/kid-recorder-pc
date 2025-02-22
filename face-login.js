// 加载模型
Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
]).then(startVideo)
    .catch(err => {
        console.error('加载模型失败:', err);
        alert('加载模型失败，请确保模型文件已正确下载');
    });

function startVideo() {
    const video = document.getElementById('videoElement')
    navigator.mediaDevices.getUserMedia(
        { video: {} }
    ).then(stream => {
        video.srcObject = stream
    }).catch(err => {
        console.error("无法访问摄像头:", err)
    })
}

// 存储用户人脸特征的对象
let faceDatabase = {};

// 添加状态显示函数
function showStatus(message, isError = false) {
    const status = document.getElementById('status');
    status.style.color = isError ? 'red' : 'green';
    status.textContent = message;
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

async function startRegister() {
    const username = document.getElementById('username').value;
    if (!username) {
        showStatus('请输入用户名', true);
        return;
    }

    showLoading(true);
    try {
        const video = document.getElementById('videoElement');
        const detection = await faceapi.detectSingleFace(video)
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (detection) {
            // 发送注册请求到后端
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    faceDescriptor: Array.from(detection.descriptor)
                })
            });
            const data = await response.json();
            if (data.success) {
                showStatus('注册成功！');
            }
        } else {
            showStatus('未检测到人脸，请重试！', true);
        }
    } catch (error) {
        showStatus('注册失败：' + error.message, true);
    } finally {
        showLoading(false);
    }
}

async function startFaceLogin() {
    // 首先从后端获取所有用户数据
    try {
        const response = await fetch('http://localhost:3000/users');
        const faceDatabase = await response.json();
        
        const video = document.getElementById('videoElement');
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);
        
        const loginInterval = setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video)
                .withFaceLandmarks()
                .withFaceDescriptors();
            
            if (detections.length > 0) {
                const faceDescriptor = detections[0].descriptor;
                // 遍历所有注册的用户进行人脸匹配
                for (let username in faceDatabase) {
                    const distance = faceapi.euclideanDistance(
                        new Float32Array(faceDatabase[username].descriptor),
                        faceDescriptor
                    );
                    
                    if (distance < 0.6) {
                        alert(`登录成功！欢迎 ${username}`);
                        clearInterval(loginInterval);
                        canvas.remove();
                        return;
                    }
                }
            }
            
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
        }, 100);
    } catch (error) {
        console.error('登录失败:', error);
        alert('登录失败，请重试！');
    }
} 
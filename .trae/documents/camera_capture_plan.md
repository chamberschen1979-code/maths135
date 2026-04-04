# 摄像头拍照功能实现计划

## 需求分析

当前"拍照上传"按钮使用 `<input type="file" capture="environment">` 方式：
- 移动设备：直接调用摄像头拍照
- 桌面浏览器：打开文件选择器

用户期望的完整拍照体验：
1. 打开摄像头实时预览
2. 点击拍照按钮
3. 进入截图模式
4. 确认截图后诊断

## 技术方案

使用 WebRTC `getUserMedia` API 访问摄像头，实现实时预览和拍照功能。

## 实现步骤

### 1. 添加摄像头相关状态
```javascript
const [isCameraOpen, setIsCameraOpen] = useState(false)
const [cameraStream, setCameraStream] = useState(null)
const videoRef = useRef(null)
```

### 2. 实现打开摄像头函数
```javascript
const openCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' } // 后置摄像头
    })
    setCameraStream(stream)
    setIsCameraOpen(true)
    // 设置 video 元素的 srcObject
  } catch (error) {
    // 处理权限拒绝等情况
  }
}
```

### 3. 实现拍照函数
```javascript
const takePhoto = () => {
  const video = videoRef.current
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0)
  const base64 = canvas.toDataURL('image/jpeg', 0.9)
  
  // 关闭摄像头
  closeCamera()
  
  // 进入截图模式
  setUpImg(base64)
  setIsFromCamera(true)
}
```

### 4. 实现关闭摄像头函数
```javascript
const closeCamera = () => {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop())
    setCameraStream(null)
  }
  setIsCameraOpen(false)
}
```

### 5. 添加摄像头预览 UI
- 显示 video 元素实时预览
- 拍照按钮
- 关闭按钮
- 切换前后摄像头按钮（可选）

### 6. 处理兼容性和权限
- 检测浏览器是否支持 getUserMedia
- 处理权限拒绝情况
- 提供降级方案（使用原有的 input capture 方式）

## UI 设计

```
┌─────────────────────────────┐
│  拍照诊断              [X]  │
├─────────────────────────────┤
│                             │
│    ┌───────────────────┐   │
│    │                   │   │
│    │   摄像头实时预览    │   │
│    │   (video 元素)     │   │
│    │                   │   │
│    └───────────────────┘   │
│                             │
│    [🔄 切换]    [📷 拍照]   │
│                             │
└─────────────────────────────┘
```

## 文件修改

- `src/components/BattleScanner.jsx`
  - 添加摄像头状态和函数
  - 添加摄像头预览 UI
  - 修改"拍照上传"按钮点击逻辑

## 注意事项

1. 需要 HTTPS 环境才能使用 getUserMedia（localhost 除外）
2. 需要处理用户拒绝摄像头权限的情况
3. 需要在组件卸载时释放摄像头资源
4. 移动端优先使用后置摄像头

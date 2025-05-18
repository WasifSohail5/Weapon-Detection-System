# 🔫 Weapon Detection Using YOLOv8

<div align="center">
  <img src="https://img.shields.io/badge/PyTorch-2.6.0-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/Ultralytics%20YOLO-v8.3.138-green?style=flat-square"/>
  <img src="https://img.shields.io/badge/Model-mAP50_79.7%25-success?style=flat-square"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square"/>
  <img src="https://img.shields.io/badge/Last%20Updated-May%2018%2C%202025-red?style=flat-square"/>
</div>

---

## 🚀 Overview

This project implements a **real-time weapon detection system** using the latest YOLOv8 object detection framework. The model is trained to accurately detect weapons in images and video streams, making it suitable for security systems, smart surveillance, and public safety applications.

This implementation is based on the research paper [**"Comprehensive Study on Weapon Detection: A Comparative Analysis using YOLOv8"**](https://arxiv.org/pdf/2410.19862), extending the methodologies and enhancing the techniques proposed in the paper.

---

## 📊 Model Performance

| Metric      | Value     |
|-------------|-----------|
| **Precision**   | 76.6%    |
| **Recall**      | 82.0%    |
| **mAP@0.5**     | 79.7%    |
| **Framework**   | YOLOv8   |
| **Dataset**     | Custom   |

### 🔥 Confusion Matrix Example

<img src="runs/detect/val2/confusion_matrix.png" alt="Confusion Matrix" width="400"/>

---

## 🧑‍💻 Features

- **Real-Time Detection** (Webcam & Video)
- **Custom Dataset Training**
- **Export to ONNX for Deployment**
- **Visual Performance Reports (curves & matrices)**
- **Easy Integration & Customization**

---

## 📚 Research Implementation

This project is an implementation of the methodologies described in ["Comprehensive Study on Weapon Detection: A Comparative Analysis using YOLOv8"](https://arxiv.org/pdf/2410.19862). Our work:

- Extends the YOLOv8-based weapon detection approach 
- Implements optimizations suggested in the research
- Achieves similar or better performance metrics on weapon classification
- Provides practical deployment options via ONNX conversion

### 📝 Citation

```
@article{weapon_detection_yolov8,
  title={Comprehensive Study on Weapon Detection: A Comparative Analysis using YOLOv8},
  journal={arXiv preprint arXiv:2410.19862},
  url={https://arxiv.org/pdf/2410.19862},
  year={2024}
}
```

---

## 🗂️ Project Structure

```
weapon_detection/
├── data/                  # Dataset (images, labels)
├── weights/               # Trained model files (.pt, .onnx)
├── runs/                  # YOLOv8 output (validation results, plots)
├── scripts/               # Training, validation, inference scripts
├── utils/                 # Helper functions
├── README.md
└── requirements.txt
```

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/WasifSohail5/Weapon-Detection-System.git
cd Weapon-Detection-System
```

### 2. Install Requirements

```bash
pip install -r requirements.txt
```

### 3. Inference on Images or Video

```python
from ultralytics import YOLO

model = YOLO('weights/best.pt')
results = model('path/to/test_image.jpg', show=True)  # For single image
```

### 4. Export Model to ONNX

```python
model.export(format='onnx', imgsz=640, half=True, simplify=True, opset=12, dynamic=True)
```

---

## 📈 Results Visualization

- **Precision-Recall Curve**  
  ![](runs/detect/val2/PR_curve.png)

- **F1 Curve**  
  ![](runs/detect/val2/F1_curve.png)

---

## 🏆 Example Results

| Input Image | Prediction |
|-------------|------------|
| <img src="runs/detect/val2/val_batch0_labels.jpg" width="200"/> | <img src="runs/detect/val2/val_batch0_pred.jpg" width="200"/> |

---

## 🛠️ Training

To train the model on your dataset:

```python
from ultralytics import YOLO
model = YOLO('yolov8n.pt')  # or use yolov8s.pt, yolov8m.pt, etc.
model.train(data='data.yaml', epochs=100, imgsz=640)
```

---

## 📦 Model Export & Deployment

- **Formats Supported:** PyTorch (.pt), ONNX (.onnx), TorchScript, CoreML, etc.
- ONNX model can be integrated into real-time inferencing pipelines & edge devices.
- This follows the deployment strategy outlined in the research paper, enabling edge computing applications.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 📧 Contact

- **Created by:** Wasif Sohail
- **Email:** [wasifsohail66@gmail.com](mailto:wasifsohail66@gmail.com)
- **GitHub:** [github.com/Wasif-Sohail55](https://github.com/Wasif-Sohail55)
- **Repository:** [Weapon-Detection-System](https://github.com/WasifSohail5/Weapon-Detection-System)
- **Last Updated:** May 18, 2025

---

## 📜 License

This project is licensed under the MIT License.

---

<div align="center">
  <b>🔰 Secure the Future with Real-Time Weapon Detection! 🔰</b>
</div>
